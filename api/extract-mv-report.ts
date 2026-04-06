import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const MV_REPORT_EXTRACTION_PROMPT = `You are an M&V (Measurement and Verification) analyst for Vantage Infrastructure Group, an independent Owner's Representative firm.

You are reviewing an M&V report produced by an ESCO (Energy Service Company). Your job is to extract the reported savings figures so Vantage can independently verify them against utility data and flag any discrepancies.

Pay close attention to baseline adjustments the ESCO has made — these are common sources of inflated savings claims.

Return ONLY valid JSON. No explanation, no markdown. Raw JSON only.

{
  "report_period_start": "YYYY-MM-DD | null",
  "report_period_end": "YYYY-MM-DD | null",
  "report_year": "number | null",
  "esco_reported_savings": "number | null",
  "ecm_savings": [
    {
      "ecm_name": "string",
      "reported_savings": "number | null"
    }
  ],
  "baseline_adjustments": ["string description of each adjustment"],
  "methodology_notes": "string summarizing the M&V approach used",
  "confidence_score": "number 0-1",
  "extraction_notes": ["array of strings noting concerns or ambiguities"]
}`;

const MAX_BASE64_LENGTH = 27_000_000;

function parseClaudeJSON(text: string): any {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  return JSON.parse(cleaned);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }
  if (!anthropicKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const { file_base64, file_name, contract_id } = req.body || {};

  if (!file_base64 || typeof file_base64 !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "file_base64"' });
  }
  if (!file_name || typeof file_name !== 'string') {
    return res.status(400).json({ error: 'Missing "file_name"' });
  }
  if (!contract_id || typeof contract_id !== 'string') {
    return res.status(400).json({ error: 'Missing "contract_id"' });
  }
  if (file_base64.length > MAX_BASE64_LENGTH) {
    return res.status(413).json({ error: 'File too large — maximum ~20MB' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  try {
    // Verify contract exists
    const { data: contract, error: contractErr } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contract_id)
      .single();

    if (contractErr || !contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // 1. Upload PDF to Supabase Storage
    const storagePath = `mv-reports/${contract_id}/${Date.now()}_${file_name}`;
    const fileBuffer = Buffer.from(file_base64, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('vantage-documents')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('[extract-mv-report] Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload document', detail: uploadError.message });
    }

    // 2. Create document record
    const { data: docRecord, error: docError } = await supabase
      .from('documents')
      .insert({
        file_name,
        file_path: storagePath,
        document_type: 'mv_report',
        contract_id,
        client_name: contract.client_name,
        status: 'processing',
      })
      .select()
      .single();

    if (docError) {
      console.error('[extract-mv-report] Document insert error:', docError);
      return res.status(500).json({ error: 'Failed to create document record', detail: docError.message });
    }

    // 3. Send to Claude for extraction
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: file_base64,
              },
            },
            {
              type: 'text',
              text: MV_REPORT_EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '{}';
    let extracted: any;

    try {
      extracted = parseClaudeJSON(responseText);
    } catch (parseErr: any) {
      console.error('[extract-mv-report] JSON parse error:', parseErr.message, responseText.slice(0, 500));
      await supabase.from('documents').update({ status: 'failed' }).eq('id', docRecord.id);
      return res.status(502).json({ error: 'Failed to parse AI extraction response', raw: responseText.slice(0, 1000) });
    }

    // 4. Insert M&V report record
    const { data: mvRecord, error: mvError } = await supabase
      .from('mv_reports')
      .insert({
        contract_id,
        document_id: docRecord.id,
        report_period_start: extracted.report_period_start,
        report_period_end: extracted.report_period_end,
        report_year: extracted.report_year,
        esco_reported_savings: extracted.esco_reported_savings,
        ecm_savings: extracted.ecm_savings,
        baseline_adjustments: extracted.baseline_adjustments,
        methodology_notes: extracted.methodology_notes,
        confidence_score: extracted.confidence_score,
        extraction_notes: extracted.extraction_notes,
      })
      .select()
      .single();

    if (mvError) {
      console.error('[extract-mv-report] M&V report insert error:', mvError);
      await supabase.from('documents').update({ status: 'failed' }).eq('id', docRecord.id);
      return res.status(500).json({ error: 'Failed to create M&V report record', detail: mvError.message });
    }

    // 5. Generate alerts — compare ESCO-reported savings vs verified utility savings
    const alerts: any[] = [];

    // Cross-reference with actual utility readings for the same period
    if (extracted.report_period_start && extracted.report_period_end && extracted.esco_reported_savings) {
      const { data: readings } = await supabase
        .from('utility_readings')
        .select('verified_savings')
        .eq('contract_id', contract_id)
        .gte('billing_period_start', extracted.report_period_start)
        .lte('billing_period_end', extracted.report_period_end);

      if (readings && readings.length > 0) {
        const totalVerified = readings.reduce(
          (sum: number, r: any) => sum + (r.verified_savings || 0),
          0
        );
        const escoReported = extracted.esco_reported_savings;
        const discrepancy = escoReported - totalVerified;
        const discrepancyPct = escoReported > 0 ? (discrepancy / escoReported) * 100 : 0;

        if (discrepancyPct > 10) {
          alerts.push({
            contract_id,
            alert_type: 'savings_discrepancy',
            severity: discrepancyPct > 25 ? 'critical' : 'warning',
            title: 'ESCO savings discrepancy detected',
            message: `ESCO reports $${escoReported.toLocaleString()} in savings, but verified utility data shows $${totalVerified.toLocaleString()}. Discrepancy: ${discrepancyPct.toFixed(1)}% ($${discrepancy.toLocaleString()}).`,
            status: 'active',
          });
        }
      }
    }

    // Flag baseline adjustments
    if (extracted.baseline_adjustments && extracted.baseline_adjustments.length > 0) {
      alerts.push({
        contract_id,
        alert_type: 'baseline_adjustment',
        severity: 'warning',
        title: 'ESCO baseline adjustments detected',
        message: `${extracted.baseline_adjustments.length} baseline adjustment(s) found: ${extracted.baseline_adjustments.join('; ')}`,
        status: 'active',
      });
    }

    if (extracted.confidence_score !== null && extracted.confidence_score < 0.7) {
      alerts.push({
        contract_id,
        alert_type: 'low_confidence',
        severity: 'warning',
        title: 'Low M&V report extraction confidence',
        message: `M&V report extraction confidence is ${(extracted.confidence_score * 100).toFixed(0)}%. Manual review recommended.`,
        status: 'active',
      });
    }

    if (alerts.length > 0) {
      const { error: alertError } = await supabase.from('alerts').insert(alerts);
      if (alertError) {
        console.error('[extract-mv-report] Alert insert error:', alertError);
      }
    }

    // 6. Update document status
    await supabase.from('documents').update({ status: 'completed' }).eq('id', docRecord.id);

    return res.status(200).json({
      success: true,
      document: docRecord,
      mv_report: mvRecord,
      alerts_generated: alerts.length,
      extraction: extracted,
    });
  } catch (err: any) {
    console.error('[extract-mv-report] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

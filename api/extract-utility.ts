import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const UTILITY_EXTRACTION_PROMPT = `You are an energy data analyst for Vantage Infrastructure Group.

Extract billing data from this utility bill document. This data will be used to calculate verified energy savings against guaranteed ESPC baselines.

Be precise with numbers. Extract exactly what is printed on the bill. If multiple meters or accounts appear, extract all of them as separate entries.

Return ONLY valid JSON. No explanation, no markdown. Raw JSON only.

{
  "bills": [
    {
      "account_number": "string | null",
      "utility_type": "electricity | gas | water",
      "billing_period_start": "YYYY-MM-DD | null",
      "billing_period_end": "YYYY-MM-DD | null",
      "consumption_value": "number | null",
      "consumption_unit": "kWh | therms | CCF | gallons | null",
      "demand_kw": "number | null",
      "total_cost": "number | null",
      "rate_schedule": "string | null",
      "confidence_score": "number 0-1",
      "extraction_notes": ["array of strings"]
    }
  ]
}`;

const MAX_BASE64_LENGTH = 27_000_000;

function parseClaudeJSON(text: string): any {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  return JSON.parse(cleaned);
}

function calculateVerifiedSavings(
  bill: { consumption_value: number | null; total_cost: number | null },
  monthlyBaseline: number
) {
  const consumption = bill.consumption_value ?? 0;
  const avoided = Math.max(0, monthlyBaseline - consumption);
  const avgRate =
    bill.total_cost && consumption > 0
      ? bill.total_cost / consumption
      : 0.12;
  return {
    avoided_consumption: avoided,
    verified_savings: avoided * avgRate,
    performance_pct: monthlyBaseline > 0 ? (avoided / monthlyBaseline) * 100 : 0,
  };
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
    const storagePath = `utility-bills/${contract_id}/${Date.now()}_${file_name}`;
    const fileBuffer = Buffer.from(file_base64, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('vantage-documents')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('[extract-utility] Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload document', detail: uploadError.message });
    }

    // 2. Create document record
    const { data: docRecord, error: docError } = await supabase
      .from('documents')
      .insert({
        file_name,
        file_path: storagePath,
        document_type: 'utility_bill',
        contract_id,
        client_name: contract.client_name,
        status: 'processing',
      })
      .select()
      .single();

    if (docError) {
      console.error('[extract-utility] Document insert error:', docError);
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
              text: UTILITY_EXTRACTION_PROMPT,
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
      console.error('[extract-utility] JSON parse error:', parseErr.message, responseText.slice(0, 500));
      await supabase.from('documents').update({ status: 'failed' }).eq('id', docRecord.id);
      return res.status(502).json({ error: 'Failed to parse AI extraction response', raw: responseText.slice(0, 1000) });
    }

    // 4. Fetch ECM baselines for savings calculation
    const { data: ecms } = await supabase
      .from('ecms')
      .select('*')
      .eq('contract_id', contract_id);

    // Calculate monthly baseline from annual guaranteed savings / 12
    const annualBaseline = contract.guaranteed_savings_annual || 0;
    const monthlyBaselineDefault = annualBaseline / 12;

    // 5. Insert utility reading records and calculate verified savings
    const bills = extracted.bills || [];
    const readingRecords: any[] = [];
    const alerts: any[] = [];

    for (const bill of bills) {
      // Calculate verified savings
      // Try to find ECM-specific baseline by utility type, fallback to contract-level
      let monthlyBaseline = monthlyBaselineDefault;
      if (ecms && ecms.length > 0) {
        const matchingEcm = ecms.find(
          (e: any) =>
            (bill.utility_type === 'electricity' && e.baseline_unit === 'kWh') ||
            (bill.utility_type === 'gas' && (e.baseline_unit === 'therms' || e.baseline_unit === 'CCF')) ||
            (bill.utility_type === 'water' && e.baseline_unit === 'gallons')
        );
        if (matchingEcm && matchingEcm.baseline_value) {
          monthlyBaseline = matchingEcm.baseline_value / 12;
        }
      }

      const savings = calculateVerifiedSavings(bill, monthlyBaseline);

      const { data: reading, error: readingError } = await supabase
        .from('utility_readings')
        .insert({
          contract_id,
          document_id: docRecord.id,
          account_number: bill.account_number,
          utility_type: bill.utility_type,
          billing_period_start: bill.billing_period_start,
          billing_period_end: bill.billing_period_end,
          consumption_value: bill.consumption_value,
          consumption_unit: bill.consumption_unit,
          demand_kw: bill.demand_kw,
          total_cost: bill.total_cost,
          rate_schedule: bill.rate_schedule,
          monthly_baseline: monthlyBaseline,
          avoided_consumption: savings.avoided_consumption,
          verified_savings: savings.verified_savings,
          performance_pct: savings.performance_pct,
          confidence_score: bill.confidence_score,
          extraction_notes: bill.extraction_notes,
        })
        .select()
        .single();

      if (readingError) {
        console.error('[extract-utility] Reading insert error:', readingError);
      } else if (reading) {
        readingRecords.push(reading);
      }

      // 6. Check for drift alerts
      if (savings.performance_pct < 80 && monthlyBaseline > 0) {
        alerts.push({
          contract_id,
          alert_type: 'savings_drift',
          severity: savings.performance_pct < 50 ? 'critical' : 'warning',
          title: `Savings drift detected — ${bill.utility_type}`,
          message: `${bill.utility_type} savings at ${savings.performance_pct.toFixed(1)}% of baseline for period ${bill.billing_period_start || '?'} to ${bill.billing_period_end || '?'}. Avoided: ${savings.avoided_consumption.toFixed(1)} ${bill.consumption_unit || 'units'}, Verified savings: $${savings.verified_savings.toFixed(2)}`,
          status: 'active',
        });
      }

      if (bill.confidence_score !== null && bill.confidence_score < 0.7) {
        alerts.push({
          contract_id,
          alert_type: 'low_confidence',
          severity: 'warning',
          title: `Low extraction confidence — ${bill.utility_type} bill`,
          message: `Utility bill extraction confidence is ${(bill.confidence_score * 100).toFixed(0)}%. Manual review recommended.`,
          status: 'active',
        });
      }
    }

    if (alerts.length > 0) {
      const { error: alertError } = await supabase.from('alerts').insert(alerts);
      if (alertError) {
        console.error('[extract-utility] Alert insert error:', alertError);
      }
    }

    // 7. Update document status
    await supabase.from('documents').update({ status: 'completed' }).eq('id', docRecord.id);

    return res.status(200).json({
      success: true,
      document: docRecord,
      readings: readingRecords,
      alerts_generated: alerts.length,
      extraction: extracted,
    });
  } catch (err: any) {
    console.error('[extract-utility] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

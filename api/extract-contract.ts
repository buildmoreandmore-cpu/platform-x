import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const CONTRACT_EXTRACTION_PROMPT = `You are an expert ESPC (Energy Savings Performance Contract) analyst for Vantage Infrastructure Group, an independent Owner's Representative firm.

Your job is to extract structured data from the provided ESPC contract document. This data will populate a real-time energy performance monitoring dashboard.

Be precise. If a value is not found, use null. Do not invent or estimate values. Extract exact numbers as written in the document.

Extract all available information and return ONLY valid JSON matching this exact structure. No explanation, no markdown, no code blocks. Raw JSON only.

{
  "esco_name": "string | null",
  "contract_value": "number | null",
  "contract_term_years": "number | null",
  "performance_period_start": "YYYY-MM-DD | null",
  "financing_type": "string | null",
  "guaranteed_savings_annual": "number | null",
  "dscr_requirement": "number | null",
  "shortfall_remedy_clause": "string summarizing remedy | null",
  "ecms": [
    {
      "name": "string",
      "measure_type": "string (e.g. HVAC, Lighting, Envelope, BMS, Solar, Water)",
      "description": "string | null",
      "guaranteed_savings_annual": "number | null",
      "baseline_value": "number | null",
      "baseline_unit": "string (kWh, therms, gallons, etc) | null",
      "mv_methodology": "string | null",
      "mv_option": "A | B | C | D | null",
      "measurement_boundary": "string | null"
    }
  ],
  "raw_text_summary": "2-3 sentence plain English summary of this contract",
  "confidence_score": "number 0-1 indicating extraction confidence",
  "extraction_notes": ["array of strings noting any ambiguities or missing data"]
}`;

// ~20MB base64 limit
const MAX_BASE64_LENGTH = 27_000_000;

function parseClaudeJSON(text: string): any {
  // Strip markdown code blocks if present
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

  const { file_base64, file_name, client_name, building_name, building_address } = req.body || {};

  if (!file_base64 || typeof file_base64 !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "file_base64" — expected a base64-encoded PDF' });
  }
  if (!file_name || typeof file_name !== 'string') {
    return res.status(400).json({ error: 'Missing "file_name"' });
  }
  if (!client_name || typeof client_name !== 'string') {
    return res.status(400).json({ error: 'Missing "client_name"' });
  }
  if (file_base64.length > MAX_BASE64_LENGTH) {
    return res.status(413).json({ error: 'File too large — maximum ~20MB' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  try {
    // 1. Upload PDF to Supabase Storage
    const storagePath = `contracts/${Date.now()}_${file_name}`;
    const fileBuffer = Buffer.from(file_base64, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('vantage-documents')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('[extract-contract] Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload document', detail: uploadError.message });
    }

    // 2. Create document record
    const { data: docRecord, error: docError } = await supabase
      .from('documents')
      .insert({
        file_name,
        file_path: storagePath,
        document_type: 'contract',
        client_name,
        building_name: building_name || null,
        building_address: building_address || null,
        status: 'processing',
      })
      .select()
      .single();

    if (docError) {
      console.error('[extract-contract] Document insert error:', docError);
      return res.status(500).json({ error: 'Failed to create document record', detail: docError.message });
    }

    // 3. Send PDF to Claude for extraction
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
              text: CONTRACT_EXTRACTION_PROMPT,
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
      console.error('[extract-contract] JSON parse error:', parseErr.message, responseText.slice(0, 500));
      // Update document status to failed
      await supabase.from('documents').update({ status: 'failed' }).eq('id', docRecord.id);
      return res.status(502).json({ error: 'Failed to parse AI extraction response', raw: responseText.slice(0, 1000) });
    }

    // 4. Insert contract record
    const { data: contractRecord, error: contractError } = await supabase
      .from('contracts')
      .insert({
        document_id: docRecord.id,
        client_name,
        building_name: building_name || null,
        building_address: building_address || null,
        esco_name: extracted.esco_name,
        contract_value: extracted.contract_value,
        contract_term_years: extracted.contract_term_years,
        performance_period_start: extracted.performance_period_start,
        financing_type: extracted.financing_type,
        guaranteed_savings_annual: extracted.guaranteed_savings_annual,
        dscr_requirement: extracted.dscr_requirement,
        shortfall_remedy_clause: extracted.shortfall_remedy_clause,
        raw_text_summary: extracted.raw_text_summary,
        confidence_score: extracted.confidence_score,
        extraction_notes: extracted.extraction_notes,
      })
      .select()
      .single();

    if (contractError) {
      console.error('[extract-contract] Contract insert error:', contractError);
      await supabase.from('documents').update({ status: 'failed' }).eq('id', docRecord.id);
      return res.status(500).json({ error: 'Failed to create contract record', detail: contractError.message });
    }

    // 5. Insert ECM records
    const ecmRecords: any[] = [];
    if (Array.isArray(extracted.ecms) && extracted.ecms.length > 0) {
      const ecmInserts = extracted.ecms.map((ecm: any) => ({
        contract_id: contractRecord.id,
        name: ecm.name,
        measure_type: ecm.measure_type,
        description: ecm.description,
        guaranteed_savings_annual: ecm.guaranteed_savings_annual,
        baseline_value: ecm.baseline_value,
        baseline_unit: ecm.baseline_unit,
        mv_methodology: ecm.mv_methodology,
        mv_option: ecm.mv_option,
        measurement_boundary: ecm.measurement_boundary,
      }));

      const { data: ecmData, error: ecmError } = await supabase
        .from('ecms')
        .insert(ecmInserts)
        .select();

      if (ecmError) {
        console.error('[extract-contract] ECM insert error:', ecmError);
        // Non-fatal — contract was created, ECMs failed
      } else {
        ecmRecords.push(...(ecmData || []));
      }
    }

    // 6. Generate alerts
    const alerts: any[] = [];

    if (extracted.confidence_score !== null && extracted.confidence_score < 0.7) {
      alerts.push({
        contract_id: contractRecord.id,
        alert_type: 'low_confidence',
        severity: 'warning',
        title: 'Low extraction confidence',
        message: `Contract extraction confidence is ${(extracted.confidence_score * 100).toFixed(0)}%. Manual review recommended.`,
        status: 'active',
      });
    }

    if (!extracted.guaranteed_savings_annual) {
      alerts.push({
        contract_id: contractRecord.id,
        alert_type: 'missing_data',
        severity: 'warning',
        title: 'Missing guaranteed savings',
        message: 'Annual guaranteed savings could not be extracted from the contract. Manual entry required.',
        status: 'active',
      });
    }

    if (!extracted.dscr_requirement) {
      alerts.push({
        contract_id: contractRecord.id,
        alert_type: 'missing_data',
        severity: 'info',
        title: 'Missing DSCR requirement',
        message: 'DSCR requirement not found in contract. Verify if applicable.',
        status: 'active',
      });
    }

    if (extracted.extraction_notes && extracted.extraction_notes.length > 0) {
      alerts.push({
        contract_id: contractRecord.id,
        alert_type: 'extraction_notes',
        severity: 'info',
        title: 'Extraction notes require review',
        message: extracted.extraction_notes.join('; '),
        status: 'active',
      });
    }

    if (alerts.length > 0) {
      const { error: alertError } = await supabase.from('alerts').insert(alerts);
      if (alertError) {
        console.error('[extract-contract] Alert insert error:', alertError);
      }
    }

    // 7. Update document status to completed
    await supabase.from('documents').update({ status: 'completed' }).eq('id', docRecord.id);

    return res.status(200).json({
      success: true,
      document: docRecord,
      contract: contractRecord,
      ecms: ecmRecords,
      alerts_generated: alerts.length,
      extraction: extracted,
    });
  } catch (err: any) {
    console.error('[extract-contract] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

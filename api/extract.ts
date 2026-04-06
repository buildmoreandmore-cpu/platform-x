import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

/* ─────────────────────────────────────────────────────────────────────────────
 * Consolidated extraction endpoint.
 *
 * Route via query param ?type=contract|utility|mv-report
 *
 *   POST ?type=contract   → extract ESPC contract     (was extract-contract.ts)
 *   POST ?type=utility    → extract utility bill       (was extract-utility.ts)
 *   POST ?type=mv-report  → extract M&V report        (was extract-mv-report.ts)
 * ────────────────────────────────────────────────────────────────────────── */

// ── Prompts ─────────────────────────────────────────────────────────────────

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

// ── Helpers ─────────────────────────────────────────────────────────────────

const MAX_BASE64_LENGTH = 27_000_000; // ~20MB

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

// ── Sub-handlers ────────────────────────────────────────────────────────────

async function handleContract(
  req: VercelRequest,
  res: VercelResponse,
  supabase: ReturnType<typeof createClient>,
  anthropic: Anthropic,
) {
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
      console.error('[extract] contract storage upload error:', uploadError);
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
      console.error('[extract] contract document insert error:', docError);
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
      console.error('[extract] contract JSON parse error:', parseErr.message, responseText.slice(0, 500));
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
      console.error('[extract] contract insert error:', contractError);
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
        console.error('[extract] contract ECM insert error:', ecmError);
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
        console.error('[extract] contract alert insert error:', alertError);
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
    console.error('[extract] contract unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

async function handleUtility(
  req: VercelRequest,
  res: VercelResponse,
  supabase: ReturnType<typeof createClient>,
  anthropic: Anthropic,
) {
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
      console.error('[extract] utility storage upload error:', uploadError);
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
      console.error('[extract] utility document insert error:', docError);
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
      console.error('[extract] utility JSON parse error:', parseErr.message, responseText.slice(0, 500));
      await supabase.from('documents').update({ status: 'failed' }).eq('id', docRecord.id);
      return res.status(502).json({ error: 'Failed to parse AI extraction response', raw: responseText.slice(0, 1000) });
    }

    // 4. Fetch ECM baselines for savings calculation
    const { data: ecms } = await supabase
      .from('ecms')
      .select('*')
      .eq('contract_id', contract_id);

    const annualBaseline = contract.guaranteed_savings_annual || 0;
    const monthlyBaselineDefault = annualBaseline / 12;

    // 5. Insert utility reading records and calculate verified savings
    const bills = extracted.bills || [];
    const readingRecords: any[] = [];
    const alerts: any[] = [];

    for (const bill of bills) {
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
        console.error('[extract] utility reading insert error:', readingError);
      } else if (reading) {
        readingRecords.push(reading);
      }

      // Check for drift alerts
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
        console.error('[extract] utility alert insert error:', alertError);
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
    console.error('[extract] utility unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

async function handleMvReport(
  req: VercelRequest,
  res: VercelResponse,
  supabase: ReturnType<typeof createClient>,
  anthropic: Anthropic,
) {
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
      console.error('[extract] mv-report storage upload error:', uploadError);
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
      console.error('[extract] mv-report document insert error:', docError);
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
      console.error('[extract] mv-report JSON parse error:', parseErr.message, responseText.slice(0, 500));
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
      console.error('[extract] mv-report insert error:', mvError);
      await supabase.from('documents').update({ status: 'failed' }).eq('id', docRecord.id);
      return res.status(500).json({ error: 'Failed to create M&V report record', detail: mvError.message });
    }

    // 5. Generate alerts
    const alerts: any[] = [];

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
        console.error('[extract] mv-report alert insert error:', alertError);
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
    console.error('[extract] mv-report unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

// ── Main handler ────────────────────────────────────────────────────────────

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

  const supabase = createClient(supabaseUrl, supabaseKey);
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const type = (req.query.type as string) || '';

  switch (type) {
    case 'contract':
      return handleContract(req, res, supabase, anthropic);
    case 'utility':
      return handleUtility(req, res, supabase, anthropic);
    case 'mv-report':
      return handleMvReport(req, res, supabase, anthropic);
    default:
      return res.status(400).json({ error: 'Missing or invalid "type" query param — expected contract, utility, or mv-report' });
  }
}

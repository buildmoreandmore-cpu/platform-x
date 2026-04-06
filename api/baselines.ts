import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

/* ─────────────────────────────────────────────────────────────────────────────
 * Consolidated baselines endpoint — Module 3.
 *
 * Route via query param ?action=list|comparisons|dispute-report|extract
 *
 *   GET   ?action=list            → list baselines for a contract (?contract_id=)
 *   POST  ?action=list            → create baseline record
 *   PATCH ?action=list            → update baseline (approve, flag, adjust)
 *   GET   ?action=comparisons     → list comparisons (?contract_id=, ?baseline_id=, ?year=)
 *   POST  ?action=comparisons     → create comparison record
 *   POST  ?action=dispute-report  → generate dispute report using Claude AI
 *   POST  ?action=extract         → extract baselines from PDF using Claude AI
 * ────────────────────────────────────────────────────────────────────────── */

// ── Prompts ─────────────────────────────────────────────────────────────────

const BASELINE_EXTRACTION_PROMPT = `You are an expert ESPC (Energy Savings Performance Contract) baseline analyst for Vantage Infrastructure Group, an independent Owner's Representative firm.

Your job is to extract structured baseline data from the provided ESPC document. Baselines are the pre-retrofit energy consumption values that ESCOs use to calculate guaranteed savings. Accurate baseline extraction is critical for verifying ESCO performance claims.

Be precise. If a value is not found, use null. Do not invent or estimate values. Extract exact numbers as written in the document.

Extract all baseline information and return ONLY valid JSON matching this exact structure. No explanation, no markdown, no code blocks. Raw JSON only.

{
  "baselines": [
    {
      "ecm_name": "string — name of the Energy Conservation Measure",
      "measure_type": "string (e.g. HVAC, Lighting, Envelope, BMS, Solar, Water)",
      "baseline_year": "number (e.g. 2019) | null",
      "baseline_period_start": "YYYY-MM-DD | null",
      "baseline_period_end": "YYYY-MM-DD | null",
      "baseline_value": "number | null",
      "baseline_unit": "string (kWh, therms, gallons, kW, etc) | null",
      "baseline_cost": "number (annual $ cost at baseline) | null",
      "adjustment_method": "string describing any weather/occupancy normalization | null",
      "degree_days_heating": "number | null",
      "degree_days_cooling": "number | null",
      "data_source": "string (e.g. utility bills, sub-metering, engineering estimate) | null",
      "mv_option": "A | B | C | D | null",
      "notes": "string | null"
    }
  ],
  "facility_info": {
    "facility_name": "string | null",
    "facility_address": "string | null",
    "square_footage": "number | null",
    "building_type": "string | null",
    "occupancy_hours": "string | null"
  },
  "raw_text_summary": "2-3 sentence plain English summary of the baseline data found",
  "confidence_score": "number 0-1 indicating extraction confidence",
  "extraction_notes": ["array of strings noting any ambiguities, missing data, or red flags in baseline methodology"]
}`;

const DISPUTE_REPORT_PROMPT = `You are preparing a forensic baseline analysis for an ESPC dispute on behalf of the building owner. Review all provided baseline data, comparison history, IGA assumptions, and communications. Summarize all evidence of baseline manipulation or drift and produce a structured findings report with: Executive Summary, Baseline Anomalies Found, IGA Assumption Concerns, Communication Trail Evidence, and Recommended Actions.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient<any>(supabaseUrl, supabaseKey);

  const action = (req.query.action as string) || '';

  // ═══════════════════════════════════════════════════════════════════════════
  // action=list  (GET | POST | PATCH)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'list') {
    // GET — list baselines for a contract
    if (req.method === 'GET') {
      const contractId = req.query.contract_id as string;

      if (!contractId) {
        return res.status(400).json({ error: 'contract_id query param is required' });
      }

      try {
        const { data: baselines, error } = await supabase
          .from('baselines')
          .select('*')
          .eq('contract_id', contractId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[baselines] list query error:', error);
          return res.status(500).json({ error: 'Failed to fetch baselines', detail: error.message });
        }

        return res.status(200).json({ baselines: baselines || [] });
      } catch (err: any) {
        console.error('[baselines] list unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    // POST — create a baseline record
    if (req.method === 'POST') {
      const {
        contract_id,
        ecm_id,
        ecm_name,
        measure_type,
        baseline_year,
        baseline_period_start,
        baseline_period_end,
        baseline_value,
        baseline_unit,
        baseline_cost,
        adjustment_method,
        degree_days_heating,
        degree_days_cooling,
        data_source,
        mv_option,
        notes,
        status,
      } = req.body || {};

      if (!contract_id) {
        return res.status(400).json({ error: 'contract_id is required' });
      }

      try {
        const { data: baseline, error } = await supabase
          .from('baselines')
          .insert({
            contract_id,
            ecm_id: ecm_id || null,
            ecm_name: ecm_name || null,
            measure_type: measure_type || null,
            baseline_year: baseline_year || null,
            baseline_period_start: baseline_period_start || null,
            baseline_period_end: baseline_period_end || null,
            baseline_value: baseline_value || null,
            baseline_unit: baseline_unit || null,
            baseline_cost: baseline_cost || null,
            adjustment_method: adjustment_method || null,
            degree_days_heating: degree_days_heating || null,
            degree_days_cooling: degree_days_cooling || null,
            data_source: data_source || null,
            mv_option: mv_option || null,
            notes: notes || null,
            status: status || 'pending',
          })
          .select()
          .single();

        if (error) {
          console.error('[baselines] create error:', error);
          return res.status(500).json({ error: 'Failed to create baseline', detail: error.message });
        }

        return res.status(201).json({ success: true, baseline });
      } catch (err: any) {
        console.error('[baselines] create unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    // PATCH — update baseline (approve, flag, adjust)
    if (req.method === 'PATCH') {
      const { id, action: baselineAction, ...updateFields } = req.body || {};

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "id"' });
      }

      if (!baselineAction || !['approve', 'flag', 'adjust'].includes(baselineAction)) {
        return res.status(400).json({ error: 'Invalid "action" — must be "approve", "flag", or "adjust"' });
      }

      try {
        const updateData: Record<string, any> = {};

        if (baselineAction === 'approve') {
          updateData.status = 'approved';
          updateData.approved_at = new Date().toISOString();
        } else if (baselineAction === 'flag') {
          updateData.status = 'flagged';
          updateData.flagged_at = new Date().toISOString();
          if (updateFields.flag_reason) {
            updateData.flag_reason = updateFields.flag_reason;
          }
        } else if (baselineAction === 'adjust') {
          updateData.status = 'adjusted';
          updateData.adjusted_at = new Date().toISOString();
          // Allow updating specific fields during adjustment
          const adjustableFields = [
            'baseline_value', 'baseline_unit', 'baseline_cost',
            'adjustment_method', 'degree_days_heating', 'degree_days_cooling',
            'notes',
          ];
          for (const field of adjustableFields) {
            if (updateFields[field] !== undefined) {
              updateData[field] = updateFields[field];
            }
          }
        }

        const { data: baseline, error } = await supabase
          .from('baselines')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('[baselines] update error:', error);
          return res.status(500).json({ error: 'Failed to update baseline', detail: error.message });
        }

        if (!baseline) {
          return res.status(404).json({ error: 'Baseline not found' });
        }

        return res.status(200).json({ success: true, baseline });
      } catch (err: any) {
        console.error('[baselines] update unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // action=comparisons  (GET | POST)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'comparisons') {
    // GET — list baseline comparisons
    if (req.method === 'GET') {
      const contractId = req.query.contract_id as string;
      const baselineId = req.query.baseline_id as string | undefined;
      const year = req.query.year as string | undefined;

      if (!contractId) {
        return res.status(400).json({ error: 'contract_id query param is required' });
      }

      try {
        let query = supabase
          .from('baseline_comparisons')
          .select('*')
          .eq('contract_id', contractId)
          .order('created_at', { ascending: false });

        if (baselineId) {
          query = query.eq('baseline_id', baselineId);
        }

        if (year) {
          query = query.eq('comparison_year', parseInt(year, 10));
        }

        const { data: comparisons, error } = await query;

        if (error) {
          console.error('[baselines] comparisons query error:', error);
          return res.status(500).json({ error: 'Failed to fetch comparisons', detail: error.message });
        }

        return res.status(200).json({ comparisons: comparisons || [] });
      } catch (err: any) {
        console.error('[baselines] comparisons unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    // POST — create comparison record
    if (req.method === 'POST') {
      const {
        contract_id,
        baseline_id,
        comparison_year,
        actual_value,
        actual_unit,
        actual_cost,
        savings_claimed,
        savings_verified,
        variance_pct,
        variance_reason,
        notes,
      } = req.body || {};

      if (!contract_id || !baseline_id) {
        return res.status(400).json({ error: 'contract_id and baseline_id are required' });
      }

      try {
        const { data: comparison, error } = await supabase
          .from('baseline_comparisons')
          .insert({
            contract_id,
            baseline_id,
            comparison_year: comparison_year || null,
            actual_value: actual_value || null,
            actual_unit: actual_unit || null,
            actual_cost: actual_cost || null,
            savings_claimed: savings_claimed || null,
            savings_verified: savings_verified || null,
            variance_pct: variance_pct || null,
            variance_reason: variance_reason || null,
            notes: notes || null,
          })
          .select()
          .single();

        if (error) {
          console.error('[baselines] comparison create error:', error);
          return res.status(500).json({ error: 'Failed to create comparison', detail: error.message });
        }

        return res.status(201).json({ success: true, comparison });
      } catch (err: any) {
        console.error('[baselines] comparison create unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // action=dispute-report  (POST only)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'dispute-report') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { contractId } = req.body || {};

    if (!contractId) {
      return res.status(400).json({ error: 'contractId is required' });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
    if (!anthropicKey) {
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    try {
      // Fetch all relevant data for the contract in parallel
      const [baselinesResult, comparisonsResult, igaResult, commsResult] = await Promise.all([
        supabase
          .from('baselines')
          .select('*')
          .eq('contract_id', contractId)
          .order('created_at', { ascending: false }),
        supabase
          .from('baseline_comparisons')
          .select('*')
          .eq('contract_id', contractId)
          .order('created_at', { ascending: false }),
        supabase
          .from('iga_assumptions')
          .select('*')
          .eq('contract_id', contractId)
          .order('created_at', { ascending: false }),
        supabase
          .from('communications_log')
          .select('*')
          .eq('contract_id', contractId)
          .order('created_at', { ascending: false }),
      ]);

      const errors: string[] = [];
      if (baselinesResult.error) errors.push(`baselines: ${baselinesResult.error.message}`);
      if (comparisonsResult.error) errors.push(`comparisons: ${comparisonsResult.error.message}`);
      if (igaResult.error) errors.push(`iga_assumptions: ${igaResult.error.message}`);
      if (commsResult.error) errors.push(`communications_log: ${commsResult.error.message}`);

      if (errors.length > 0) {
        console.error('[baselines] dispute-report query errors:', errors);
      }

      const contextData = {
        baselines: baselinesResult.data || [],
        comparisons: comparisonsResult.data || [],
        iga_assumptions: igaResult.data || [],
        communications_log: commsResult.data || [],
      };

      const anthropic = new Anthropic({ apiKey: anthropicKey });

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `${DISPUTE_REPORT_PROMPT}\n\nContract Data:\n${JSON.stringify(contextData, null, 2)}`,
          },
        ],
      });

      const reportText = message.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('\n');

      return res.status(200).json({
        success: true,
        report: reportText,
        data_summary: {
          baselines_count: contextData.baselines.length,
          comparisons_count: contextData.comparisons.length,
          iga_assumptions_count: contextData.iga_assumptions.length,
          communications_count: contextData.communications_log.length,
        },
        query_errors: errors.length > 0 ? errors : undefined,
      });
    } catch (err: any) {
      console.error('[baselines] dispute-report unexpected error:', err);
      return res.status(500).json({ error: 'Internal server error', detail: err.message });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // action=extract  (POST only)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'extract') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fileBase64, fileName, contractId } = req.body || {};

    if (!fileBase64 || !fileName || !contractId) {
      return res.status(400).json({ error: 'fileBase64, fileName, and contractId are required' });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
    if (!anthropicKey) {
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    try {
      // 1. Upload PDF to Supabase Storage
      const buffer = Buffer.from(fileBase64, 'base64');
      const storagePath = `baselines/${contractId}/${Date.now()}_${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error('[baselines] storage upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload document', detail: uploadError.message });
      }

      // 2. Send to Claude for extraction
      const anthropic = new Anthropic({ apiKey: anthropicKey });

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
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
                  data: fileBase64,
                },
              },
              {
                type: 'text',
                text: BASELINE_EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      });

      const rawText = message.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('\n');

      // 3. Parse extraction result
      let extracted: any;
      try {
        extracted = JSON.parse(rawText);
      } catch {
        console.error('[baselines] extraction JSON parse failed, raw:', rawText);
        return res.status(200).json({
          success: false,
          error: 'Failed to parse extraction result as JSON',
          raw_text: rawText,
          storage_path: storagePath,
        });
      }

      // 4. Store extracted baselines in the baselines table
      const baselineRows = (extracted.baselines || []).map((b: any) => ({
        contract_id: contractId,
        ecm_name: b.ecm_name || null,
        measure_type: b.measure_type || null,
        baseline_year: b.baseline_year || null,
        baseline_period_start: b.baseline_period_start || null,
        baseline_period_end: b.baseline_period_end || null,
        baseline_value: b.baseline_value || null,
        baseline_unit: b.baseline_unit || null,
        baseline_cost: b.baseline_cost || null,
        adjustment_method: b.adjustment_method || null,
        degree_days_heating: b.degree_days_heating || null,
        degree_days_cooling: b.degree_days_cooling || null,
        data_source: b.data_source || null,
        mv_option: b.mv_option || null,
        notes: b.notes || null,
        status: 'pending',
        source_document_path: storagePath,
      }));

      let insertedBaselines: any[] = [];

      if (baselineRows.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('baselines')
          .insert(baselineRows)
          .select();

        if (insertError) {
          console.error('[baselines] insert error:', insertError);
          return res.status(500).json({
            error: 'Extraction succeeded but failed to store baselines',
            detail: insertError.message,
            extracted,
            storage_path: storagePath,
          });
        }

        insertedBaselines = inserted || [];
      }

      return res.status(200).json({
        success: true,
        baselines: insertedBaselines,
        facility_info: extracted.facility_info || null,
        confidence_score: extracted.confidence_score || null,
        extraction_notes: extracted.extraction_notes || [],
        raw_text_summary: extracted.raw_text_summary || null,
        storage_path: storagePath,
      });
    } catch (err: any) {
      console.error('[baselines] extract unexpected error:', err);
      return res.status(500).json({ error: 'Internal server error', detail: err.message });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Unknown or missing action
  // ═══════════════════════════════════════════════════════════════════════════
  return res.status(400).json({
    error: 'Missing or invalid "action" query param — expected list, comparisons, dispute-report, or extract',
  });
}

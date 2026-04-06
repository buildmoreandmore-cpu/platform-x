import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

/* ─────────────────────────────────────────────────────────────────────────────
 * Consolidated knowledge-base endpoint — Modules 1 & 2.
 *
 * Route via query param ?action=
 *
 *   GET  ?action=timeline          → list timeline events      (?contract_id=)
 *   POST ?action=timeline          → create timeline event
 *   GET  ?action=personnel         → list personnel            (?contract_id=)
 *   POST ?action=personnel         → create/update personnel
 *   PATCH?action=personnel         → mark departed (end_date, is_active=false)
 *   GET  ?action=iga-assumptions   → list IGA assumptions      (?contract_id=)
 *   PATCH?action=iga-assumptions   → verify/flag assumption
 *   GET  ?action=communications    → list communications       (?contract_id=, ?type=)
 *   POST ?action=communications    → create communication log
 *   GET  ?action=rfi               → list RFIs                 (?contract_id=)
 *   POST ?action=rfi               → create RFI
 *   PATCH?action=rfi               → update RFI (response, status)
 *   POST ?action=ai-summary        → Claude AI summary of comms about a topic
 * ────────────────────────────────────────────────────────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient<any>(supabaseUrl, supabaseKey);
  const action = (req.query.action as string) || '';

  // ═══════════════════════════════════════════════════════════════════════════
  // action=timeline  (GET | POST)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'timeline') {
    if (req.method === 'GET') {
      const contract_id = req.query.contract_id as string;
      if (!contract_id) {
        return res.status(400).json({ error: 'contract_id query param is required' });
      }

      try {
        const { data, error } = await supabase
          .from('timeline_events')
          .select('*')
          .eq('contract_id', contract_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[knowledge] timeline GET error:', error);
          return res.status(500).json({ error: 'Failed to fetch timeline events', detail: error.message });
        }

        return res.status(200).json({ timeline_events: data || [] });
      } catch (err: any) {
        console.error('[knowledge] timeline GET unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    if (req.method === 'POST') {
      try {
        const body = req.body;
        if (!body.contract_id) {
          return res.status(400).json({ error: 'contract_id is required' });
        }

        const { data, error } = await supabase
          .from('timeline_events')
          .insert(body)
          .select()
          .single();

        if (error) {
          console.error('[knowledge] timeline POST error:', error);
          return res.status(500).json({ error: 'Failed to create timeline event', detail: error.message });
        }

        return res.status(201).json({ timeline_event: data });
      } catch (err: any) {
        console.error('[knowledge] timeline POST unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // action=personnel  (GET | POST | PATCH)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'personnel') {
    if (req.method === 'GET') {
      const contract_id = req.query.contract_id as string;
      if (!contract_id) {
        return res.status(400).json({ error: 'contract_id query param is required' });
      }

      try {
        const { data, error } = await supabase
          .from('personnel')
          .select('*')
          .eq('contract_id', contract_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[knowledge] personnel GET error:', error);
          return res.status(500).json({ error: 'Failed to fetch personnel', detail: error.message });
        }

        return res.status(200).json({ personnel: data || [] });
      } catch (err: any) {
        console.error('[knowledge] personnel GET unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    if (req.method === 'POST') {
      try {
        const body = req.body;
        if (!body.contract_id) {
          return res.status(400).json({ error: 'contract_id is required' });
        }

        const { data, error } = await supabase
          .from('personnel')
          .insert(body)
          .select()
          .single();

        if (error) {
          console.error('[knowledge] personnel POST error:', error);
          return res.status(500).json({ error: 'Failed to create personnel', detail: error.message });
        }

        return res.status(201).json({ personnel: data });
      } catch (err: any) {
        console.error('[knowledge] personnel POST unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    if (req.method === 'PATCH') {
      try {
        const { id, end_date } = req.body;
        if (!id) {
          return res.status(400).json({ error: 'id is required' });
        }

        const { data, error } = await supabase
          .from('personnel')
          .update({
            end_date: end_date || new Date().toISOString(),
            is_active: false,
          })
          .match({ id })
          .select()
          .single();

        if (error) {
          console.error('[knowledge] personnel PATCH error:', error);
          return res.status(500).json({ error: 'Failed to update personnel', detail: error.message });
        }

        if (!data) {
          return res.status(404).json({ error: 'Personnel record not found' });
        }

        return res.status(200).json({ success: true, personnel: data });
      } catch (err: any) {
        console.error('[knowledge] personnel PATCH unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // action=iga-assumptions  (GET | PATCH)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'iga-assumptions') {
    if (req.method === 'GET') {
      const contract_id = req.query.contract_id as string;
      if (!contract_id) {
        return res.status(400).json({ error: 'contract_id query param is required' });
      }

      try {
        const { data, error } = await supabase
          .from('iga_assumptions')
          .select('*')
          .eq('contract_id', contract_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[knowledge] iga-assumptions GET error:', error);
          return res.status(500).json({ error: 'Failed to fetch IGA assumptions', detail: error.message });
        }

        return res.status(200).json({ iga_assumptions: data || [] });
      } catch (err: any) {
        console.error('[knowledge] iga-assumptions GET unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    if (req.method === 'PATCH') {
      try {
        const { id, ...updates } = req.body;
        if (!id) {
          return res.status(400).json({ error: 'id is required' });
        }

        const { data, error } = await supabase
          .from('iga_assumptions')
          .update(updates)
          .match({ id })
          .select()
          .single();

        if (error) {
          console.error('[knowledge] iga-assumptions PATCH error:', error);
          return res.status(500).json({ error: 'Failed to update IGA assumption', detail: error.message });
        }

        if (!data) {
          return res.status(404).json({ error: 'IGA assumption not found' });
        }

        return res.status(200).json({ success: true, iga_assumption: data });
      } catch (err: any) {
        console.error('[knowledge] iga-assumptions PATCH unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // action=communications  (GET | POST)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'communications') {
    if (req.method === 'GET') {
      const contract_id = req.query.contract_id as string;
      if (!contract_id) {
        return res.status(400).json({ error: 'contract_id query param is required' });
      }

      try {
        let query = supabase
          .from('communications')
          .select('*')
          .eq('contract_id', contract_id);

        const type = req.query.type as string;
        if (type) {
          query = query.eq('type', type);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('[knowledge] communications GET error:', error);
          return res.status(500).json({ error: 'Failed to fetch communications', detail: error.message });
        }

        return res.status(200).json({ communications: data || [] });
      } catch (err: any) {
        console.error('[knowledge] communications GET unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    if (req.method === 'POST') {
      try {
        const body = req.body;
        if (!body.contract_id) {
          return res.status(400).json({ error: 'contract_id is required' });
        }

        const { data, error } = await supabase
          .from('communications')
          .insert(body)
          .select()
          .single();

        if (error) {
          console.error('[knowledge] communications POST error:', error);
          return res.status(500).json({ error: 'Failed to create communication', detail: error.message });
        }

        return res.status(201).json({ communication: data });
      } catch (err: any) {
        console.error('[knowledge] communications POST unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // action=rfi  (GET | POST | PATCH)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'rfi') {
    if (req.method === 'GET') {
      const contract_id = req.query.contract_id as string;
      if (!contract_id) {
        return res.status(400).json({ error: 'contract_id query param is required' });
      }

      try {
        const { data, error } = await supabase
          .from('rfis')
          .select('*')
          .eq('contract_id', contract_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[knowledge] rfi GET error:', error);
          return res.status(500).json({ error: 'Failed to fetch RFIs', detail: error.message });
        }

        return res.status(200).json({ rfis: data || [] });
      } catch (err: any) {
        console.error('[knowledge] rfi GET unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    if (req.method === 'POST') {
      try {
        const body = req.body;
        if (!body.contract_id) {
          return res.status(400).json({ error: 'contract_id is required' });
        }

        const { data, error } = await supabase
          .from('rfis')
          .insert(body)
          .select()
          .single();

        if (error) {
          console.error('[knowledge] rfi POST error:', error);
          return res.status(500).json({ error: 'Failed to create RFI', detail: error.message });
        }

        return res.status(201).json({ rfi: data });
      } catch (err: any) {
        console.error('[knowledge] rfi POST unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    if (req.method === 'PATCH') {
      try {
        const { id, ...updates } = req.body;
        if (!id) {
          return res.status(400).json({ error: 'id is required' });
        }

        const { data, error } = await supabase
          .from('rfis')
          .update(updates)
          .match({ id })
          .select()
          .single();

        if (error) {
          console.error('[knowledge] rfi PATCH error:', error);
          return res.status(500).json({ error: 'Failed to update RFI', detail: error.message });
        }

        if (!data) {
          return res.status(404).json({ error: 'RFI not found' });
        }

        return res.status(200).json({ success: true, rfi: data });
      } catch (err: any) {
        console.error('[knowledge] rfi PATCH unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // action=ai-summary  (POST only)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'ai-summary') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { contract_id, topic } = req.body;
      if (!contract_id || !topic) {
        return res.status(400).json({ error: 'contract_id and topic are required' });
      }

      // Fetch all communications for the contract
      const { data: comms, error: commsError } = await supabase
        .from('communications')
        .select('*')
        .eq('contract_id', contract_id)
        .order('created_at', { ascending: true });

      if (commsError) {
        console.error('[knowledge] ai-summary comms fetch error:', commsError);
        return res.status(500).json({ error: 'Failed to fetch communications', detail: commsError.message });
      }

      if (!comms || comms.length === 0) {
        return res.status(200).json({ summary: 'No communications found for this contract.' });
      }

      const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
      if (!anthropicKey) {
        return res.status(500).json({ error: 'Anthropic API key not configured' });
      }

      const anthropic = new Anthropic({ apiKey: anthropicKey });

      const commsText = comms
        .map((c: any, i: number) =>
          `[${i + 1}] ${c.created_at} | Type: ${c.type || 'N/A'} | From: ${c.from || 'N/A'} | To: ${c.to || 'N/A'}\nSubject: ${c.subject || 'N/A'}\n${c.body || c.content || c.summary || ''}`
        )
        .join('\n\n---\n\n');

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are an energy performance contract analyst. Below are all communications for a contract. Summarize the key points, decisions, and outstanding items specifically related to the topic: "${topic}".\n\nIf the topic is not mentioned in any communication, say so clearly.\n\n--- COMMUNICATIONS ---\n\n${commsText}`,
          },
        ],
      });

      const summaryText =
        message.content[0].type === 'text' ? message.content[0].text : 'Unable to generate summary.';

      return res.status(200).json({ summary: summaryText });
    } catch (err: any) {
      console.error('[knowledge] ai-summary unexpected error:', err);
      return res.status(500).json({ error: 'Internal server error', detail: err.message });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Unknown or missing action
  // ═══════════════════════════════════════════════════════════════════════════
  return res.status(400).json({
    error: 'Missing or invalid "action" query param — expected timeline, personnel, iga-assumptions, communications, rfi, or ai-summary',
  });
}

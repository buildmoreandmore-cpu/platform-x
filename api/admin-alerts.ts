import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // ── GET: return active alerts ──────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[admin-alerts] Query error:', error);
        return res.status(500).json({ error: 'Failed to fetch alerts', detail: error.message });
      }

      return res.status(200).json({ alerts: alerts || [] });
    } catch (err: any) {
      console.error('[admin-alerts] Unexpected error:', err);
      return res.status(500).json({ error: 'Internal server error', detail: err.message });
    }
  }

  // ── PATCH: acknowledge or resolve an alert ─────────────────────────────────
  if (req.method === 'PATCH') {
    const { id, action } = req.body || {};

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "id"' });
    }
    if (!action || !['acknowledge', 'resolve'].includes(action)) {
      return res.status(400).json({ error: 'Invalid "action" — must be "acknowledge" or "resolve"' });
    }

    try {
      const updateData: Record<string, any> = {};

      if (action === 'acknowledge') {
        updateData.status = 'acknowledged';
        updateData.acknowledged_at = new Date().toISOString();
      } else if (action === 'resolve') {
        updateData.status = 'resolved';
        updateData.resolved_at = new Date().toISOString();
      }

      const { data: alert, error } = await supabase
        .from('alerts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[admin-alerts] Update error:', error);
        return res.status(500).json({ error: 'Failed to update alert', detail: error.message });
      }

      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      return res.status(200).json({ success: true, alert });
    } catch (err: any) {
      console.error('[admin-alerts] Unexpected error:', err);
      return res.status(500).json({ error: 'Internal server error', detail: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

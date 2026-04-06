import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/* ─────────────────────────────────────────────────────────────────────────────
 * Consolidated admin endpoint.
 *
 * Route via query param ?action=data|alerts|users
 *
 *   GET  ?action=data   → admin dashboard data        (was admin-data.ts)
 *   GET  ?action=alerts → list active alerts           (was admin-alerts.ts)
 *   PATCH?action=alerts → acknowledge/resolve alert    (was admin-alerts.ts)
 *   GET  ?action=users  → list users                   (was admin-users.ts)
 *   POST ?action=users  → create user                  (was admin-users.ts)
 *   PATCH?action=users  → update user                  (was admin-users.ts)
 * ────────────────────────────────────────────────────────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const action = (req.query.action as string) || '';

  // ═══════════════════════════════════════════════════════════════════════════
  // action=data  (GET only)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'data') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const [
        contractsResult,
        ecmsResult,
        alertsResult,
        documentsResult,
        utilityReadingsResult,
        mvReportsResult,
      ] = await Promise.all([
        supabase
          .from('contracts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('ecms')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('utility_readings')
          .select('*')
          .order('billing_period_end', { ascending: false })
          .limit(200),
        supabase
          .from('mv_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      const errors: string[] = [];
      if (contractsResult.error) errors.push(`contracts: ${contractsResult.error.message}`);
      if (ecmsResult.error) errors.push(`ecms: ${ecmsResult.error.message}`);
      if (alertsResult.error) errors.push(`alerts: ${alertsResult.error.message}`);
      if (documentsResult.error) errors.push(`documents: ${documentsResult.error.message}`);
      if (utilityReadingsResult.error) errors.push(`utility_readings: ${utilityReadingsResult.error.message}`);
      if (mvReportsResult.error) errors.push(`mv_reports: ${mvReportsResult.error.message}`);

      if (errors.length > 0) {
        console.error('[admin] data query errors:', errors);
      }

      const contracts = contractsResult.data || [];
      const ecms = ecmsResult.data || [];
      const alerts = alertsResult.data || [];
      const documents = documentsResult.data || [];
      const utilityReadings = utilityReadingsResult.data || [];
      const mvReports = mvReportsResult.data || [];

      const activeAlerts = alerts.filter((a: any) => a.status === 'active');
      const totalContractValue = contracts.reduce((sum: number, c: any) => sum + (c.contract_value || 0), 0);
      const totalGuaranteedSavings = contracts.reduce((sum: number, c: any) => sum + (c.guaranteed_savings_annual || 0), 0);
      const totalVerifiedSavings = utilityReadings.reduce((sum: number, r: any) => sum + (r.verified_savings || 0), 0);

      return res.status(200).json({
        contracts,
        ecms,
        alerts,
        documents,
        utility_readings: utilityReadings,
        mv_reports: mvReports,
        summary: {
          total_contracts: contracts.length,
          total_contract_value: totalContractValue,
          total_guaranteed_savings: totalGuaranteedSavings,
          total_verified_savings: totalVerifiedSavings,
          active_alerts: activeAlerts.length,
          total_ecms: ecms.length,
          total_documents: documents.length,
        },
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (err: any) {
      console.error('[admin] data unexpected error:', err);
      return res.status(500).json({ error: 'Internal server error', detail: err.message });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // action=alerts  (GET | PATCH)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'alerts') {
    // GET — return active alerts
    if (req.method === 'GET') {
      try {
        const { data: alerts, error } = await supabase
          .from('alerts')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[admin] alerts query error:', error);
          return res.status(500).json({ error: 'Failed to fetch alerts', detail: error.message });
        }

        return res.status(200).json({ alerts: alerts || [] });
      } catch (err: any) {
        console.error('[admin] alerts unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    // PATCH — acknowledge or resolve an alert
    if (req.method === 'PATCH') {
      const { id, action: alertAction } = req.body || {};

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "id"' });
      }
      if (!alertAction || !['acknowledge', 'resolve'].includes(alertAction)) {
        return res.status(400).json({ error: 'Invalid "action" — must be "acknowledge" or "resolve"' });
      }

      try {
        const updateData: Record<string, any> = {};

        if (alertAction === 'acknowledge') {
          updateData.status = 'acknowledged';
          updateData.acknowledged_at = new Date().toISOString();
        } else if (alertAction === 'resolve') {
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
          console.error('[admin] alerts update error:', error);
          return res.status(500).json({ error: 'Failed to update alert', detail: error.message });
        }

        if (!alert) {
          return res.status(404).json({ error: 'Alert not found' });
        }

        return res.status(200).json({ success: true, alert });
      } catch (err: any) {
        console.error('[admin] alerts unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // action=users  (GET | POST | PATCH)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'users') {
    const method = req.method;

    // GET — list all users with contract access
    if (method === 'GET') {
      try {
        const [profilesResult, accessResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('contract_access')
            .select('*'),
        ]);

        if (profilesResult.error) {
          return res.status(500).json({ error: profilesResult.error.message });
        }

        const profiles = profilesResult.data || [];
        const accessRecords = accessResult.data || [];

        const users = profiles.map((p: any) => ({
          ...p,
          contract_access: accessRecords.filter((a: any) => a.user_id === p.id),
        }));

        return res.status(200).json({ users });
      } catch (err: any) {
        console.error('[admin] users GET error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    // POST — create a new user
    if (method === 'POST') {
      try {
        const { email, password, full_name, role, organization, credentials, contract_ids } = req.body;

        if (!email || !password) {
          return res.status(400).json({ error: 'email and password are required' });
        }

        if (!role || !['admin', 'client', 'cmvp'].includes(role)) {
          return res.status(400).json({ error: 'role must be admin, client, or cmvp' });
        }

        // 1. Create auth user via Supabase admin API
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (authError) {
          return res.status(400).json({ error: authError.message });
        }

        const userId = authData.user.id;

        // 2. Insert profile record
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email,
            full_name: full_name || null,
            role,
            organization: organization || null,
            credentials: credentials || null,
            is_active: true,
          });

        if (profileError) {
          console.error('[admin] users profile insert error:', profileError);
          await supabase.auth.admin.deleteUser(userId);
          return res.status(500).json({ error: 'Failed to create profile', detail: profileError.message });
        }

        // 3. Insert contract_access records if provided
        if (contract_ids && Array.isArray(contract_ids) && contract_ids.length > 0) {
          const accessRows = contract_ids.map((cid: string) => ({
            user_id: userId,
            contract_id: cid,
          }));

          const { error: accessError } = await supabase
            .from('contract_access')
            .insert(accessRows);

          if (accessError) {
            console.error('[admin] users contract access insert error:', accessError);
          }
        }

        // 4. Return created user with access
        const { data: createdProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        const { data: createdAccess } = await supabase
          .from('contract_access')
          .select('*')
          .eq('user_id', userId);

        return res.status(201).json({
          user: {
            ...createdProfile,
            contract_access: createdAccess || [],
          },
        });
      } catch (err: any) {
        console.error('[admin] users POST error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    // PATCH — update user (toggle active, change role, grant/revoke access)
    if (method === 'PATCH') {
      try {
        const { user_id, action: userAction, role, contract_id } = req.body;

        if (!user_id || !userAction) {
          return res.status(400).json({ error: 'user_id and action are required' });
        }

        switch (userAction) {
          case 'toggle_active': {
            const { data: profile, error: fetchErr } = await supabase
              .from('profiles')
              .select('is_active')
              .eq('id', user_id)
              .single();

            if (fetchErr || !profile) {
              return res.status(404).json({ error: 'User not found' });
            }

            const { error: updateErr } = await supabase
              .from('profiles')
              .update({ is_active: !profile.is_active })
              .eq('id', user_id);

            if (updateErr) {
              return res.status(500).json({ error: updateErr.message });
            }

            return res.status(200).json({ success: true, is_active: !profile.is_active });
          }

          case 'update_role': {
            if (!role || !['admin', 'client', 'cmvp'].includes(role)) {
              return res.status(400).json({ error: 'role must be admin, client, or cmvp' });
            }

            const { error: roleErr } = await supabase
              .from('profiles')
              .update({ role })
              .eq('id', user_id);

            if (roleErr) {
              return res.status(500).json({ error: roleErr.message });
            }

            return res.status(200).json({ success: true, role });
          }

          case 'grant_access': {
            if (!contract_id) {
              return res.status(400).json({ error: 'contract_id is required for grant_access' });
            }

            const { error: grantErr } = await supabase
              .from('contract_access')
              .upsert({ user_id, contract_id }, { onConflict: 'user_id,contract_id' });

            if (grantErr) {
              return res.status(500).json({ error: grantErr.message });
            }

            return res.status(200).json({ success: true });
          }

          case 'revoke_access': {
            if (!contract_id) {
              return res.status(400).json({ error: 'contract_id is required for revoke_access' });
            }

            const { error: revokeErr } = await supabase
              .from('contract_access')
              .delete()
              .eq('user_id', user_id)
              .eq('contract_id', contract_id);

            if (revokeErr) {
              return res.status(500).json({ error: revokeErr.message });
            }

            return res.status(200).json({ success: true });
          }

          default:
            return res.status(400).json({ error: `Unknown action: ${userAction}` });
        }
      } catch (err: any) {
        console.error('[admin] users PATCH error:', err);
        return res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Unknown or missing action
  // ═══════════════════════════════════════════════════════════════════════════
  return res.status(400).json({ error: 'Missing or invalid "action" query param — expected data, alerts, or users' });
}

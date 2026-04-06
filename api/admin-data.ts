import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Fetch all data in parallel
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

    // Check for errors
    const errors: string[] = [];
    if (contractsResult.error) errors.push(`contracts: ${contractsResult.error.message}`);
    if (ecmsResult.error) errors.push(`ecms: ${ecmsResult.error.message}`);
    if (alertsResult.error) errors.push(`alerts: ${alertsResult.error.message}`);
    if (documentsResult.error) errors.push(`documents: ${documentsResult.error.message}`);
    if (utilityReadingsResult.error) errors.push(`utility_readings: ${utilityReadingsResult.error.message}`);
    if (mvReportsResult.error) errors.push(`mv_reports: ${mvReportsResult.error.message}`);

    if (errors.length > 0) {
      console.error('[admin-data] Query errors:', errors);
    }

    // Compute summary stats
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
    console.error('[admin-data] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

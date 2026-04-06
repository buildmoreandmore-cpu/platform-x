import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Fetch contracts, ECMs, alerts, utility readings, and report deliverables
    const [
      contractsResult,
      ecmsResult,
      alertsResult,
      utilityReadingsResult,
      reportDeliverablesResult,
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
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('utility_readings')
        .select('*')
        .order('billing_period_end', { ascending: false })
        .limit(200),
      supabase
        .from('report_deliverables')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    const contracts = contractsResult.data || []
    const ecms = ecmsResult.data || []
    const alerts = alertsResult.data || []
    const utilityReadings = utilityReadingsResult.data || []
    const reportDeliverables = reportDeliverablesResult.data || []

    // Build client-facing contract objects with nested ECMs, alerts, and reports
    const enrichedContracts = contracts.map((c: any) => {
      const contractEcms = ecms.filter((e: any) => e.contract_id === c.id)
      const contractAlerts = alerts.filter((a: any) => a.contract_id === c.id)
      const contractReports = reportDeliverables.filter((r: any) => r.contract_id === c.id)
      const contractReadings = utilityReadings.filter((r: any) => r.contract_id === c.id)

      // Calculate verified savings YTD from utility readings or ECMs
      const verifiedSavingsYTD = contractReadings.reduce(
        (sum: number, r: any) => sum + (r.verified_savings || 0), 0
      ) || contractEcms.reduce(
        (sum: number, e: any) => sum + (e.verified_savings || 0), 0
      )

      const guaranteedAnnual = c.guaranteed_savings_annual || c.guaranteed_annual_savings || 0
      const performancePct = guaranteedAnnual > 0 ? (verifiedSavingsYTD / guaranteedAnnual) * 100 : 0

      // Determine contract year
      const startYear = c.contract_start_year || (c.start_date ? new Date(c.start_date).getFullYear() : new Date().getFullYear())
      const currentYear = c.current_year || (new Date().getFullYear() - startYear + 1)
      const termYears = c.contract_term_years || c.term_years || 20

      return {
        id: c.id,
        client_name: c.client_name,
        building_name: c.building_name,
        contract_value: c.contract_value || 0,
        guaranteed_savings_annual: guaranteedAnnual,
        verified_savings_ytd: verifiedSavingsYTD,
        contract_start_year: startYear,
        contract_term_years: termYears,
        current_year: currentYear,
        performance_pct: Math.round(performancePct * 10) / 10,
        ecms: contractEcms.map((e: any) => ({
          id: e.id,
          name: e.name || e.ecm_name,
          ecm_type: e.ecm_type || e.type || 'Unknown',
          guaranteed_savings: e.guaranteed_savings || 0,
          verified_savings: e.verified_savings || 0,
          performance_pct: e.guaranteed_savings > 0
            ? Math.round(((e.verified_savings || 0) / e.guaranteed_savings) * 1000) / 10
            : 0,
          status: e.status || 'active',
        })),
        alerts: contractAlerts.map((a: any) => ({
          id: a.id,
          severity: a.severity || 'info',
          title: a.title,
          description: a.description,
          created_at: a.created_at,
        })),
        report_deliverables: contractReports.map((r: any) => ({
          id: r.id,
          title: r.title || r.file_name || 'Report',
          report_type: r.report_type || r.document_type || 'M&V Report',
          period: r.period || 'Current Period',
          created_at: r.created_at,
          file_url: r.file_url || null,
        })),
      }
    })

    // Summary
    const totalVerifiedYTD = enrichedContracts.reduce((s: number, c: any) => s + c.verified_savings_ytd, 0)
    const totalGuaranteedYTD = enrichedContracts.reduce((s: number, c: any) => s + c.guaranteed_savings_annual, 0)
    const avgPerformance = enrichedContracts.length > 0
      ? enrichedContracts.reduce((s: number, c: any) => s + c.performance_pct, 0) / enrichedContracts.length
      : 0
    const criticalAlerts = alerts.filter((a: any) => a.severity === 'critical').length

    return res.status(200).json({
      contracts: enrichedContracts,
      summary: {
        total_verified_savings_ytd: totalVerifiedYTD,
        total_guaranteed_savings_ytd: totalGuaranteedYTD,
        avg_performance_pct: Math.round(avgPerformance * 10) / 10,
        critical_alerts: criticalAlerts,
      },
    })
  } catch (err: any) {
    console.error('[client-data] Error:', err)
    return res.status(500).json({ error: 'Internal server error', detail: err.message })
  }
}

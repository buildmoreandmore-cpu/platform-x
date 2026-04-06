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
    const [
      tasksResult,
      contractsResult,
      ecmsResult,
    ] = await Promise.all([
      supabase
        .from('mv_tasks')
        .select('*')
        .order('due_date', { ascending: true }),
      supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('ecms')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

    const tasks = tasksResult.data || []
    const contracts = contractsResult.data || []
    const ecms = ecmsResult.data || []

    // Enrich contracts with ECMs
    const enrichedContracts = contracts.map((c: any) => {
      const contractEcms = ecms.filter((e: any) => e.contract_id === c.id)
      const verifiedYTD = contractEcms.reduce((s: number, e: any) => s + (e.verified_savings || 0), 0)
      const guaranteedAnnual = c.guaranteed_savings_annual || c.guaranteed_annual_savings || 0
      const performancePct = guaranteedAnnual > 0 ? (verifiedYTD / guaranteedAnnual) * 100 : 0

      return {
        id: c.id,
        client_name: c.client_name,
        building_name: c.building_name,
        contract_value: c.contract_value || 0,
        guaranteed_savings_annual: guaranteedAnnual,
        verified_savings_ytd: verifiedYTD,
        performance_pct: Math.round(performancePct * 10) / 10,
        current_year: c.current_year || 1,
        contract_term_years: c.contract_term_years || c.term_years || 20,
        status: c.status || 'active',
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
      }
    })

    // Format tasks
    const formattedTasks = tasks.map((t: any) => ({
      id: t.id,
      task_type: t.task_type || 'savings_verification',
      title: t.title || 'M&V Review Task',
      building_name: t.building_name || 'Unknown Building',
      period: t.period || 'Current Period',
      priority: t.priority || 'medium',
      due_date: t.due_date || new Date().toISOString(),
      status: t.status || 'pending',
      contract_id: t.contract_id,
    }))

    // Summary
    const pending = formattedTasks.filter((t: any) => t.status === 'pending').length
    const inReview = formattedTasks.filter((t: any) => t.status === 'in_review').length
    const completed = formattedTasks.filter((t: any) => t.status === 'completed').length

    return res.status(200).json({
      tasks: formattedTasks,
      contracts: enrichedContracts,
      summary: {
        pending,
        in_review: inReview,
        completed,
        contracts_assigned: contracts.length,
      },
    })
  } catch (err: any) {
    console.error('[cmvp-data] Error:', err)
    return res.status(500).json({ error: 'Internal server error', detail: err.message })
  }
}

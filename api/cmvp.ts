import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

/* ─────────────────────────────────────────────────────────────────────────────
 * Consolidated CMVP endpoint.
 *
 * Route via query param ?action=data|tasks|sign-off
 *
 *   GET  ?action=data     → CMVP dashboard data          (was cmvp-data.ts)
 *   GET  ?action=tasks    → task list (optional &id=)     (was cmvp-tasks.ts)
 *   POST ?action=sign-off → CMVP sign-off                (was cmvp-sign-off.ts)
 * ────────────────────────────────────────────────────────────────────────── */

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = (req.query.action as string) || ''

  // ═══════════════════════════════════════════════════════════════════════════
  // action=data  (GET only)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'data') {
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
      console.error('[cmvp] data error:', err)
      return res.status(500).json({ error: 'Internal server error', detail: err.message })
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // action=tasks  (GET only, optional &id= for single task)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'tasks') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { id } = req.query

    try {
      if (id && typeof id === 'string') {
        // Single task detail
        const { data: task, error } = await supabase
          .from('mv_tasks')
          .select('*')
          .eq('id', id)
          .single()

        if (error || !task) {
          return res.status(404).json({ error: 'Task not found' })
        }

        // Get associated ECM info if available
        let ecmInfo: any = {}
        if (task.ecm_id) {
          const { data: ecm } = await supabase
            .from('ecms')
            .select('name, ecm_name, ecm_type, type, guaranteed_savings, verified_savings')
            .eq('id', task.ecm_id)
            .single()
          if (ecm) {
            ecmInfo = {
              ecm_name: ecm.name || ecm.ecm_name || '',
              ecm_type: ecm.ecm_type || ecm.type || '',
            }
          }
        }

        // Get contract info
        let contractInfo: any = {}
        if (task.contract_id) {
          const { data: contract } = await supabase
            .from('contracts')
            .select('guaranteed_savings_annual, guaranteed_annual_savings')
            .eq('id', task.contract_id)
            .single()
          if (contract) {
            contractInfo = {
              guaranteed_savings: contract.guaranteed_savings_annual || contract.guaranteed_annual_savings || 0,
            }
          }
        }

        return res.status(200).json({
          task: {
            id: task.id,
            task_type: task.task_type || 'savings_verification',
            title: task.title || 'M&V Review Task',
            description: task.description || '',
            building_name: task.building_name || 'Unknown Building',
            period: task.period || 'Current Period',
            priority: task.priority || 'medium',
            due_date: task.due_date || new Date().toISOString(),
            status: task.status || 'pending',
            contract_id: task.contract_id,
            system_calculated_savings: task.system_calculated_savings || 0,
            guaranteed_savings: contractInfo.guaranteed_savings || task.guaranteed_savings || 0,
            cmvp_verified_savings: task.cmvp_verified_savings || null,
            cmvp_notes: task.cmvp_notes || null,
            methodology_comments: task.methodology_comments || null,
            discrepancy_flags: task.discrepancy_flags || [],
            ...ecmInfo,
          },
        })
      }

      // All tasks
      const { data: tasks, error } = await supabase
        .from('mv_tasks')
        .select('*')
        .order('due_date', { ascending: true })

      if (error) {
        console.error('[cmvp] tasks query error:', error)
        return res.status(500).json({ error: 'Failed to fetch tasks' })
      }

      const formattedTasks = (tasks || []).map((t: any) => ({
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

      return res.status(200).json({ tasks: formattedTasks })
    } catch (err: any) {
      console.error('[cmvp] tasks error:', err)
      return res.status(500).json({ error: 'Internal server error', detail: err.message })
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // action=sign-off  (POST only)
  // ═══════════════════════════════════════════════════════════════════════════
  if (action === 'sign-off') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const {
      task_id,
      status,
      cmvp_notes,
      methodology_comments,
      cmvp_verified_savings,
      variance_amount,
      variance_notes,
      discrepancy_flags,
      signed_off,
    } = req.body

    if (!task_id || !status) {
      return res.status(400).json({ error: 'task_id and status are required' })
    }

    if (!cmvp_notes || !cmvp_notes.trim()) {
      return res.status(400).json({ error: 'Professional notes are required before sign-off' })
    }

    const validStatuses = ['approved', 'flagged', 'rejected']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
    }

    try {
      // Update the mv_tasks record
      const taskUpdate: any = {
        status: status === 'approved' ? 'completed' : status,
        cmvp_notes: cmvp_notes.trim(),
        methodology_comments: methodology_comments?.trim() || null,
        cmvp_verified_savings: cmvp_verified_savings || null,
        variance_amount: variance_amount || null,
        variance_notes: variance_notes || null,
        discrepancy_flags: discrepancy_flags || [],
        signed_off: signed_off || false,
        signed_off_at: signed_off ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }

      const { data: updatedTask, error: taskError } = await supabase
        .from('mv_tasks')
        .update(taskUpdate)
        .eq('id', task_id)
        .select()
        .single()

      if (taskError) {
        console.error('[cmvp] sign-off task update error:', taskError)
        return res.status(500).json({ error: 'Failed to update task', detail: taskError.message })
      }

      // If approved: update mv_reports with verified savings and create a report deliverable
      if (status === 'approved' && updatedTask) {
        if (updatedTask.report_id) {
          await supabase
            .from('mv_reports')
            .update({
              cmvp_verified_savings: cmvp_verified_savings,
              cmvp_signed_off: true,
              cmvp_signed_off_at: new Date().toISOString(),
              cmvp_notes: cmvp_notes.trim(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', updatedTask.report_id)
        }

        const { error: deliverableError } = await supabase
          .from('report_deliverables')
          .insert({
            contract_id: updatedTask.contract_id,
            title: `CMVP Verified: ${updatedTask.title || 'M&V Report'}`,
            report_type: 'CMVP Verification',
            period: updatedTask.period || 'Current Period',
            status: 'published',
            cmvp_verified: true,
            cmvp_verified_savings: cmvp_verified_savings,
            created_at: new Date().toISOString(),
          })

        if (deliverableError) {
          console.warn('[cmvp] sign-off failed to create report deliverable:', deliverableError.message)
        }
      }

      // If flagged or rejected: create an alert for admin
      if (status === 'flagged' || status === 'rejected') {
        const { error: alertError } = await supabase
          .from('alerts')
          .insert({
            contract_id: updatedTask?.contract_id || null,
            severity: status === 'rejected' ? 'critical' : 'warning',
            type: 'cmvp_review',
            title: `CMVP ${status === 'rejected' ? 'Rejected' : 'Flagged'}: ${updatedTask?.title || 'M&V Task'}`,
            description: `CMVP professional has ${status} this task. Notes: ${cmvp_notes.trim().substring(0, 200)}${
              discrepancy_flags?.length ? `. Flags: ${discrepancy_flags.join(', ')}` : ''
            }`,
            status: 'active',
            created_at: new Date().toISOString(),
          })

        if (alertError) {
          console.warn('[cmvp] sign-off failed to create alert:', alertError.message)
        }
      }

      return res.status(200).json({
        success: true,
        task_id,
        status,
        message: `Task ${status} successfully`,
      })
    } catch (err: any) {
      console.error('[cmvp] sign-off error:', err)
      return res.status(500).json({ error: 'Internal server error', detail: err.message })
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Unknown or missing action
  // ═══════════════════════════════════════════════════════════════════════════
  return res.status(400).json({ error: 'Missing or invalid "action" query param — expected data, tasks, or sign-off' })
}

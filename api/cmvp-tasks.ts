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
      console.error('[cmvp-tasks] Query error:', error)
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
    console.error('[cmvp-tasks] Error:', err)
    return res.status(500).json({ error: 'Internal server error', detail: err.message })
  }
}

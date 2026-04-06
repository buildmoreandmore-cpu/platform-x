import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      console.error('[cmvp-sign-off] Task update error:', taskError)
      return res.status(500).json({ error: 'Failed to update task', detail: taskError.message })
    }

    // If approved: update mv_reports with verified savings and create a report deliverable
    if (status === 'approved' && updatedTask) {
      // Update mv_reports if the task has an associated report
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

      // Create a report deliverable for the client
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
        console.warn('[cmvp-sign-off] Failed to create report deliverable:', deliverableError.message)
        // Non-blocking: we still return success for the sign-off
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
        console.warn('[cmvp-sign-off] Failed to create alert:', alertError.message)
      }
    }

    return res.status(200).json({
      success: true,
      task_id,
      status,
      message: `Task ${status} successfully`,
    })
  } catch (err: any) {
    console.error('[cmvp-sign-off] Error:', err)
    return res.status(500).json({ error: 'Internal server error', detail: err.message })
  }
}

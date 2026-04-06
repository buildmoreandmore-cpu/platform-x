import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, CheckCircle, Flag, X, Plus, Loader2 } from 'lucide-react'

interface TaskDetail {
  id: string
  task_type: string
  title: string
  description: string
  building_name: string
  period: string
  priority: 'high' | 'medium' | 'low'
  due_date: string
  status: string
  contract_id: string
  system_calculated_savings: number
  guaranteed_savings: number
  cmvp_verified_savings: number | null
  cmvp_notes: string | null
  methodology_comments: string | null
  discrepancy_flags: string[]
  ecm_name: string
  ecm_type: string
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'high': return '#ff4444'
    case 'medium': return '#ffaa00'
    default: return '#00ff88'
  }
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64" style={{ backgroundColor: '#050f08' }} />
      <div className="h-64" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} />
      <div className="h-48" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} />
    </div>
  )
}

export function CMVPTaskReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Editable fields
  const [verifiedSavings, setVerifiedSavings] = useState('')
  const [notes, setNotes] = useState('')
  const [methodologyComments, setMethodologyComments] = useState('')
  const [flags, setFlags] = useState<string[]>([])
  const [newFlag, setNewFlag] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`/api/cmvp?action=tasks&id=${id}`)
      .then(r => r.json())
      .then(d => {
        const t = d.task
        if (t) {
          setTask(t)
          setVerifiedSavings(t.cmvp_verified_savings?.toString() ?? t.system_calculated_savings?.toString() ?? '')
          setNotes(t.cmvp_notes ?? '')
          setMethodologyComments(t.methodology_comments ?? '')
          setFlags(t.discrepancy_flags ?? [])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <Skeleton />

  if (!task) {
    return (
      <div className="py-20 text-center">
        <div className="text-xs" style={{ color: '#4a7a5a' }}>Task not found</div>
        <button
          onClick={() => navigate('/cmvp/tasks')}
          className="mt-4 px-4 py-2 text-[9px] uppercase tracking-[0.15em]"
          style={{ color: '#00ff88', border: '1px solid #0d2a18' }}
        >
          Back to Tasks
        </button>
      </div>
    )
  }

  const systemCalc = task.system_calculated_savings ?? 0
  const verifiedNum = parseFloat(verifiedSavings) || 0
  const variance = verifiedNum - systemCalc
  const variancePct = systemCalc > 0 ? ((variance / systemCalc) * 100) : 0

  const addFlag = () => {
    if (newFlag.trim()) {
      setFlags(prev => [...prev, newFlag.trim()])
      setNewFlag('')
    }
  }

  const removeFlag = (index: number) => {
    setFlags(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (decision: 'approved' | 'flagged' | 'rejected') => {
    if (!notes.trim()) {
      setError('Professional notes are required before sign-off')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/cmvp?action=sign-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          status: decision,
          cmvp_notes: notes.trim(),
          methodology_comments: methodologyComments.trim(),
          cmvp_verified_savings: verifiedNum,
          variance_amount: variance,
          variance_notes: variancePct !== 0 ? `${variancePct > 0 ? '+' : ''}${variancePct.toFixed(1)}% variance from system calculation` : null,
          discrepancy_flags: flags,
          signed_off: decision === 'approved',
        }),
      })

      const result = await res.json()
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`Task ${decision} successfully`)
        setTimeout(() => navigate('/cmvp/tasks'), 1500)
      }
    } catch (err) {
      setError('Failed to submit sign-off')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/cmvp/tasks')}
        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] transition-colors"
        style={{ color: '#4a7a5a' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#00ff88')}
        onMouseLeave={e => (e.currentTarget.style.color = '#4a7a5a')}
      >
        <ArrowLeft size={12} />
        Back to Tasks
      </button>

      {/* Task Header */}
      <div className="p-6" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1
              className="text-xl font-bold tracking-[0.05em] uppercase mb-2"
              style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
            >
              {task.title}
            </h1>
            <div className="flex items-center gap-4 text-[10px]" style={{ color: '#4a7a5a' }}>
              <span>{task.building_name}</span>
              <span>|</span>
              <span>{task.period}</span>
              <span>|</span>
              <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
              style={{ color: priorityColor(task.priority), border: `1px solid ${priorityColor(task.priority)}` }}
            >
              {task.priority} priority
            </span>
            <span
              className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
              style={{ color: '#4a7a5a', border: '1px solid #0d2a18' }}
            >
              {task.task_type.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        {task.description && (
          <div className="text-xs leading-relaxed mt-3" style={{ color: '#c8f0d8' }}>
            {task.description}
          </div>
        )}
        {task.ecm_name && (
          <div className="mt-3 text-[10px]" style={{ color: '#4a7a5a' }}>
            ECM: {task.ecm_name} ({task.ecm_type})
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings Verification Panel */}
        <div className="p-6" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
          <div
            className="text-[9px] uppercase tracking-[0.3em] font-bold pb-3 mb-5"
            style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
          >
            Savings Verification
          </div>

          <div className="space-y-5">
            {/* System Calculated */}
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>
                System Calculated Savings
              </label>
              <div className="text-lg font-bold" style={{ color: '#c8f0d8' }}>
                {formatCurrency(systemCalc)}
              </div>
            </div>

            {/* Guaranteed */}
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>
                Guaranteed Savings
              </label>
              <div className="text-lg font-bold" style={{ color: '#4a7a5a' }}>
                {formatCurrency(task.guaranteed_savings ?? 0)}
              </div>
            </div>

            {/* CMVP Verified (editable) */}
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] mb-2" style={{ color: '#00ff88' }}>
                CMVP Verified Savings
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#4a7a5a' }}>$</span>
                <input
                  type="number"
                  value={verifiedSavings}
                  onChange={e => setVerifiedSavings(e.target.value)}
                  className="flex-1 px-4 py-3 text-sm font-bold outline-none"
                  style={{
                    backgroundColor: '#020c06',
                    border: '1px solid #0d2a18',
                    color: '#00ff88',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#00ff88')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#0d2a18')}
                />
              </div>
            </div>

            {/* Variance Display */}
            <div
              className="p-4"
              style={{
                backgroundColor: 'rgba(0,255,136,0.04)',
                border: `1px solid ${Math.abs(variancePct) > 10 ? '#ffaa00' : '#0d2a18'}`,
              }}
            >
              <div className="text-[9px] uppercase tracking-[0.2em] mb-2" style={{ color: '#4a7a5a' }}>
                Variance
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-lg font-bold"
                  style={{
                    color: variance >= 0 ? '#00ff88' : '#ff4444',
                  }}
                >
                  {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                </span>
                <span
                  className="text-sm"
                  style={{
                    color: Math.abs(variancePct) > 10 ? '#ffaa00' : '#4a7a5a',
                  }}
                >
                  ({variancePct >= 0 ? '+' : ''}{variancePct.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Discrepancy Flags */}
        <div className="p-6" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
          <div
            className="text-[9px] uppercase tracking-[0.3em] font-bold pb-3 mb-5"
            style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
          >
            Discrepancy Flags
          </div>

          <div className="space-y-3 mb-4">
            {flags.length === 0 ? (
              <div className="py-4 text-center text-[10px]" style={{ color: '#4a7a5a' }}>
                No flags raised
              </div>
            ) : (
              flags.map((flag, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2"
                  style={{ border: '1px solid rgba(255,170,0,0.3)', backgroundColor: 'rgba(255,170,0,0.04)' }}
                >
                  <div className="flex items-center gap-2">
                    <Flag size={10} style={{ color: '#ffaa00' }} />
                    <span className="text-xs" style={{ color: '#ffaa00' }}>{flag}</span>
                  </div>
                  <button onClick={() => removeFlag(i)}>
                    <X size={12} style={{ color: '#ff4444' }} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newFlag}
              onChange={e => setNewFlag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addFlag()}
              placeholder="Add a discrepancy flag..."
              className="flex-1 px-3 py-2 text-xs outline-none"
              style={{
                backgroundColor: '#020c06',
                border: '1px solid #0d2a18',
                color: '#c8f0d8',
              }}
            />
            <button
              onClick={addFlag}
              className="px-3 py-2"
              style={{ backgroundColor: '#0d2a18', color: '#ffaa00' }}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
          <div
            className="text-[9px] uppercase tracking-[0.3em] font-bold pb-3 mb-4"
            style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
          >
            Professional Notes *
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={6}
            placeholder="Document your verification findings, adjustments, and rationale..."
            className="w-full px-4 py-3 text-xs leading-relaxed outline-none resize-none"
            style={{
              backgroundColor: '#020c06',
              border: '1px solid #0d2a18',
              color: '#c8f0d8',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#00ff88')}
            onBlur={e => (e.currentTarget.style.borderColor = '#0d2a18')}
          />
        </div>

        <div className="p-6" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
          <div
            className="text-[9px] uppercase tracking-[0.3em] font-bold pb-3 mb-4"
            style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
          >
            Methodology Comments
          </div>
          <textarea
            value={methodologyComments}
            onChange={e => setMethodologyComments(e.target.value)}
            rows={6}
            placeholder="Comment on M&V methodology applied, IPMVP option, baseline adjustments..."
            className="w-full px-4 py-3 text-xs leading-relaxed outline-none resize-none"
            style={{
              backgroundColor: '#020c06',
              border: '1px solid #0d2a18',
              color: '#c8f0d8',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#00ff88')}
            onBlur={e => (e.currentTarget.style.borderColor = '#0d2a18')}
          />
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div
          className="px-5 py-3 text-xs flex items-center gap-2"
          style={{ backgroundColor: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444' }}
        >
          <AlertTriangle size={14} />
          {error}
        </div>
      )}
      {success && (
        <div
          className="px-5 py-3 text-xs flex items-center gap-2"
          style={{ backgroundColor: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88' }}
        >
          <CheckCircle size={14} />
          {success}
        </div>
      )}

      {/* Decision Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => handleSubmit('approved')}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold transition-opacity"
          style={{
            backgroundColor: '#00ff88',
            color: '#020c06',
            opacity: submitting ? 0.5 : 1,
          }}
        >
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
          Approve & Sign
        </button>

        <button
          onClick={() => handleSubmit('flagged')}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold transition-opacity"
          style={{
            backgroundColor: '#ffaa00',
            color: '#020c06',
            opacity: submitting ? 0.5 : 1,
          }}
        >
          <Flag size={12} />
          Flag for Review
        </button>

        <button
          onClick={() => handleSubmit('rejected')}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold transition-opacity"
          style={{
            backgroundColor: '#ff4444',
            color: '#020c06',
            opacity: submitting ? 0.5 : 1,
          }}
        >
          <X size={12} />
          Reject
        </button>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { Plus, X, MessageSquare } from 'lucide-react'

interface RFI {
  id: string
  rfi_number: string
  contract_id: string
  client_name?: string
  subject: string
  question: string
  submitted_to: string
  date_submitted: string
  response_required_by: string
  status: 'open' | 'answered' | 'overdue' | 'closed'
  impact?: string
  response_text?: string
  response_date?: string
  responded_by?: string
}

function statusColor(status: string): string {
  switch (status) {
    case 'open': return '#ffaa00'
    case 'answered': return '#00ff88'
    case 'overdue': return '#ff4444'
    case 'closed': return '#4a7a5a'
    default: return '#4a7a5a'
  }
}

export function AdminRFITracker() {
  const [rfis, setRfis] = useState<RFI[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showResponseModal, setShowResponseModal] = useState<string | null>(null)
  const [addLoading, setAddLoading] = useState(false)
  const [responseLoading, setResponseLoading] = useState(false)

  // Add modal form state
  const [formRfiNumber, setFormRfiNumber] = useState('')
  const [formSubject, setFormSubject] = useState('')
  const [formQuestion, setFormQuestion] = useState('')
  const [formSubmittedTo, setFormSubmittedTo] = useState('')
  const [formDateSubmitted, setFormDateSubmitted] = useState('')
  const [formResponseRequired, setFormResponseRequired] = useState('')
  const [formContractId, setFormContractId] = useState('')

  // Response modal state
  const [respText, setRespText] = useState('')
  const [respDate, setRespDate] = useState('')
  const [respBy, setRespBy] = useState('')

  const fetchRfis = () => {
    const params = new URLSearchParams({ action: 'rfi' })
    if (selectedContract) params.set('contract_id', selectedContract)
    fetch(`/api/knowledge?${params}`)
      .then(r => r.json())
      .then(d => { setRfis(Array.isArray(d) ? d : d.rfis ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchRfis() }, [selectedContract])

  const handleAddRfi = async () => {
    setAddLoading(true)
    try {
      const res = await fetch('/api/knowledge?action=rfi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: formContractId,
          rfi_number: formRfiNumber,
          subject: formSubject,
          question: formQuestion,
          submitted_to: formSubmittedTo,
          date_submitted: formDateSubmitted,
          response_required_by: formResponseRequired,
        }),
      })
      if (res.ok) {
        setShowAddModal(false)
        setFormRfiNumber('')
        setFormSubject('')
        setFormQuestion('')
        setFormSubmittedTo('')
        setFormDateSubmitted('')
        setFormResponseRequired('')
        setFormContractId('')
        fetchRfis()
      }
    } catch {
      // silently fail
    } finally {
      setAddLoading(false)
    }
  }

  const handleLogResponse = async (id: string) => {
    setResponseLoading(true)
    try {
      const res = await fetch('/api/knowledge?action=rfi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          response_text: respText,
          response_date: respDate,
          responded_by: respBy,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setRfis(prev => prev.map(r => (r.id === id ? { ...r, ...updated } : r)))
        setShowResponseModal(null)
        setRespText('')
        setRespDate('')
        setRespBy('')
      }
    } catch {
      // silently fail
    } finally {
      setResponseLoading(false)
    }
  }

  // Metrics
  const totalRfis = rfis.length
  const openCount = rfis.filter(r => r.status === 'open').length
  const overdueCount = rfis.filter(r => r.status === 'overdue').length
  const answeredOnTime = rfis.filter(r => r.status === 'answered' && r.response_date && r.response_required_by && new Date(r.response_date) <= new Date(r.response_required_by)).length
  const totalAnswered = rfis.filter(r => r.status === 'answered' || r.status === 'closed').length
  const responseRate = totalAnswered > 0 ? Math.round((answeredOnTime / totalAnswered) * 100) : 0

  const metrics = [
    { label: 'Total RFIs', value: totalRfis, color: '#c8f0d8' },
    { label: 'Open', value: openCount, color: '#ffaa00' },
    { label: 'Overdue', value: overdueCount, color: '#ff4444' },
    { label: 'Response Rate', value: `${responseRate}%`, color: '#00ff88' },
  ]

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#020c06',
    border: '1px solid #0d2a18',
    color: '#c8f0d8',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '11px',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold tracking-[0.1em] uppercase"
          style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
        >
          RFI Tracker
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity hover:opacity-80"
          style={{ color: '#00ff88', border: '1px solid #00ff88' }}
        >
          <Plus size={10} />
          Add RFI
        </button>
      </div>

      {/* Contract filter input */}
      <div className="flex items-center gap-3">
        <label className="text-[9px] uppercase tracking-[0.15em]" style={{ color: '#4a7a5a' }}>
          Contract ID
        </label>
        <input
          type="text"
          value={selectedContract}
          onChange={e => setSelectedContract(e.target.value)}
          placeholder="Filter by contract..."
          className="px-3 py-1.5 text-xs w-64"
          style={inputStyle}
        />
      </div>

      {/* Metrics bar */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="p-4" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
            <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>
              {m.label}
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: m.color, fontFamily: "'Share Tech Mono', monospace" }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* RFI table */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        {loading ? (
          <div className="p-8 text-center animate-pulse">
            <div className="h-4 w-48 mx-auto" style={{ backgroundColor: '#0d2a18' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr
                  className="text-left text-[9px] uppercase tracking-[0.15em]"
                  style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
                >
                  <th className="px-5 py-3">RFI #</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Submitted To</th>
                  <th className="px-5 py-3">Date Submitted</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Impact</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rfis.map(r => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid #0d2a18',
                      borderLeft: r.status === 'overdue' ? '3px solid #ff4444' : '3px solid transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,255,136,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-5 py-3" style={{ color: '#c8f0d8', fontFamily: "'Share Tech Mono', monospace" }}>
                      {r.rfi_number}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#c8f0d8' }}>
                      {r.subject}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>
                      {r.submitted_to}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>
                      {new Date(r.date_submitted).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3" style={{ color: r.status === 'overdue' ? '#ff4444' : '#4a7a5a' }}>
                      {new Date(r.response_required_by).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                        style={{ color: statusColor(r.status), border: `1px solid ${statusColor(r.status)}` }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 max-w-xs truncate" style={{ color: '#4a7a5a' }}>
                      {r.impact || '--'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {(r.status === 'open' || r.status === 'overdue') && (
                        <button
                          onClick={() => {
                            setShowResponseModal(r.id)
                            setRespText('')
                            setRespDate('')
                            setRespBy('')
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-[9px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80 ml-auto"
                          style={{ color: '#00ff88', border: '1px solid #00ff88' }}
                        >
                          <MessageSquare size={10} />
                          Log Response
                        </button>
                      )}
                      {r.status === 'answered' && (
                        <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: '#00ff88' }}>
                          Answered
                        </span>
                      )}
                      {r.status === 'closed' && (
                        <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: '#4a7a5a' }}>
                          Closed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {rfis.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center" style={{ color: '#4a7a5a' }}>
                      No RFIs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add RFI Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg p-6 space-y-4" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
            <div className="flex items-center justify-between">
              <h2
                className="text-sm font-bold tracking-[0.1em] uppercase"
                style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
              >
                Add RFI
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{ color: '#4a7a5a' }}>
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Contract ID</label>
                <input type="text" value={formContractId} onChange={e => setFormContractId(e.target.value)} className="w-full px-3 py-1.5 text-xs" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>RFI Number</label>
                <input type="text" value={formRfiNumber} onChange={e => setFormRfiNumber(e.target.value)} className="w-full px-3 py-1.5 text-xs" style={inputStyle} placeholder="RFI-001" />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Subject</label>
                <input type="text" value={formSubject} onChange={e => setFormSubject(e.target.value)} className="w-full px-3 py-1.5 text-xs" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Question</label>
                <textarea value={formQuestion} onChange={e => setFormQuestion(e.target.value)} rows={3} className="w-full px-3 py-1.5 text-xs resize-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Submitted To</label>
                <input type="text" value={formSubmittedTo} onChange={e => setFormSubmittedTo(e.target.value)} className="w-full px-3 py-1.5 text-xs" style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Date Submitted</label>
                  <input type="date" value={formDateSubmitted} onChange={e => setFormDateSubmitted(e.target.value)} className="w-full px-3 py-1.5 text-xs" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Response Required By</label>
                  <input type="date" value={formResponseRequired} onChange={e => setFormResponseRequired(e.target.value)} className="w-full px-3 py-1.5 text-xs" style={inputStyle} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-1.5 text-[9px] uppercase tracking-[0.15em] font-bold"
                style={{ color: '#4a7a5a', border: '1px solid #0d2a18' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddRfi}
                disabled={addLoading || !formSubject || !formRfiNumber || !formContractId}
                className="px-4 py-1.5 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity disabled:opacity-30"
                style={{ color: '#00ff88', border: '1px solid #00ff88' }}
              >
                {addLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md p-6 space-y-4" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
            <div className="flex items-center justify-between">
              <h2
                className="text-sm font-bold tracking-[0.1em] uppercase"
                style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
              >
                Log Response
              </h2>
              <button onClick={() => setShowResponseModal(null)} style={{ color: '#4a7a5a' }}>
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Response</label>
                <textarea value={respText} onChange={e => setRespText(e.target.value)} rows={4} className="w-full px-3 py-1.5 text-xs resize-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Response Date</label>
                <input type="date" value={respDate} onChange={e => setRespDate(e.target.value)} className="w-full px-3 py-1.5 text-xs" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Responded By</label>
                <input type="text" value={respBy} onChange={e => setRespBy(e.target.value)} className="w-full px-3 py-1.5 text-xs" style={inputStyle} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResponseModal(null)}
                className="px-4 py-1.5 text-[9px] uppercase tracking-[0.15em] font-bold"
                style={{ color: '#4a7a5a', border: '1px solid #0d2a18' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleLogResponse(showResponseModal)}
                disabled={responseLoading || !respText || !respDate}
                className="px-4 py-1.5 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity disabled:opacity-30"
                style={{ color: '#00ff88', border: '1px solid #00ff88' }}
              >
                {responseLoading ? 'Saving...' : 'Save Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

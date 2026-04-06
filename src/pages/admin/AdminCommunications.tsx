import React, { useEffect, useState } from 'react'
import { MessageSquare, Mail, MapPin, Phone, FileText, Users, Sparkles, Plus, X, AlertTriangle } from 'lucide-react'

interface ActionItem {
  description: string
  assigned_to: string
  status: 'pending' | 'completed' | 'overdue'
  due_date?: string
}

interface Communication {
  id: string
  contract_id: string
  client_name?: string
  comm_type: string
  subject: string
  date: string
  summary: string
  decisions?: string[]
  action_items?: ActionItem[]
  requires_esco_response: boolean
  esco_responded: boolean
  esco_response_due?: string
  is_disputed: boolean
}

type FilterTab = 'all' | 'meeting' | 'email' | 'site_visit' | 'phone' | 'letter' | 'other'

function commTypeIcon(type: string) {
  switch (type) {
    case 'meeting': return <Users size={12} />
    case 'email': return <Mail size={12} />
    case 'site_visit': return <MapPin size={12} />
    case 'phone': return <Phone size={12} />
    case 'letter': return <FileText size={12} />
    default: return <MessageSquare size={12} />
  }
}

function commTypeColor(type: string): string {
  switch (type) {
    case 'meeting': return '#00ff88'
    case 'email': return '#00bbff'
    case 'site_visit': return '#ffaa00'
    case 'phone': return '#cc88ff'
    case 'letter': return '#ff8844'
    default: return '#4a7a5a'
  }
}

function escoResponseStatus(comm: Communication): { label: string; color: string } | null {
  if (!comm.requires_esco_response) return null
  if (comm.esco_responded) return { label: 'RESPONDED', color: '#00ff88' }
  if (comm.esco_response_due && new Date(comm.esco_response_due) < new Date()) {
    return { label: 'OVERDUE', color: '#ff4444' }
  }
  return { label: 'AWAITING RESPONSE', color: '#ffaa00' }
}

export function AdminCommunications() {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [selectedContract, setSelectedContract] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)
  const [aiSummaryResult, setAiSummaryResult] = useState<string | null>(null)
  const [aiTopic, setAiTopic] = useState('')
  const [showAiPanel, setShowAiPanel] = useState(false)

  // Add modal form state
  const [formType, setFormType] = useState('meeting')
  const [formSubject, setFormSubject] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formSummary, setFormSummary] = useState('')
  const [formDecisions, setFormDecisions] = useState('')
  const [formRequiresEsco, setFormRequiresEsco] = useState(false)
  const [formEscoDue, setFormEscoDue] = useState('')
  const [formContractId, setFormContractId] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  const fetchCommunications = () => {
    const params = new URLSearchParams({ action: 'communications' })
    if (selectedContract) params.set('contract_id', selectedContract)
    fetch(`/api/knowledge?${params}`)
      .then(r => r.json())
      .then(d => { setCommunications(Array.isArray(d) ? d : d.communications ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchCommunications() }, [selectedContract])

  const handleAddCommunication = async () => {
    setAddLoading(true)
    try {
      const res = await fetch('/api/knowledge?action=communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: formContractId,
          comm_type: formType,
          subject: formSubject,
          date: formDate,
          summary: formSummary,
          decisions: formDecisions ? formDecisions.split('\n').filter(Boolean) : [],
          requires_esco_response: formRequiresEsco,
          esco_response_due: formEscoDue || undefined,
        }),
      })
      if (res.ok) {
        setShowAddModal(false)
        setFormSubject('')
        setFormDate('')
        setFormSummary('')
        setFormDecisions('')
        setFormRequiresEsco(false)
        setFormEscoDue('')
        setFormContractId('')
        fetchCommunications()
      }
    } catch {
      // silently fail
    } finally {
      setAddLoading(false)
    }
  }

  const handleAiSummary = async () => {
    if (!aiTopic || !selectedContract) return
    setAiSummaryLoading(true)
    setAiSummaryResult(null)
    try {
      const res = await fetch('/api/knowledge?action=ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: selectedContract, topic: aiTopic }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiSummaryResult(data.summary || JSON.stringify(data))
      }
    } catch {
      setAiSummaryResult('Failed to generate summary.')
    } finally {
      setAiSummaryLoading(false)
    }
  }

  const filtered = communications.filter(c => {
    if (filter === 'all') return true
    return c.comm_type === filter
  })

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: `All (${communications.length})` },
    { key: 'meeting', label: `Meeting (${communications.filter(c => c.comm_type === 'meeting').length})` },
    { key: 'email', label: `Email (${communications.filter(c => c.comm_type === 'email').length})` },
    { key: 'site_visit', label: `Site Visit (${communications.filter(c => c.comm_type === 'site_visit').length})` },
    { key: 'phone', label: `Phone (${communications.filter(c => c.comm_type === 'phone').length})` },
    { key: 'letter', label: `Letter (${communications.filter(c => c.comm_type === 'letter').length})` },
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
          Communications Log
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity hover:opacity-80"
            style={{ color: '#cc88ff', border: '1px solid #cc88ff' }}
          >
            <Sparkles size={10} />
            AI Summary
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity hover:opacity-80"
            style={{ color: '#00ff88', border: '1px solid #00ff88' }}
          >
            <Plus size={10} />
            Add Communication
          </button>
        </div>
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

      {/* AI Summary Panel */}
      {showAiPanel && (
        <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span
              className="text-[9px] uppercase tracking-[0.15em] font-bold"
              style={{ color: '#cc88ff' }}
            >
              AI-Powered Summary
            </span>
            <button onClick={() => setShowAiPanel(false)} style={{ color: '#4a7a5a' }}>
              <X size={12} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={aiTopic}
              onChange={e => setAiTopic(e.target.value)}
              placeholder="Enter topic to summarize..."
              className="px-3 py-1.5 text-xs flex-1"
              style={inputStyle}
            />
            <button
              onClick={handleAiSummary}
              disabled={aiSummaryLoading || !selectedContract || !aiTopic}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity disabled:opacity-30"
              style={{ color: '#00ff88', border: '1px solid #00ff88' }}
            >
              {aiSummaryLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {!selectedContract && (
            <p className="text-[10px]" style={{ color: '#ffaa00' }}>
              Enter a contract ID above to use AI Summary.
            </p>
          )}
          {aiSummaryResult && (
            <div className="p-4 text-xs leading-relaxed" style={{ backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', fontFamily: "'Share Tech Mono', monospace" }}>
              {aiSummaryResult}
            </div>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex" style={{ borderBottom: '1px solid #0d2a18' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className="px-5 py-3 text-[9px] uppercase tracking-[0.2em] font-bold transition-colors"
            style={{
              color: filter === t.key ? '#00ff88' : '#4a7a5a',
              borderBottom: filter === t.key ? '2px solid #00ff88' : '2px solid transparent',
              backgroundColor: 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Communications feed */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        {loading ? (
          <div className="p-8 text-center animate-pulse">
            <div className="h-4 w-48 mx-auto" style={{ backgroundColor: '#0d2a18' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-8 text-center" style={{ color: '#4a7a5a' }}>
            No communications match the current filter
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#0d2a18' }}>
            {filtered.map(c => {
              const esco = escoResponseStatus(c)
              const typeColor = commTypeColor(c.comm_type)
              return (
                <div
                  key={c.id}
                  className="p-5 transition-colors"
                  style={{ borderBottom: '1px solid #0d2a18' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,255,136,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                        style={{ color: typeColor, border: `1px solid ${typeColor}` }}
                      >
                        {commTypeIcon(c.comm_type)}
                        {c.comm_type.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-bold" style={{ color: '#c8f0d8', fontFamily: "'Share Tech Mono', monospace" }}>
                        {c.subject}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.is_disputed && (
                        <span
                          className="flex items-center gap-1 text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                          style={{ color: '#ff4444', border: '1px solid #ff4444' }}
                        >
                          <AlertTriangle size={10} />
                          Disputed
                        </span>
                      )}
                      {esco && (
                        <span
                          className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 font-bold"
                          style={{ color: esco.color, border: `1px solid ${esco.color}` }}
                        >
                          {esco.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date & contract */}
                  <div className="flex items-center gap-4 mb-2 text-[10px]" style={{ color: '#4a7a5a' }}>
                    <span>{new Date(c.date).toLocaleString()}</span>
                    {c.client_name && <span>{c.client_name}</span>}
                    <span>{c.contract_id?.slice(0, 8)}</span>
                  </div>

                  {/* Summary */}
                  <p className="text-xs leading-relaxed mb-2" style={{ color: '#c8f0d8', fontFamily: "'Share Tech Mono', monospace" }}>
                    {c.summary}
                  </p>

                  {/* Decisions */}
                  {c.decisions && c.decisions.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{ color: '#00ff88' }}>
                        Decisions
                      </span>
                      <ul className="mt-1 space-y-0.5">
                        {c.decisions.map((d, i) => (
                          <li key={i} className="text-[11px] pl-3" style={{ color: '#00ff88', fontFamily: "'Share Tech Mono', monospace", borderLeft: '2px solid #00ff88' }}>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action items */}
                  {c.action_items && c.action_items.length > 0 && (
                    <div>
                      <span className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{ color: '#4a7a5a' }}>
                        Action Items
                      </span>
                      <ul className="mt-1 space-y-0.5">
                        {c.action_items.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-[11px]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: item.status === 'completed' ? '#00ff88' : item.status === 'overdue' ? '#ff4444' : '#ffaa00',
                              }}
                            />
                            <span style={{ color: '#c8f0d8' }}>{item.description}</span>
                            <span style={{ color: '#4a7a5a' }}>— {item.assigned_to}</span>
                            <span
                              className="text-[8px] uppercase tracking-[0.1em] px-1.5 py-0.5"
                              style={{
                                color: item.status === 'completed' ? '#00ff88' : item.status === 'overdue' ? '#ff4444' : '#ffaa00',
                                border: `1px solid ${item.status === 'completed' ? '#00ff88' : item.status === 'overdue' ? '#ff4444' : '#ffaa00'}`,
                              }}
                            >
                              {item.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Communication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg p-6 space-y-4" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
            <div className="flex items-center justify-between">
              <h2
                className="text-sm font-bold tracking-[0.1em] uppercase"
                style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
              >
                Add Communication
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
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Type</label>
                <select value={formType} onChange={e => setFormType(e.target.value)} className="w-full px-3 py-1.5 text-xs" style={inputStyle}>
                  <option value="meeting">Meeting</option>
                  <option value="email">Email</option>
                  <option value="site_visit">Site Visit</option>
                  <option value="phone">Phone</option>
                  <option value="letter">Letter</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Subject</label>
                <input type="text" value={formSubject} onChange={e => setFormSubject(e.target.value)} className="w-full px-3 py-1.5 text-xs" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Date</label>
                <input type="datetime-local" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full px-3 py-1.5 text-xs" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Summary</label>
                <textarea value={formSummary} onChange={e => setFormSummary(e.target.value)} rows={3} className="w-full px-3 py-1.5 text-xs resize-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Decisions (one per line)</label>
                <textarea value={formDecisions} onChange={e => setFormDecisions(e.target.value)} rows={2} className="w-full px-3 py-1.5 text-xs resize-none" style={inputStyle} />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formRequiresEsco} onChange={e => setFormRequiresEsco(e.target.checked)} />
                  <span className="text-[9px] uppercase tracking-[0.15em]" style={{ color: '#4a7a5a' }}>Requires ESCO Response</span>
                </label>
              </div>
              {formRequiresEsco && (
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>ESCO Response Due</label>
                  <input type="datetime-local" value={formEscoDue} onChange={e => setFormEscoDue(e.target.value)} className="w-full px-3 py-1.5 text-xs" style={inputStyle} />
                </div>
              )}
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
                onClick={handleAddCommunication}
                disabled={addLoading || !formSubject || !formContractId}
                className="px-4 py-1.5 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity disabled:opacity-30"
                style={{ color: '#00ff88', border: '1px solid #00ff88' }}
              >
                {addLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

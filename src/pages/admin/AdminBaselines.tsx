import { Fragment, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, CheckCircle, XCircle, Flag, Shield } from 'lucide-react'

interface Adjustment {
  date: string
  original_value: number
  new_value: number
  reason: string
  vantage_approved: boolean | null
}

interface Baseline {
  id: string
  contract_id: string
  ecm: string
  type: string
  description: string
  baseline_value: number
  current_value: number
  unit: string
  risk_level: 'low' | 'normal' | 'high' | 'critical'
  is_approved: boolean
  is_flagged: boolean
  adjustments: Adjustment[]
}

function riskColor(level: string): string {
  switch (level) {
    case 'low': return '#00ff88'
    case 'normal': return '#4a7a5a'
    case 'high': return '#ffaa00'
    case 'critical': return '#ff4444'
    default: return '#4a7a5a'
  }
}

export function AdminBaselines() {
  const [baselines, setBaselines] = useState<Baseline[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Add modal form state
  const [formEcm, setFormEcm] = useState('')
  const [formType, setFormType] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formBaselineValue, setFormBaselineValue] = useState('')
  const [formUnit, setFormUnit] = useState('')
  const [formRiskLevel, setFormRiskLevel] = useState<'low' | 'normal' | 'high' | 'critical'>('normal')

  const fetchBaselines = () => {
    setLoading(true)
    const params = new URLSearchParams({ action: 'list' })
    if (selectedContract) params.set('contract_id', selectedContract)
    fetch(`/api/baselines?${params}`)
      .then(r => r.json())
      .then(d => { setBaselines(Array.isArray(d) ? d : d.baselines ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchBaselines() }, [selectedContract])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/baselines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve', is_approved: true }),
      })
      if (res.ok) {
        setBaselines(prev => prev.map(b => b.id === id ? { ...b, is_approved: true } : b))
      }
    } catch { /* silently fail */ } finally { setActionLoading(null) }
  }

  const handleFlag = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/baselines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'flag' }),
      })
      if (res.ok) {
        setBaselines(prev => prev.map(b => b.id === id ? { ...b, is_flagged: true } : b))
      }
    } catch { /* silently fail */ } finally { setActionLoading(null) }
  }

  const handleAdjustmentAction = async (baselineId: string, adjustmentIndex: number, approved: boolean) => {
    setActionLoading(`${baselineId}-${adjustmentIndex}`)
    try {
      const res = await fetch('/api/baselines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: baselineId, action: 'review-adjustment', adjustmentIndex, approved }),
      })
      if (res.ok) {
        const updated = await res.json()
        setBaselines(prev => prev.map(b => b.id === baselineId ? { ...b, ...updated } : b))
      }
    } catch { /* silently fail */ } finally { setActionLoading(null) }
  }

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/baselines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          contract_id: selectedContract,
          ecm: formEcm,
          type: formType,
          description: formDescription,
          baseline_value: parseFloat(formBaselineValue),
          unit: formUnit,
          risk_level: formRiskLevel,
        }),
      })
      if (res.ok) {
        setShowAddModal(false)
        setFormEcm(''); setFormType(''); setFormDescription(''); setFormBaselineValue(''); setFormUnit(''); setFormRiskLevel('normal')
        fetchBaselines()
      }
    } catch { /* silently fail */ }
  }

  const approved = baselines.filter(b => b.is_approved).length
  const pending = baselines.filter(b => !b.is_approved).length
  const flagged = baselines.filter(b => b.is_flagged).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold tracking-[0.1em] uppercase"
          style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
        >
          Baseline Registry
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold transition-opacity hover:opacity-80"
          style={{ color: '#020c06', backgroundColor: '#00ff88' }}
        >
          <Plus size={12} /> Add Baseline
        </button>
      </div>

      {/* Contract filter */}
      <div>
        <input
          type="text"
          placeholder="Filter by Contract ID..."
          value={selectedContract}
          onChange={e => setSelectedContract(e.target.value)}
          className="px-4 py-2 text-xs w-64 outline-none"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            backgroundColor: '#050f08',
            border: '1px solid #0d2a18',
            color: '#c8f0d8',
          }}
        />
      </div>

      {/* Summary bar */}
      <div
        className="flex gap-8 px-5 py-3"
        style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}
      >
        <div className="text-[9px] uppercase tracking-[0.15em]" style={{ color: '#4a7a5a' }}>
          Total: <span style={{ color: '#c8f0d8', fontFamily: "'Share Tech Mono', monospace" }}>{baselines.length}</span>
        </div>
        <div className="text-[9px] uppercase tracking-[0.15em]" style={{ color: '#4a7a5a' }}>
          Approved: <span style={{ color: '#00ff88', fontFamily: "'Share Tech Mono', monospace" }}>{approved}</span>
        </div>
        <div className="text-[9px] uppercase tracking-[0.15em]" style={{ color: '#4a7a5a' }}>
          Pending: <span style={{ color: '#ffaa00', fontFamily: "'Share Tech Mono', monospace" }}>{pending}</span>
        </div>
        <div className="text-[9px] uppercase tracking-[0.15em]" style={{ color: '#4a7a5a' }}>
          Flagged: <span style={{ color: '#ff4444', fontFamily: "'Share Tech Mono', monospace" }}>{flagged}</span>
        </div>
      </div>

      {/* Baselines table */}
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
                  <th className="px-5 py-3 w-8"></th>
                  <th className="px-5 py-3">ECM</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Original</th>
                  <th className="px-5 py-3">Current</th>
                  <th className="px-5 py-3">Unit</th>
                  <th className="px-5 py-3">Risk</th>
                  <th className="px-5 py-3">Approved</th>
                  <th className="px-5 py-3">Adj.</th>
                </tr>
              </thead>
              <tbody>
                {baselines.map(b => {
                  const isExpanded = expandedRow === b.id
                  const isAdjusted = b.current_value !== b.baseline_value
                  return (
                    <Fragment key={b.id}>
                      <tr
                        className="cursor-pointer"
                        style={{
                          borderBottom: '1px solid #0d2a18',
                          borderLeft: !b.is_approved ? '2px solid #ffaa00' : '2px solid transparent',
                        }}
                        onClick={() => setExpandedRow(isExpanded ? null : b.id)}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,255,136,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td className="px-5 py-3">
                          {isExpanded ? <ChevronDown size={12} style={{ color: '#00ff88' }} /> : <ChevronRight size={12} style={{ color: '#4a7a5a' }} />}
                        </td>
                        <td className="px-5 py-3" style={{ color: '#c8f0d8', fontFamily: "'Share Tech Mono', monospace" }}>{b.ecm}</td>
                        <td className="px-5 py-3">
                          <span
                            className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                            style={{ color: '#c8f0d8', border: '1px solid #0d2a18' }}
                          >
                            {b.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 max-w-xs truncate" style={{ color: '#4a7a5a' }}>{b.description}</td>
                        <td className="px-5 py-3" style={{ color: '#c8f0d8', fontFamily: "'Share Tech Mono', monospace" }}>{b.baseline_value}</td>
                        <td className="px-5 py-3" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                          <span style={{ color: isAdjusted ? '#ffaa00' : '#c8f0d8' }}>{b.current_value}</span>
                          {isAdjusted && (
                            <span
                              className="ml-2 text-[8px] uppercase tracking-[0.1em] px-1.5 py-0.5"
                              style={{ color: '#ffaa00', border: '1px solid #ffaa00' }}
                            >
                              adjusted
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3" style={{ color: '#4a7a5a', fontFamily: "'Share Tech Mono', monospace" }}>{b.unit}</td>
                        <td className="px-5 py-3">
                          <span
                            className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                            style={{ color: riskColor(b.risk_level), border: `1px solid ${riskColor(b.risk_level)}` }}
                          >
                            {b.risk_level}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {b.is_approved
                            ? <CheckCircle size={12} style={{ color: '#00ff88' }} />
                            : <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: '#ffaa00' }}>Pending</span>
                          }
                        </td>
                        <td className="px-5 py-3" style={{ color: '#4a7a5a', fontFamily: "'Share Tech Mono', monospace" }}>
                          {b.adjustments?.length ?? 0}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ borderBottom: '1px solid #0d2a18' }}>
                          <td colSpan={10} className="px-8 py-5" style={{ backgroundColor: 'rgba(0,255,136,0.02)' }}>
                            <div className="space-y-4">
                              {/* Adjustment history */}
                              <div>
                                <div
                                  className="text-[9px] uppercase tracking-[0.2em] font-bold mb-3"
                                  style={{ color: '#4a7a5a' }}
                                >
                                  Adjustment History
                                </div>
                                {b.adjustments && b.adjustments.length > 0 ? (
                                  <div className="space-y-2">
                                    {b.adjustments.map((adj, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center justify-between px-4 py-2"
                                        style={{ border: '1px solid #0d2a18', backgroundColor: '#050f08' }}
                                      >
                                        <div className="flex items-center gap-6 text-xs" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                          <span style={{ color: '#4a7a5a' }}>{new Date(adj.date).toLocaleDateString()}</span>
                                          <span style={{ color: '#c8f0d8' }}>{adj.original_value}</span>
                                          <span style={{ color: '#4a7a5a' }}>&rarr;</span>
                                          <span style={{ color: '#ffaa00' }}>{adj.new_value}</span>
                                          <span style={{ color: '#4a7a5a' }}>{adj.reason}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {adj.vantage_approved === null ? (
                                            <>
                                              <button
                                                onClick={e => { e.stopPropagation(); handleAdjustmentAction(b.id, i, true) }}
                                                disabled={actionLoading === `${b.id}-${i}`}
                                                className="flex items-center gap-1 px-2 py-1 text-[9px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-30"
                                                style={{ color: '#00ff88', border: '1px solid #00ff88' }}
                                              >
                                                <CheckCircle size={10} /> Approve
                                              </button>
                                              <button
                                                onClick={e => { e.stopPropagation(); handleAdjustmentAction(b.id, i, false) }}
                                                disabled={actionLoading === `${b.id}-${i}`}
                                                className="flex items-center gap-1 px-2 py-1 text-[9px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-30"
                                                style={{ color: '#ff4444', border: '1px solid #ff4444' }}
                                              >
                                                <XCircle size={10} /> Reject
                                              </button>
                                            </>
                                          ) : adj.vantage_approved ? (
                                            <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: '#00ff88' }}>Approved</span>
                                          ) : (
                                            <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: '#ff4444' }}>Rejected</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs" style={{ color: '#4a7a5a' }}>No adjustments recorded</div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-3">
                                {!b.is_approved && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleApprove(b.id) }}
                                    disabled={actionLoading === b.id}
                                    className="flex items-center gap-1 px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] font-bold transition-opacity disabled:opacity-30"
                                    style={{ color: '#00ff88', border: '1px solid #00ff88' }}
                                  >
                                    <Shield size={10} /> Approve Baseline
                                  </button>
                                )}
                                {!b.is_flagged && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleFlag(b.id) }}
                                    disabled={actionLoading === b.id}
                                    className="flex items-center gap-1 px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] font-bold transition-opacity disabled:opacity-30"
                                    style={{ color: '#ff4444', border: '1px solid #ff4444' }}
                                  >
                                    <Flag size={10} /> Flag Baseline
                                  </button>
                                )}
                                {b.is_flagged && (
                                  <span className="text-[9px] uppercase tracking-[0.1em] px-3 py-1.5" style={{ color: '#ff4444', border: '1px solid #ff4444' }}>
                                    Flagged
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {baselines.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-5 py-8 text-center" style={{ color: '#4a7a5a' }}>
                      No baselines found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Baseline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(2,12,6,0.85)' }}>
          <div className="w-full max-w-lg p-6 space-y-5" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
            <h2
              className="text-lg font-bold tracking-[0.1em] uppercase"
              style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
            >
              Add Baseline
            </h2>
            <div className="space-y-3">
              {[
                { label: 'ECM', value: formEcm, set: setFormEcm, placeholder: 'ECM-001' },
                { label: 'Type', value: formType, set: setFormType, placeholder: 'energy, water, demand...' },
                { label: 'Description', value: formDescription, set: setFormDescription, placeholder: 'Baseline description...' },
                { label: 'Baseline Value', value: formBaselineValue, set: setFormBaselineValue, placeholder: '0.00' },
                { label: 'Unit', value: formUnit, set: setFormUnit, placeholder: 'kWh, therms, kW...' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>{f.label}</label>
                  <input
                    type="text"
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 text-xs outline-none"
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      backgroundColor: '#020c06',
                      border: '1px solid #0d2a18',
                      color: '#c8f0d8',
                    }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>Risk Level</label>
                <select
                  value={formRiskLevel}
                  onChange={e => setFormRiskLevel(e.target.value as Baseline['risk_level'])}
                  className="w-full px-3 py-2 text-xs outline-none"
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    backgroundColor: '#020c06',
                    border: '1px solid #0d2a18',
                    color: '#c8f0d8',
                  }}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold"
                style={{ color: '#4a7a5a', border: '1px solid #0d2a18' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold"
                style={{ color: '#020c06', backgroundColor: '#00ff88' }}
              >
                Save Baseline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

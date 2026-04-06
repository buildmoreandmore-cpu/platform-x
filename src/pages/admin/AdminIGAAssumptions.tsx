import { useEffect, useState, useRef } from 'react'
import { ChevronDown, ChevronRight, Flag, CheckCircle, Upload, AlertTriangle, X } from 'lucide-react'

interface Assumption {
  id: string
  contract_id: string
  assumption_type: string
  description: string
  value: string
  unit: string
  source: string
  risk_level: 'low' | 'normal' | 'high' | 'critical'
  risk_notes?: string
  is_flagged: boolean
  flag_reason?: string
  is_verified: boolean
  created_at: string
}

interface Contract {
  id: string
  client_name?: string
  name?: string
}

function riskColor(level: string): string {
  switch (level) {
    case 'low': return '#00ff88'
    case 'high': return '#ffaa00'
    case 'critical': return '#ff4444'
    default: return '#4a7a5a'
  }
}

export function AdminIGAAssumptions() {
  const [assumptions, setAssumptions] = useState<Assumption[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [selectedContract, setSelectedContract] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [flaggingId, setFlaggingId] = useState<string | null>(null)
  const [flagReason, setFlagReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin?action=data')
      .then(r => r.json())
      .then(d => {
        const c = Array.isArray(d) ? d : d.contracts ?? []
        setContracts(c)
        if (c.length > 0) setSelectedContract(c[0].id)
      })
      .catch(() => {})
  }, [])

  const fetchAssumptions = () => {
    if (!selectedContract) return
    setLoading(true)
    fetch(`/api/knowledge?action=iga-assumptions&contract_id=${selectedContract}`)
      .then(r => r.json())
      .then(d => { setAssumptions(Array.isArray(d) ? d : d.assumptions ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchAssumptions() }, [selectedContract])

  const total = assumptions.length
  const critical = assumptions.filter(a => a.risk_level === 'critical').length
  const flagged = assumptions.filter(a => a.is_flagged).length
  const verified = assumptions.filter(a => a.is_verified).length

  const handleVerify = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/knowledge?action=iga-assumptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_verified: true }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAssumptions(prev => prev.map(a => (a.id === id ? { ...a, ...updated } : a)))
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null)
    }
  }

  const handleFlag = async (id: string) => {
    if (!flagReason.trim()) return
    setActionLoading(id)
    try {
      const res = await fetch('/api/knowledge?action=iga-assumptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_flagged: true, flag_reason: flagReason }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAssumptions(prev => prev.map(a => (a.id === id ? { ...a, ...updated } : a)))
        setFlaggingId(null)
        setFlagReason('')
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'iga-assumptions')
      formData.append('contract_id', selectedContract)
      const res = await fetch('/api/extract?type=iga-assumptions', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        fetchAssumptions()
      }
    } catch {
      // silently fail
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold tracking-[0.1em] uppercase"
          style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
        >
          IGA Assumptions
        </h1>
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleUpload(f)
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity hover:opacity-80 disabled:opacity-30"
            style={{ color: '#ffaa00', border: '1px solid #ffaa00' }}
          >
            <Upload size={12} />
            {uploading ? 'Extracting...' : 'Upload IGA for Extraction'}
          </button>
        </div>
      </div>

      {/* Contract selector */}
      <div className="relative inline-block">
        <select
          value={selectedContract}
          onChange={e => setSelectedContract(e.target.value)}
          className="appearance-none px-4 py-2 pr-8 text-xs"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            backgroundColor: '#050f08',
            border: '1px solid #0d2a18',
            color: '#c8f0d8',
            outline: 'none',
          }}
        >
          {contracts.map(c => (
            <option key={c.id} value={c.id}>{c.client_name || c.name || c.id.slice(0, 12)}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#4a7a5a' }} />
      </div>

      {/* Summary bar */}
      <div className="flex gap-6 px-5 py-3" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: '#c8f0d8', fontFamily: "'Share Tech Mono', monospace" }}>{total}</div>
          <div className="text-[8px] uppercase tracking-[0.15em]" style={{ color: '#4a7a5a' }}>Total</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: '#ff4444', fontFamily: "'Share Tech Mono', monospace" }}>{critical}</div>
          <div className="text-[8px] uppercase tracking-[0.15em]" style={{ color: '#4a7a5a' }}>Critical</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: '#ffaa00', fontFamily: "'Share Tech Mono', monospace" }}>{flagged}</div>
          <div className="text-[8px] uppercase tracking-[0.15em]" style={{ color: '#4a7a5a' }}>Flagged</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: '#00ff88', fontFamily: "'Share Tech Mono', monospace" }}>{verified}</div>
          <div className="text-[8px] uppercase tracking-[0.15em]" style={{ color: '#4a7a5a' }}>Verified</div>
        </div>
      </div>

      {/* Assumptions table */}
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
                  <th className="px-5 py-3 w-6"></th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Value</th>
                  <th className="px-5 py-3">Unit</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Risk</th>
                  <th className="px-5 py-3 text-center">Flagged</th>
                  <th className="px-5 py-3 text-center">Verified</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assumptions.map(a => (
                  <>
                    <tr
                      key={a.id}
                      className="cursor-pointer"
                      style={{
                        borderBottom: '1px solid #0d2a18',
                        borderLeft: a.risk_level === 'critical' ? '3px solid #ff4444' : '3px solid transparent',
                        backgroundColor: a.risk_level === 'critical' ? 'rgba(255,68,68,0.04)' : 'transparent',
                      }}
                      onClick={() => setExpandedRow(expandedRow === a.id ? null : a.id)}
                      onMouseEnter={e => {
                        if (a.risk_level !== 'critical') e.currentTarget.style.backgroundColor = 'rgba(0,255,136,0.04)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = a.risk_level === 'critical' ? 'rgba(255,68,68,0.04)' : 'transparent'
                      }}
                    >
                      <td className="px-5 py-3">
                        {expandedRow === a.id ? (
                          <ChevronDown size={12} style={{ color: '#4a7a5a' }} />
                        ) : (
                          <ChevronRight size={12} style={{ color: '#4a7a5a' }} />
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                          style={{ color: '#c8f0d8', border: '1px solid #0d2a18' }}
                        >
                          {a.assumption_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 max-w-xs truncate" style={{ color: '#c8f0d8' }}>
                        {a.description}
                      </td>
                      <td className="px-5 py-3" style={{ color: '#c8f0d8', fontFamily: "'Share Tech Mono', monospace" }}>
                        {a.value}
                      </td>
                      <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>{a.unit}</td>
                      <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>{a.source}</td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1">
                          {a.risk_level === 'critical' && <AlertTriangle size={10} style={{ color: '#ff4444' }} />}
                          <span
                            className="text-[9px] uppercase tracking-[0.1em]"
                            style={{ color: riskColor(a.risk_level) }}
                          >
                            {a.risk_level}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {a.is_flagged ? (
                          <Flag size={12} style={{ color: '#ffaa00' }} className="mx-auto" />
                        ) : (
                          <span style={{ color: '#0d2a18' }}>--</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {a.is_verified ? (
                          <CheckCircle size={12} style={{ color: '#00ff88' }} className="mx-auto" />
                        ) : (
                          <span style={{ color: '#0d2a18' }}>--</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {!a.is_verified && (
                            <button
                              onClick={() => handleVerify(a.id)}
                              disabled={actionLoading === a.id}
                              className="flex items-center gap-1 px-2 py-1 text-[9px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-30"
                              style={{ color: '#00ff88', border: '1px solid #00ff88' }}
                            >
                              <CheckCircle size={10} />
                              Verify
                            </button>
                          )}
                          {!a.is_flagged && (
                            <button
                              onClick={() => setFlaggingId(a.id)}
                              disabled={actionLoading === a.id}
                              className="flex items-center gap-1 px-2 py-1 text-[9px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-30"
                              style={{ color: '#ffaa00', border: '1px solid #ffaa00' }}
                            >
                              <Flag size={10} />
                              Flag
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRow === a.id && (
                      <tr key={`${a.id}-expanded`} style={{ borderBottom: '1px solid #0d2a18' }}>
                        <td colSpan={10} className="px-10 py-4" style={{ backgroundColor: 'rgba(0,255,136,0.02)' }}>
                          <div className="space-y-2">
                            {a.risk_notes && (
                              <div>
                                <span className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{ color: '#4a7a5a' }}>Risk Notes: </span>
                                <span className="text-xs" style={{ color: '#c8f0d8' }}>{a.risk_notes}</span>
                              </div>
                            )}
                            {a.is_flagged && a.flag_reason && (
                              <div>
                                <span className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{ color: '#ffaa00' }}>Flag Reason: </span>
                                <span className="text-xs" style={{ color: '#c8f0d8' }}>{a.flag_reason}</span>
                              </div>
                            )}
                            {!a.risk_notes && !a.flag_reason && (
                              <div className="text-xs" style={{ color: '#4a7a5a' }}>No additional details available.</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {assumptions.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-5 py-8 text-center" style={{ color: '#4a7a5a' }}>
                      No IGA assumptions found for this contract
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Flag Reason Modal */}
      {flaggingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md p-6 space-y-4" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
            <div className="flex items-center justify-between">
              <h2
                className="text-sm font-bold tracking-[0.1em] uppercase"
                style={{ fontFamily: "'Syne', sans-serif", color: '#ffaa00' }}
              >
                Flag Assumption
              </h2>
              <button onClick={() => { setFlaggingId(null); setFlagReason('') }} style={{ color: '#4a7a5a' }}>
                <X size={16} />
              </button>
            </div>

            <div className="text-xs" style={{ color: '#c8f0d8' }}>
              {assumptions.find(a => a.id === flaggingId)?.description}
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Flag Reason</label>
              <textarea
                value={flagReason}
                onChange={e => setFlagReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs resize-none"
                style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', outline: 'none' }}
                placeholder="Why is this assumption being flagged?"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setFlaggingId(null); setFlagReason('') }}
                className="px-4 py-2 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity hover:opacity-80"
                style={{ color: '#4a7a5a', border: '1px solid #0d2a18' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleFlag(flaggingId)}
                disabled={actionLoading === flaggingId || !flagReason.trim()}
                className="px-4 py-2 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity hover:opacity-80 disabled:opacity-30"
                style={{ color: '#020c06', backgroundColor: '#ffaa00' }}
              >
                {actionLoading === flaggingId ? 'Saving...' : 'Flag Assumption'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

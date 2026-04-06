import { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

interface Alert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  type: string
  title: string
  description: string
  contract_id: string
  client_name?: string
  status: string
  created_at: string
}

type FilterTab = 'all' | 'active' | 'critical' | 'acknowledged'

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#ff4444'
    case 'warning': return '#ffaa00'
    default: return '#00ff88'
  }
}

export function AdminAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchAlerts = () => {
    fetch('/api/admin?action=alerts')
      .then(r => r.json())
      .then(d => { setAlerts(Array.isArray(d) ? d : d.alerts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchAlerts() }, [])

  const handleAction = async (id: string, action: 'acknowledge' | 'resolve') => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin?action=alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAlerts(prev =>
          prev.map(a => (a.id === id ? { ...a, ...updated } : a))
        )
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = alerts.filter(a => {
    switch (filter) {
      case 'active': return a.status !== 'resolved' && a.status !== 'acknowledged'
      case 'critical': return a.severity === 'critical'
      case 'acknowledged': return a.status === 'acknowledged'
      default: return true
    }
  })

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: `All (${alerts.length})` },
    { key: 'active', label: `Active (${alerts.filter(a => a.status !== 'resolved' && a.status !== 'acknowledged').length})` },
    { key: 'critical', label: `Critical (${alerts.filter(a => a.severity === 'critical').length})` },
    { key: 'acknowledged', label: `Acknowledged (${alerts.filter(a => a.status === 'acknowledged').length})` },
  ]

  return (
    <div className="space-y-6">
      <h1
        className="text-2xl font-bold tracking-[0.1em] uppercase"
        style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
      >
        Alerts
      </h1>

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

      {/* Alert table */}
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
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Contract</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr
                    key={a.id}
                    style={{ borderBottom: '1px solid #0d2a18' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,255,136,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-5 py-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: severityColor(a.severity),
                          boxShadow: `0 0 4px ${severityColor(a.severity)}`,
                        }}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                        style={{ color: severityColor(a.severity), border: `1px solid ${severityColor(a.severity)}` }}
                      >
                        {a.type}
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ color: '#c8f0d8' }}>{a.title}</td>
                    <td className="px-5 py-3 max-w-xs truncate" style={{ color: '#4a7a5a' }}>
                      {a.description}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>
                      {a.client_name || a.contract_id?.slice(0, 8) || '--'}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {a.status !== 'acknowledged' && a.status !== 'resolved' && (
                          <button
                            onClick={() => handleAction(a.id, 'acknowledge')}
                            disabled={actionLoading === a.id}
                            className="flex items-center gap-1 px-2 py-1 text-[9px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-30"
                            style={{ color: '#ffaa00', border: '1px solid #ffaa00' }}
                            title="Acknowledge"
                          >
                            <CheckCircle size={10} />
                            ACK
                          </button>
                        )}
                        {a.status !== 'resolved' && (
                          <button
                            onClick={() => handleAction(a.id, 'resolve')}
                            disabled={actionLoading === a.id}
                            className="flex items-center gap-1 px-2 py-1 text-[9px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-30"
                            style={{ color: '#00ff88', border: '1px solid #00ff88' }}
                            title="Resolve"
                          >
                            <XCircle size={10} />
                            Resolve
                          </button>
                        )}
                        {a.status === 'resolved' && (
                          <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: '#4a7a5a' }}>
                            Resolved
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center" style={{ color: '#4a7a5a' }}>
                      No alerts match the current filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

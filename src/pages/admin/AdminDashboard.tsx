import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Contract {
  id: string
  client_name: string
  building_name: string
  esco_name: string
  contract_value: number
  guaranteed_annual_savings: number
  year: number
  status: string
}

interface Alert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  type: string
  title: string
  description: string
  contract_id: string
  created_at: string
}

interface Document {
  id: string
  file_name: string
  document_type: string
  processing_status: string
  created_at: string
}

interface AdminData {
  contracts: Contract[]
  alerts: Alert[]
  documents: Document[]
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#ff4444'
    case 'warning': return '#ffaa00'
    default: return '#00ff88'
  }
}

function typeBadgeColor(type: string): string {
  switch (type) {
    case 'espc_contract': return '#00ff88'
    case 'utility_bill': return '#4488ff'
    case 'mv_report': return '#ffaa00'
    default: return '#4a7a5a'
  }
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} />
        ))}
      </div>
      <div className="h-64" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} />
    </div>
  )
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/admin?action=data')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  const contracts = data?.contracts ?? []
  const alerts = data?.alerts ?? []
  const documents = data?.documents ?? []

  const totalValue = contracts.reduce((s, c) => s + (c.contract_value || 0), 0)
  const totalSavings = contracts.reduce((s, c) => s + (c.guaranteed_annual_savings || 0), 0)
  const activeAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length

  const metrics = [
    { label: 'Total Contracts', value: contracts.length.toString() },
    { label: 'Total Contract Value', value: formatCurrency(totalValue) },
    { label: 'Guaranteed Savings', value: formatCurrency(totalSavings) + '/yr' },
    { label: 'Active Alerts', value: activeAlerts.toString(), alert: activeAlerts > 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1
        className="text-2xl font-bold tracking-[0.1em] uppercase"
        style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
      >
        Dashboard
      </h1>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div
            key={m.label}
            className="p-5"
            style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}
          >
            <div
              className="text-[9px] uppercase tracking-[0.2em] mb-2"
              style={{ color: '#4a7a5a' }}
            >
              {m.label}
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: m.alert ? '#ff4444' : '#00ff88' }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Contract List */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        <div
          className="px-5 py-3 text-[9px] uppercase tracking-[0.2em] font-bold"
          style={{ borderBottom: '1px solid #0d2a18', color: '#4a7a5a' }}
        >
          Contracts
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr
                className="text-left text-[9px] uppercase tracking-[0.15em]"
                style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
              >
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Building</th>
                <th className="px-5 py-3">ESCO</th>
                <th className="px-5 py-3 text-right">Contract Value</th>
                <th className="px-5 py-3 text-right">Guaranteed Savings</th>
                <th className="px-5 py-3 text-center">Year</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(c => (
                <tr
                  key={c.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid #0d2a18' }}
                  onClick={() => navigate(`/admin/contracts/${c.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,255,136,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-5 py-3" style={{ color: '#c8f0d8' }}>{c.client_name}</td>
                  <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>{c.building_name}</td>
                  <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>{c.esco_name}</td>
                  <td className="px-5 py-3 text-right" style={{ color: '#00ff88' }}>
                    {formatCurrency(c.contract_value)}
                  </td>
                  <td className="px-5 py-3 text-right" style={{ color: '#c8f0d8' }}>
                    {formatCurrency(c.guaranteed_annual_savings)}/yr
                  </td>
                  <td className="px-5 py-3 text-center" style={{ color: '#4a7a5a' }}>{c.year}</td>
                  <td className="px-5 py-3">
                    <span
                      className="text-[9px] uppercase tracking-[0.15em] px-2 py-0.5"
                      style={{
                        color: c.status === 'active' ? '#00ff88' : '#ffaa00',
                        border: `1px solid ${c.status === 'active' ? '#00ff88' : '#ffaa00'}`,
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center" style={{ color: '#4a7a5a' }}>
                    No contracts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row: Alerts + Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Alerts */}
        <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
          <div
            className="px-5 py-3 text-[9px] uppercase tracking-[0.2em] font-bold"
            style={{ borderBottom: '1px solid #0d2a18', color: '#4a7a5a' }}
          >
            Recent Alerts
          </div>
          <div>
            {alerts.slice(0, 5).map(a => (
              <div
                key={a.id}
                className="px-5 py-3 flex items-start gap-3"
                style={{ borderBottom: '1px solid #0d2a18' }}
              >
                <div
                  className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                  style={{
                    backgroundColor: severityColor(a.severity),
                    boxShadow: `0 0 4px ${severityColor(a.severity)}`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs" style={{ color: '#c8f0d8' }}>{a.title}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#4a7a5a' }}>{a.description}</div>
                  <div className="text-[9px] mt-1" style={{ color: '#4a7a5a' }}>
                    {new Date(a.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="px-5 py-8 text-center text-xs" style={{ color: '#4a7a5a' }}>
                No alerts
              </div>
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
          <div
            className="px-5 py-3 text-[9px] uppercase tracking-[0.2em] font-bold"
            style={{ borderBottom: '1px solid #0d2a18', color: '#4a7a5a' }}
          >
            Recent Documents
          </div>
          <div>
            {documents.slice(0, 5).map(d => (
              <div
                key={d.id}
                className="px-5 py-3 flex items-center gap-3"
                style={{ borderBottom: '1px solid #0d2a18' }}
              >
                <span
                  className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 flex-shrink-0"
                  style={{
                    color: typeBadgeColor(d.document_type),
                    border: `1px solid ${typeBadgeColor(d.document_type)}`,
                  }}
                >
                  {d.document_type.replace(/_/g, ' ')}
                </span>
                <span className="text-xs truncate flex-1" style={{ color: '#c8f0d8' }}>
                  {d.file_name}
                </span>
                <span
                  className="text-[9px] uppercase tracking-[0.1em] flex-shrink-0"
                  style={{
                    color: d.processing_status === 'completed' ? '#00ff88'
                      : d.processing_status === 'failed' ? '#ff4444'
                      : '#ffaa00',
                  }}
                >
                  {d.processing_status}
                </span>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="px-5 py-8 text-center text-xs" style={{ color: '#4a7a5a' }}>
                No documents
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

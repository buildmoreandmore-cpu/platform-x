import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface ECM {
  name: string
  type: string
  guaranteed_savings: number
  mv_option: string
  performance_pct: number
}

interface Contract {
  id: string
  client_name: string
  building_name: string
  building_address: string
  esco_name: string
  contract_value: number
  term_years: number
  financing_type: string
  performance_period: string
  dscr_requirement: number
  shortfall_clause: string
  guaranteed_annual_savings: number
  year: number
  status: string
  ecms: ECM[]
}

interface Alert {
  id: string
  severity: string
  type: string
  title: string
  description: string
  contract_id: string
  created_at: string
}

interface UtilityReading {
  id: string
  period: string
  usage_kwh: number
  cost: number
  contract_id: string
}

interface MVReport {
  id: string
  period: string
  verified_savings: number
  status: string
  contract_id: string
}

interface Document {
  id: string
  file_name: string
  document_type: string
  processing_status: string
  contract_id: string
}

interface AdminData {
  contracts: Contract[]
  alerts: Alert[]
  utility_readings: UtilityReading[]
  mv_reports: MVReport[]
  documents: Document[]
}

function formatCurrency(value: number): string {
  if (!value) return '$0'
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

export function AdminContractDetail() {
  const { id } = useParams<{ id: string }>()
  const [contract, setContract] = useState<Contract | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [utilityReadings, setUtilityReadings] = useState<UtilityReading[]>([])
  const [mvReports, setMvReports] = useState<MVReport[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin-data')
      .then(r => r.json())
      .then((d: AdminData) => {
        const c = d.contracts?.find(c => c.id === id) ?? null
        setContract(c)
        setAlerts((d.alerts ?? []).filter(a => a.contract_id === id))
        setUtilityReadings((d.utility_readings ?? []).filter(u => u.contract_id === id))
        setMvReports((d.mv_reports ?? []).filter(m => m.contract_id === id))
        setDocuments((d.documents ?? []).filter(doc => doc.contract_id === id))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64" style={{ backgroundColor: '#0d2a18' }} />
        <div className="h-40" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/contracts"
          className="flex items-center gap-2 text-xs"
          style={{ color: '#4a7a5a' }}
        >
          <ArrowLeft size={14} /> Back to Contracts
        </Link>
        <div className="p-8 text-center" style={{ color: '#4a7a5a' }}>
          Contract not found
        </div>
      </div>
    )
  }

  const ecms = contract.ecms ?? []

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/admin/contracts"
        className="flex items-center gap-2 text-xs hover:opacity-80"
        style={{ color: '#4a7a5a' }}
      >
        <ArrowLeft size={14} /> Back to Contracts
      </Link>

      {/* Contract Header */}
      <div
        className="p-6"
        style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-xl font-bold tracking-[0.1em] uppercase"
              style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
            >
              {contract.client_name}
            </h1>
            <div className="mt-1 text-xs" style={{ color: '#4a7a5a' }}>
              {contract.building_name}
              {contract.building_address && ` — ${contract.building_address}`}
            </div>
            <div className="mt-1 text-xs" style={{ color: '#4a7a5a' }}>
              ESCO: {contract.esco_name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: '#00ff88' }}>
              {formatCurrency(contract.contract_value)}
            </div>
            <span
              className="text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 mt-1 inline-block"
              style={{
                color: contract.status === 'active' ? '#00ff88' : '#ffaa00',
                border: `1px solid ${contract.status === 'active' ? '#00ff88' : '#ffaa00'}`,
              }}
            >
              {contract.status}
            </span>
          </div>
        </div>
      </div>

      {/* Contract Details */}
      <div
        className="p-6"
        style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}
      >
        <div
          className="text-[9px] uppercase tracking-[0.2em] font-bold mb-4"
          style={{ color: '#4a7a5a' }}
        >
          Contract Details
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Term', value: contract.term_years ? `${contract.term_years} years` : '--' },
            { label: 'Financing Type', value: contract.financing_type || '--' },
            { label: 'Performance Period', value: contract.performance_period || '--' },
            { label: 'DSCR Requirement', value: contract.dscr_requirement ? `${contract.dscr_requirement}x` : '--' },
            { label: 'Guaranteed Savings', value: `${formatCurrency(contract.guaranteed_annual_savings)}/yr` },
            { label: 'Year', value: contract.year?.toString() || '--' },
          ].map(item => (
            <div key={item.label}>
              <div className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>
                {item.label}
              </div>
              <div className="text-xs" style={{ color: '#c8f0d8' }}>{item.value}</div>
            </div>
          ))}
        </div>
        {contract.shortfall_clause && (
          <div className="mt-4">
            <div className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>
              Shortfall Clause
            </div>
            <div className="text-xs leading-relaxed" style={{ color: '#c8f0d8' }}>
              {contract.shortfall_clause}
            </div>
          </div>
        )}
      </div>

      {/* ECMs */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        <div
          className="px-5 py-3 text-[9px] uppercase tracking-[0.2em] font-bold"
          style={{ borderBottom: '1px solid #0d2a18', color: '#4a7a5a' }}
        >
          Energy Conservation Measures ({ecms.length})
        </div>
        {ecms.length > 0 ? (
          <div className="divide-y" style={{ borderColor: '#0d2a18' }}>
            {ecms.map((ecm, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs font-bold" style={{ color: '#c8f0d8' }}>{ecm.name}</div>
                    <div className="flex items-center gap-3 mt-1">
                      {ecm.type && (
                        <span
                          className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                          style={{ color: '#00ff88', border: '1px solid #0d2a18' }}
                        >
                          {ecm.type}
                        </span>
                      )}
                      {ecm.mv_option && (
                        <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: '#4a7a5a' }}>
                          M&V: {ecm.mv_option}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: '#00ff88' }}>
                      {formatCurrency(ecm.guaranteed_savings)}/yr
                    </div>
                  </div>
                </div>
                {ecm.performance_pct !== undefined && ecm.performance_pct !== null && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] uppercase tracking-[0.15em]" style={{ color: '#4a7a5a' }}>
                        Performance
                      </span>
                      <span className="text-[9px]" style={{ color: '#00ff88' }}>
                        {ecm.performance_pct}%
                      </span>
                    </div>
                    <div style={{ height: 4, backgroundColor: '#0d2a18' }}>
                      <div
                        className="h-full"
                        style={{
                          width: `${Math.min(ecm.performance_pct, 100)}%`,
                          backgroundColor: ecm.performance_pct >= 100 ? '#00ff88'
                            : ecm.performance_pct >= 80 ? '#ffaa00'
                            : '#ff4444',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-xs" style={{ color: '#4a7a5a' }}>
            No ECMs found for this contract
          </div>
        )}
      </div>

      {/* Related Alerts */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        <div
          className="px-5 py-3 text-[9px] uppercase tracking-[0.2em] font-bold"
          style={{ borderBottom: '1px solid #0d2a18', color: '#4a7a5a' }}
        >
          Related Alerts ({alerts.length})
        </div>
        {alerts.length > 0 ? (
          alerts.map(a => (
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
              <div className="flex-1">
                <div className="text-xs" style={{ color: '#c8f0d8' }}>{a.title}</div>
                <div className="text-[10px] mt-0.5" style={{ color: '#4a7a5a' }}>{a.description}</div>
              </div>
              <span className="text-[9px] flex-shrink-0" style={{ color: '#4a7a5a' }}>
                {new Date(a.created_at).toLocaleDateString()}
              </span>
            </div>
          ))
        ) : (
          <div className="px-5 py-6 text-center text-xs" style={{ color: '#4a7a5a' }}>
            No alerts for this contract
          </div>
        )}
      </div>

      {/* Utility Readings */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        <div
          className="px-5 py-3 text-[9px] uppercase tracking-[0.2em] font-bold"
          style={{ borderBottom: '1px solid #0d2a18', color: '#4a7a5a' }}
        >
          Utility Readings ({utilityReadings.length})
        </div>
        {utilityReadings.length > 0 ? (
          <table className="w-full text-xs">
            <thead>
              <tr
                className="text-left text-[9px] uppercase tracking-[0.15em]"
                style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
              >
                <th className="px-5 py-2">Period</th>
                <th className="px-5 py-2 text-right">Usage (kWh)</th>
                <th className="px-5 py-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {utilityReadings.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #0d2a18' }}>
                  <td className="px-5 py-2" style={{ color: '#c8f0d8' }}>{u.period}</td>
                  <td className="px-5 py-2 text-right" style={{ color: '#4a7a5a' }}>
                    {u.usage_kwh?.toLocaleString()}
                  </td>
                  <td className="px-5 py-2 text-right" style={{ color: '#00ff88' }}>
                    ${u.cost?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-6 text-center text-xs" style={{ color: '#4a7a5a' }}>
            No utility readings
          </div>
        )}
      </div>

      {/* M&V Reports */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        <div
          className="px-5 py-3 text-[9px] uppercase tracking-[0.2em] font-bold"
          style={{ borderBottom: '1px solid #0d2a18', color: '#4a7a5a' }}
        >
          M&V Reports ({mvReports.length})
        </div>
        {mvReports.length > 0 ? (
          <table className="w-full text-xs">
            <thead>
              <tr
                className="text-left text-[9px] uppercase tracking-[0.15em]"
                style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
              >
                <th className="px-5 py-2">Period</th>
                <th className="px-5 py-2 text-right">Verified Savings</th>
                <th className="px-5 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {mvReports.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #0d2a18' }}>
                  <td className="px-5 py-2" style={{ color: '#c8f0d8' }}>{m.period}</td>
                  <td className="px-5 py-2 text-right" style={{ color: '#00ff88' }}>
                    {formatCurrency(m.verified_savings)}
                  </td>
                  <td className="px-5 py-2">
                    <span
                      className="text-[9px] uppercase tracking-[0.1em]"
                      style={{ color: m.status === 'verified' ? '#00ff88' : '#ffaa00' }}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-6 text-center text-xs" style={{ color: '#4a7a5a' }}>
            No M&V reports
          </div>
        )}
      </div>

      {/* Related Documents */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        <div
          className="px-5 py-3 text-[9px] uppercase tracking-[0.2em] font-bold"
          style={{ borderBottom: '1px solid #0d2a18', color: '#4a7a5a' }}
        >
          Related Documents ({documents.length})
        </div>
        {documents.length > 0 ? (
          documents.map(d => (
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
                className="text-[9px] uppercase tracking-[0.1em]"
                style={{
                  color: d.processing_status === 'completed' ? '#00ff88'
                    : d.processing_status === 'failed' ? '#ff4444'
                    : '#ffaa00',
                }}
              >
                {d.processing_status}
              </span>
            </div>
          ))
        ) : (
          <div className="px-5 py-6 text-center text-xs" style={{ color: '#4a7a5a' }}>
            No documents
          </div>
        )}
      </div>
    </div>
  )
}

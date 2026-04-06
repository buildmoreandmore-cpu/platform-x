import { useEffect, useState, useRef } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, FileText, Send, Loader2 } from 'lucide-react'

type Tab = 'overview' | 'ecm' | 'reports' | 'ask' | 'history' | 'communications' | 'baselines'

interface ECM {
  id: string
  name: string
  ecm_type: string
  guaranteed_savings: number
  verified_savings: number
  performance_pct: number
  status: string
}

interface Alert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  created_at: string
}

interface ReportDeliverable {
  id: string
  title: string
  report_type: string
  period: string
  created_at: string
  file_url?: string
}

interface Contract {
  id: string
  client_name: string
  building_name: string
  contract_value: number
  guaranteed_savings_annual: number
  verified_savings_ytd: number
  contract_start_year: number
  contract_term_years: number
  current_year: number
  performance_pct: number
  ecms: ECM[]
  alerts: Alert[]
  report_deliverables: ReportDeliverable[]
}

interface ClientData {
  contracts: Contract[]
  summary: {
    total_verified_savings_ytd: number
    total_guaranteed_savings_ytd: number
    avg_performance_pct: number
    critical_alerts: number
  }
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function performanceColor(pct: number): string {
  if (pct >= 100) return '#00ff88'
  if (pct >= 90) return '#00ff88'
  if (pct >= 75) return '#ffaa00'
  return '#ff4444'
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#ff4444'
    case 'warning': return '#ffaa00'
    default: return '#00ff88'
  }
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} />
        ))}
      </div>
      <div className="h-64" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} />
    </div>
  )
}

// ── Savings Gauge ──────────────────────────────────────────────────────

function SavingsGauge({ verified, guaranteed }: { verified: number; guaranteed: number }) {
  const pct = guaranteed > 0 ? Math.min((verified / guaranteed) * 100, 120) : 0
  const barWidth = Math.min(pct, 100)
  const color = performanceColor(pct)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: '#4a7a5a' }}>
          Savings Performance
        </span>
        <span className="text-sm font-bold" style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="relative h-6" style={{ backgroundColor: '#0d2a18' }}>
        {/* Guaranteed threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-px z-10"
          style={{ left: '100%', backgroundColor: '#4a7a5a' }}
        />
        {/* Verified fill */}
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${barWidth}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[10px]" style={{ color: '#4a7a5a' }}>
        <span>Verified: {formatCurrency(verified)}</span>
        <span>Guaranteed: {formatCurrency(guaranteed)}</span>
      </div>
    </div>
  )
}

// ── Overview Tab ────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: ClientData }) {
  const contract = data.contracts[0]
  const alerts = data.contracts.flatMap(c => c.alerts || [])
  const critAlerts = alerts.filter(a => a.severity === 'critical')
  const warnAlerts = alerts.filter(a => a.severity === 'warning')

  return (
    <div className="space-y-6">
      {/* Savings Gauge */}
      <div className="p-6" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        <div
          className="text-[9px] uppercase tracking-[0.3em] font-bold pb-3 mb-4"
          style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
        >
          Verified vs Guaranteed Savings (YTD)
        </div>
        <SavingsGauge
          verified={data.summary.total_verified_savings_ytd}
          guaranteed={data.summary.total_guaranteed_savings_ytd}
        />
      </div>

      {/* Alert Summary */}
      <div className="p-6" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        <div
          className="text-[9px] uppercase tracking-[0.3em] font-bold pb-3 mb-4"
          style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
        >
          Alert Summary
        </div>
        {alerts.length === 0 ? (
          <div className="flex items-center gap-3 py-4">
            <CheckCircle size={16} style={{ color: '#00ff88' }} />
            <span className="text-xs" style={{ color: '#00ff88' }}>All systems performing within parameters</span>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 8).map(a => (
              <div
                key={a.id}
                className="flex items-start gap-3 px-4 py-3"
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
                </div>
                <span
                  className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 flex-shrink-0"
                  style={{
                    color: severityColor(a.severity),
                    border: `1px solid ${severityColor(a.severity)}`,
                  }}
                >
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ECM Performance Tab ─────────────────────────────────────────────────

function ECMTab({ data }: { data: ClientData }) {
  const ecms = data.contracts.flatMap(c => c.ecms || [])

  return (
    <div className="space-y-4">
      <div
        className="text-[9px] uppercase tracking-[0.3em] font-bold"
        style={{ color: '#4a7a5a' }}
      >
        Energy Conservation Measures
      </div>
      {ecms.length === 0 ? (
        <div className="p-8 text-center text-xs" style={{ color: '#4a7a5a' }}>
          No ECMs found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ecms.map(ecm => {
            const pct = ecm.performance_pct ?? (ecm.guaranteed_savings > 0 ? (ecm.verified_savings / ecm.guaranteed_savings) * 100 : 0)
            const color = performanceColor(pct)
            return (
              <div
                key={ecm.id}
                className="p-5"
                style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold" style={{ color: '#c8f0d8' }}>{ecm.name}</span>
                  <span
                    className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                    style={{
                      color: ecm.status === 'active' ? '#00ff88' : '#ffaa00',
                      border: `1px solid ${ecm.status === 'active' ? '#00ff88' : '#ffaa00'}`,
                    }}
                  >
                    {ecm.status || 'active'}
                  </span>
                </div>
                <div className="text-[9px] uppercase tracking-[0.15em] mb-3" style={{ color: '#4a7a5a' }}>
                  {ecm.ecm_type}
                </div>
                {/* Performance bar */}
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px]" style={{ color: '#4a7a5a' }}>Performance</span>
                    <span className="text-xs font-bold" style={{ color }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1" style={{ backgroundColor: '#0d2a18' }}>
                    <div
                      className="h-full transition-all duration-700"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] mt-3" style={{ color: '#4a7a5a' }}>
                  <span>Verified: {formatCurrency(ecm.verified_savings)}</span>
                  <span>Guaranteed: {formatCurrency(ecm.guaranteed_savings)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Reports Tab ─────────────────────────────────────────────────────────

function ReportsTab({ data }: { data: ClientData }) {
  const deliverables = data.contracts.flatMap(c => c.report_deliverables || [])

  return (
    <div className="space-y-4">
      <div
        className="text-[9px] uppercase tracking-[0.3em] font-bold"
        style={{ color: '#4a7a5a' }}
      >
        Report Deliverables
      </div>
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        {deliverables.length === 0 ? (
          <div className="p-8 text-center text-xs" style={{ color: '#4a7a5a' }}>
            No reports available yet
          </div>
        ) : (
          deliverables.map(d => (
            <div
              key={d.id}
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid #0d2a18' }}
            >
              <div className="flex items-center gap-3">
                <FileText size={14} style={{ color: '#00ff88' }} />
                <div>
                  <div className="text-xs" style={{ color: '#c8f0d8' }}>{d.title}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#4a7a5a' }}>
                    {d.report_type} | {d.period}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px]" style={{ color: '#4a7a5a' }}>
                  {new Date(d.created_at).toLocaleDateString()}
                </span>
                {d.file_url && (
                  <a
                    href={d.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] font-bold transition-colors"
                    style={{
                      backgroundColor: '#00ff88',
                      color: '#020c06',
                    }}
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Ask Vantage AI Tab ──────────────────────────────────────────────────

function AskTab({ data }: { data: ClientData }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleAsk = async () => {
    if (!question.trim() || loading) return
    const q = question.trim()
    setQuestion('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)

    try {
      const contract = data.contracts[0]
      const res = await fetch('/api/client-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          contract_id: contract?.id,
          contract_data: contract ? {
            client_name: contract.client_name,
            building_name: contract.building_name,
            contract_value: contract.contract_value,
            guaranteed_savings_annual: contract.guaranteed_savings_annual,
            verified_savings_ytd: contract.verified_savings_ytd,
            performance_pct: contract.performance_pct,
            current_year: contract.current_year,
            contract_term_years: contract.contract_term_years,
            ecms: contract.ecms?.map(e => ({
              name: e.name,
              type: e.ecm_type,
              guaranteed: e.guaranteed_savings,
              verified: e.verified_savings,
              performance: e.performance_pct,
            })),
          } : null,
        }),
      })
      const result = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: result.answer || 'No response received.' }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Unable to connect to Vantage AI. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="text-[9px] uppercase tracking-[0.3em] font-bold"
        style={{ color: '#4a7a5a' }}
      >
        Ask Vantage AI
      </div>
      <div
        className="flex flex-col"
        style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18', minHeight: 400 }}
      >
        {/* Chat messages */}
        <div className="flex-1 p-5 space-y-4 overflow-y-auto" style={{ maxHeight: 400 }}>
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-xs" style={{ color: '#4a7a5a' }}>
                Ask questions about your contract performance, savings, or ECM status.
              </div>
              <div className="mt-4 space-y-2">
                {[
                  'How are my savings performing this year?',
                  'Which ECMs are underperforming?',
                  'Am I at risk of a shortfall?',
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => { setQuestion(suggestion); }}
                    className="block mx-auto px-4 py-2 text-[10px] tracking-[0.1em] transition-colors"
                    style={{
                      color: '#00ff88',
                      border: '1px solid #0d2a18',
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#00ff88')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#0d2a18')}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%] px-4 py-3 text-xs leading-relaxed"
                style={{
                  backgroundColor: msg.role === 'user' ? 'rgba(0,255,136,0.08)' : '#0d2a18',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(0,255,136,0.2)' : '#0d2a18'}`,
                  color: '#c8f0d8',
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{ backgroundColor: '#0d2a18', border: '1px solid #0d2a18' }}
              >
                <Loader2 size={12} className="animate-spin" style={{ color: '#00ff88' }} />
                <span className="text-[10px]" style={{ color: '#4a7a5a' }}>Analyzing...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderTop: '1px solid #0d2a18' }}
        >
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder="Ask about your contract performance..."
            className="flex-1 bg-transparent text-xs outline-none placeholder-[#4a7a5a]"
            style={{ color: '#c8f0d8' }}
          />
          <button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            className="px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold transition-opacity"
            style={{
              backgroundColor: '#00ff88',
              color: '#020c06',
              opacity: loading || !question.trim() ? 0.4 : 1,
            }}
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard Component ────────────────────────────────────────────

export function ClientDashboard({ activeTab = 'overview' }: { activeTab?: Tab }) {
  const [data, setData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/client-data')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  if (!data || data.contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-xs" style={{ color: '#4a7a5a' }}>No contract data available</div>
      </div>
    )
  }

  const summary = data.summary
  const perfPct = summary.avg_performance_pct

  const metrics = [
    {
      label: 'Verified Savings YTD',
      value: formatCurrency(summary.total_verified_savings_ytd),
      icon: summary.total_verified_savings_ytd >= summary.total_guaranteed_savings_ytd ? TrendingUp : TrendingDown,
      color: summary.total_verified_savings_ytd >= summary.total_guaranteed_savings_ytd ? '#00ff88' : '#ff4444',
    },
    {
      label: 'Performance',
      value: `${perfPct.toFixed(1)}%`,
      icon: perfPct >= 90 ? TrendingUp : AlertTriangle,
      color: performanceColor(perfPct),
    },
    {
      label: 'Contract Year',
      value: `${data.contracts[0]?.current_year || 1} / ${data.contracts[0]?.contract_term_years || '?'}`,
      icon: CheckCircle,
      color: '#00ff88',
    },
    {
      label: 'Active Alerts',
      value: summary.critical_alerts.toString(),
      icon: AlertTriangle,
      color: summary.critical_alerts > 0 ? '#ff4444' : '#00ff88',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div
            key={m.label}
            className="p-5"
            style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: '#4a7a5a' }}>
                {m.label}
              </span>
              <m.icon size={14} style={{ color: m.color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab data={data} />}
      {activeTab === 'ecm' && <ECMTab data={data} />}
      {activeTab === 'reports' && <ReportsTab data={data} />}
      {activeTab === 'ask' && <AskTab data={data} />}
      {activeTab === 'history' && <ClientHistoryTab />}
      {activeTab === 'communications' && <ClientCommunicationsTab />}
      {activeTab === 'baselines' && <ClientBaselinesTab />}
    </div>
  )
}

// ── Read-Only Client Tabs for Modules 1-3 ─────────────────────────────

function ClientHistoryTab() {
  const [events, setEvents] = useState<Array<{ id: string; title: string; event_type: string; description: string; event_date: string; is_permanent: boolean }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/knowledge?action=timeline&contract_id=all')
      .then(r => r.json())
      .then(d => { setEvents(Array.isArray(d) ? d : d.events ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const typeColor: Record<string, string> = {
    milestone: '#00ff88', decision: '#ffaa00', alert_resolved: '#00ff88',
    dispute_opened: '#ff4444', mv_verified: '#00ff88', personnel_change: '#ffaa00',
  }

  if (loading) return <div style={{ color: '#4a7a5a', padding: 40 }}>Loading contract history...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: '#c8f0d8' }}>Contract History</h2>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#4a7a5a', letterSpacing: '0.15em' }}>COMPLETE RECORD — SURVIVES STAFF CHANGES</span>
      </div>
      {events.length === 0 ? (
        <div style={{ color: '#4a7a5a', padding: 20 }}>No timeline events recorded yet.</div>
      ) : events.map(e => (
        <div key={e.id} style={{ background: '#050f08', border: '1px solid #0d2a18', padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: typeColor[e.event_type] || '#4a7a5a' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, fontWeight: 600, color: '#c8f0d8' }}>{e.is_permanent && '\uD83D\uDD12 '}{e.title}</span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#4a7a5a' }}>{e.event_date}</span>
            </div>
            {e.description && <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#4a7a5a', lineHeight: 1.6, margin: 0 }}>{e.description}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

function ClientCommunicationsTab() {
  const [comms, setComms] = useState<Array<{ id: string; subject: string; comm_type: string; summary: string; decisions_made: string; date_occurred: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/knowledge?action=communications&contract_id=all')
      .then(r => r.json())
      .then(d => { setComms(Array.isArray(d) ? d : d.communications ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ color: '#4a7a5a', padding: 40 }}>Loading communications...</div>

  return (
    <div className="space-y-4">
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: '#c8f0d8', marginBottom: 24 }}>Communications Summary</h2>
      {comms.length === 0 ? (
        <div style={{ color: '#4a7a5a', padding: 20 }}>No communications logged yet.</div>
      ) : comms.map(c => (
        <div key={c.id} style={{ background: '#050f08', border: '1px solid #0d2a18', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, fontWeight: 600, color: '#c8f0d8' }}>{c.subject}</span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#4a7a5a' }}>{new Date(c.date_occurred).toLocaleDateString()}</span>
          </div>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.1em', color: '#00ff88', textTransform: 'uppercase' as const }}>{c.comm_type.replace(/_/g, ' ')}</span>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#4a7a5a', lineHeight: 1.6, margin: '8px 0 0' }}>{c.summary}</p>
          {c.decisions_made && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(0,255,136,0.04)', borderLeft: '2px solid #00ff88' }}>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: '#00ff88', letterSpacing: '0.1em' }}>DECISIONS: </span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#c8f0d8' }}>{c.decisions_made}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ClientBaselinesTab() {
  const [baselines, setBaselines] = useState<Array<{ id: string; description: string; baseline_value: number; current_value: number; baseline_unit: string; risk_level: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/baselines?action=list&contract_id=all')
      .then(r => r.json())
      .then(d => { setBaselines(Array.isArray(d) ? d : d.baselines ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const riskColor: Record<string, string> = { low: '#00ff88', normal: '#4a7a5a', high: '#ffaa00', critical: '#ff4444' }

  if (loading) return <div style={{ color: '#4a7a5a', padding: 40 }}>Loading baselines...</div>

  return (
    <div className="space-y-4">
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: '#c8f0d8', marginBottom: 24 }}>Baseline View</h2>
      {baselines.length === 0 ? (
        <div style={{ color: '#4a7a5a', padding: 20 }}>No baselines established yet.</div>
      ) : baselines.map(b => {
        const variance = b.current_value && b.baseline_value ? (((b.current_value - b.baseline_value) / b.baseline_value) * 100).toFixed(1) : null
        return (
          <div key={b.id} style={{ background: '#050f08', border: '1px solid #0d2a18', padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, fontWeight: 600, color: '#c8f0d8' }}>{b.description}</span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: riskColor[b.risk_level] || '#4a7a5a', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{b.risk_level} RISK</span>
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: '#c8f0d8' }}>
              Baseline: <span style={{ color: '#00ff88' }}>{b.baseline_value} {b.baseline_unit}</span>
              {b.current_value != null && b.current_value !== b.baseline_value && (
                <> &rarr; Current: <span style={{ color: '#ffaa00' }}>{b.current_value} {b.baseline_unit}</span></>
              )}
            </div>
            {variance && parseFloat(variance) !== 0 && (
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#4a7a5a', margin: '8px 0 0' }}>
                You should be using {b.baseline_value} {b.baseline_unit}. Current: {b.current_value} {b.baseline_unit}. That's a {variance}% variance.
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

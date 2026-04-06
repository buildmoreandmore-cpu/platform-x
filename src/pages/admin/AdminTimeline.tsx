import { useEffect, useState } from 'react'
import { Lock, Plus, X, Calendar, Tag, ChevronDown } from 'lucide-react'

interface TimelineEvent {
  id: string
  contract_id: string
  event_type: 'milestone' | 'decision' | 'alert_resolved' | 'dispute_opened' | 'mv_report' | 'amendment' | 'note'
  title: string
  description: string
  event_date: string
  is_permanent: boolean
  tags: string[]
  created_at: string
}

interface Contract {
  id: string
  client_name?: string
  name?: string
}

type FilterTab = 'all' | 'milestones' | 'decisions' | 'alerts' | 'mv'

function eventColor(type: string): string {
  switch (type) {
    case 'milestone': return '#00ff88'
    case 'decision': return '#ffaa00'
    case 'alert_resolved': return '#00ff88'
    case 'dispute_opened': return '#ff4444'
    case 'mv_report': return '#00bbff'
    case 'amendment': return '#ffaa00'
    default: return '#4a7a5a'
  }
}

function eventTypeLabel(type: string): string {
  switch (type) {
    case 'milestone': return 'Milestone'
    case 'decision': return 'Decision'
    case 'alert_resolved': return 'Alert Resolved'
    case 'dispute_opened': return 'Dispute Opened'
    case 'mv_report': return 'M&V Report'
    case 'amendment': return 'Amendment'
    default: return 'Note'
  }
}

const EVENT_TYPES = ['milestone', 'decision', 'alert_resolved', 'dispute_opened', 'mv_report', 'amendment', 'note'] as const

export function AdminTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [selectedContract, setSelectedContract] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Add form state
  const [formType, setFormType] = useState<string>('milestone')
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formPermanent, setFormPermanent] = useState(false)

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

  useEffect(() => {
    if (!selectedContract) return
    setLoading(true)
    fetch(`/api/knowledge?action=timeline&contract_id=${selectedContract}`)
      .then(r => r.json())
      .then(d => { setEvents(Array.isArray(d) ? d : d.events ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedContract])

  const filtered = events.filter(e => {
    switch (filter) {
      case 'milestones': return e.event_type === 'milestone'
      case 'decisions': return e.event_type === 'decision'
      case 'alerts': return e.event_type === 'alert_resolved' || e.event_type === 'dispute_opened'
      case 'mv': return e.event_type === 'mv_report'
      default: return true
    }
  })

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: `All (${events.length})` },
    { key: 'milestones', label: `Milestones (${events.filter(e => e.event_type === 'milestone').length})` },
    { key: 'decisions', label: `Decisions (${events.filter(e => e.event_type === 'decision').length})` },
    { key: 'alerts', label: `Alerts (${events.filter(e => e.event_type === 'alert_resolved' || e.event_type === 'dispute_opened').length})` },
    { key: 'mv', label: `M&V (${events.filter(e => e.event_type === 'mv_report').length})` },
  ]

  const handleAdd = async () => {
    if (!formTitle.trim() || !formDate) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/knowledge?action=timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: selectedContract,
          event_type: formType,
          title: formTitle,
          description: formDesc,
          event_date: formDate,
          tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
          is_permanent: formPermanent,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setEvents(prev => [created, ...prev])
        setShowAddModal(false)
        setFormTitle(''); setFormDesc(''); setFormDate(''); setFormTags(''); setFormPermanent(false); setFormType('milestone')
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold tracking-[0.1em] uppercase"
          style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
        >
          Contract Timeline
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity hover:opacity-80"
          style={{ color: '#020c06', backgroundColor: '#00ff88' }}
        >
          <Plus size={12} />
          Add Event
        </button>
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

      {/* Timeline */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        {loading ? (
          <div className="p-8 text-center animate-pulse">
            <div className="h-4 w-48 mx-auto" style={{ backgroundColor: '#0d2a18' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-8 text-center" style={{ color: '#4a7a5a' }}>
            No timeline events match the current filter
          </div>
        ) : (
          <div className="relative px-6 py-4">
            {/* Vertical line */}
            <div
              className="absolute left-10 top-0 bottom-0 w-px"
              style={{ backgroundColor: '#0d2a18' }}
            />

            {filtered
              .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
              .map(ev => (
              <div key={ev.id} className="relative flex items-start gap-5 py-4 ml-4">
                {/* Dot */}
                <div className="relative z-10 flex-shrink-0 mt-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: eventColor(ev.event_type),
                      boxShadow: `0 0 6px ${eventColor(ev.event_type)}`,
                    }}
                  />
                </div>

                {/* Card */}
                <div
                  className="flex-1 p-4"
                  style={{
                    backgroundColor: 'rgba(0,255,136,0.02)',
                    border: '1px solid #0d2a18',
                    borderLeft: `3px solid ${eventColor(ev.event_type)}`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                      style={{ color: eventColor(ev.event_type), border: `1px solid ${eventColor(ev.event_type)}` }}
                    >
                      {eventTypeLabel(ev.event_type)}
                    </span>
                    <span className="text-[9px]" style={{ color: '#4a7a5a', fontFamily: "'Share Tech Mono', monospace" }}>
                      <Calendar size={9} className="inline mr-1" />
                      {new Date(ev.event_date).toLocaleDateString()}
                    </span>
                    {ev.is_permanent && (
                      <Lock size={10} style={{ color: '#ffaa00' }} title="Permanent record" />
                    )}
                  </div>
                  <div className="text-sm mb-1" style={{ color: '#c8f0d8' }}>{ev.title}</div>
                  {ev.description && (
                    <div className="text-xs mt-1" style={{ color: '#4a7a5a' }}>{ev.description}</div>
                  )}
                  {ev.tags && ev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ev.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[8px] uppercase tracking-[0.1em] px-2 py-0.5 rounded-full"
                          style={{ color: '#00ff88', backgroundColor: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}
                        >
                          <Tag size={7} className="inline mr-1" />{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg p-6 space-y-4" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
            <div className="flex items-center justify-between">
              <h2
                className="text-sm font-bold tracking-[0.1em] uppercase"
                style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
              >
                Add Timeline Event
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{ color: '#4a7a5a' }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Event Type</label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value)}
                  className="w-full px-3 py-2 text-xs"
                  style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', outline: 'none' }}
                >
                  {EVENT_TYPES.map(t => (
                    <option key={t} value={t}>{eventTypeLabel(t)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Title</label>
                <input
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs"
                  style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', outline: 'none' }}
                  placeholder="Event title..."
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Description</label>
                <textarea
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs resize-none"
                  style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', outline: 'none' }}
                  placeholder="Event description..."
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs"
                  style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', outline: 'none' }}
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Tags (comma-separated)</label>
                <input
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  className="w-full px-3 py-2 text-xs"
                  style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', outline: 'none' }}
                  placeholder="energy, savings, phase-1"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPermanent}
                  onChange={e => setFormPermanent(e.target.checked)}
                  className="accent-green-500"
                />
                <span className="text-[9px] uppercase tracking-[0.15em]" style={{ color: '#c8f0d8' }}>Permanent Record (cannot be deleted)</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity hover:opacity-80"
                style={{ color: '#4a7a5a', border: '1px solid #0d2a18' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting || !formTitle.trim() || !formDate}
                className="px-4 py-2 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity hover:opacity-80 disabled:opacity-30"
                style={{ color: '#020c06', backgroundColor: '#00ff88' }}
              >
                {submitting ? 'Saving...' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

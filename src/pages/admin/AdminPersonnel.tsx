import React, { useEffect, useState } from 'react'
import { Plus, X, ChevronDown, UserMinus, Mail, Phone, Building } from 'lucide-react'

interface Person {
  id: string
  contract_id: string
  full_name: string
  role: string
  organization: string
  side: 'owner' | 'esco' | 'vantage' | 'other'
  email?: string
  phone?: string
  start_date?: string
  end_date?: string
  is_active: boolean
  departure_notes?: string
  successor_id?: string
  successor_name?: string
  created_at: string
}

interface Contract {
  id: string
  client_name?: string
  name?: string
}

export function AdminPersonnel() {
  const [personnel, setPersonnel] = useState<Person[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [selectedContract, setSelectedContract] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDepartModal, setShowDepartModal] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Add form state
  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState('')
  const [formOrg, setFormOrg] = useState('')
  const [formSide, setFormSide] = useState<string>('owner')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formStartDate, setFormStartDate] = useState('')

  // Depart form state
  const [departNotes, setDepartNotes] = useState('')

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
    fetch(`/api/knowledge?action=personnel&contract_id=${selectedContract}`)
      .then(r => r.json())
      .then(d => { setPersonnel(Array.isArray(d) ? d : d.personnel ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedContract])

  const bySide = (side: string) => personnel.filter(p => p.side === side)
  const ownerTeam = bySide('owner')
  const escoTeam = bySide('esco')
  const vantageTeam = bySide('vantage')
  const otherTeam = bySide('other')

  const handleAdd = async () => {
    if (!formName.trim() || !formRole.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/knowledge?action=personnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: selectedContract,
          full_name: formName,
          role: formRole,
          organization: formOrg,
          side: formSide,
          email: formEmail || undefined,
          phone: formPhone || undefined,
          start_date: formStartDate || undefined,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setPersonnel(prev => [...prev, created])
        setShowAddModal(false)
        setFormName(''); setFormRole(''); setFormOrg(''); setFormSide('owner'); setFormEmail(''); setFormPhone(''); setFormStartDate('')
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false)
    }
  }

  const handleDepart = async (id: string) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/knowledge?action=personnel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          is_active: false,
          end_date: new Date().toISOString().split('T')[0],
          departure_notes: departNotes || undefined,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setPersonnel(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)))
        setShowDepartModal(null)
        setDepartNotes('')
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false)
    }
  }

  function PersonCard({ person }: { person: Person }) {
    const isActive = person.is_active
    return (
      <div
        className="p-4 transition-colors"
        style={{
          backgroundColor: 'rgba(0,255,136,0.02)',
          border: '1px solid #0d2a18',
          borderLeft: `3px solid ${isActive ? '#00ff88' : '#4a7a5a'}`,
          opacity: isActive ? 1 : 0.5,
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,255,136,0.04)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(0,255,136,0.02)')}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-bold" style={{ color: '#c8f0d8' }}>{person.full_name}</div>
            <div className="text-[10px] uppercase tracking-[0.1em] mt-0.5" style={{ color: '#00ff88', fontFamily: "'Share Tech Mono', monospace" }}>
              {person.role}
            </div>
          </div>
          {isActive && (
            <button
              onClick={() => setShowDepartModal(person.id)}
              className="flex items-center gap-1 px-2 py-1 text-[9px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
              style={{ color: '#ff4444', border: '1px solid #ff4444' }}
              title="Mark Departed"
            >
              <UserMinus size={10} />
              Depart
            </button>
          )}
        </div>
        {person.organization && (
          <div className="flex items-center gap-1 mt-2 text-[10px]" style={{ color: '#4a7a5a' }}>
            <Building size={9} /> {person.organization}
          </div>
        )}
        {person.email && (
          <div className="flex items-center gap-1 mt-1 text-[10px]" style={{ color: '#4a7a5a' }}>
            <Mail size={9} /> {person.email}
          </div>
        )}
        {person.phone && (
          <div className="flex items-center gap-1 mt-1 text-[10px]" style={{ color: '#4a7a5a' }}>
            <Phone size={9} /> {person.phone}
          </div>
        )}
        {!isActive && person.end_date && (
          <div className="text-[9px] mt-2 uppercase tracking-[0.1em]" style={{ color: '#ff4444' }}>
            Departed: {new Date(person.end_date).toLocaleDateString()}
            {person.departure_notes && <span style={{ color: '#4a7a5a' }}> — {person.departure_notes}</span>}
          </div>
        )}
        {person.successor_id && (
          <div className="text-[9px] mt-1 uppercase tracking-[0.1em]" style={{ color: '#ffaa00' }}>
            Replaced by: {person.successor_name || person.successor_id.slice(0, 8)}
          </div>
        )}
      </div>
    )
  }

  function TeamSection({ title, team, compact }: { title: string; team: Person[]; compact?: boolean }) {
    return (
      <div className={compact ? '' : 'flex-1'}>
        <div
          className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3 pb-2"
          style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18', fontFamily: "'Syne', sans-serif" }}
        >
          {title} ({team.length})
        </div>
        <div className="space-y-2">
          {team.length === 0 ? (
            <div className="text-[10px] py-4 text-center" style={{ color: '#4a7a5a' }}>
              No personnel assigned
            </div>
          ) : (
            team.map(p => <div key={p.id}><PersonCard person={p} /></div>)
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold tracking-[0.1em] uppercase"
          style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
        >
          Personnel Tracker
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity hover:opacity-80"
          style={{ color: '#020c06', backgroundColor: '#00ff88' }}
        >
          <Plus size={12} />
          Add Person
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

      {/* Main content */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        {loading ? (
          <div className="p-8 text-center animate-pulse">
            <div className="h-4 w-48 mx-auto" style={{ backgroundColor: '#0d2a18' }} />
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {/* Two-column owner/esco layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TeamSection title="Owner Team" team={ownerTeam} />
              <TeamSection title="ESCO Team" team={escoTeam} />
            </div>

            {/* Secondary sections */}
            {(vantageTeam.length > 0 || otherTeam.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4" style={{ borderTop: '1px solid #0d2a18' }}>
                {vantageTeam.length > 0 && <TeamSection title="Vantage Team" team={vantageTeam} compact />}
                {otherTeam.length > 0 && <TeamSection title="Other" team={otherTeam} compact />}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Person Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg p-6 space-y-4" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
            <div className="flex items-center justify-between">
              <h2
                className="text-sm font-bold tracking-[0.1em] uppercase"
                style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
              >
                Add Personnel
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{ color: '#4a7a5a' }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Full Name</label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs"
                  style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', outline: 'none' }}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Role</label>
                <input
                  value={formRole}
                  onChange={e => setFormRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs"
                  style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', outline: 'none' }}
                  placeholder="Project Manager"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Organization</label>
                <input
                  value={formOrg}
                  onChange={e => setFormOrg(e.target.value)}
                  className="w-full px-3 py-2 text-xs"
                  style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', outline: 'none' }}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Side</label>
                <select
                  value={formSide}
                  onChange={e => setFormSide(e.target.value)}
                  className="w-full px-3 py-2 text-xs"
                  style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', outline: 'none' }}
                >
                  <option value="owner">Owner</option>
                  <option value="esco">ESCO</option>
                  <option value="vantage">Vantage</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Email</label>
                  <input
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs"
                    style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', outline: 'none' }}
                    placeholder="john@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Phone</label>
                  <input
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs"
                    style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', outline: 'none' }}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Start Date</label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={e => setFormStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs"
                  style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', outline: 'none' }}
                />
              </div>
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
                disabled={submitting || !formName.trim() || !formRole.trim()}
                className="px-4 py-2 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity hover:opacity-80 disabled:opacity-30"
                style={{ color: '#020c06', backgroundColor: '#00ff88' }}
              >
                {submitting ? 'Saving...' : 'Add Person'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Departed Modal */}
      {showDepartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md p-6 space-y-4" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
            <div className="flex items-center justify-between">
              <h2
                className="text-sm font-bold tracking-[0.1em] uppercase"
                style={{ fontFamily: "'Syne', sans-serif", color: '#ff4444' }}
              >
                Mark Departed
              </h2>
              <button onClick={() => { setShowDepartModal(null); setDepartNotes('') }} style={{ color: '#4a7a5a' }}>
                <X size={16} />
              </button>
            </div>

            <div className="text-xs" style={{ color: '#c8f0d8' }}>
              {personnel.find(p => p.id === showDepartModal)?.full_name} will be marked as departed with today&#39;s date.
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: '#4a7a5a' }}>Departure Notes (optional)</label>
              <textarea
                value={departNotes}
                onChange={e => setDepartNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs resize-none"
                style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8', outline: 'none' }}
                placeholder="Reason for departure..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowDepartModal(null); setDepartNotes('') }}
                className="px-4 py-2 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity hover:opacity-80"
                style={{ color: '#4a7a5a', border: '1px solid #0d2a18' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDepart(showDepartModal)}
                disabled={submitting}
                className="px-4 py-2 text-[9px] uppercase tracking-[0.15em] font-bold transition-opacity hover:opacity-80 disabled:opacity-30"
                style={{ color: '#020c06', backgroundColor: '#ff4444' }}
              >
                {submitting ? 'Saving...' : 'Confirm Departure'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

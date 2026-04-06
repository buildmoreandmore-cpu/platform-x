import React, { useEffect, useState } from 'react'

interface ContractAccess {
  id?: string
  user_id: string
  contract_id: string
}

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  organization: string | null
  credentials: string | null
  is_active: boolean
  created_at: string
  contract_access: ContractAccess[]
}

interface Contract {
  id: string
  name?: string
  contract_name?: string
  client_name?: string
}

function roleBadgeColor(role: string): string {
  switch (role) {
    case 'admin': return '#00ff88'
    case 'client': return '#4488ff'
    case 'cmvp': return '#ffaa00'
    default: return '#4a7a5a'
  }
}

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let pw = ''
  for (let i = 0; i < length; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pw
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'client' | 'cmvp'>('client')
  const [organization, setOrganization] = useState('')
  const [credentials, setCredentials] = useState('')
  const [selectedContracts, setSelectedContracts] = useState<string[]>([])

  // Grant access dropdown
  const [grantDropdownUserId, setGrantDropdownUserId] = useState<string | null>(null)

  function fetchData() {
    Promise.all([
      fetch('/api/admin-users').then(r => r.json()),
      fetch('/api/admin-data').then(r => r.json()),
    ])
      .then(([usersData, adminData]) => {
        setUsers(usersData.users ?? [])
        setContracts(adminData.contracts ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  function resetForm() {
    setEmail('')
    setPassword('')
    setFullName('')
    setRole('client')
    setOrganization('')
    setCredentials('')
    setSelectedContracts([])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName || undefined,
          role,
          organization: organization || undefined,
          credentials: credentials || undefined,
          contract_ids: selectedContracts.length > 0 ? selectedContracts : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to create user' })
      } else {
        setFeedback({ type: 'success', message: `User ${data.user.email} created successfully` })
        resetForm()
        fetchData()
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error' })
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleActive(userId: string) {
    const res = await fetch('/api/admin-users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action: 'toggle_active' }),
    })
    if (res.ok) fetchData()
  }

  async function handleGrantAccess(userId: string, contractId: string) {
    const res = await fetch('/api/admin-users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action: 'grant_access', contract_id: contractId }),
    })
    if (res.ok) {
      setGrantDropdownUserId(null)
      fetchData()
    }
  }

  async function handleRevokeAccess(userId: string, contractId: string) {
    const res = await fetch('/api/admin-users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action: 'revoke_access', contract_id: contractId }),
    })
    if (res.ok) fetchData()
  }

  function toggleContractSelection(contractId: string) {
    setSelectedContracts(prev =>
      prev.includes(contractId) ? prev.filter(c => c !== contractId) : [...prev, contractId]
    )
  }

  function contractLabel(c: Contract): string {
    return c.contract_name || c.name || c.client_name || c.id.slice(0, 8)
  }

  // ── Input style helper ──
  const inputStyle: React.CSSProperties = {
    backgroundColor: '#020c06',
    border: '1px solid #0d2a18',
    color: '#c8f0d8',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 12,
    padding: '8px 12px',
    width: '100%',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    color: '#4a7a5a',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 9,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    marginBottom: 4,
    display: 'block',
  }

  return (
    <div className="space-y-8">
      <h1
        className="text-2xl font-bold tracking-[0.1em] uppercase"
        style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
      >
        User Management
      </h1>

      {/* ── Create New User ── */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18', padding: 24 }}>
        <h2
          className="text-sm font-bold tracking-[0.15em] uppercase mb-6"
          style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
        >
          Create New User
        </h2>

        {feedback && (
          <div
            className="mb-4 px-4 py-2 text-xs"
            style={{
              border: `1px solid ${feedback.type === 'success' ? '#00ff88' : '#ff4444'}`,
              color: feedback.type === 'success' ? '#00ff88' : '#ff4444',
              backgroundColor: feedback.type === 'success' ? 'rgba(0,255,136,0.06)' : 'rgba(255,68,68,0.06)',
            }}
          >
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Email */}
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Temporary Password *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="temppassword123"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setPassword(generatePassword())}
                  className="px-3 text-[9px] uppercase tracking-[0.15em] whitespace-nowrap"
                  style={{
                    backgroundColor: '#0d2a18',
                    color: '#00ff88',
                    border: '1px solid #0d2a18',
                    fontFamily: "'Share Tech Mono', monospace",
                    cursor: 'pointer',
                  }}
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="John Doe"
                style={inputStyle}
              />
            </div>

            {/* Role */}
            <div>
              <label style={labelStyle}>Role *</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'admin' | 'client' | 'cmvp')}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="client">Client</option>
                <option value="cmvp">CMVP</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Organization */}
            <div>
              <label style={labelStyle}>Organization</label>
              <input
                type="text"
                value={organization}
                onChange={e => setOrganization(e.target.value)}
                placeholder="City of Atlanta"
                style={inputStyle}
              />
            </div>

            {/* Credentials (only for cmvp) */}
            {role === 'cmvp' && (
              <div>
                <label style={labelStyle}>Credentials</label>
                <input
                  type="text"
                  value={credentials}
                  onChange={e => setCredentials(e.target.value)}
                  placeholder="CMVP, CEA"
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          {/* Contract Access */}
          {contracts.length > 0 && (
            <div className="mb-4">
              <label style={labelStyle}>Contract Access</label>
              <div
                className="flex flex-wrap gap-2 p-3"
                style={{ backgroundColor: '#020c06', border: '1px solid #0d2a18' }}
              >
                {contracts.map(c => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 cursor-pointer px-3 py-1.5 text-xs"
                    style={{
                      border: `1px solid ${selectedContracts.includes(c.id) ? '#00ff88' : '#0d2a18'}`,
                      backgroundColor: selectedContracts.includes(c.id) ? 'rgba(0,255,136,0.06)' : 'transparent',
                      color: selectedContracts.includes(c.id) ? '#00ff88' : '#4a7a5a',
                      fontFamily: "'Share Tech Mono', monospace",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedContracts.includes(c.id)}
                      onChange={() => toggleContractSelection(c.id)}
                      className="sr-only"
                    />
                    <div
                      className="w-3 h-3 flex items-center justify-center"
                      style={{
                        border: `1px solid ${selectedContracts.includes(c.id) ? '#00ff88' : '#4a7a5a'}`,
                      }}
                    >
                      {selectedContracts.includes(c.id) && (
                        <div className="w-1.5 h-1.5" style={{ backgroundColor: '#00ff88' }} />
                      )}
                    </div>
                    {contractLabel(c)}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="px-6 py-2.5 text-xs uppercase tracking-[0.15em] font-bold"
            style={{
              backgroundColor: creating ? '#0d2a18' : '#00ff88',
              color: '#020c06',
              border: 'none',
              fontFamily: "'Share Tech Mono', monospace",
              cursor: creating ? 'not-allowed' : 'pointer',
              opacity: creating ? 0.6 : 1,
            }}
          >
            {creating ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>

      {/* ── User List ── */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #0d2a18' }}>
          <h2
            className="text-sm font-bold tracking-[0.15em] uppercase"
            style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
          >
            All Users
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center animate-pulse">
            <div className="h-4 w-48 mx-auto" style={{ backgroundColor: '#0d2a18' }} />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs" style={{ color: '#4a7a5a' }}>
            No users found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr
                  className="text-left text-[9px] uppercase tracking-[0.15em]"
                  style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
                >
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Organization</th>
                  <th className="px-5 py-3">Credentials</th>
                  <th className="px-5 py-3">Active</th>
                  <th className="px-5 py-3">Contracts</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const userContracts = user.contract_access || []
                  const ungrantedContracts = contracts.filter(
                    c => !userContracts.some(a => a.contract_id === c.id)
                  )

                  return (
                    <tr
                      key={user.id}
                      style={{ borderBottom: '1px solid #0d2a18' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,255,136,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Name */}
                      <td className="px-5 py-3" style={{ color: '#c8f0d8' }}>
                        {user.full_name || '--'}
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3" style={{ color: '#c8f0d8' }}>
                        {user.email}
                      </td>

                      {/* Role badge */}
                      <td className="px-5 py-3">
                        <span
                          className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 inline-block"
                          style={{
                            border: `1px solid ${roleBadgeColor(user.role)}`,
                            color: roleBadgeColor(user.role),
                          }}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Organization */}
                      <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>
                        {user.organization || '--'}
                      </td>

                      {/* Credentials */}
                      <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>
                        {user.credentials || '--'}
                      </td>

                      {/* Active toggle */}
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                          style={{
                            border: `1px solid ${user.is_active ? '#00ff88' : '#ff4444'}`,
                            color: user.is_active ? '#00ff88' : '#ff4444',
                            backgroundColor: user.is_active ? 'rgba(0,255,136,0.06)' : 'rgba(255,68,68,0.06)',
                            cursor: 'pointer',
                            fontFamily: "'Share Tech Mono', monospace",
                          }}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Contracts */}
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {userContracts.length === 0 && (
                            <span style={{ color: '#4a7a5a' }}>--</span>
                          )}
                          {userContracts.map(a => {
                            const c = contracts.find(ct => ct.id === a.contract_id)
                            return (
                              <span
                                key={a.contract_id}
                                className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                                style={{
                                  border: '1px solid #0d2a18',
                                  color: '#4a7a5a',
                                }}
                              >
                                {c ? contractLabel(c) : a.contract_id.slice(0, 8)}
                                <button
                                  onClick={() => handleRevokeAccess(user.id, a.contract_id)}
                                  style={{
                                    color: '#ff4444',
                                    cursor: 'pointer',
                                    background: 'none',
                                    border: 'none',
                                    fontFamily: "'Share Tech Mono', monospace",
                                    fontSize: 9,
                                    padding: 0,
                                    marginLeft: 2,
                                  }}
                                  title="Revoke access"
                                >
                                  x
                                </button>
                              </span>
                            )
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 relative">
                        {ungrantedContracts.length > 0 && (
                          <div className="relative inline-block">
                            <button
                              onClick={() =>
                                setGrantDropdownUserId(
                                  grantDropdownUserId === user.id ? null : user.id
                                )
                              }
                              className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                              style={{
                                border: '1px solid #0d2a18',
                                color: '#00ff88',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                fontFamily: "'Share Tech Mono', monospace",
                              }}
                            >
                              + Grant Access
                            </button>

                            {grantDropdownUserId === user.id && (
                              <div
                                className="absolute z-50 mt-1 right-0 min-w-[200px]"
                                style={{
                                  backgroundColor: '#050f08',
                                  border: '1px solid #0d2a18',
                                }}
                              >
                                {ungrantedContracts.map(c => (
                                  <button
                                    key={c.id}
                                    onClick={() => handleGrantAccess(user.id, c.id)}
                                    className="block w-full text-left px-4 py-2 text-[10px]"
                                    style={{
                                      color: '#c8f0d8',
                                      fontFamily: "'Share Tech Mono', monospace",
                                      borderBottom: '1px solid #0d2a18',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      borderBottomWidth: 1,
                                      borderBottomStyle: 'solid',
                                      borderBottomColor: '#0d2a18',
                                      cursor: 'pointer',
                                    }}
                                    onMouseEnter={e =>
                                      (e.currentTarget.style.backgroundColor = 'rgba(0,255,136,0.06)')
                                    }
                                    onMouseLeave={e =>
                                      (e.currentTarget.style.backgroundColor = 'transparent')
                                    }
                                  >
                                    {contractLabel(c)}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

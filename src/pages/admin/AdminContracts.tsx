import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Contract {
  id: string
  client_name: string
  building_name: string
  esco_name: string
  contract_value: number
  term_years: number
  guaranteed_annual_savings: number
  status: string
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

export function AdminContracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/admin?action=data')
      .then(r => r.json())
      .then(d => { setContracts(d.contracts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1
        className="text-2xl font-bold tracking-[0.1em] uppercase"
        style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
      >
        Contracts
      </h1>

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
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Building</th>
                  <th className="px-5 py-3">ESCO</th>
                  <th className="px-5 py-3 text-right">Value</th>
                  <th className="px-5 py-3 text-center">Term</th>
                  <th className="px-5 py-3 text-right">Guaranteed Savings</th>
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
                    <td className="px-5 py-3 text-center" style={{ color: '#4a7a5a' }}>
                      {c.term_years ? `${c.term_years}yr` : '--'}
                    </td>
                    <td className="px-5 py-3 text-right" style={{ color: '#c8f0d8' }}>
                      {formatCurrency(c.guaranteed_annual_savings)}/yr
                    </td>
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
                      No contracts found. Upload an ESPC contract to get started.
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

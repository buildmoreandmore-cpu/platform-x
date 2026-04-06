import { useEffect, useState } from 'react'

interface ECM {
  id: string
  name: string
  ecm_type: string
  guaranteed_savings: number
  verified_savings: number
  performance_pct: number
  status: string
}

interface Contract {
  id: string
  client_name: string
  building_name: string
  contract_value: number
  guaranteed_savings_annual: number
  verified_savings_ytd: number
  performance_pct: number
  current_year: number
  contract_term_years: number
  status: string
  ecms: ECM[]
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function performanceColor(pct: number): string {
  if (pct >= 90) return '#00ff88'
  if (pct >= 75) return '#ffaa00'
  return '#ff4444'
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48" style={{ backgroundColor: '#050f08' }} />
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-64" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} />
      ))}
    </div>
  )
}

export function CMVPContracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cmvp?action=data')
      .then(r => r.json())
      .then(d => { setContracts(d.contracts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1
        className="text-2xl font-bold tracking-[0.1em] uppercase"
        style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
      >
        Assigned Contracts
      </h1>

      {contracts.length === 0 ? (
        <div
          className="p-12 text-center text-xs"
          style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18', color: '#4a7a5a' }}
        >
          No contracts assigned
        </div>
      ) : (
        contracts.map(contract => {
          const pct = contract.performance_pct ?? (contract.guaranteed_savings_annual > 0
            ? (contract.verified_savings_ytd / contract.guaranteed_savings_annual) * 100
            : 0)
          const color = performanceColor(pct)

          return (
            <div
              key={contract.id}
              style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}
            >
              {/* Contract Header */}
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid #0d2a18' }}
              >
                <div>
                  <div className="text-sm font-bold" style={{ color: '#c8f0d8' }}>
                    {contract.building_name}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: '#4a7a5a' }}>
                    {contract.client_name} | Year {contract.current_year} of {contract.contract_term_years}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-[0.15em]" style={{ color: '#4a7a5a' }}>
                      Contract Value
                    </div>
                    <div className="text-sm font-bold" style={{ color: '#00ff88' }}>
                      {formatCurrency(contract.contract_value)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-[0.15em]" style={{ color: '#4a7a5a' }}>
                      Performance
                    </div>
                    <div className="text-sm font-bold" style={{ color }}>
                      {pct.toFixed(1)}%
                    </div>
                  </div>
                  <span
                    className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                    style={{
                      color: contract.status === 'active' ? '#00ff88' : '#ffaa00',
                      border: `1px solid ${contract.status === 'active' ? '#00ff88' : '#ffaa00'}`,
                    }}
                  >
                    {contract.status}
                  </span>
                </div>
              </div>

              {/* Savings Summary */}
              <div
                className="px-6 py-4 grid grid-cols-3 gap-6"
                style={{ borderBottom: '1px solid #0d2a18' }}
              >
                <div>
                  <div className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>
                    Guaranteed Annual
                  </div>
                  <div className="text-sm font-bold" style={{ color: '#c8f0d8' }}>
                    {formatCurrency(contract.guaranteed_savings_annual)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>
                    Verified YTD
                  </div>
                  <div className="text-sm font-bold" style={{ color }}>
                    {formatCurrency(contract.verified_savings_ytd)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>
                    Overall Performance
                  </div>
                  <div className="h-1 mt-2" style={{ backgroundColor: '#0d2a18' }}>
                    <div
                      className="h-full transition-all duration-700"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              </div>

              {/* ECMs Table */}
              <div>
                <div
                  className="px-6 py-2 text-[9px] uppercase tracking-[0.2em] font-bold"
                  style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
                >
                  Energy Conservation Measures ({contract.ecms?.length ?? 0})
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr
                      className="text-left text-[9px] uppercase tracking-[0.15em]"
                      style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
                    >
                      <th className="px-6 py-2">ECM</th>
                      <th className="px-6 py-2">Type</th>
                      <th className="px-6 py-2 text-right">Guaranteed</th>
                      <th className="px-6 py-2 text-right">Verified</th>
                      <th className="px-6 py-2 text-right">Performance</th>
                      <th className="px-6 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(contract.ecms ?? []).map(ecm => {
                      const ecmPct = ecm.performance_pct ?? (ecm.guaranteed_savings > 0
                        ? (ecm.verified_savings / ecm.guaranteed_savings) * 100 : 0)
                      const ecmColor = performanceColor(ecmPct)
                      return (
                        <tr
                          key={ecm.id}
                          style={{ borderBottom: '1px solid #0d2a18' }}
                        >
                          <td className="px-6 py-3" style={{ color: '#c8f0d8' }}>{ecm.name}</td>
                          <td className="px-6 py-3" style={{ color: '#4a7a5a' }}>{ecm.ecm_type}</td>
                          <td className="px-6 py-3 text-right" style={{ color: '#4a7a5a' }}>
                            {formatCurrency(ecm.guaranteed_savings)}
                          </td>
                          <td className="px-6 py-3 text-right" style={{ color: ecmColor }}>
                            {formatCurrency(ecm.verified_savings)}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span style={{ color: ecmColor }}>{ecmPct.toFixed(1)}%</span>
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                              style={{
                                color: ecm.status === 'active' ? '#00ff88' : '#ffaa00',
                                border: `1px solid ${ecm.status === 'active' ? '#00ff88' : '#ffaa00'}`,
                              }}
                            >
                              {ecm.status || 'active'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    {(!contract.ecms || contract.ecms.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center" style={{ color: '#4a7a5a' }}>
                          No ECMs
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

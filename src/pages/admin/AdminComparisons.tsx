import { useEffect, useState } from 'react'
import { Plus, CloudRain } from 'lucide-react'

interface Comparison {
  id: string
  baseline_id: string
  month: number
  year: number
  baseline_value: number
  actual_value: number
  weather_adjusted_value: number | null
  tolerance_pct: number
  unit: string
}

function varianceColor(variance: number, tolerance: number): string {
  const abs = Math.abs(variance)
  if (abs <= tolerance * 0.5) return '#00ff88'
  if (abs <= tolerance) return '#ffaa00'
  return '#ff4444'
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function AdminComparisons() {
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState('')
  const [selectedBaseline, setSelectedBaseline] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [weatherAdjusted, setWeatherAdjusted] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Add modal form state
  const [formMonth, setFormMonth] = useState('1')
  const [formYear, setFormYear] = useState(new Date().getFullYear().toString())
  const [formBaselineValue, setFormBaselineValue] = useState('')
  const [formActualValue, setFormActualValue] = useState('')
  const [formUnit, setFormUnit] = useState('')
  const [formTolerance, setFormTolerance] = useState('10')

  const fetchComparisons = () => {
    setLoading(true)
    const params = new URLSearchParams({ action: 'comparisons' })
    if (selectedContract) params.set('contract_id', selectedContract)
    if (selectedBaseline) params.set('baseline_id', selectedBaseline)
    if (selectedYear) params.set('year', selectedYear)
    fetch(`/api/baselines?${params}`)
      .then(r => r.json())
      .then(d => { setComparisons(Array.isArray(d) ? d : d.comparisons ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchComparisons() }, [selectedContract, selectedBaseline, selectedYear])

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/baselines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-comparison',
          contract_id: selectedContract,
          baseline_id: selectedBaseline,
          month: parseInt(formMonth),
          year: parseInt(formYear),
          baseline_value: parseFloat(formBaselineValue),
          actual_value: parseFloat(formActualValue),
          unit: formUnit,
          tolerance_pct: parseFloat(formTolerance),
        }),
      })
      if (res.ok) {
        setShowAddModal(false)
        setFormMonth('1'); setFormYear(new Date().getFullYear().toString()); setFormBaselineValue(''); setFormActualValue(''); setFormUnit(''); setFormTolerance('10')
        fetchComparisons()
      }
    } catch { /* silently fail */ }
  }

  // Compute chart data
  const maxVal = comparisons.reduce((m, c) => {
    const val = weatherAdjusted && c.weather_adjusted_value != null ? c.weather_adjusted_value : c.actual_value
    return Math.max(m, val, c.baseline_value)
  }, 1)

  // Summary for the selected month (latest or highest variance)
  const latest = comparisons.length > 0 ? comparisons[comparisons.length - 1] : null
  const latestActual = latest ? (weatherAdjusted && latest.weather_adjusted_value != null ? latest.weather_adjusted_value : latest.actual_value) : 0
  const latestVariance = latest ? ((latestActual - latest.baseline_value) / latest.baseline_value * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold tracking-[0.1em] uppercase"
          style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
        >
          Baseline Comparisons
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold transition-opacity hover:opacity-80"
          style={{ color: '#020c06', backgroundColor: '#00ff88' }}
        >
          <Plus size={12} /> Add Comparison
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>Contract ID</label>
          <input
            type="text"
            placeholder="Contract ID..."
            value={selectedContract}
            onChange={e => setSelectedContract(e.target.value)}
            className="px-4 py-2 text-xs w-48 outline-none"
            style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#050f08', border: '1px solid #0d2a18', color: '#c8f0d8' }}
          />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>Baseline ID</label>
          <input
            type="text"
            placeholder="Baseline ID..."
            value={selectedBaseline}
            onChange={e => setSelectedBaseline(e.target.value)}
            className="px-4 py-2 text-xs w-48 outline-none"
            style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#050f08', border: '1px solid #0d2a18', color: '#c8f0d8' }}
          />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>Year</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="px-4 py-2 text-xs outline-none"
            style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#050f08', border: '1px solid #0d2a18', color: '#c8f0d8' }}
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setWeatherAdjusted(!weatherAdjusted)}
            className="flex items-center gap-2 px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold transition-opacity"
            style={{
              color: weatherAdjusted ? '#020c06' : '#ffaa00',
              backgroundColor: weatherAdjusted ? '#ffaa00' : 'transparent',
              border: '1px solid #ffaa00',
            }}
          >
            <CloudRain size={12} /> Weather Adjusted
          </button>
        </div>
      </div>

      {/* Plain English summary */}
      {latest && (
        <div className="px-5 py-4" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
          <div className="text-sm" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#c8f0d8' }}>
            You should be using{' '}
            <span style={{ color: '#00ff88' }}>{latest.baseline_value} {latest.unit}</span>.
            You&apos;re using{' '}
            <span style={{ color: varianceColor(Math.abs(latestVariance), latest.tolerance_pct) }}>{latestActual} {latest.unit}</span>.
            That&apos;s a{' '}
            <span style={{ color: varianceColor(Math.abs(latestVariance), latest.tolerance_pct) }}>
              {latestVariance >= 0 ? '+' : ''}{latestVariance.toFixed(1)}% variance
            </span>.
          </div>
        </div>
      )}

      {/* Bar chart */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        {loading ? (
          <div className="p-8 text-center animate-pulse">
            <div className="h-4 w-48 mx-auto" style={{ backgroundColor: '#0d2a18' }} />
          </div>
        ) : comparisons.length === 0 ? (
          <div className="p-8 text-center text-xs" style={{ color: '#4a7a5a' }}>No comparison data found</div>
        ) : (
          <div className="p-5 space-y-2">
            <div
              className="text-[9px] uppercase tracking-[0.2em] font-bold mb-4"
              style={{ color: '#4a7a5a' }}
            >
              Monthly Baseline vs Actual
            </div>
            {comparisons.map(c => {
              const actual = weatherAdjusted && c.weather_adjusted_value != null ? c.weather_adjusted_value : c.actual_value
              const variance = ((actual - c.baseline_value) / c.baseline_value) * 100
              const barWidth = (actual / maxVal) * 100
              const baselinePos = (c.baseline_value / maxVal) * 100
              const color = varianceColor(Math.abs(variance), c.tolerance_pct)

              return (
                <div key={c.id || `${c.month}-${c.year}`} className="flex items-center gap-4">
                  <div className="w-8 text-right text-[9px] uppercase tracking-[0.1em]" style={{ color: '#4a7a5a', fontFamily: "'Share Tech Mono', monospace" }}>
                    {MONTHS[c.month - 1]}
                  </div>
                  <div className="flex-1 relative h-6">
                    {/* Actual bar */}
                    <div
                      className="absolute top-0 left-0 h-full transition-all"
                      style={{
                        width: `${Math.min(barWidth, 100)}%`,
                        backgroundColor: color,
                        opacity: 0.3,
                      }}
                    />
                    <div
                      className="absolute top-0 left-0 h-full transition-all"
                      style={{
                        width: `${Math.min(barWidth, 100)}%`,
                        borderRight: `2px solid ${color}`,
                      }}
                    />
                    {/* Baseline marker */}
                    <div
                      className="absolute top-0 h-full"
                      style={{
                        left: `${Math.min(baselinePos, 100)}%`,
                        width: '2px',
                        backgroundColor: '#c8f0d8',
                        opacity: 0.6,
                      }}
                    />
                  </div>
                  <div className="w-24 text-right text-[9px]" style={{ fontFamily: "'Share Tech Mono', monospace", color }}>
                    {actual.toLocaleString()} {c.unit}
                  </div>
                  <div className="w-16 text-right text-[9px]" style={{ fontFamily: "'Share Tech Mono', monospace", color }}>
                    {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                  </div>
                </div>
              )
            })}
            <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid #0d2a18' }}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5" style={{ backgroundColor: '#c8f0d8', opacity: 0.6 }} />
                <span className="text-[8px] uppercase tracking-[0.1em]" style={{ color: '#4a7a5a' }}>Baseline</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3" style={{ backgroundColor: '#00ff88', opacity: 0.3 }} />
                <span className="text-[8px] uppercase tracking-[0.1em]" style={{ color: '#4a7a5a' }}>Actual</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data table */}
      {!loading && comparisons.length > 0 && (
        <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr
                  className="text-left text-[9px] uppercase tracking-[0.15em]"
                  style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
                >
                  <th className="px-5 py-3">Month</th>
                  <th className="px-5 py-3">Baseline</th>
                  <th className="px-5 py-3">Actual</th>
                  {weatherAdjusted && <th className="px-5 py-3">Weather Adj.</th>}
                  <th className="px-5 py-3">Unit</th>
                  <th className="px-5 py-3">Tolerance</th>
                  <th className="px-5 py-3">Variance</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map(c => {
                  const actual = weatherAdjusted && c.weather_adjusted_value != null ? c.weather_adjusted_value : c.actual_value
                  const variance = ((actual - c.baseline_value) / c.baseline_value) * 100
                  const color = varianceColor(Math.abs(variance), c.tolerance_pct)
                  const abs = Math.abs(variance)
                  const status = abs <= c.tolerance_pct * 0.5 ? 'PASS' : abs <= c.tolerance_pct ? 'WARNING' : 'FAIL'
                  return (
                    <tr
                      key={c.id || `${c.month}-${c.year}`}
                      style={{ borderBottom: '1px solid #0d2a18' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,255,136,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-5 py-3" style={{ color: '#c8f0d8', fontFamily: "'Share Tech Mono', monospace" }}>
                        {MONTHS[c.month - 1]} {c.year}
                      </td>
                      <td className="px-5 py-3" style={{ color: '#c8f0d8', fontFamily: "'Share Tech Mono', monospace" }}>{c.baseline_value.toLocaleString()}</td>
                      <td className="px-5 py-3" style={{ color, fontFamily: "'Share Tech Mono', monospace" }}>{c.actual_value.toLocaleString()}</td>
                      {weatherAdjusted && (
                        <td className="px-5 py-3" style={{ color: '#ffaa00', fontFamily: "'Share Tech Mono', monospace" }}>
                          {c.weather_adjusted_value != null ? c.weather_adjusted_value.toLocaleString() : '--'}
                        </td>
                      )}
                      <td className="px-5 py-3" style={{ color: '#4a7a5a', fontFamily: "'Share Tech Mono', monospace" }}>{c.unit}</td>
                      <td className="px-5 py-3" style={{ color: '#4a7a5a', fontFamily: "'Share Tech Mono', monospace" }}>&plusmn;{c.tolerance_pct}%</td>
                      <td className="px-5 py-3" style={{ color, fontFamily: "'Share Tech Mono', monospace" }}>
                        {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                          style={{ color, border: `1px solid ${color}` }}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Comparison Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(2,12,6,0.85)' }}>
          <div className="w-full max-w-lg p-6 space-y-5" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
            <h2
              className="text-lg font-bold tracking-[0.1em] uppercase"
              style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
            >
              Add Comparison
            </h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>Month</label>
                  <select
                    value={formMonth}
                    onChange={e => setFormMonth(e.target.value)}
                    className="w-full px-3 py-2 text-xs outline-none"
                    style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8' }}
                  >
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>Year</label>
                  <select
                    value={formYear}
                    onChange={e => setFormYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs outline-none"
                    style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8' }}
                  >
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              {[
                { label: 'Baseline Value', value: formBaselineValue, set: setFormBaselineValue, placeholder: '0.00' },
                { label: 'Actual Value', value: formActualValue, set: setFormActualValue, placeholder: '0.00' },
                { label: 'Unit', value: formUnit, set: setFormUnit, placeholder: 'kWh, therms, kW...' },
                { label: 'Tolerance %', value: formTolerance, set: setFormTolerance, placeholder: '10' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>{f.label}</label>
                  <input
                    type="text"
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 text-xs outline-none"
                    style={{ fontFamily: "'Share Tech Mono', monospace", backgroundColor: '#020c06', border: '1px solid #0d2a18', color: '#c8f0d8' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold"
                style={{ color: '#4a7a5a', border: '1px solid #0d2a18' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold"
                style={{ color: '#020c06', backgroundColor: '#00ff88' }}
              >
                Save Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

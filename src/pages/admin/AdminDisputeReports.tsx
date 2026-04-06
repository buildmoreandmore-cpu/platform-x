import { useState } from 'react'
import { FileText, Printer, Send, Loader2, Clock } from 'lucide-react'

interface ReportRecord {
  contractId: string
  generatedAt: string
  preview: string
}

export function AdminDisputeReports() {
  const [selectedContract, setSelectedContract] = useState('')
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState('')
  const [reportGenerated, setReportGenerated] = useState(false)
  const [history, setHistory] = useState<ReportRecord[]>([])

  const handleGenerate = async () => {
    if (!selectedContract) return
    setGenerating(true)
    setReport('')
    setReportGenerated(false)
    try {
      const res = await fetch('/api/baselines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dispute-report', contractId: selectedContract }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = typeof data === 'string' ? data : data.report ?? ''
        setReport(text)
        setReportGenerated(true)
        setHistory(prev => [
          { contractId: selectedContract, generatedAt: new Date().toISOString(), preview: text.slice(0, 120) },
          ...prev,
        ])
      }
    } catch {
      setReport('Error generating report. Please try again.')
      setReportGenerated(true)
    } finally {
      setGenerating(false)
    }
  }

  const handleExportPdf = () => {
    window.print()
  }

  const handleSendCmvp = () => {
    // Placeholder action
    alert('Report queued for CMVP review.')
  }

  // Render report text with section headers
  const renderReport = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      const trimmed = line.trim()
      // Detect section headers (lines in ALL CAPS or starting with ##)
      const isHeader = /^#{1,3}\s/.test(trimmed) || (/^[A-Z][A-Z\s:]{5,}$/.test(trimmed) && trimmed.length > 5)
      if (isHeader) {
        const clean = trimmed.replace(/^#{1,3}\s*/, '')
        return (
          <div
            key={i}
            className="text-xs font-bold tracking-[0.15em] uppercase mt-5 mb-2 pb-1"
            style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88', borderBottom: '1px solid #0d2a18' }}
          >
            {clean}
          </div>
        )
      }
      if (!trimmed) return <div key={i} className="h-2" />
      return (
        <div key={i} className="text-xs leading-relaxed" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#c8f0d8' }}>
          {trimmed}
        </div>
      )
    })
  }

  return (
    <div className="space-y-6">
      <h1
        className="text-2xl font-bold tracking-[0.1em] uppercase"
        style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
      >
        Dispute Reports
      </h1>

      {/* Contract selector + Generate button */}
      <div
        className="p-5 space-y-4"
        style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}
      >
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: '#4a7a5a' }}>Contract ID</label>
          <input
            type="text"
            placeholder="Enter Contract ID..."
            value={selectedContract}
            onChange={e => setSelectedContract(e.target.value)}
            className="px-4 py-2 text-xs w-72 outline-none"
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              backgroundColor: '#020c06',
              border: '1px solid #0d2a18',
              color: '#c8f0d8',
            }}
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedContract}
          className="flex items-center gap-3 px-8 py-4 text-xs uppercase tracking-[0.2em] font-bold transition-opacity disabled:opacity-30"
          style={{
            color: '#020c06',
            backgroundColor: '#ffaa00',
            fontFamily: "'Syne', sans-serif",
          }}
        >
          <FileText size={16} />
          Generate Baseline Dispute Report
        </button>
      </div>

      {/* Generating spinner */}
      {generating && (
        <div
          className="flex items-center justify-center gap-3 p-8"
          style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}
        >
          <Loader2 size={16} className="animate-spin" style={{ color: '#ffaa00' }} />
          <span
            className="text-xs uppercase tracking-[0.2em] animate-pulse"
            style={{ fontFamily: "'Share Tech Mono', monospace", color: '#ffaa00' }}
          >
            Generating forensic analysis...
          </span>
        </div>
      )}

      {/* Report display */}
      {reportGenerated && !generating && (
        <div className="space-y-4 print:space-y-2">
          <div
            className="p-6 print:p-4"
            style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}
          >
            <div className="print:hidden flex items-center justify-between mb-5 pb-3" style={{ borderBottom: '1px solid #0d2a18' }}>
              <div
                className="text-[9px] uppercase tracking-[0.2em] font-bold"
                style={{ color: '#4a7a5a' }}
              >
                Dispute Report &mdash; {selectedContract}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportPdf}
                  className="flex items-center gap-1 px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] font-bold transition-opacity hover:opacity-80"
                  style={{ color: '#00ff88', border: '1px solid #00ff88' }}
                >
                  <Printer size={10} /> Export as PDF
                </button>
                <button
                  onClick={handleSendCmvp}
                  className="flex items-center gap-1 px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] font-bold transition-opacity hover:opacity-80"
                  style={{ color: '#ffaa00', border: '1px solid #ffaa00' }}
                >
                  <Send size={10} /> Send to CMVP for Review
                </button>
              </div>
            </div>
            <div>{renderReport(report)}</div>
          </div>
        </div>
      )}

      {/* Report history */}
      {history.length > 0 && (
        <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #0d2a18' }}>
            <div
              className="text-[9px] uppercase tracking-[0.2em] font-bold"
              style={{ color: '#4a7a5a' }}
            >
              Report History
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr
                  className="text-left text-[9px] uppercase tracking-[0.15em]"
                  style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
                >
                  <th className="px-5 py-3 w-8"></th>
                  <th className="px-5 py-3">Contract</th>
                  <th className="px-5 py-3">Generated</th>
                  <th className="px-5 py-3">Preview</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid #0d2a18' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,255,136,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-5 py-3">
                      <Clock size={12} style={{ color: '#4a7a5a' }} />
                    </td>
                    <td className="px-5 py-3" style={{ color: '#c8f0d8', fontFamily: "'Share Tech Mono', monospace" }}>
                      {h.contractId}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>
                      {new Date(h.generatedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 max-w-md truncate" style={{ color: '#4a7a5a' }}>
                      {h.preview}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .print\\:p-4 { padding: 1rem !important; }
          .print\\:space-y-2 > * + * { margin-top: 0.5rem !important; }
          * { color: black !important; border-color: #ccc !important; background: white !important; }
        }
      `}</style>
    </div>
  )
}

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react'

type UploadMode = 'espc_contract' | 'utility_bill' | 'mv_report'

interface Contract {
  id: string
  client_name: string
  building_name: string
}

const tabs: { key: UploadMode; label: string }[] = [
  { key: 'espc_contract', label: 'ESPC Contract' },
  { key: 'utility_bill', label: 'Utility Bill' },
  { key: 'mv_report', label: 'M&V Report' },
]

const endpointMap: Record<UploadMode, string> = {
  espc_contract: '/api/extract-contract',
  utility_bill: '/api/extract-utility',
  mv_report: '/api/extract-mv-report',
}

export function AdminUpload() {
  const [mode, setMode] = useState<UploadMode>('espc_contract')
  const [contracts, setContracts] = useState<Contract[]>([])
  const [clientName, setClientName] = useState('')
  const [buildingName, setBuildingName] = useState('')
  const [buildingAddress, setBuildingAddress] = useState('')
  const [contractId, setContractId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileBase64, setFileBase64] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    fetch('/api/admin-data')
      .then(r => r.json())
      .then(d => {
        if (d.contracts) setContracts(d.contracts)
      })
      .catch(() => {})
  }, [])

  const resetForm = useCallback(() => {
    setFile(null)
    setFileBase64('')
    setResult(null)
    setError('')
    setProgress(0)
  }, [])

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are accepted')
      return
    }
    setFile(f)
    setError('')
    setResult(null)
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1] || ''
      setFileBase64(base64)
    }
    reader.readAsDataURL(f)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleUpload = async () => {
    if (!file || !fileBase64) return
    if (mode === 'espc_contract' && !clientName.trim()) {
      setError('Client name is required')
      return
    }
    if ((mode === 'utility_bill' || mode === 'mv_report') && !contractId) {
      setError('Please select a contract')
      return
    }

    setUploading(true)
    setError('')
    setResult(null)
    setProgress(10)

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 8, 90))
    }, 500)

    try {
      const body =
        mode === 'espc_contract'
          ? {
              file_base64: fileBase64,
              file_name: file.name,
              client_name: clientName.trim(),
              building_name: buildingName.trim(),
              building_address: buildingAddress.trim(),
            }
          : {
              file_base64: fileBase64,
              file_name: file.name,
              contract_id: contractId,
            }

      const res = await fetch(endpointMap[mode], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errData.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err: unknown) {
      clearInterval(progressInterval)
      setProgress(0)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1
        className="text-2xl font-bold tracking-[0.1em] uppercase"
        style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
      >
        Upload Document
      </h1>

      {/* Mode tabs */}
      <div className="flex" style={{ borderBottom: '1px solid #0d2a18' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setMode(t.key); resetForm() }}
            className="px-5 py-3 text-[9px] uppercase tracking-[0.2em] font-bold transition-colors"
            style={{
              color: mode === t.key ? '#00ff88' : '#4a7a5a',
              borderBottom: mode === t.key ? '2px solid #00ff88' : '2px solid transparent',
              backgroundColor: 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="space-y-4" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18', padding: 24 }}>
        {mode === 'espc_contract' && (
          <>
            <div>
              <label
                className="block text-[9px] uppercase tracking-[0.2em] mb-2"
                style={{ color: '#4a7a5a' }}
              >
                Client Name *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="City of Atlanta"
                className="w-full px-4 py-2 text-xs outline-none"
                style={{
                  backgroundColor: '#020c06',
                  border: '1px solid #0d2a18',
                  color: '#c8f0d8',
                  fontFamily: "'Share Tech Mono', monospace",
                }}
              />
            </div>
            <div>
              <label
                className="block text-[9px] uppercase tracking-[0.2em] mb-2"
                style={{ color: '#4a7a5a' }}
              >
                Building Name
              </label>
              <input
                type="text"
                value={buildingName}
                onChange={e => setBuildingName(e.target.value)}
                placeholder="City Hall"
                className="w-full px-4 py-2 text-xs outline-none"
                style={{
                  backgroundColor: '#020c06',
                  border: '1px solid #0d2a18',
                  color: '#c8f0d8',
                  fontFamily: "'Share Tech Mono', monospace",
                }}
              />
            </div>
            <div>
              <label
                className="block text-[9px] uppercase tracking-[0.2em] mb-2"
                style={{ color: '#4a7a5a' }}
              >
                Building Address
              </label>
              <input
                type="text"
                value={buildingAddress}
                onChange={e => setBuildingAddress(e.target.value)}
                placeholder="55 Trinity Ave SW"
                className="w-full px-4 py-2 text-xs outline-none"
                style={{
                  backgroundColor: '#020c06',
                  border: '1px solid #0d2a18',
                  color: '#c8f0d8',
                  fontFamily: "'Share Tech Mono', monospace",
                }}
              />
            </div>
          </>
        )}

        {(mode === 'utility_bill' || mode === 'mv_report') && (
          <div>
            <label
              className="block text-[9px] uppercase tracking-[0.2em] mb-2"
              style={{ color: '#4a7a5a' }}
            >
              Select Contract *
            </label>
            <select
              value={contractId}
              onChange={e => setContractId(e.target.value)}
              className="w-full px-4 py-2 text-xs outline-none"
              style={{
                backgroundColor: '#020c06',
                border: '1px solid #0d2a18',
                color: '#c8f0d8',
                fontFamily: "'Share Tech Mono', monospace",
              }}
            >
              <option value="">-- Select a contract --</option>
              {contracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.client_name} - {c.building_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* File drop zone */}
        <div>
          <label
            className="block text-[9px] uppercase tracking-[0.2em] mb-2"
            style={{ color: '#4a7a5a' }}
          >
            Document (PDF)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-colors"
            style={{
              border: `1px dashed ${dragOver ? '#00ff88' : '#0d2a18'}`,
              backgroundColor: dragOver ? 'rgba(0,255,136,0.04)' : '#020c06',
            }}
          >
            {file ? (
              <>
                <FileText size={24} style={{ color: '#00ff88' }} />
                <span className="text-xs" style={{ color: '#c8f0d8' }}>{file.name}</span>
                <span className="text-[9px] uppercase tracking-[0.15em]" style={{ color: '#4a7a5a' }}>
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </>
            ) : (
              <>
                <Upload size={24} style={{ color: '#4a7a5a' }} />
                <span className="text-xs" style={{ color: '#4a7a5a' }}>
                  Drop PDF here or click to select
                </span>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </div>

        {/* Progress bar */}
        {uploading && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: '#4a7a5a' }}>
                Extracting...
              </span>
              <span className="text-[9px]" style={{ color: '#00ff88' }}>{progress}%</span>
            </div>
            <div className="w-full" style={{ height: 4, backgroundColor: '#0d2a18' }}>
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: '#00ff88' }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: 'rgba(255,68,68,0.08)', border: '1px solid #ff4444' }}>
            <AlertCircle size={14} style={{ color: '#ff4444' }} />
            <span className="text-xs" style={{ color: '#ff4444' }}>{error}</span>
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold transition-opacity disabled:opacity-30"
          style={{
            backgroundColor: '#00ff88',
            color: '#020c06',
            fontFamily: "'Share Tech Mono', monospace",
          }}
        >
          {uploading ? 'Processing...' : 'Upload & Extract'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
          <div
            className="px-5 py-3 flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] font-bold"
            style={{ borderBottom: '1px solid #0d2a18', color: '#00ff88' }}
          >
            <CheckCircle size={14} />
            Extraction Complete
          </div>
          <div className="p-5 space-y-3">
            {Object.entries(result).map(([key, value]) => {
              if (key === 'ecms' && Array.isArray(value)) {
                return (
                  <div key={key}>
                    <div
                      className="text-[9px] uppercase tracking-[0.2em] mb-2"
                      style={{ color: '#4a7a5a' }}
                    >
                      ECMs Found ({value.length})
                    </div>
                    <div className="space-y-1">
                      {value.map((ecm: Record<string, unknown>, i: number) => (
                        <div
                          key={i}
                          className="px-3 py-2 text-xs flex items-center justify-between"
                          style={{ backgroundColor: '#020c06', border: '1px solid #0d2a18' }}
                        >
                          <span style={{ color: '#c8f0d8' }}>
                            {(ecm.name as string) || (ecm.description as string) || `ECM ${i + 1}`}
                          </span>
                          {ecm.guaranteed_savings !== undefined && (
                            <span style={{ color: '#00ff88' }}>
                              ${Number(ecm.guaranteed_savings).toLocaleString()}/yr
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }
              if (typeof value === 'object' && value !== null) return null
              return (
                <div key={key} className="flex items-center justify-between">
                  <span
                    className="text-[9px] uppercase tracking-[0.2em]"
                    style={{ color: '#4a7a5a' }}
                  >
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs" style={{ color: '#c8f0d8' }}>
                    {typeof value === 'number' && key.toLowerCase().includes('value')
                      ? `$${value.toLocaleString()}`
                      : typeof value === 'number' && key.toLowerCase().includes('confidence')
                      ? `${(value * 100).toFixed(0)}%`
                      : String(value)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

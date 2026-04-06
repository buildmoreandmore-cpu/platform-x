import { useEffect, useState } from 'react'

interface Document {
  id: string
  file_name: string
  document_type: string
  processing_status: string
  file_size?: number
  created_at: string
}

function typeBadgeColor(type: string): string {
  switch (type) {
    case 'espc_contract': return '#00ff88'
    case 'utility_bill': return '#4488ff'
    case 'mv_report': return '#ffaa00'
    default: return '#4a7a5a'
  }
}

function formatSize(bytes?: number): string {
  if (!bytes) return '--'
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

export function AdminDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin-data')
      .then(r => r.json())
      .then(d => { setDocuments(d.documents ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1
        className="text-2xl font-bold tracking-[0.1em] uppercase"
        style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
      >
        Documents
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
                  <th className="px-5 py-3">Filename</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Size</th>
                  <th className="px-5 py-3">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(d => (
                  <tr
                    key={d.id}
                    style={{ borderBottom: '1px solid #0d2a18' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,255,136,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-5 py-3" style={{ color: '#c8f0d8' }}>{d.file_name}</td>
                    <td className="px-5 py-3">
                      <span
                        className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                        style={{
                          color: typeBadgeColor(d.document_type),
                          border: `1px solid ${typeBadgeColor(d.document_type)}`,
                        }}
                      >
                        {d.document_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
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
                    </td>
                    <td className="px-5 py-3 text-right" style={{ color: '#4a7a5a' }}>
                      {formatSize(d.file_size)}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center" style={{ color: '#4a7a5a' }}>
                      No documents uploaded yet
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

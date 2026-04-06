import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, Clock, CheckCircle, FileText, AlertTriangle } from 'lucide-react'

interface Task {
  id: string
  task_type: string
  title: string
  building_name: string
  period: string
  priority: 'high' | 'medium' | 'low'
  due_date: string
  status: 'pending' | 'in_review' | 'completed' | 'flagged'
  contract_id: string
}

interface CMVPData {
  tasks: Task[]
  contracts: any[]
  summary: {
    pending: number
    in_review: number
    completed: number
    contracts_assigned: number
  }
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'high': return '#ff4444'
    case 'medium': return '#ffaa00'
    default: return '#00ff88'
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'pending': return '#ffaa00'
    case 'in_review': return '#4488ff'
    case 'completed': return '#00ff88'
    case 'flagged': return '#ff4444'
    default: return '#4a7a5a'
  }
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} />
        ))}
      </div>
      <div className="h-64" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} />
    </div>
  )
}

export function CMVPDashboard() {
  const [data, setData] = useState<CMVPData | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/cmvp-data')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  const summary = data?.summary ?? { pending: 0, in_review: 0, completed: 0, contracts_assigned: 0 }
  const tasks = data?.tasks ?? []
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_review')

  const metrics = [
    { label: 'Pending Review', value: summary.pending, icon: Clock, color: '#ffaa00' },
    { label: 'In Review', value: summary.in_review, icon: ClipboardCheck, color: '#4488ff' },
    { label: 'Completed', value: summary.completed, icon: CheckCircle, color: '#00ff88' },
    { label: 'Contracts Assigned', value: summary.contracts_assigned, icon: FileText, color: '#00ff88' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1
        className="text-2xl font-bold tracking-[0.1em] uppercase"
        style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
      >
        M&V Dashboard
      </h1>

      {/* Metrics */}
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

      {/* Task Queue */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid #0d2a18' }}
        >
          <span
            className="text-[9px] uppercase tracking-[0.2em] font-bold"
            style={{ color: '#4a7a5a' }}
          >
            Pending Task Queue
          </span>
          <button
            onClick={() => navigate('/cmvp/tasks')}
            className="text-[9px] uppercase tracking-[0.15em]"
            style={{ color: '#00ff88' }}
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr
                className="text-left text-[9px] uppercase tracking-[0.15em]"
                style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
              >
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Task</th>
                <th className="px-5 py-3">Building</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pendingTasks.slice(0, 10).map(t => (
                <tr
                  key={t.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid #0d2a18' }}
                  onClick={() => navigate(`/cmvp/tasks/${t.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,255,136,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: priorityColor(t.priority),
                          boxShadow: `0 0 4px ${priorityColor(t.priority)}`,
                        }}
                      />
                      <span style={{ color: priorityColor(t.priority) }}>
                        {t.priority.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3" style={{ color: '#c8f0d8' }}>{t.title}</td>
                  <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>{t.building_name}</td>
                  <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>{t.period}</td>
                  <td className="px-5 py-3" style={{ color: '#4a7a5a' }}>
                    {new Date(t.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                      style={{
                        color: statusColor(t.status),
                        border: `1px solid ${statusColor(t.status)}`,
                      }}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        navigate(`/cmvp/tasks/${t.id}`)
                      }}
                      className="px-3 py-1 text-[9px] uppercase tracking-[0.15em] font-bold"
                      style={{ backgroundColor: '#00ff88', color: '#020c06' }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {pendingTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center" style={{ color: '#4a7a5a' }}>
                    No pending tasks
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type TaskStatus = 'all' | 'pending' | 'in_review' | 'completed' | 'flagged'

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
      <div className="h-10" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} />
      <div className="h-96" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} />
    </div>
  )
}

export function CMVPTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TaskStatus>('all')
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/cmvp-tasks')
      .then(r => r.json())
      .then(d => { setTasks(d.tasks ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  const filters: { id: TaskStatus; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'in_review', label: 'In Review' },
    { id: 'completed', label: 'Completed' },
    { id: 'flagged', label: 'Flagged' },
  ]

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1
        className="text-2xl font-bold tracking-[0.1em] uppercase"
        style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
      >
        M&V Tasks
      </h1>

      {/* Filter Tabs */}
      <div className="flex gap-0" style={{ borderBottom: '1px solid #0d2a18' }}>
        {filters.map(f => {
          const count = f.id === 'all' ? tasks.length : tasks.filter(t => t.status === f.id).length
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-5 py-3 text-[10px] uppercase tracking-[0.2em] transition-colors relative"
              style={{
                color: filter === f.id ? '#00ff88' : '#4a7a5a',
                borderBottom: filter === f.id ? '2px solid #00ff88' : '2px solid transparent',
                backgroundColor: filter === f.id ? 'rgba(0,255,136,0.04)' : 'transparent',
              }}
            >
              {f.label}
              <span className="ml-2 text-[8px]" style={{ opacity: 0.7 }}>({count})</span>
            </button>
          )
        })}
      </div>

      {/* Task Table */}
      <div style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr
                className="text-left text-[9px] uppercase tracking-[0.15em]"
                style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
              >
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Building</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
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
                      <span className="text-[9px] uppercase" style={{ color: priorityColor(t.priority) }}>
                        {t.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-[9px] uppercase tracking-[0.1em] px-2 py-0.5"
                      style={{ color: '#4a7a5a', border: '1px solid #0d2a18' }}
                    >
                      {t.task_type.replace(/_/g, ' ')}
                    </span>
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
                      style={{
                        backgroundColor: t.status === 'completed' ? 'transparent' : '#00ff88',
                        color: t.status === 'completed' ? '#4a7a5a' : '#020c06',
                        border: t.status === 'completed' ? '1px solid #0d2a18' : 'none',
                      }}
                    >
                      {t.status === 'completed' ? 'View' : 'Review'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center" style={{ color: '#4a7a5a' }}>
                    No tasks match this filter
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

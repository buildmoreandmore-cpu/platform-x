import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ClipboardCheck, FileText, LogOut } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/cmvp', end: true },
  { label: 'Tasks', icon: ClipboardCheck, to: '/cmvp/tasks' },
  { label: 'Contracts', icon: FileText, to: '/cmvp/contracts' },
]

export function CMVPLayout() {
  const navigate = useNavigate()

  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundColor: '#020c06',
        color: '#c8f0d8',
        fontFamily: "'Share Tech Mono', monospace",
      }}
    >
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 bottom-0 flex flex-col"
        style={{
          width: 200,
          backgroundColor: '#050f08',
          borderRight: '1px solid #0d2a18',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: '1px solid #0d2a18' }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#00ff88', boxShadow: '0 0 6px #00ff88' }}
          />
          <span
            className="text-[11px] font-bold tracking-[0.15em] uppercase"
            style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
          >
            VANTAGE // M&V
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4">
          {navItems.map(({ label, icon: Icon, to, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.15em] transition-colors"
              style={({ isActive }) => ({
                color: isActive ? '#00ff88' : '#4a7a5a',
                borderLeft: isActive ? '2px solid #00ff88' : '2px solid transparent',
                backgroundColor: isActive ? 'rgba(0,255,136,0.04)' : 'transparent',
              })}
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="px-4 py-4"
          style={{ borderTop: '1px solid #0d2a18' }}
        >
          <div className="text-[9px] uppercase tracking-[0.15em] mb-3" style={{ color: '#4a7a5a' }}>
            M&V Professional
          </div>
          <div className="flex items-center gap-2 text-[9px] mb-3" style={{ color: '#4a7a5a' }}>
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: '#00ff88', boxShadow: '0 0 4px #00ff88' }}
            />
            CMVP Certified
          </div>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-[9px] uppercase tracking-[0.15em] transition-colors"
            style={{ color: '#4a7a5a' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4a7a5a')}
          >
            <LogOut size={10} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8" style={{ marginLeft: 200 }}>
        <Outlet />
      </main>
    </div>
  )
}

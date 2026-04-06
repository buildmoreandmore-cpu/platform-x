import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, Upload, Bell, FolderOpen } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin', end: true },
  { label: 'Contracts', icon: FileText, to: '/admin/contracts' },
  { label: 'Upload', icon: Upload, to: '/admin/upload' },
  { label: 'Alerts', icon: Bell, to: '/admin/alerts' },
  { label: 'Documents', icon: FolderOpen, to: '/admin/documents' },
]

export function AdminLayout() {
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
          width: 240,
          backgroundColor: '#050f08',
          borderRight: '1px solid #0d2a18',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: '1px solid #0d2a18' }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#00ff88', boxShadow: '0 0 6px #00ff88' }}
          />
          <span
            className="text-sm font-bold tracking-[0.2em] uppercase"
            style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
          >
            VANTAGE // ADMIN
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4">
          {navItems.map(({ label, icon: Icon, to, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex items-center gap-3 px-5 py-3 text-xs uppercase tracking-[0.15em] transition-colors"
              style={({ isActive }) => ({
                color: isActive ? '#00ff88' : '#4a7a5a',
                borderLeft: isActive ? '2px solid #00ff88' : '2px solid transparent',
                backgroundColor: isActive ? 'rgba(0,255,136,0.04)' : 'transparent',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Status */}
        <div
          className="px-5 py-4 text-[9px] uppercase tracking-[0.2em]"
          style={{ borderTop: '1px solid #0d2a18', color: '#4a7a5a' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: '#00ff88', boxShadow: '0 0 4px #00ff88' }}
            />
            PLATFORM ONLINE
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8" style={{ marginLeft: 240 }}>
        <Outlet />
      </main>
    </div>
  )
}

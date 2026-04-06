import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut } from 'lucide-react'

type Tab = 'overview' | 'ecm' | 'reports' | 'ask' | 'history' | 'communications' | 'baselines'

interface ClientPortalLayoutProps {
  children?: React.ReactNode
}

export function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const navigate = useNavigate()

  // Expose activeTab via context-like pattern: render children or outlet with tab state
  // We use a simple approach: the ClientDashboard reads from a global event or we pass via outlet context
  // For simplicity, this layout stores tab state and passes it down

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'ecm', label: 'ECM Performance' },
    { id: 'reports', label: 'Reports' },
    { id: 'ask', label: 'Ask Vantage AI' },
    { id: 'history', label: 'Contract History' },
    { id: 'communications', label: 'Communications' },
    { id: 'baselines', label: 'Baseline View' },
  ]

  const handleLogout = () => {
    navigate('/client/login')
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: '#020c06',
        color: '#c8f0d8',
        fontFamily: "'Share Tech Mono', monospace",
      }}
    >
      {/* Top Nav */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #0d2a18', backgroundColor: '#050f08' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#00ff88', boxShadow: '0 0 6px #00ff88' }}
          />
          <span
            className="text-sm font-bold tracking-[0.2em] uppercase"
            style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
          >
            VANTAGE // CLIENT PORTAL
          </span>
        </div>

        <div
          className="text-xs tracking-[0.15em] uppercase hidden md:block"
          style={{ color: '#4a7a5a' }}
        >
          Client Dashboard
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bell size={14} style={{ color: '#ffaa00' }} />
            <span className="text-[10px]" style={{ color: '#ffaa00' }}>0</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] transition-colors"
            style={{ color: '#4a7a5a' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4a7a5a')}
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <div
        className="flex px-6 gap-0"
        style={{ borderBottom: '1px solid #0d2a18', backgroundColor: '#050f08' }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-5 py-3 text-[10px] uppercase tracking-[0.2em] transition-colors relative"
            style={{
              color: activeTab === tab.id ? '#00ff88' : '#4a7a5a',
              borderBottom: activeTab === tab.id ? '2px solid #00ff88' : '2px solid transparent',
              backgroundColor: activeTab === tab.id ? 'rgba(0,255,136,0.04)' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 p-6 md:p-8">
        {/* Pass activeTab to children via a data attribute on the wrapper, or use the Outlet approach */}
        <ClientPortalContent activeTab={activeTab} />
      </main>
    </div>
  )
}

// We dynamically import and render the ClientDashboard with the active tab
import { lazy, Suspense } from 'react'

const ClientDashboard = lazy(() =>
  import('../../pages/client/ClientDashboard').then(m => ({ default: m.ClientDashboard }))
)

function ClientPortalContent({ activeTab }: { activeTab: Tab }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} />
            ))}
          </div>
          <div className="h-64" style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }} />
        </div>
      }
    >
      <ClientDashboard activeTab={activeTab} />
    </Suspense>
  )
}

import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

export function ClientLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F0] flex flex-col">
      {/* Header */}
      <header className="bg-[#0A0A0A] border-b border-[#222222] px-4 md:px-8 h-16 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/portal"
            className="flex items-center gap-1.5 text-sm text-[#888888] hover:text-[#F5F5F0] transition-colors"
          >
            <Icon icon="solar:arrow-left-bold-duotone" className="w-4 h-4" />
          </Link>
          <div className="w-px h-5 bg-[#222222]" />
          <div className="flex items-center gap-2.5">
            <img src="/logo-icon.svg" alt="Vantage" className="w-7 h-7" />
            <span className="font-semibold text-[#F5F5F0] text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>Client Dashboard</span>
          </div>
        </div>

        <button
          onClick={() => document.getElementById('team-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0A0A0A] text-xs font-semibold hover:bg-[#D4B85E] transition-colors"
        >
          <Icon icon="solar:phone-calling-bold-duotone" className="w-4 h-4" />
          <span className="hidden sm:inline">Contact Your Team</span>
        </button>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

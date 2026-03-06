import { Outlet, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

export function ClientLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 h-16 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Icon icon="solar:arrow-left-bold-duotone" className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-2.5">
            <img src="/logo.webp" alt="2KB Energy" className="w-7 h-7 object-contain" />
            <span className="font-semibold text-gray-900 text-sm">Client Dashboard</span>
          </div>
        </div>

        <button
          onClick={() => document.getElementById('team-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B7A76] text-white text-xs font-semibold rounded-lg hover:bg-[#096A66] transition-colors"
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

import { useNavigate, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { TenantLogo } from '@/components/TenantLogo';
import { useTenantName } from '@/hooks/useTenantName';

export function Landing() {
  const navigate = useNavigate();
  const { name, company } = useTenantName();

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      {/* Portal header */}
      <header className="relative z-10 py-5 px-6 flex items-center justify-between border-b border-[#222222]">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Vantage Infrastructure Group" className="h-7" />
          <span className="text-[9px] tracking-[0.2em] uppercase text-[#888888] hidden sm:inline border-l border-[#222222] pl-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Client Portal
          </span>
        </Link>
        <Link to="/" className="text-xs text-[#888888] hover:text-[#F5F5F0] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          ← Back to Main Site
        </Link>
      </header>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-6">
          <img src="/logo-icon.svg" alt="Vantage" className="w-20 h-20 mx-auto" />
        </div>
        <h1 className="text-4xl md:text-5xl tracking-tight mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
          <span className="text-white font-bold">{name}</span>
        </h1>

        <p className="text-base text-[#888888] max-w-md mb-10 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Access your project dashboard, performance data, and reports.
        </p>

        {/* Dual CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => navigate('/login?redirect=/app')}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#00ff88] text-[#0A0A0A] text-sm font-semibold hover:bg-[#00cc6a] transition-colors duration-200 min-w-[200px] justify-center"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <Icon icon="solar:login-3-bold-duotone" className="w-5 h-5" />
            Engineer Login
          </button>
          <button
            onClick={() => navigate('/login?redirect=/client')}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-transparent text-[#F5F5F0] text-sm font-semibold border border-[#F5F5F0]/20 hover:border-[#00ff88] hover:text-[#00ff88] transition-all duration-200 min-w-[200px] justify-center"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <Icon icon="solar:monitor-bold-duotone" className="w-5 h-5" />
            Client Portal
          </button>
        </div>

        <p className="mt-6 text-sm text-[#888888]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Don't have access? Contact your Vantage project manager.
        </p>
      </div>

      {/* Minimal footer */}
      <footer className="relative z-10 py-6 text-center border-t border-[#222222]">
        <div className="text-xs text-[#888888]/40" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <span>Powered by Vantage Infrastructure Intelligence Platform</span>
          <span className="mx-2">·</span>
          <span>&copy; {new Date().getFullYear()} {company}</span>
        </div>
      </footer>
    </div>
  );
}

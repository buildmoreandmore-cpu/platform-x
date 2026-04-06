import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { useTenantName } from '@/hooks/useTenantName';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useStore(state => state.login);
  const { name, company } = useTenantName();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get('redirect') || '/app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 400));

    const success = await login(email.trim().toLowerCase(), password);
    if (success) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('default_role')
            .eq('id', user.id)
            .single();

          if (profile && profile.default_role === 'Client') {
            navigate('/client', { replace: true });
          } else {
            navigate(redirect, { replace: true });
          }
        } else {
          navigate(redirect, { replace: true });
        }
      } catch (err) {
        navigate(redirect, { replace: true });
      }
    } else {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 hero-gradient-bg">
        <div className="energy-blob energy-blob-1" />
        <div className="energy-blob energy-blob-2" />
        <div className="energy-blob energy-blob-3" />
        <div className="energy-grid" />
      </div>
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-6">
          <img src="/logo-icon.svg" alt="Vantage" className="w-20 h-20 mx-auto" />
        </div>

        <h1 className="text-2xl tracking-tight mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          <span className="text-white font-bold">{name}</span>
        </h1>
        <p className="text-sm text-[#888888] mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>Sign in to continue</p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-xs text-[#888888] mb-1.5 ml-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full px-4 py-3 bg-[#111111] border border-[#222222] text-sm text-white placeholder:text-[#888888]/40 focus:outline-none focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-[#888888] mb-1.5 ml-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full px-4 py-3 bg-[#111111] border border-[#222222] text-sm text-white placeholder:text-[#888888]/40 focus:outline-none focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/20 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20">
              <Icon icon="solar:danger-triangle-bold-duotone" className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-300">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#00ff88] text-[#0A0A0A] text-sm font-semibold hover:bg-[#00cc6a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {loading ? (
              <>
                <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />
                Signing in...
              </>
            ) : (
              <>
                <Icon icon="solar:login-3-bold-duotone" className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-xs text-[#00ff88]/70 hover:text-[#00ff88] transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Forgot password?
          </button>
        </div>

        <Link
          to="/portal"
          className="mt-6 text-xs text-[#888888]/50 hover:text-[#888888] transition-colors"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Back to portal
        </Link>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center border-t border-[#222222]">
        <div className="text-xs text-[#888888]/30" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          &copy; {new Date().getFullYear()} {company}
        </div>
      </footer>
    </div>
  );
}

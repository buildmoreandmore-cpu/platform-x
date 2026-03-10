import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useStore } from '@/store';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useStore(state => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get('redirect') || '/app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Small delay for UX
    await new Promise(r => setTimeout(r, 400));

    const success = await login(email.trim().toLowerCase(), password);
    if (success) {
      navigate(redirect, { replace: true });
    } else {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#041E1D] text-white flex flex-col overflow-hidden">
      {/* Animated background */}
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
          <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-[#0D918C]/20" style={{ animation: 'heroPulse 1.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }} />
          <img src="/logo.webp" alt="2KB Energy" className="relative w-24 h-24 object-contain" />
        </div>

        <h1 className="text-2xl tracking-tight mb-1" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          <span className="text-white font-extrabold">2KB</span>{' '}
          <span className="text-[#37BB26] font-light tracking-[0.15em]">Intelligence</span>
        </h1>
        <p className="text-sm text-white/40 mb-8">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@2kbco.com"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#0D918C]/60 focus:ring-1 focus:ring-[#0D918C]/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#0D918C]/60 focus:ring-1 focus:ring-[#0D918C]/30 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <Icon icon="solar:danger-triangle-bold-duotone" className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-300">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0D918C] text-white text-sm font-semibold rounded-xl hover:bg-[#0B7A76] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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

        <button
          onClick={() => navigate('/')}
          className="mt-6 text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          Back to portal selection
        </button>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <div className="text-xs text-white/20">
          &copy; {new Date().getFullYear()} 2KB Energy Services, LLC
        </div>
      </footer>
    </div>
  );
}

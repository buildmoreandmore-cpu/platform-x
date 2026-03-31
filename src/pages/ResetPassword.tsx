import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { supabase } from '@/lib/supabase';
import { TenantLogo } from '@/components/TenantLogo';

export function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we have the recovery session from the URL hash
    const hashParams = new URLSearchParams(location.hash.slice(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (!accessToken) {
      setError('Invalid or expired reset link. Please request a new one.');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden">
        <div className="absolute inset-0 hero-gradient-bg">
          <div className="energy-blob energy-blob-1" />
          <div className="energy-blob energy-blob-2" />
          <div className="energy-blob energy-blob-3" />
          <div className="energy-grid" />
        </div>
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-primary/20" style={{ animation: 'heroPulse 1.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }} />
            <TenantLogo className="relative w-24 h-24" />
          </div>

          <div className="w-full max-w-sm text-center">
            <div className="mb-6">
              <Icon icon="solar:check-circle-bold-duotone" className="w-16 h-16 text-secondary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Password Updated</h1>
              <p className="text-white/60">
                Your password has been successfully updated.
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-primary text-[#0A0A0A] text-sm font-semibold rounded-xl hover:bg-[#B8972F] transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="solar:login-3-bold-duotone" className="w-4 h-4" />
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden">
      <div className="absolute inset-0 hero-gradient-bg">
        <div className="energy-blob energy-blob-1" />
        <div className="energy-blob energy-blob-2" />
        <div className="energy-blob energy-blob-3" />
        <div className="energy-grid" />
      </div>
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-6">
          <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-primary/20" style={{ animation: 'heroPulse 1.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }} />
          <TenantLogo className="relative w-24 h-24" />
        </div>

        <h1 className="text-2xl tracking-tight mb-1" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Set New Password
        </h1>
        <p className="text-sm text-white/40 mb-8">Enter your new password</p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5 ml-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5 ml-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
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
            className="w-full py-3 bg-primary text-[#0A0A0A] text-sm font-semibold rounded-xl hover:bg-[#B8972F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />
                Updating...
              </>
            ) : (
              <>
                <Icon icon="solar:key-bold-duotone" className="w-4 h-4" />
                Update Password
              </>
            )}
          </button>
        </form>

        <button
          onClick={() => navigate('/login')}
          className="mt-6 text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { supabase } from '@/lib/supabase';
import { getInviteByToken, acceptInvite, type ClientInvite } from '@/lib/clientInvites';
import { TenantLogo } from '@/components/TenantLogo';
import { useStore } from '@/store';
import { useTenantName } from '@/hooks/useTenantName';

export function ClientAccept() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invite, setInvite] = useState<ClientInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const projects = useStore(s => s.projects);
  const { name: tenantName } = useTenantName();
  const token = searchParams.get('token');

  useEffect(() => {
    const loadInvite = async () => {
      if (!token) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }

      try {
        const inviteData = await getInviteByToken(token);
        if (!inviteData) {
          setError('Invite not found or expired');
        } else if (inviteData.status !== 'pending') {
          setError('This invite has already been accepted or expired');
        } else {
          setInvite(inviteData);
          setFormData(prev => ({ ...prev, name: inviteData.client_name }));
        }
      } catch (err) {
        setError('Failed to load invite');
      } finally {
        setLoading(false);
      }
    };

    loadInvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;

    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    try {
      // Create Supabase Auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invite.client_email,
        password: formData.password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setSubmitting(false);
        return;
      }

      if (!authData.user) {
        setError('Failed to create account');
        setSubmitting(false);
        return;
      }

      // Create profile for the client
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          name: formData.name,
          initials: formData.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
          email: invite.client_email,
          default_role: 'Client',
          project_roles: {},
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail the whole process for this
      }

      // Accept the invite
      const acceptResult = await acceptInvite(token!);
      if (!acceptResult.success) {
        setError(acceptResult.error || 'Failed to accept invite');
        setSubmitting(false);
        return;
      }

      // Auto-login the client
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invite.client_email,
        password: formData.password,
      });

      if (signInError) {
        setError('Account created but login failed. Please try logging in manually.');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      // Redirect to client portal after 2 seconds
      setTimeout(() => {
        navigate('/client');
      }, 2000);

    } catch (err) {
      console.error('Accept invite error:', err);
      setError('An error occurred while creating your account');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <Icon icon="svg-spinners:ring-resize" className="w-8 h-8 text-primary mx-auto mb-4" />
          <p className="text-sm text-white/60">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <Icon icon="solar:danger-triangle-bold-duotone" className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid Invite</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-[#0A0A0A] text-sm font-semibold rounded-lg hover:bg-[#00ff88] transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <Icon icon="solar:check-circle-bold-duotone" className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Welcome to {tenantName}!</h1>
          <p className="text-white/60 mb-6">
            Your account has been created successfully. You now have access to the {projects.find(p => p.id === invite?.project_id)?.name} project portal.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-white/40">
            <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />
            Redirecting to your portal...
          </div>
        </div>
      </div>
    );
  }

  const project = projects.find(p => p.id === invite?.project_id);

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient-bg">
        <div className="energy-blob energy-blob-1" />
        <div className="energy-blob energy-blob-2" />
        <div className="energy-blob energy-blob-3" />
        <div className="energy-grid" />
      </div>
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-primary/20" style={{ animation: 'heroPulse 1.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }} />
              <TenantLogo className="relative w-20 h-20 mx-auto" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Client Portal Access</h1>
            <p className="text-sm text-white/60">
              You've been invited to access the <span className="text-secondary font-medium">{project?.name}</span> project portal
            </p>
          </div>

          {/* Form */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5 ml-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5 ml-1">Email</label>
                <input
                  type="email"
                  value={invite?.client_email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white/50"
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5 ml-1">Create Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5 ml-1">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
                  placeholder="Confirm your password"
                  required
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
                disabled={submitting}
                className="w-full py-3 bg-primary text-[#0A0A0A] text-sm font-semibold rounded-xl hover:bg-[#00ff88] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:user-plus-bold" className="w-4 h-4" />
                    Create Account & Access Portal
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <p className="text-xs text-white/40">
                Already have an account? <button onClick={() => navigate('/login')} className="text-secondary hover:text-primary transition-colors">Sign in</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
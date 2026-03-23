import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-dashboard`;
const KEY = import.meta.env.VITE_SUPER_ADMIN_KEY || '';

interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  created_at: string;
  user_count: number;
  project_count: number;
  storage_bytes: number;
}

interface TenantDetail {
  tenant: TenantSummary;
  users: { user_id: string; role: string; created_at: string; name: string; email: string }[];
  projects: { id: string; name: string }[];
  storage_bytes: number;
}

type View = 'list' | 'detail' | 'create';

async function adminFetch(method: string, params?: Record<string, string>, body?: unknown) {
  const url = new URL(EDGE_URL);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Password Gate ──
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === KEY) {
      sessionStorage.setItem('super_admin_auth', 'true');
      onAuth();
    } else {
      setError('Invalid key');
    }
  };

  return (
    <div className="h-screen bg-[#0B1120] text-white flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Icon icon="solar:shield-keyhole-bold-duotone" className="w-6 h-6 text-red-400" />
          </div>
          <h1 className="text-xl font-bold">Super Admin</h1>
          <p className="text-sm text-[#5A6B88] mt-1">Enter admin key to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(''); }}
            placeholder="Admin key"
            autoFocus
            className="w-full px-4 py-3 bg-[#121C35] border border-[#1E2A45] rounded-xl text-sm text-white placeholder:text-[#5A6B88] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
          />
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <Icon icon="solar:danger-triangle-bold-duotone" className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-300">{error}</span>
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors"
          >
            Access Panel
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Panel ──
export function SuperAdmin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('super_admin_auth') === 'true');
  const [view, setView] = useState<View>('list');
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Icon icon="solar:shield-keyhole-bold-duotone" className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Super Admin</h1>
              <p className="text-xs text-[#5A6B88]">Platform-wide tenant management</p>
            </div>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem('super_admin_auth'); setAuthed(false); }}
            className="text-xs text-[#5A6B88] hover:text-red-400 transition-colors"
          >
            Lock Panel
          </button>
        </div>

        {view === 'list' && (
          <TenantListView
            tenants={tenants}
            setTenants={setTenants}
            loading={loading}
            setLoading={setLoading}
            error={error}
            setError={setError}
            onViewDetail={(id) => { setSelectedTenantId(id); setView('detail'); }}
            onCreateNew={() => setView('create')}
          />
        )}
        {view === 'detail' && selectedTenantId && (
          <TenantDetailView
            tenantId={selectedTenantId}
            onBack={() => { setView('list'); setSelectedTenantId(null); }}
            onDeleted={(id) => {
              setTenants(prev => prev.filter(t => t.id !== id));
              setView('list');
              setSelectedTenantId(null);
            }}
          />
        )}
        {view === 'create' && (
          <CreateTenantView
            onBack={() => setView('list')}
            onCreated={() => {
              setView('list');
              setLoading(true); // triggers refetch
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── Stat Cards ──
function StatCards({ tenants }: { tenants: TenantSummary[] }) {
  const stats = [
    { label: 'Total Tenants', value: tenants.length, icon: 'solar:buildings-bold-duotone', color: 'text-blue-400' },
    { label: 'Active Tenants', value: tenants.filter(t => t.is_active).length, icon: 'solar:check-circle-bold-duotone', color: 'text-green-400' },
    { label: 'Total Users', value: tenants.reduce((s, t) => s + t.user_count, 0), icon: 'solar:users-group-rounded-bold-duotone', color: 'text-purple-400' },
    { label: 'Total Projects', value: tenants.reduce((s, t) => s + t.project_count, 0), icon: 'solar:folder-bold-duotone', color: 'text-amber-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map(s => (
        <div key={s.label} className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Icon icon={s.icon} className={`w-5 h-5 ${s.color}`} />
            <span className="text-xs text-[#5A6B88] uppercase tracking-wider">{s.label}</span>
          </div>
          <p className="text-2xl font-bold text-white">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Tenant List View ──
function TenantListView({
  tenants, setTenants, loading, setLoading, error, setError,
  onViewDetail, onCreateNew,
}: {
  tenants: TenantSummary[];
  setTenants: React.Dispatch<React.SetStateAction<TenantSummary[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  onViewDetail: (id: string) => void;
  onCreateNew: () => void;
}) {
  const [toggleError, setToggleError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) return;
    adminFetch('GET')
      .then(data => { setTenants(data.tenants || []); setError(''); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [loading]);

  const handleToggle = async (tenant: TenantSummary) => {
    const prev = tenant.is_active;
    setTenants(ts => ts.map(t => t.id === tenant.id ? { ...t, is_active: !prev } : t));
    setToggleError(null);
    try {
      await adminFetch('PATCH', undefined, { tenant_id: tenant.id, is_active: !prev });
    } catch (e: any) {
      setTenants(ts => ts.map(t => t.id === tenant.id ? { ...t, is_active: prev } : t));
      setToggleError(e.message);
      setTimeout(() => setToggleError(null), 3000);
    }
  };

  return (
    <>
      <StatCards tenants={tenants} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">All Tenants</h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
        >
          <Icon icon="solar:add-circle-bold" className="w-4 h-4" />
          Create Tenant
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <Icon icon="solar:danger-triangle-bold-duotone" className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {toggleError && (
        <div className="flex items-center gap-2 px-4 py-2 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <span className="text-xs text-amber-300">{toggleError}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Icon icon="svg-spinners:ring-resize" className="w-8 h-8 text-[#5A6B88]" />
        </div>
      ) : (
        <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E2A45]">
                  {['Name', 'Slug', 'Plan', 'Status', 'Users', 'Projects', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-medium text-[#5A6B88] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t.id} className="border-b border-[#1E2A45]/50 hover:bg-[#0F1829] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {t.logo_url && <img src={t.logo_url} className="w-6 h-6 rounded object-contain" alt="" />}
                        <span className="text-sm font-medium text-white">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#7A8BA8] font-mono">{t.slug}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                        t.plan === 'paid'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleToggle(t)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${t.is_active ? 'bg-green-500' : 'bg-[#1E2A45]'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${t.is_active ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-5 py-3 text-sm text-[#7A8BA8] font-mono">{t.user_count}</td>
                    <td className="px-5 py-3 text-sm text-[#7A8BA8] font-mono">{t.project_count}</td>
                    <td className="px-5 py-3 text-xs text-[#5A6B88]">
                      {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => onViewDetail(t.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-[#5A6B88]">
                      No tenants yet. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ── Tenant Detail View ──
function TenantDetailView({
  tenantId, onBack, onDeleted,
}: {
  tenantId: string;
  onBack: () => void;
  onDeleted: (id: string) => void;
}) {
  const [detail, setDetail] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteSlug, setDeleteSlug] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    adminFetch('GET', { tenant_id: tenantId })
      .then(data => setDetail(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenantId]);

  const handleDelete = async () => {
    if (!detail) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await adminFetch('DELETE', undefined, { tenant_id: tenantId, confirm_slug: deleteSlug });
      onDeleted(tenantId);
    } catch (e: any) {
      setDeleteError(e.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon icon="svg-spinners:ring-resize" className="w-8 h-8 text-[#5A6B88]" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div>
        <button onClick={onBack} className="text-xs text-[#5A6B88] hover:text-white mb-4 flex items-center gap-1">
          <Icon icon="solar:arrow-left-bold" className="w-3.5 h-3.5" /> Back
        </button>
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300">
          {error || 'Failed to load tenant'}
        </div>
      </div>
    );
  }

  const t = detail.tenant;

  return (
    <div>
      <button onClick={onBack} className="text-xs text-[#5A6B88] hover:text-white mb-6 flex items-center gap-1">
        <Icon icon="solar:arrow-left-bold" className="w-3.5 h-3.5" /> Back to list
      </button>

      <div className="space-y-6">
        {/* Tenant Info */}
        <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Tenant Info</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[10px] text-[#5A6B88] uppercase tracking-wider mb-1">Name</p>
              <p className="text-white font-medium">{t.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#5A6B88] uppercase tracking-wider mb-1">Slug</p>
              <p className="text-[#7A8BA8] font-mono">{t.slug}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#5A6B88] uppercase tracking-wider mb-1">Plan</p>
              <p className="text-[#7A8BA8]">{t.plan}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#5A6B88] uppercase tracking-wider mb-1">Status</p>
              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                t.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {t.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-[#5A6B88] uppercase tracking-wider mb-1">Colors</p>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded" style={{ backgroundColor: t.primary_color }} />
                <span className="w-4 h-4 rounded" style={{ backgroundColor: t.secondary_color }} />
                <span className="text-[#5A6B88] text-xs font-mono">{t.primary_color} / {t.secondary_color}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-[#5A6B88] uppercase tracking-wider mb-1">Storage</p>
              <p className="text-[#7A8BA8]">{formatBytes(detail.storage_bytes)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#5A6B88] uppercase tracking-wider mb-1">Created</p>
              <p className="text-[#7A8BA8]">{new Date(t.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            {t.logo_url && (
              <div>
                <p className="text-[10px] text-[#5A6B88] uppercase tracking-wider mb-1">Logo</p>
                <img src={t.logo_url} alt="Logo" className="w-10 h-10 rounded object-contain bg-white/5" />
              </div>
            )}
          </div>
        </div>

        {/* Users */}
        <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E2A45] flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Users ({detail.users.length})</h2>
          </div>
          {detail.users.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-[#5A6B88]">No users</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1E2A45]">
                    {['Name', 'Email', 'Role', 'Joined'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-medium text-[#5A6B88] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.users.map(u => (
                    <tr key={u.user_id} className="border-b border-[#1E2A45]/50">
                      <td className="px-5 py-3 text-sm text-white">{u.name}</td>
                      <td className="px-5 py-3 text-sm text-[#7A8BA8]">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[#5A6B88]">
                        {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-3">Projects ({detail.projects.length})</h2>
          {detail.projects.length === 0 ? (
            <p className="text-sm text-[#5A6B88]">No projects</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {detail.projects.map(p => (
                <span key={p.id} className="inline-flex px-3 py-1 rounded-lg text-xs font-medium bg-[#0F1829] border border-[#1E2A45] text-[#7A8BA8]">
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-[#121C35] border border-red-500/20 rounded-xl p-6">
          <h2 className="text-base font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-xs text-[#5A6B88] mb-4">
            Permanently delete this tenant and all associated data. This cannot be undone.
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-[#5A6B88] mb-1.5">
                Type <span className="font-mono text-red-400">{t.slug}</span> to confirm
              </label>
              <input
                type="text"
                value={deleteSlug}
                onChange={e => { setDeleteSlug(e.target.value); setDeleteError(''); }}
                placeholder={t.slug}
                className="w-full px-3 py-2 bg-[#0F1829] border border-red-500/20 rounded-lg text-sm text-white font-mono placeholder:text-[#5A6B88] focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>
            <button
              onClick={handleDelete}
              disabled={deleteSlug !== t.slug || deleting}
              className="px-4 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {deleting ? (
                <><Icon icon="svg-spinners:ring-resize" className="w-3.5 h-3.5" /> Deleting...</>
              ) : (
                <><Icon icon="solar:trash-bin-trash-bold" className="w-3.5 h-3.5" /> Delete Tenant</>
              )}
            </button>
          </div>
          {deleteError && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <Icon icon="solar:danger-triangle-bold-duotone" className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-300">{deleteError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Create Tenant View ──
function CreateTenantView({
  onBack, onCreated,
}: {
  onBack: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [plan, setPlan] = useState('trial');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [inviteNote, setInviteNote] = useState('');

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setCreating(true);
    setError('');
    setInviteNote('');

    try {
      const data = await adminFetch('POST', undefined, {
        name: name.trim(),
        slug: slug.trim(),
        plan,
        ownerEmail: ownerEmail.trim() || undefined,
      });

      // Send invite email if owner email provided
      if (data.needsOwnerInvite && ownerEmail.trim()) {
        try {
          await fetch('/api/send-invite-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientEmail: ownerEmail.trim(),
              clientName: name.trim(),
              projectName: name.trim(),
              inviteToken: 'PENDING',
              invitedBy: 'Platform Admin',
            }),
          });
          setInviteNote('Tenant created. An invite email has been sent. The owner should use "Forgot Password" to set their initial password.');
        } catch {
          setInviteNote('Tenant created but invite email failed to send. The owner can use "Forgot Password" to get started.');
        }
        // Show note briefly then navigate
        setTimeout(() => onCreated(), 3000);
      } else {
        onCreated();
      }
    } catch (e: any) {
      setError(e.message);
      setCreating(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="text-xs text-[#5A6B88] hover:text-white mb-6 flex items-center gap-1">
        <Icon icon="solar:arrow-left-bold" className="w-3.5 h-3.5" /> Back to list
      </button>

      <div className="max-w-lg">
        <h2 className="text-lg font-bold text-white mb-6">Create New Tenant</h2>

        {inviteNote && (
          <div className="flex items-start gap-2 px-4 py-3 mb-6 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Icon icon="solar:check-circle-bold-duotone" className="w-4 h-4 text-green-400 mt-0.5" />
            <span className="text-sm text-green-300">{inviteNote}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-[#5A6B88] mb-1.5">Company Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Acme Energy Services"
              required
              className="w-full px-4 py-3 bg-[#121C35] border border-[#1E2A45] rounded-xl text-sm text-white placeholder:text-[#5A6B88] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs text-[#5A6B88] mb-1.5">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugEdited(true); }}
              placeholder="acme-energy-services"
              required
              className="w-full px-4 py-3 bg-[#121C35] border border-[#1E2A45] rounded-xl text-sm text-white font-mono placeholder:text-[#5A6B88] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
            />
            <p className="text-[10px] text-[#5A6B88] mt-1">URL-safe identifier. Must be unique.</p>
          </div>

          <div>
            <label className="block text-xs text-[#5A6B88] mb-1.5">Plan</label>
            <select
              value={plan}
              onChange={e => setPlan(e.target.value)}
              className="w-full px-4 py-3 bg-[#121C35] border border-[#1E2A45] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
            >
              <option value="trial">Trial</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#5A6B88] mb-1.5">Owner Email (optional)</label>
            <input
              type="email"
              value={ownerEmail}
              onChange={e => setOwnerEmail(e.target.value)}
              placeholder="owner@company.com"
              className="w-full px-4 py-3 bg-[#121C35] border border-[#1E2A45] rounded-xl text-sm text-white placeholder:text-[#5A6B88] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
            />
            <p className="text-[10px] text-[#5A6B88] mt-1">If provided, an invite email will be sent after creation.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <Icon icon="solar:danger-triangle-bold-duotone" className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-300">{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={creating || !name.trim() || !slug.trim()}
              className="px-6 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {creating ? (
                <><Icon icon="svg-spinners:ring-resize" className="w-4 h-4" /> Creating...</>
              ) : (
                <><Icon icon="solar:add-circle-bold" className="w-4 h-4" /> Create Tenant</>
              )}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-[#5A6B88] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

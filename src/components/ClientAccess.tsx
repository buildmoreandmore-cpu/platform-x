import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useStore } from '@/store';
import {
  getProjectInvites,
  createClientInvite,
  resendInvite,
  revokeInvite,
  type ClientInvite,
} from '@/lib/clientInvites';

interface ClientAccessProps {
  projectId: string;
}

export function ClientAccess({ projectId }: ClientAccessProps) {
  const [invites, setInvites] = useState<ClientInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const currentUserId = useStore(s => s.currentUserId);
  const users = useStore(s => s.users);
  const projects = useStore(s => s.projects);

  const currentUser = users.find(u => u.id === currentUserId);
  const project = projects.find(p => p.id === projectId);

  const loadInvites = async () => {
    setLoading(true);
    const projectInvites = await getProjectInvites(projectId);
    setInvites(projectInvites);
    setLoading(false);
  };

  useEffect(() => {
    loadInvites();
  }, [projectId]);

  const handleInviteClient = async (clientName: string, clientEmail: string) => {
    if (!currentUser) return;

    setActionLoading('invite');
    const result = await createClientInvite({
      projectId,
      clientName,
      clientEmail,
      invitedBy: currentUser.name,
    });

    if (result.success && result.invite) {
      // Send invite email
      try {
        await fetch('/api/send-invite-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName,
            clientEmail,
            projectName: project?.name || projectId,
            inviteToken: result.invite.invite_token,
            invitedBy: currentUser.name,
          }),
        });
      } catch (err) {
        console.error('Failed to send invite email:', err);
      }
      setShowInviteModal(false);
      loadInvites();
    } else {
      alert(result.error || 'Failed to send invite');
    }
    setActionLoading(null);
  };

  const handleResendInvite = async (inviteId: string) => {
    setActionLoading(inviteId);
    const invite = invites.find(i => i.id === inviteId);
    const result = await resendInvite(inviteId);
    if (result.success && invite) {
      // Re-send the email
      try {
        await fetch('/api/send-invite-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: invite.client_name,
            clientEmail: invite.client_email,
            projectName: project?.name || projectId,
            inviteToken: invite.invite_token,
            invitedBy: currentUser?.name || invite.invited_by,
          }),
        });
      } catch (err) {
        console.error('Failed to resend invite email:', err);
      }
      loadInvites();
    } else {
      alert(result.error || 'Failed to resend invite');
    }
    setActionLoading(null);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this client\'s access?')) return;
    
    setActionLoading(inviteId);
    const result = await revokeInvite(inviteId);
    if (result.success) {
      loadInvites();
    } else {
      alert(result.error || 'Failed to revoke invite');
    }
    setActionLoading(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'expired':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-[#1E2A45] text-[#7A8BA8] border-[#2A3A5C]';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <Icon icon="svg-spinners:ring-resize" className="w-8 h-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Client Access</h2>
          <p className="text-sm text-[#7A8BA8] mt-1">
            Manage client portal access for {project?.name}
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-[#0B7A76] transition-colors"
        >
          <Icon icon="solar:user-plus-bold" className="w-4 h-4" />
          Invite Client
        </button>
      </div>

      {/* Client Invites Table */}
      <div className="bg-[#121C35] border border-[#1E2A45] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E2A45]">
          <h3 className="text-sm font-semibold text-white">Client Invitations</h3>
        </div>

        {invites.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Icon icon="solar:users-group-two-rounded-bold-duotone" className="w-12 h-12 text-[#5A6B88] mx-auto mb-3" />
            <p className="text-sm text-[#7A8BA8]">No clients have been invited yet</p>
            <p className="text-xs text-[#5A6B88] mt-1">Invite clients to give them access to the project portal</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0F1829] border-b border-[#1E2A45]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#5A6B88] uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#5A6B88] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#5A6B88] uppercase tracking-wider">
                    Invited
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#5A6B88] uppercase tracking-wider">
                    Accepted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#5A6B88] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2A45]">
                {invites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-[#1A2544] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 mr-3">
                          <span className="text-xs font-semibold text-secondary">
                            {invite.client_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{invite.client_name}</div>
                          <div className="text-xs text-[#7A8BA8]">{invite.client_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invite.status)}`}>
                        {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#7A8BA8]">{formatDate(invite.created_at)}</div>
                      <div className="text-xs text-[#5A6B88]">by {invite.invited_by}</div>
                    </td>
                    <td className="px-6 py-4">
                      {invite.accepted_at ? (
                        <div className="text-sm text-[#7A8BA8]">{formatDate(invite.accepted_at)}</div>
                      ) : (
                        <div className="text-sm text-[#5A6B88]">—</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {invite.status === 'pending' && (
                          <button
                            onClick={() => handleResendInvite(invite.id)}
                            disabled={actionLoading === invite.id}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-secondary hover:text-primary border border-secondary/30 hover:border-primary/50 rounded transition-colors disabled:opacity-50"
                          >
                            {actionLoading === invite.id ? (
                              <Icon icon="svg-spinners:ring-resize" className="w-3 h-3 mr-1" />
                            ) : (
                              <Icon icon="solar:restart-bold" className="w-3 h-3 mr-1" />
                            )}
                            Resend
                          </button>
                        )}
                        {invite.status !== 'expired' && (
                          <button
                            onClick={() => handleRevokeInvite(invite.id)}
                            disabled={actionLoading === invite.id}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-300/50 rounded transition-colors disabled:opacity-50"
                          >
                            {actionLoading === invite.id ? (
                              <Icon icon="svg-spinners:ring-resize" className="w-3 h-3 mr-1" />
                            ) : (
                              <Icon icon="solar:trash-bin-minimalistic-bold" className="w-3 h-3 mr-1" />
                            )}
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteClientModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteClient}
          loading={actionLoading === 'invite'}
        />
      )}
    </div>
  );
}

interface InviteClientModalProps {
  onClose: () => void;
  onInvite: (name: string, email: string) => void;
  loading: boolean;
}

function InviteClientModal({ onClose, onInvite, loading }: InviteClientModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientName.trim() && clientEmail.trim()) {
      onInvite(clientName.trim(), clientEmail.trim().toLowerCase());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-[#1E2A45]">
          <h3 className="text-lg font-semibold text-white">Invite Client</h3>
          <p className="text-sm text-[#7A8BA8] mt-1">
            Send an invitation to access the client portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Client Name
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-white placeholder-[#5A6B88] focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-white placeholder-[#5A6B88] focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
              placeholder="john@company.com"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#7A8BA8] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-[#0B7A76] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />
                  Sending...
                </>
              ) : (
                <>
                  <Icon icon="solar:letter-bold" className="w-4 h-4" />
                  Send Invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
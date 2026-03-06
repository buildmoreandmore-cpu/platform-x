import { useState } from 'react';
import { useStore, UserRole } from '@/store';
import { UserRoleBadge } from '@/components/UserRoleBadge';
import { cn } from '@/lib/utils';
import {
  Settings as SettingsIcon,
  User,
  Users,
  Database,
  Plug,
  Bell,
  ChevronRight,
  Search,
  Filter,
  HardDrive,
  Cloud,
  Calendar,
  MessageSquare,
  Mail,
  BellRing,
  CalendarDays,
  Download,
  Upload,
  History,
} from 'lucide-react';
import { Icon } from '@iconify/react';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'data', label: 'Data Management', icon: Database },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'notifications', label: 'Notifications', icon: Bell },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const currentUserId = useStore(s => s.currentUserId);
  const users = useStore(s => s.users);
  const projects = useStore(s => s.projects);
  const setCurrentUser = useStore(s => s.setCurrentUser);
  const auditTrail = useStore(s => s.auditTrail);
  const importHistory = useStore(s => s.importHistory);
  const exportHistory = useStore(s => s.exportHistory);
  const notificationPreferences = useStore(s => s.notificationPreferences);
  const toggleNotificationPreference = useStore(s => s.toggleNotificationPreference);

  const currentUser = users.find(u => u.id === currentUserId);
  const currentRole = currentUser?.defaultRole || 'Engineer';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#1E2A45] bg-[#121C35] px-3 md:px-8 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
            <p className="text-sm text-[#7A8BA8] mt-1">Manage your account, users, data, and integrations.</p>
          </div>
        </div>

        <div className="flex space-x-6 border-b border-[#1E2A45] overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-[#0D918C] text-white'
                  : 'border-transparent text-[#7A8BA8] hover:text-white hover:border-[#2A3A5C]'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-8">
        {activeTab === 'profile' && (
          <ProfileTab
            currentUser={currentUser!}
            users={users}
            onSwitchUser={setCurrentUser}
          />
        )}
        {activeTab === 'users' && (
          <UserManagementTab
            currentRole={currentRole}
            users={users}
            projects={projects}
          />
        )}
        {activeTab === 'data' && (
          <DataManagementTab
            importHistory={importHistory}
            exportHistory={exportHistory}
            auditTrail={auditTrail}
          />
        )}
        {activeTab === 'integrations' && <IntegrationsTab />}
        {activeTab === 'notifications' && (
          <NotificationsTab
            preferences={notificationPreferences}
            onToggle={toggleNotificationPreference}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Profile Tab ─── */
function ProfileTab({
  currentUser,
  users,
  onSwitchUser,
}: {
  currentUser: typeof useStore extends (s: infer S) => any ? never : any;
  users: any[];
  onSwitchUser: (userId: string) => void;
}) {
  if (!currentUser) return null;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Current User Card */}
      <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Your Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#0D918C]/15 border border-[#0D918C]/25 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-semibold text-[#37BB26]">{currentUser.initials}</span>
          </div>
          <div className="flex-1">
            <p className="text-lg font-medium text-white">{currentUser.name}</p>
            <p className="text-sm text-[#7A8BA8]">{currentUser.email}</p>
            <div className="mt-2">
              <UserRoleBadge role={currentUser.defaultRole} />
            </div>
          </div>
        </div>

        {/* Project Roles */}
        {Object.keys(currentUser.projectRoles).length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#1E2A45]">
            <p className="text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-2">Project Role Overrides</p>
            <div className="space-y-1.5">
              {Object.entries(currentUser.projectRoles).map(([pid, role]) => (
                <div key={pid} className="flex items-center justify-between text-sm">
                  <span className="text-[#9AA5B8]">Project {pid}</span>
                  <UserRoleBadge role={role as UserRole} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Switcher (simulates auth) */}
      <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-2">Switch User</h2>
        <p className="text-xs text-[#7A8BA8] mb-4">Simulate different user roles for demonstration purposes.</p>
        <div className="space-y-2">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => onSwitchUser(user.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors',
                user.id === currentUser.id
                  ? 'bg-[#0D918C]/10 border-[#0D918C]/25'
                  : 'bg-[#0F1829] border-[#1E2A45] hover:bg-[#1E2A45]'
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border',
                user.id === currentUser.id
                  ? 'bg-[#0D918C]/15 border-[#0D918C]/25'
                  : 'bg-[#1E2A45] border-[#2A3A5C]'
              )}>
                <span className={cn(
                  'text-xs font-semibold',
                  user.id === currentUser.id ? 'text-[#37BB26]' : 'text-[#7A8BA8]'
                )}>
                  {user.initials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', user.id === currentUser.id ? 'text-white' : 'text-[#CBD2DF]')}>
                  {user.name}
                </p>
                <p className="text-xs text-[#5A6B88] truncate">{user.email}</p>
              </div>
              <UserRoleBadge role={user.defaultRole} />
              {user.id === currentUser.id && (
                <span className="w-2 h-2 rounded-full bg-[#0D918C] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── User Management Tab ─── */
function UserManagementTab({
  currentRole,
  users,
  projects,
}: {
  currentRole: UserRole;
  users: any[];
  projects: any[];
}) {
  if (currentRole !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-[#1E2A45] flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-[#5A6B88]" />
        </div>
        <h3 className="text-lg font-medium text-white mb-1">Admin Access Required</h3>
        <p className="text-sm text-[#7A8BA8]">Only administrators can manage users and project assignments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Users Table */}
      <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E2A45]">
          <h2 className="text-base font-semibold text-white">Team Members</h2>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1E2A45]">
              <th className="text-left px-6 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">User</th>
              <th className="text-left px-6 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">Default Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-[#1E2A45]/50 hover:bg-[#0F1829] transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0D918C]/15 border border-[#0D918C]/25 flex items-center justify-center">
                      <span className="text-xs font-semibold text-[#37BB26]">{user.initials}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-sm text-[#9AA5B8]">{user.email}</td>
                <td className="px-6 py-3"><UserRoleBadge role={user.defaultRole} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Project Assignment Matrix */}
      <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E2A45]">
          <h2 className="text-base font-semibold text-white">Project Assignments</h2>
          <p className="text-xs text-[#7A8BA8] mt-1">Role overrides per project. Empty cells inherit the default role.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E2A45]">
                <th className="text-left px-6 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">User</th>
                {projects.map(p => (
                  <th key={p.id} className="text-center px-4 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">{p.name.split(' ').slice(0, 2).join(' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-[#1E2A45]/50 hover:bg-[#0F1829] transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-white">{user.name}</td>
                  {projects.map(p => {
                    const role = user.projectRoles[p.id];
                    return (
                      <td key={p.id} className="px-4 py-3 text-center">
                        {role ? <UserRoleBadge role={role} /> : (
                          <span className="text-[10px] text-[#5A6B88]">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Data Management Tab ─── */
function DataManagementTab({
  importHistory,
  exportHistory,
  auditTrail,
}: {
  importHistory: any[];
  exportHistory: any[];
  auditTrail: any[];
}) {
  const [auditFilter, setAuditFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');

  const entityTypes = ['All', ...new Set(auditTrail.map(e => e.entityType))];
  const filteredAudit = auditTrail.filter(e => {
    if (entityFilter !== 'All' && e.entityType !== entityFilter) return false;
    if (auditFilter && !e.field.toLowerCase().includes(auditFilter.toLowerCase()) && !e.userName.toLowerCase().includes(auditFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Import History */}
      <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E2A45] flex items-center gap-2">
          <Download className="w-4 h-4 text-[#37BB26]" />
          <h2 className="text-base font-semibold text-white">Import History</h2>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1E2A45]">
              <th className="text-left px-6 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">Type</th>
              <th className="text-left px-6 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">Source</th>
              <th className="text-left px-6 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">Date</th>
              <th className="text-left px-6 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">Records</th>
              <th className="text-left px-6 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">User</th>
            </tr>
          </thead>
          <tbody>
            {importHistory.map(imp => (
              <tr key={imp.id} className="border-b border-[#1E2A45]/50 hover:bg-[#0F1829] transition-colors">
                <td className="px-6 py-3 text-sm text-white font-medium">{imp.type}</td>
                <td className="px-6 py-3 text-sm text-[#9AA5B8]">{imp.source}</td>
                <td className="px-6 py-3 text-sm text-[#9AA5B8] font-mono text-xs">
                  {new Date(imp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-6 py-3 text-sm text-[#9AA5B8] font-mono">{imp.records}</td>
                <td className="px-6 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0D918C]/10 text-[#37BB26] border border-[#0D918C]/20">
                    {imp.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-[#9AA5B8]">{imp.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Export History */}
      <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E2A45] flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-400" />
          <h2 className="text-base font-semibold text-white">Export History</h2>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1E2A45]">
              <th className="text-left px-6 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">Type</th>
              <th className="text-left px-6 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">Format</th>
              <th className="text-left px-6 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">Date</th>
              <th className="text-left px-6 py-3 text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">User</th>
            </tr>
          </thead>
          <tbody>
            {exportHistory.map(exp => (
              <tr key={exp.id} className="border-b border-[#1E2A45]/50 hover:bg-[#0F1829] transition-colors">
                <td className="px-6 py-3 text-sm text-white font-medium">{exp.type}</td>
                <td className="px-6 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {exp.format}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-[#9AA5B8] font-mono text-xs">
                  {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-6 py-3 text-sm text-[#9AA5B8]">{exp.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Global Audit Log */}
      <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E2A45]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-semibold text-white">Global Audit Log</h2>
              <span className="bg-[#1E2A45] text-[#7A8BA8] px-2 py-0.5 rounded border border-[#2A3A5C] font-mono text-[10px]">
                {auditTrail.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5A6B88]" />
                <input
                  value={auditFilter}
                  onChange={e => setAuditFilter(e.target.value)}
                  placeholder="Search..."
                  className="bg-[#0F1829] border border-[#1E2A45] text-white text-xs rounded-lg pl-8 pr-3 py-1.5 w-40 focus:outline-none focus:ring-2 focus:ring-[#0D918C] focus:border-transparent placeholder-[#5A6B88]"
                />
              </div>
              <select
                value={entityFilter}
                onChange={e => setEntityFilter(e.target.value)}
                className="bg-[#0F1829] border border-[#1E2A45] text-[#CBD2DF] text-xs rounded-lg px-2 py-1.5 focus:ring-[#0D918C] focus:border-[#0D918C]"
              >
                {entityTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredAudit.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <History className="w-8 h-8 text-[#5A6B88] mx-auto mb-2" />
            <p className="text-sm text-[#7A8BA8]">
              {auditTrail.length === 0 ? 'No edits have been recorded yet.' : 'No matching audit entries.'}
            </p>
            <p className="text-xs text-[#5A6B88] mt-1">Edit any field to see the audit trail here.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {filteredAudit.map(entry => (
              <div key={entry.id} className="px-6 py-3 border-b border-[#1E2A45]/50 hover:bg-[#0F1829] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{entry.userName}</span>
                    <span className="bg-[#1E2A45] text-[#7A8BA8] px-1.5 py-0.5 rounded border border-[#2A3A5C] text-[10px]">
                      {entry.entityType}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#5A6B88] font-mono">
                    {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[#9AA5B8]">
                  Changed <span className="font-medium text-[#CBD2DF]">{entry.field}</span>{' '}
                  from <span className="font-mono text-red-400">{entry.oldValue || '(empty)'}</span>{' '}
                  to <span className="font-mono text-[#37BB26]">{entry.newValue || '(empty)'}</span>
                </p>
                {entry.reason && (
                  <p className="text-[10px] text-[#5A6B88] italic mt-1">"{entry.reason}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Integrations Tab ─── */
const integrations = [
  {
    name: 'Google Drive',
    description: 'Import utility bills and reports directly from Google Drive shared folders.',
    icon: 'logos:google-drive',
    status: 'Coming Soon',
  },
  {
    name: 'ENERGY STAR Portfolio Manager',
    description: 'Sync building benchmarks and energy ratings with ENERGY STAR.',
    icon: 'mdi:leaf',
    status: 'Coming Soon',
  },
  {
    name: 'Google Calendar',
    description: 'Sync project milestones and deadlines to Google Calendar.',
    icon: 'logos:google-calendar',
    status: 'Coming Soon',
  },
  {
    name: 'Slack',
    description: 'Get real-time notifications for approvals, edits, and milestone changes.',
    icon: 'logos:slack-icon',
    status: 'Coming Soon',
  },
];

function IntegrationsTab() {
  return (
    <div className="max-w-3xl">
      <div className="grid grid-cols-2 gap-4">
        {integrations.map(integ => (
          <div
            key={integ.name}
            className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6 flex flex-col items-start"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#0F1829] border border-[#1E2A45] flex items-center justify-center">
                <Icon icon={integ.icon} className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{integ.name}</p>
              </div>
            </div>
            <p className="text-xs text-[#7A8BA8] mb-4 flex-1">{integ.description}</p>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#1E2A45] text-[#7A8BA8] border border-[#2A3A5C] uppercase tracking-wider">
              {integ.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Notifications Tab ─── */
function NotificationsTab({
  preferences,
  onToggle,
}: {
  preferences: { email: boolean; inApp: boolean; calendar: boolean };
  onToggle: (channel: 'email' | 'inApp' | 'calendar') => void;
}) {
  const channels = [
    { key: 'email' as const, label: 'Email Notifications', description: 'Receive email alerts for approvals, edits, and deadline reminders.', icon: Mail },
    { key: 'inApp' as const, label: 'In-App Notifications', description: 'Show notification badges and alerts within the platform.', icon: BellRing },
    { key: 'calendar' as const, label: 'Calendar Sync', description: 'Automatically add milestones and deadlines to your calendar.', icon: CalendarDays },
  ];

  return (
    <div className="max-w-2xl space-y-3">
      {channels.map(ch => (
        <div
          key={ch.key}
          className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-[#0F1829] border border-[#1E2A45] flex items-center justify-center flex-shrink-0">
            <ch.icon className="w-5 h-5 text-[#7A8BA8]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{ch.label}</p>
            <p className="text-xs text-[#7A8BA8] mt-0.5">{ch.description}</p>
          </div>
          <button
            onClick={() => onToggle(ch.key)}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors flex-shrink-0',
              preferences[ch.key] ? 'bg-[#0D918C]' : 'bg-[#1E2A45]'
            )}
          >
            <span
              className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm',
                preferences[ch.key] ? 'left-6' : 'left-1'
              )}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

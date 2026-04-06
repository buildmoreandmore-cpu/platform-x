import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { TenantLogo } from '@/components/TenantLogo';
import { useTenantName } from '@/hooks/useTenantName';
import {
  LayoutDashboard,
  Camera,
  BarChart3,
  FileText,
  BookOpen,
  Zap,
  FolderOpen,
  Layers,
  CalendarRange,
  Settings,
  AlertTriangle,
  ChevronUp,
  LogOut,
  UserCog,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore, ServiceLineMode } from '@/store';
import { AIAssistant } from './AIAssistant';
import { getFreshnessStatus } from '@/lib/freshness';
import { ProjectFileImport } from './ProjectFileImport';
import { ToastContainer } from './ToastContainer';
import { ConfirmDialog } from './ConfirmDialog';
import { CommandPalette } from './CommandPalette';
import { Breadcrumbs } from './Breadcrumbs';

const allNavigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard, modes: ['Full', 'OR'], badgeKey: null as string | null, freshnessModule: null as string | null },
  { name: 'Projects', href: '/app/projects', icon: FolderOpen, modes: ['Full', 'Audit', 'OR', 'Construction'], badgeKey: 'projects', freshnessModule: null },
  { name: 'All Assets', href: '/app/assets', icon: Camera, modes: ['Full', 'Audit', 'Construction'], badgeKey: 'assets', freshnessModule: 'Assets' },
  { name: 'Benchmarking', href: '/app/benchmarking', icon: BarChart3, modes: ['Full', 'Audit', 'OR'], badgeKey: null, freshnessModule: 'Utility Bills' },
  { name: 'Reports', href: '/app/reporting', icon: FileText, modes: ['Full', 'Audit', 'OR', 'Construction'], badgeKey: 'reports', freshnessModule: null },
  { name: 'Knowledge Base', href: '/app/knowledge', icon: BookOpen, modes: ['Full', 'Audit'], badgeKey: null, freshnessModule: null },
  { name: 'Schedule', href: '/app/timeline', icon: CalendarRange, modes: ['Full', 'Audit', 'Construction'], badgeKey: null, freshnessModule: null },
  { name: 'Tasks & Workflow', href: '/app/workflows', icon: Zap, modes: ['Full', 'Audit', 'OR', 'Construction'], badgeKey: 'tasks', freshnessModule: null },
  { name: 'Technical Drawings', href: '/app/drawings', icon: Layers, modes: ['Full', 'Audit', 'Construction'], badgeKey: null, freshnessModule: null },
];

const modeLabels: Record<ServiceLineMode, string> = {
  Full: 'Full Platform',
  Audit: 'Energy Audit',
  OR: "Owner's Rep",
  Construction: 'Construction Mgt',
};

const modeLabelsShort: Record<ServiceLineMode, string> = {
  Full: 'Full',
  Audit: 'Audit',
  OR: "OR",
  Construction: 'Constr.',
};

export function Layout() {
  const navigate = useNavigate();
  const { name: tenantName } = useTenantName();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showProjectImport = useStore(state => state.showProjectImport);
  const setShowProjectImport = useStore(state => state.setShowProjectImport);
  const mode = useStore(state => state.serviceLineMode);
  const logout = useStore(state => state.logout);
  const setMode = useStore(state => state.setServiceLineMode);
  const projects = useStore(state => state.projects);
  const assets = useStore(state => state.assets);
  const reports = useStore(state => state.reports);
  const tasks = useStore(state => state.tasks);
  const milestones = useStore(state => state.milestones);
  const contractObligations = useStore(state => state.contractObligations);
  const currentUserId = useStore(state => state.currentUserId);
  const users = useStore(state => state.users);
  const setCurrentUser = useStore(state => state.setCurrentUser);

  const currentUser = users.find(u => u.id === currentUserId);
  const moduleLastUpdated = useStore(state => state.moduleLastUpdated);
  const freshnessConfig = useStore(state => state.freshnessConfig);

  const navigation = allNavigation.filter(item => item.modes.includes(mode));

  const getWorstFreshness = (module: string): 'fresh' | 'amber' | 'red' => {
    const config = freshnessConfig.find(c => c.module === module);
    if (!config) return 'fresh';
    // Only check modules that have at least one timestamp recorded (i.e. data was imported/updated)
    const relevantKeys = Object.keys(moduleLastUpdated).filter(k => k.endsWith(`-${module}`));
    if (relevantKeys.length === 0) return 'fresh';
    let worst: 'fresh' | 'amber' | 'red' = 'fresh';
    for (const key of relevantKeys) {
      const lastUpdated = moduleLastUpdated[key];
      if (!lastUpdated) continue;
      const status = getFreshnessStatus(lastUpdated, config);
      if (status === 'red') { worst = 'red'; break; }
      if (status === 'amber' && worst === 'fresh') worst = 'amber';
    }
    return worst;
  };

  const allModules = freshnessConfig.map(c => c.module);
  const hasRedModule = allModules.some(m => getWorstFreshness(m) === 'red');

  const badgeCounts: Record<string, number> = {
    projects: projects.length,
    assets: assets.length,
    reports: reports.length,
    tasks: tasks.length,
  };

  const hasOverdueReports = reports.some(r => r.status === 'In Review' || r.status === 'Draft');
  const hasOverdueTasks = tasks.some(t => t.status === 'To Do' || t.priority === 'High');
  const hasOverdueMilestones = milestones.some(m => m.status === 'overdue');
  const hasOverdueObligations = contractObligations.some(c => c.status === 'Overdue');

  const attentionKeys: Record<string, boolean> = {
    reports: hasOverdueReports,
    tasks: hasOverdueTasks,
    projects: hasOverdueMilestones || hasOverdueObligations,
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img src="/logo-icon.svg" alt="Vantage" className="w-8 h-8 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-white tracking-tight leading-tight text-[13px] truncate">Vantage Infrastructure</span>
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider transition-all duration-200",
                mode !== 'Full' ? "text-primary opacity-100" : "text-text-muted opacity-100"
              )}
            >
              {mode !== 'Full' ? `${mode} Mode` : 'Full Platform'}
            </span>
          </div>
        </div>
        {/* Close button on mobile */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden text-[#666666] hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col stagger-children">
        <div className="space-y-0.5 flex-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/app'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium relative',
                  isActive
                    ? 'bg-primary/10 text-secondary active'
                    : 'text-[#888888] hover:bg-[#1A1A1A] hover:text-white'
                )
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.badgeKey && badgeCounts[item.badgeKey] != null && (
                <span className="text-[10px] font-medium text-[#666666] tabular-nums">
                  {badgeCounts[item.badgeKey]}
                </span>
              )}
              {item.badgeKey && attentionKeys[item.badgeKey] && (
                <span className="absolute top-2 left-7 w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
              {item.freshnessModule && (() => {
                const status = getWorstFreshness(item.freshnessModule);
                if (status === 'fresh') return null;
                return (
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                    status === 'red' ? 'bg-red-500' : 'bg-amber-500'
                  )} />
                );
              })()}
            </NavLink>
          ))}
        </div>

        <div className="border-t border-[#222222] pt-3 mt-3">
          <button
            onClick={() => { setShowProjectImport(true); setMobileMenuOpen(false); }}
            className="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#888888] hover:bg-[#1A1A1A] hover:text-white w-full text-left"
          >
            <Layers className="w-4 h-4 flex-shrink-0" />
            <span>Import Project File</span>
          </button>
          <NavLink
            to="/app/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                'nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                isActive
                  ? 'bg-primary/10 text-secondary active'
                  : 'text-[#888888] hover:bg-[#1A1A1A] hover:text-white'
              )
            }
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-[#222222] relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-3 px-1 hover:bg-[#1A1A1A] rounded-lg py-1 -my-1 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-secondary">{currentUser?.initials || 'RN'}</span>
          </div>
          <div className="flex flex-col min-w-0 text-left flex-1">
            <span className="text-sm font-medium text-white truncate">{currentUser?.name || 'User'}</span>
            <span className="text-[11px] text-[#666666] truncate">{currentUser?.defaultRole || 'Admin'} • {modeLabels[mode]}</span>
          </div>
          <ChevronUp className={cn("w-4 h-4 text-[#666666] transition-transform", showUserMenu && "rotate-180")} />
        </button>

        {showUserMenu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#1A1A1A] border border-[#222222] rounded-xl shadow-2xl z-40 overflow-hidden animate-slide-down">
              <div className="px-3 py-2.5 flex items-center gap-3 border-b border-[#222222]">
                <div className="w-7 h-7 rounded-full bg-[#222222] border border-secondary/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-secondary">{currentUser?.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-[#666666]">{currentUser?.email}</p>
                </div>
              </div>
              <div>
                <button
                  onClick={() => { logout(); navigate('/login'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#222222] transition-colors text-left text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Log Out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-[#D4D4D4]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0 border-r border-[#222222] bg-[#070707] flex-col">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[85vw] h-full bg-[#070707] flex flex-col shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A]">
        {/* Top Bar */}
        <header className="h-14 flex-shrink-0 border-b border-[#222222] bg-[#070707] flex items-center justify-between px-3 md:px-8">
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-[#888888] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mode pills - scrollable on mobile */}
            <div className="flex items-center gap-1 bg-[#0A0A0A] p-1 rounded-xl border border-[#222222] overflow-x-auto">
              <Layers className="w-3.5 h-3.5 text-[#666666] ml-1 flex-shrink-0 hidden sm:block" />
              {(['Full', 'Audit', 'OR', 'Construction'] as ServiceLineMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "mode-pill px-2 md:px-3 py-1.5 text-[11px] md:text-xs font-medium rounded-lg whitespace-nowrap flex-shrink-0",
                    mode === m
                      ? "active bg-[#1A1A1A] text-white shadow-sm"
                      : "text-[#666666] hover:text-[#D4D4D4] hover:bg-[#1A1A1A]/50"
                  )}
                >
                  <span className="hidden sm:inline">{modeLabels[m]}</span>
                  <span className="sm:hidden">{modeLabelsShort[m]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-badge-pulse" title="System online" />
            <span className="text-[10px] md:text-xs text-[#666666] hidden sm:block">{tenantName}</span>
          </div>
        </header>

        {/* Stale Data Alert Bar */}
        {hasRedModule && (
          <div className="flex-shrink-0 px-3 md:px-8 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <span className="text-[11px] md:text-xs font-medium text-red-400">
              Stale data detected — some modules have not been updated past their threshold.
            </span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="animate-page-enter h-full">
            <div className="pt-3 px-3 md:px-8">
              <Breadcrumbs />
            </div>
            <Outlet />
          </div>
        </main>
      </div>

      {/* AI Assistant */}
      <AIAssistant />

      {/* Project File Import Modal */}
      {showProjectImport && (
        <ProjectFileImport onClose={() => setShowProjectImport(false)} />
      )}

      {/* Global UI overlays */}
      <ToastContainer />
      <ConfirmDialog />
      <CommandPalette />
    </div>
  );
}

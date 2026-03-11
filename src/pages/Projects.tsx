import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, X, Layers, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFreshnessStatus } from '@/lib/freshness';
import { SearchBar } from '@/components/SearchBar';

const STATUS_OPTIONS = ['All', 'Active', 'Complete', 'Archived'];
const TYPE_OPTIONS = ['All', 'ESPC', 'Energy Audit', 'Energy Program Management', 'EV Planning'];

const PROJECT_TYPE_CARDS = [
  {
    type: 'ESPC',
    label: 'ESPC',
    description: 'Energy Savings Performance Contract',
    accent: 'border-[#0D918C]/50 bg-[#0D918C]/5',
    iconColor: 'text-[#37BB26]',
    dotColor: 'bg-[#37BB26]',
  },
  {
    type: 'Energy Audit',
    label: 'Energy Audit',
    description: 'ASHRAE Level I, II, or III facility survey',
    accent: 'border-blue-500/50 bg-blue-500/5',
    iconColor: 'text-blue-400',
    dotColor: 'bg-blue-400',
  },
  {
    type: 'Energy Program Management',
    label: 'Energy Program Management',
    description: 'Ongoing energy program oversight',
    accent: 'border-amber-500/50 bg-amber-500/5',
    iconColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
  },
  {
    type: 'EV Planning',
    label: 'EV Planning',
    description: 'Electric vehicle infrastructure planning',
    accent: 'border-purple-500/50 bg-purple-500/5',
    iconColor: 'text-purple-400',
    dotColor: 'bg-purple-400',
  },
];

const TYPE_BADGE_STYLES: Record<string, string> = {
  'ESPC': 'bg-[#0D918C]/10 text-[#37BB26] border-[#0D918C]/20',
  'Energy Audit': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Energy Program Management': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'EV Planning': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  'Active': 'bg-[#37BB26]/10 text-[#37BB26] border-[#37BB26]/20',
  'Complete': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Archived': 'bg-[#5A6B88]/10 text-[#5A6B88] border-[#5A6B88]/20',
};

export function Projects() {
  const projects = useStore(state => state.projects);
  const organizations = useStore(state => state.organizations);
  const moduleLastUpdated = useStore(state => state.moduleLastUpdated);
  const freshnessConfig = useStore(state => state.freshnessConfig);
  const addProject = useStore(state => state.addProject);
  const addActivity = useStore(state => state.addActivity);
  const assets = useStore(state => state.assets);
  const utilityBills = useStore(state => state.utilityBills);
  const ecms = useStore(state => state.ecms);
  const milestones = useStore(state => state.milestones);
  const mvData = useStore(state => state.mvData);
  const navigate = useNavigate();

  const [showNewProject, setShowNewProject] = useState(false);
  const [formStep, setFormStep] = useState<'type' | 'details'>('type');
  const [newProject, setNewProject] = useState({
    name: '', esco: '', phase: 'Prospect' as string, value: '', engineer: '',
    riskScore: 0, orgId: '', projectType: '', status: 'Active',
    ashraeLevel: '', pm: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const getProjectWorstFreshness = (projectId: string): 'fresh' | 'amber' | 'red' => {
    let worst: 'fresh' | 'amber' | 'red' = 'fresh';
    for (const config of freshnessConfig) {
      const key = `${projectId}-${config.module}`;
      const lastUpdated = moduleLastUpdated[key];
      if (!lastUpdated) continue;
      const status = getFreshnessStatus(lastUpdated, config);
      if (status === 'red') return 'red';
      if (status === 'amber') worst = 'amber';
    }
    return worst;
  };

  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(p => statusFilter === 'All' || ((p as any).status || 'Active') === statusFilter)
      .filter(p => typeFilter === 'All' || (p as any).projectType === typeFilter);
  }, [projects, searchQuery, statusFilter, typeFilter]);

  const resetForm = () => {
    setNewProject({ name: '', esco: '', phase: 'Prospect', value: '', engineer: '', riskScore: 0, orgId: '', projectType: '', status: 'Active', ashraeLevel: '', pm: '' });
    setFormStep('type');
    setShowNewProject(false);
  };

  const handleCreate = () => {
    const defaultPhase = newProject.projectType === 'Energy Audit' ? 'Audit' : 'Prospect';
    addProject({
      name: newProject.name,
      esco: newProject.esco || 'TBD',
      phase: newProject.phase || defaultPhase,
      value: Number(newProject.value) || 0,
      engineer: newProject.engineer || 'Unassigned',
      riskScore: 0,
      orgId: newProject.orgId || '',
      projectType: newProject.projectType,
      status: newProject.status,
      ashraeLevel: newProject.ashraeLevel,
      pm: newProject.pm,
    } as any);
    addActivity({ user: 'System', description: `created project "${newProject.name}"` });
    resetForm();
  };

  const selectedTypeCard = PROJECT_TYPE_CARDS.find(c => c.type === newProject.projectType);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-[#1E2A45] bg-[#121C35] px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Projects</h1>
            <p className="text-sm text-[#7A8BA8] mt-1">Manage projects across all service lines and phases.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => useStore.getState().setShowProjectImport(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-500/20 transition-colors duration-150"
            >
              <Layers className="w-4 h-4" />
              Import Workbook
            </button>
            <button
              onClick={() => { setFormStep('type'); setShowNewProject(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B7A76] border border-transparent rounded-lg text-sm font-medium text-white hover:bg-[#096A66] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchBar
            placeholder="Search projects..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-96"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-[#5A6B88] font-medium uppercase tracking-wider w-14">Status</span>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  statusFilter === opt
                    ? "bg-[#0D918C]/20 text-[#37BB26] border-[#0D918C]/40"
                    : "bg-[#1E2A45] text-[#7A8BA8] border-[#2A3A5C] hover:text-white hover:bg-[#2A3A5C]"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5A6B88] font-medium uppercase tracking-wider w-14">Type</span>
          <div className="flex gap-1.5 flex-wrap">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setTypeFilter(opt)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  typeFilter === opt
                    ? "bg-[#0D918C]/20 text-[#37BB26] border-[#0D918C]/40"
                    : "bg-[#1E2A45] text-[#7A8BA8] border-[#2A3A5C] hover:text-white hover:bg-[#2A3A5C]"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => {
            const org = organizations.find(o => o.id === project.orgId);
            const projStatus: string = (project as any).status || 'Active';
            const projType: string = (project as any).projectType || '';

            // Import readiness checklist
            const hasAssets = assets.some(a => a.buildingId === project.id || (a as any).projectId === project.id);
            const hasBills = utilityBills.some(b => b.projectId === project.id);
            const hasEcms = ecms.some(e => e.projectId === project.id);
            const hasMilestones = milestones.some(m => m.projectId === project.id);
            const hasMv = mvData.some(d => d.projectId === project.id);

            const freshnessStatus = getProjectWorstFreshness(project.id);

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/app/projects/${project.id}`)}
                className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6 hover:border-[#0D918C]/50 transition-colors cursor-pointer group flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-[#1E2A45] rounded-lg flex items-center justify-center group-hover:bg-[#0D918C]/20 transition-colors">
                    <FolderOpen className="w-5 h-5 text-neutral-400 group-hover:text-[#37BB26] transition-colors" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {projType && (
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium border", TYPE_BADGE_STYLES[projType] || 'bg-[#1E2A45] text-[#7A8BA8] border-[#2A3A5C]')}>
                        {projType}
                      </span>
                    )}
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium border", STATUS_BADGE_STYLES[projStatus] || 'bg-[#1E2A45] text-[#7A8BA8] border-[#2A3A5C]')}>
                      {projStatus}
                    </span>
                    <span className={cn(
                      "px-2.5 py-1 rounded text-xs font-medium border",
                      project.phase === 'Construction' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      project.phase === 'M&V' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                      "bg-[#0D918C]/10 text-[#37BB26] border-[#0D918C]/20"
                    )}>
                      {project.phase.toUpperCase()}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#37BB26] transition-colors">{project.name}</h3>
                <p className="text-sm text-[#7A8BA8] mb-4">{org?.name}</p>

                <div className="mt-auto pt-4 border-t border-[#1E2A45] space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1">ESCO</span>
                      <span className="text-sm text-[#9AA5B8]">{project.esco}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1">Value</span>
                      <span className="text-sm text-[#9AA5B8] font-mono">${(project.value / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>

                  {/* Import readiness checklist */}
                  <div className="flex items-center gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
                    {[
                      { label: 'Assets', has: hasAssets },
                      { label: 'Bills', has: hasBills },
                      { label: 'ECMs', has: hasEcms },
                      { label: 'Milestones', has: hasMilestones },
                      { label: 'M&V', has: hasMv },
                    ].map(item => (
                      <span
                        key={item.label}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium border",
                          item.has
                            ? "bg-[#37BB26]/10 text-[#37BB26] border-[#37BB26]/20"
                            : "bg-[#1E2A45] text-[#3A4B68] border-[#2A3A5C]"
                        )}
                        title={item.has ? `${item.label}: data present` : `${item.label}: no data`}
                      >
                        {item.label}
                      </span>
                    ))}
                    {freshnessStatus !== 'fresh' && (
                      <span className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        freshnessStatus === 'red' ? 'bg-red-500' : 'bg-amber-500'
                      )} title={`Data ${freshnessStatus === 'red' ? 'overdue' : 'stale'}`} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={resetForm} />
          <div className="relative bg-[#121C35] border border-[#1E2A45] rounded-xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2A45]">
              <div className="flex items-center gap-2">
                {formStep === 'details' && (
                  <button onClick={() => setFormStep('type')} className="text-[#5A6B88] hover:text-white mr-1">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <h2 className="text-lg font-bold text-white">
                  {formStep === 'type' ? 'Choose Project Type' : 'Project Details'}
                </h2>
              </div>
              <button onClick={resetForm} className="text-[#5A6B88] hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {formStep === 'type' ? (
              <div className="px-6 py-5 space-y-3">
                <p className="text-sm text-[#7A8BA8] mb-4">Select the project type to get started.</p>
                {PROJECT_TYPE_CARDS.map(card => (
                  <button
                    key={card.type}
                    onClick={() => { setNewProject(prev => ({ ...prev, projectType: card.type, phase: card.type === 'Energy Audit' ? 'Audit' : 'Prospect' })); setFormStep('details'); }}
                    className={cn(
                      "w-full text-left px-4 py-4 rounded-xl border-2 transition-all duration-150 hover:scale-[1.01]",
                      card.accent
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", card.dotColor)} />
                      <div>
                        <p className={cn("text-sm font-semibold", card.iconColor)}>{card.label}</p>
                        <p className="text-xs text-[#7A8BA8] mt-0.5">{card.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                {selectedTypeCard && (
                  <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border", selectedTypeCard.accent)}>
                    <div className={cn("w-2 h-2 rounded-full", selectedTypeCard.dotColor)} />
                    <span className={cn("text-xs font-medium", selectedTypeCard.iconColor)}>{selectedTypeCard.type}</span>
                  </div>
                )}

                {/* Project Name — always required */}
                <div>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Project Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Fort Worth ISD ESPC"
                    className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]"
                  />
                </div>

                {/* ESPC-specific fields */}
                {newProject.projectType === 'ESPC' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">ESCO Partner</label>
                      <input type="text" value={newProject.esco} onChange={e => setNewProject(prev => ({ ...prev, esco: e.target.value }))} placeholder="e.g. Trane" className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Lead Engineer</label>
                      <input type="text" value={newProject.engineer} onChange={e => setNewProject(prev => ({ ...prev, engineer: e.target.value }))} placeholder="e.g. Ruthie Norton" className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Phase</label>
                        <select value={newProject.phase} onChange={e => setNewProject(prev => ({ ...prev, phase: e.target.value }))} className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]">
                          {['Prospect','Audit','IGEA','RFP','Contract','Construction','M&V','Closeout'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Contract Value ($)</label>
                        <input type="number" value={newProject.value} onChange={e => setNewProject(prev => ({ ...prev, value: e.target.value }))} placeholder="e.g. 5000000" className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]" />
                      </div>
                    </div>
                  </>
                )}

                {/* Energy Audit-specific fields */}
                {newProject.projectType === 'Energy Audit' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Lead Engineer</label>
                      <input type="text" value={newProject.engineer} onChange={e => setNewProject(prev => ({ ...prev, engineer: e.target.value }))} placeholder="e.g. Ruthie Norton" className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">ASHRAE Level</label>
                      <select value={newProject.ashraeLevel} onChange={e => setNewProject(prev => ({ ...prev, ashraeLevel: e.target.value }))} className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]">
                        <option value="">Select level...</option>
                        <option value="Level I — Walk-Through">Level I — Walk-Through</option>
                        <option value="Level II — Energy Survey">Level II — Energy Survey</option>
                        <option value="Level III — IGEA/Investment Grade">Level III — IGEA/Investment Grade</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Phase</label>
                      <select value={newProject.phase} onChange={e => setNewProject(prev => ({ ...prev, phase: e.target.value }))} className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]">
                        {['Prospect','Audit','IGEA','RFP','Contract','Construction','M&V','Closeout'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {/* Energy Program Management-specific fields */}
                {newProject.projectType === 'Energy Program Management' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Program Manager</label>
                      <input type="text" value={newProject.pm} onChange={e => setNewProject(prev => ({ ...prev, pm: e.target.value }))} placeholder="e.g. George Buchanan" className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Phase</label>
                      <select value={newProject.phase} onChange={e => setNewProject(prev => ({ ...prev, phase: e.target.value }))} className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]">
                        {['Prospect','Audit','IGEA','RFP','Contract','Construction','M&V','Closeout'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {/* EV Planning-specific fields */}
                {newProject.projectType === 'EV Planning' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Lead Engineer</label>
                      <input type="text" value={newProject.engineer} onChange={e => setNewProject(prev => ({ ...prev, engineer: e.target.value }))} placeholder="e.g. Ruthie Norton" className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Phase</label>
                      <select value={newProject.phase} onChange={e => setNewProject(prev => ({ ...prev, phase: e.target.value }))} className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]">
                        {['Prospect','Audit','IGEA','RFP','Contract','Construction','M&V','Closeout'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {/* Status — all types */}
                <div>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Status</label>
                  <select value={newProject.status} onChange={e => setNewProject(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]">
                    <option value="Active">Active</option>
                    <option value="Complete">Complete</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
            )}

            {formStep === 'details' && (
              <div className="px-6 py-4 border-t border-[#1E2A45] flex justify-end gap-3">
                <button onClick={() => setFormStep('type')} className="px-4 py-2 text-sm text-[#7A8BA8] hover:text-white">Back</button>
                <button
                  disabled={!newProject.name.trim()}
                  onClick={handleCreate}
                  className="px-4 py-2 bg-[#0B7A76] rounded-lg text-sm font-medium text-white hover:bg-[#096A66] disabled:opacity-40"
                >
                  Create Project
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

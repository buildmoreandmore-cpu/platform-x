import { useState } from 'react';
import { useStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, Search, Filter, X, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompletenessBar } from '@/components/CompletenessBar';
import { getFreshnessStatus } from '@/lib/freshness';

export function Projects() {
  const projects = useStore(state => state.projects);
  const organizations = useStore(state => state.organizations);
  const moduleLastUpdated = useStore(state => state.moduleLastUpdated);
  const freshnessConfig = useStore(state => state.freshnessConfig);
  const addProject = useStore(state => state.addProject);
  const addActivity = useStore(state => state.addActivity);
  const navigate = useNavigate();
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', esco: '', phase: 'Prospect' as string, value: '', engineer: '', riskScore: 0, orgId: '' });

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
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-[#1E2A45] bg-[#121C35] px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Projects</h1>
            <p className="text-sm text-[#7A8BA8] mt-1">Manage ESPC projects across all phases.</p>
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
              onClick={() => setShowNewProject(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B7A76] border border-transparent rounded-lg text-sm font-medium text-white hover:bg-[#096A66] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C] focus:border-transparent shadow-sm"
            />
          </div>
          <button className="inline-flex items-center gap-2 px-3 py-2 bg-[#1E2A45] border border-[#2A3A5C] rounded-lg text-sm font-medium text-[#9AA5B8] hover:bg-[#2A3A5C] transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(project => {
            const org = organizations.find(o => o.id === project.orgId);
            return (
              <div 
                key={project.id} 
                onClick={() => navigate(`/app/projects/${project.id}`)}
                className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6 hover:border-[#0D918C]/50 transition-colors cursor-pointer group flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-[#1E2A45] rounded-lg flex items-center justify-center group-hover:bg-[#0D918C]/20 transition-colors">
                    <FolderOpen className="w-5 h-5 text-neutral-400 group-hover:text-[#37BB26] transition-colors" />
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded text-xs font-medium border",
                    project.phase === 'Construction' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    project.phase === 'M&V' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                    "bg-[#0D918C]/10 text-[#37BB26] border-[#0D918C]/20"
                  )}>
                    {project.phase.toUpperCase()}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#37BB26] transition-colors">{project.name}</h3>
                <p className="text-sm text-[#7A8BA8] mb-6">{org?.name}</p>
                
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
                  <div className="flex items-center gap-2">
                    {(() => {
                      const freshness = getProjectWorstFreshness(project.id);
                      if (freshness === 'fresh') return null;
                      return (
                        <span className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          freshness === 'red' ? 'bg-red-500' : 'bg-amber-500'
                        )} title={`Data ${freshness === 'red' ? 'overdue' : 'stale'}`} />
                      );
                    })()}
                    <div className="flex-1" onClick={e => e.stopPropagation()}>
                      <CompletenessBar projectId={project.id} />
                    </div>
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
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowNewProject(false)} />
          <div className="relative bg-[#121C35] border border-[#1E2A45] rounded-xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2A45]">
              <h2 className="text-lg font-bold text-white">New Project</h2>
              <button onClick={() => setShowNewProject(false)} className="text-[#5A6B88] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: 'Project Name', key: 'name', placeholder: 'e.g. Fort Worth ISD ESPC' },
                { label: 'ESCO Partner', key: 'esco', placeholder: 'e.g. Trane' },
                { label: 'Lead Engineer', key: 'engineer', placeholder: 'e.g. Ruthie Norton' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">{field.label}</label>
                  <input
                    type="text"
                    value={(newProject as any)[field.key]}
                    onChange={e => setNewProject(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Phase</label>
                  <select
                    value={newProject.phase}
                    onChange={e => setNewProject(prev => ({ ...prev, phase: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]"
                  >
                    {['Prospect','Audit','IGEA','RFP','Contract','Construction','M&V','Closeout'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Contract Value ($)</label>
                  <input
                    type="number"
                    value={newProject.value}
                    onChange={e => setNewProject(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="e.g. 5000000"
                    className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C]"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#1E2A45] flex justify-end gap-3">
              <button onClick={() => setShowNewProject(false)} className="px-4 py-2 text-sm text-[#7A8BA8] hover:text-white">Cancel</button>
              <button
                disabled={!newProject.name.trim()}
                onClick={() => {
                  addProject({ name: newProject.name, esco: newProject.esco || 'TBD', phase: newProject.phase, value: Number(newProject.value) || 0, engineer: newProject.engineer || 'Unassigned', riskScore: 0, orgId: newProject.orgId || '' });
                  addActivity({ user: 'System', description: `created project "${newProject.name}"` });
                  setNewProject({ name: '', esco: '', phase: 'Prospect', value: '', engineer: '', riskScore: 0, orgId: '' });
                  setShowNewProject(false);
                }}
                className="px-4 py-2 bg-[#0B7A76] rounded-lg text-sm font-medium text-white hover:bg-[#096A66] disabled:opacity-40"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

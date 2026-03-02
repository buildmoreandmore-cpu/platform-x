import { useState } from 'react';
import { useStore } from '@/store';
import { HardHat, AlertTriangle, CheckCircle2, Search, Filter, Plus, ClipboardList, Hammer } from 'lucide-react';
import { ExportButton } from '@/components/ExportButton';
import { cn } from '@/lib/utils';
import { EditableField } from '@/components/EditableField';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';
import { FreshnessBadge } from '@/components/FreshnessBadge';

export function Construction({ projectId }: { projectId?: string }) {
  const projects = useStore(state => state.projects);
  const ecms = useStore(state => state.ecms);
  const inspectionFindings = useStore(state => state.inspectionFindings);

  const [activeTab, setActiveTab] = useState<'tracker' | 'inspections'>('tracker');
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || projects[2].id); // Default to construction project

  const projectEcms = ecms.filter(e => e.projectId === selectedProjectId);
  const projectFindings = inspectionFindings.filter(f => f.projectId === selectedProjectId);

  const totalEcms = projectEcms.length;
  const openFindings = projectFindings.filter(f => f.status === 'Open').length;
  const scopeDeviations = projectFindings.filter(f => f.type === 'Deviation from Scope' && f.status === 'Open').length;

  return (
    <div className="flex flex-col h-full">
      {!projectId && (
        <div className="flex-shrink-0 border-b border-[#1E2A45] bg-[#121C35] px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">Construction Oversight</h1>
                {projectId && <FreshnessBadge module="Inspection" entityId={projectId} />}
              </div>
              <p className="text-sm text-[#7A8BA8] mt-1">Track installation progress, inspections, and scope deviations.</p>
            </div>
            <div className="flex items-center gap-3">
              <ExportButton
                variant="compact"
                filename={`construction-${(projects.find(p => p.id === selectedProjectId)?.name || 'project').toLowerCase().replace(/\s+/g, '-')}`}
                sheets={[
                  { name: 'Installation', data: projectEcms.map((e, idx) => ({ 'ECM': e.number, 'Description': e.description, 'Category': e.category, 'Cost': e.cost, 'Progress': idx === 0 ? '100%' : idx === 1 ? '45%' : '0%', 'Status': idx === 0 ? 'Complete' : idx === 1 ? 'In Progress' : 'Not Started' })) },
                  { name: 'Inspection Findings', data: projectFindings.map(f => ({ 'Date': f.date, 'ECM': f.ecm, 'Type': f.type, 'Severity': f.severity, 'Description': f.description, 'Status': f.status })) },
                ]}
              />
              <select 
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-[#1E2A45] border border-[#2A3A5C] text-[#CBD2DF] text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-64 p-2.5"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex space-x-6 border-b border-[#1E2A45]">
            <button
              onClick={() => setActiveTab('tracker')}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === 'tracker' 
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-[#7A8BA8] hover:text-white hover:border-[#2A3A5C]"
              )}
          >
            <Hammer className="w-4 h-4" />
            Installation Tracker
          </button>
          <button
            onClick={() => setActiveTab('inspections')}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'inspections'
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-[#7A8BA8] hover:text-white hover:border-[#2A3A5C]"
            )}
          >
            <ClipboardList className="w-4 h-4" />
            Inspection Log
          </button>
        </div>
      </div>
      )}

      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
            <h3 className="text-sm font-medium text-[#7A8BA8] uppercase tracking-wider mb-2">Total ECMs</h3>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-white">{totalEcms}</span>
            </div>
          </div>

          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
            <h3 className="text-sm font-medium text-[#7A8BA8] uppercase tracking-wider mb-2">Open Findings</h3>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-amber-500">{openFindings}</span>
            </div>
          </div>

          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
            <h3 className="text-sm font-medium text-[#7A8BA8] uppercase tracking-wider mb-2">Scope Deviations</h3>
            <div className="flex items-end gap-3">
              <span className={`text-4xl font-bold ${scopeDeviations > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {scopeDeviations}
              </span>
            </div>
          </div>
        </div>

        {activeTab === 'tracker' && (
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Installation Progress</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                  <tr>
                    <th className="px-6 py-4 font-medium">ECM</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Progress</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2A45]">
                  {projectEcms.map((ecm, idx) => {
                    // Mock progress based on index for demo
                    const progress = idx === 0 ? 100 : idx === 1 ? 45 : 0;
                    const status = idx === 0 ? 'Complete' : idx === 1 ? 'In Progress' : 'Not Started';
                    
                    return (
                      <tr key={ecm.id} className="hover:bg-[#1A2544] transition-colors">
                        <td className="px-6 py-4 font-medium text-white">
                          <div className="flex flex-col">
                            <span>{ecm.number}</span>
                            <span className="text-xs text-[#7A8BA8] font-normal">{ecm.description}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#9AA5B8]">{ecm.category}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-[#1E2A45] rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-blue-500' : 'bg-transparent'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#7A8BA8] font-mono">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded text-xs font-medium border",
                            status === 'Complete' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            status === 'In Progress' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                            "bg-[#1E2A45] text-[#7A8BA8] border-[#2A3A5C]"
                          )}>
                            {status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {projectEcms.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-[#7A8BA8]">No ECMs found for this project.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inspections' && (
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Inspection Log</h3>
              <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 border border-transparent rounded-lg text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Log Finding
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">ECM</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Severity</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2A45]">
                  {projectFindings.map((finding) => (
                    <tr key={finding.id} className="hover:bg-[#1A2544] transition-colors align-top">
                      <td className="px-6 py-4 text-[#9AA5B8] font-mono">{finding.date}</td>
                      <td className="px-6 py-4 text-[#9AA5B8]">{finding.ecm}</td>
                      <td className="px-6 py-4 text-[#9AA5B8]">{finding.type}</td>
                      <td className="px-6 py-4">
                        <EditableField
                          entityType="inspectionFinding"
                          entityId={finding.id}
                          field="severity"
                          value={finding.severity}
                          type="select"
                          options={['Low', 'Medium', 'High', 'Critical']}
                        />
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <EditableField
                          entityType="inspectionFinding"
                          entityId={finding.id}
                          field="description"
                          value={finding.description}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <EditableField
                          entityType="inspectionFinding"
                          entityId={finding.id}
                          field="status"
                          value={finding.status}
                          type="select"
                          options={['Open', 'In Review', 'Resolved', 'Deferred']}
                        />
                        <div className="mt-2">
                          <AuditTrailPanel entityType="inspectionFinding" entityId={finding.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {projectFindings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[#7A8BA8]">No inspection findings logged for this project.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useStore } from '@/store';
import { ShieldCheck, Calendar, FileText, AlertTriangle, GitPullRequest, FileCheck, Plus, Filter, CalendarPlus, FileSpreadsheet, X } from 'lucide-react';
import { ExportButton } from '@/components/ExportButton';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { EditableField } from '@/components/EditableField';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';
import { LockIndicator } from '@/components/LockIndicator';
import { downloadICS } from '@/lib/ics';
import { SharePointImportModal, SECTION_CONFIGS, type SectionImportConfig } from '@/components/SharePointImportModal';

export function Governance({ projectId }: { projectId?: string }) {
  const projects = useStore(state => state.projects);
  const milestones = useStore(state => state.milestones);
  const risks = useStore(state => state.risks);
  const changeOrders = useStore(state => state.changeOrders);
  const submittals = useStore(state => state.submittals);
  const contractObligations = useStore(state => state.contractObligations);
  const lockRecords = useStore(state => state.lockRecords);
  const addBatch = useStore(state => state.addBatch);
  const addCustomColumns = useStore(state => state.addCustomColumns);
  const addImportRecord = useStore(state => state.addImportRecord);
  const deleteItem = useStore(state => state.deleteItem);
  const currentUser = useStore(state => state.users).find(u => u.id === useStore.getState().currentUserId);

  const addMilestone = useStore(state => state.addMilestone);
  const addRisk = useStore(state => state.addRisk);
  const addChangeOrder = useStore(state => state.addChangeOrder);

  const [activeTab, setActiveTab] = useState<'pipeline' | 'milestones' | 'risks' | 'co' | 'submittals' | 'obligations'>('pipeline');
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || projects[0]?.id || '');
  const [catFilter, setCatFilter] = useState<string>('All');
  const [importSection, setImportSection] = useState<string | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showCOModal, setShowCOModal] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ name: '', dueDate: '', status: 'pending', assignedTo: '' });
  const [riskForm, setRiskForm] = useState({ description: '', category: 'Schedule', severity: 'Medium', owner: '' });
  const [coForm, setCoForm] = useState({ number: '', description: '', requestedBy: '', cost: '', days: '' });

  const phases = ['Prospect', 'Audit', 'IGEA', 'RFP', 'Contract', 'Construction', 'M&V', 'Closeout'];
  const project = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="flex flex-col h-full">
      {!projectId && (
        <div className="flex-shrink-0 border-b border-[#1E2A45] bg-[#121C35] px-3 md:px-8 py-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div>
              <h1 className="text-lg md:text-xl md:text-2xl font-bold text-white tracking-tight">Owner's Rep Governance</h1>
              <p className="text-sm text-[#7A8BA8] mt-1">Track project phases, milestones, documents, and risks.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <ExportButton
                variant="compact"
                filename={`governance-${(projects.find(p => p.id === selectedProjectId)?.name || 'project').toLowerCase().replace(/\s+/g, '-')}`}
                sheets={[
                  { name: 'Milestones', data: milestones.filter(m => m.projectId === selectedProjectId).map(m => ({ 'Phase': (m as any).phase || '', 'Milestone': m.name, 'Due Date': m.dueDate, 'Status': m.status, 'Owner': m.assignedTo })) },
                  { name: 'Risks', data: risks.filter(r => r.projectId === selectedProjectId).map(r => ({ 'Risk': r.description, 'Category': r.category, 'Severity': r.severity, 'Likelihood': (r as any).likelihood || '', 'Impact': (r as any).impact || '', 'Status': r.status, 'Owner': r.owner })) },
                  { name: 'Change Orders', data: changeOrders.filter(c => c.projectId === selectedProjectId).map(c => ({ 'Description': (c as any).description || '', 'Amount': (c as any).amount || '', 'Status': (c as any).status || '', 'Date': (c as any).date || '' })) },
                  { name: 'Submittals', data: submittals.filter(s => s.projectId === selectedProjectId).map(s => ({ 'Description': (s as any).description || '', 'Status': (s as any).status || '', 'Date': (s as any).date || '' })) },
                  { name: 'Contract Obligations', data: contractObligations.filter(o => o.projectId === selectedProjectId).map(o => ({ 'Description': o.description, 'Category': o.category, 'Responsible': o.responsibleParty, 'Due Date': o.dueDate || 'Ongoing', 'Status': o.status })) },
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

          <div className="flex space-x-6 border-b border-[#1E2A45] overflow-x-auto">
            {[
              { id: 'pipeline', label: 'Pipeline', icon: GitPullRequest },
              { id: 'milestones', label: 'Milestones', icon: Calendar },
              { id: 'risks', label: 'Risk Log', icon: AlertTriangle },
              { id: 'co', label: 'Change Orders', icon: FileText },
              { id: 'submittals', label: 'Submittals', icon: FileCheck },
              { id: 'obligations', label: 'Contract Obligations', icon: ShieldCheck },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === tab.id 
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-[#7A8BA8] hover:text-white hover:border-[#2A3A5C]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 md:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'pipeline' && (
          <div className="space-y-8">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {phases.map(phase => {
                const phaseProjects = projects.filter(p => p.phase === phase);
                return (
                  <div key={phase} className="flex-shrink-0 w-80 bg-[#121C35] border border-[#1E2A45] rounded-xl flex flex-col h-[calc(100vh-250px)]">
                    <div className="p-4 border-b border-[#1E2A45] flex items-center justify-between bg-[#0F1829] rounded-t-xl">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{phase}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#1E2A45] text-xs font-medium text-[#7A8BA8]">
                        {phaseProjects.length}
                      </span>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto space-y-3">
                      {phaseProjects.map(project => (
                        <div key={project.id} className="bg-[#1A2544] border border-[#2A3A5C] rounded-lg p-4 hover:border-emerald-500/50 transition-colors cursor-pointer group">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-medium text-white group-hover:text-emerald-600 transition-colors">{project.name}</h4>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                              project.riskScore > 60 ? 'bg-red-500/20 text-red-500' :
                              project.riskScore > 40 ? 'bg-amber-500/20 text-amber-500' :
                              'bg-emerald-500/20 text-emerald-500'
                            }`}>
                              {project.riskScore}
                            </div>
                          </div>
                          <div className="text-xs text-[#7A8BA8] space-y-1">
                            <p>ESCO: <span className="text-[#9AA5B8]">{project.esco}</span></p>
                            <p>Value: <span className="text-[#9AA5B8] font-mono">${(project.value / 1000000).toFixed(1)}M</span></p>
                            <p>Lead: <span className="text-[#9AA5B8]">{project.engineer}</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Project Milestones</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setImportSection('milestones')} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0D918C]/10 border border-[#0D918C]/30 rounded-lg text-xs font-medium text-[#0D918C] hover:bg-[#0D918C]/20 transition-colors duration-150">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Import
                </button>
                <button onClick={() => setShowMilestoneModal(true)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 border border-transparent rounded-lg text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Add Milestone
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Milestone</th>
                    <th className="px-6 py-4 font-medium">Due Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Assigned To</th>
                    <th className="px-6 py-4 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2A45]">
                  {milestones.filter(m => m.projectId === selectedProjectId).map((milestone) => (
                    <tr key={milestone.id} className="hover:bg-[#1A2544] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        <EditableField value={milestone.name} entityType="milestone" entityId={milestone.id} field="name" projectId={selectedProjectId} />
                        <AuditTrailPanel entityType="milestone" entityId={milestone.id} />
                      </td>
                      <td className="px-6 py-4 text-[#9AA5B8] font-mono">
                        <EditableField value={milestone.dueDate} entityType="milestone" entityId={milestone.id} field="dueDate" projectId={selectedProjectId} />
                      </td>
                      <td className="px-6 py-4">
                        <EditableField value={milestone.status} entityType="milestone" entityId={milestone.id} field="status" projectId={selectedProjectId} type="select" options={['pending', 'in-progress', 'completed', 'overdue']} />
                      </td>
                      <td className="px-6 py-4 text-[#9AA5B8]">{milestone.assignedTo}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => downloadICS(milestone.name, milestone.dueDate, `Milestone: ${milestone.name} — Assigned to: ${milestone.assignedTo}`)}
                            className="p-1 text-[#5A6B88] hover:text-emerald-400 transition-colors"
                            title="Add to Calendar"
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </button>
                          {milestone.importBatchId && (
                            <button
                              onClick={() => deleteItem('milestones', milestone.id)}
                              className="p-1 text-[#5A6B88] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Delete imported row"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {milestones.filter(m => m.projectId === selectedProjectId).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[#7A8BA8]">No milestones found for this project.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Risk Log</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setImportSection('risks')} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0D918C]/10 border border-[#0D918C]/30 rounded-lg text-xs font-medium text-[#0D918C] hover:bg-[#0D918C]/20 transition-colors duration-150">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Import
                </button>
                <button onClick={() => setShowRiskModal(true)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 border border-transparent rounded-lg text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Log Risk
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Severity</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2A45]">
                  {risks.filter(r => r.projectId === selectedProjectId).map((risk) => (
                    <tr key={risk.id} className="hover:bg-[#1A2544] transition-colors">
                      <td className="px-6 py-4 font-medium text-white max-w-md">
                        <EditableField value={risk.description} entityType="risk" entityId={risk.id} field="description" projectId={selectedProjectId} />
                        <AuditTrailPanel entityType="risk" entityId={risk.id} />
                      </td>
                      <td className="px-6 py-4 text-[#9AA5B8]">{risk.category}</td>
                      <td className="px-6 py-4">
                        <EditableField value={risk.severity} entityType="risk" entityId={risk.id} field="severity" projectId={selectedProjectId} type="select" options={['Low', 'Medium', 'High', 'Critical']} />
                      </td>
                      <td className="px-6 py-4 text-[#9AA5B8]">
                        <EditableField value={risk.status} entityType="risk" entityId={risk.id} field="status" projectId={selectedProjectId} type="select" options={['Open', 'Mitigated', 'Closed']} />
                      </td>
                      <td className="px-6 py-4 text-[#9AA5B8]">{risk.owner}</td>
                      {risk.importBatchId && (
                        <td className="px-2 py-4">
                          <button
                            onClick={() => deleteItem('risks', risk.id)}
                            className="p-1 text-[#5A6B88] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete imported row"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {risks.filter(r => r.projectId === selectedProjectId).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[#7A8BA8]">No risks logged for this project.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'co' && (
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Change Orders</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setImportSection('changeOrders')} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0D918C]/10 border border-[#0D918C]/30 rounded-lg text-xs font-medium text-[#0D918C] hover:bg-[#0D918C]/20 transition-colors duration-150">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Import
                </button>
                <button onClick={() => setShowCOModal(true)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 border border-transparent rounded-lg text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Add Change Order
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                  <tr>
                    <th className="px-6 py-4 font-medium">CO #</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Requested By</th>
                    <th className="px-6 py-4 font-medium">Cost</th>
                    <th className="px-6 py-4 font-medium">Days</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2A45]">
                  {changeOrders.filter(co => co.projectId === selectedProjectId).map((co) => {
                    const coLock = lockRecords.find(l => l.entityType === 'changeOrder' && l.entityId === co.id);
                    return (
                      <tr key={co.id} className="hover:bg-[#1A2544] transition-colors">
                        <td className="px-6 py-4 font-mono text-[#9AA5B8]">{co.number}</td>
                        <td className="px-6 py-4 font-medium text-white">
                          {coLock ? (
                            <span className="inline-flex items-center gap-2">
                              {co.description}
                              <LockIndicator lock={coLock} />
                            </span>
                          ) : (
                            <EditableField value={co.description} entityType="changeOrder" entityId={co.id} field="description" projectId={selectedProjectId} />
                          )}
                          <AuditTrailPanel entityType="changeOrder" entityId={co.id} />
                        </td>
                        <td className="px-6 py-4 text-[#9AA5B8]">{co.requestedBy}</td>
                        <td className="px-6 py-4 text-[#9AA5B8] font-mono">${co.cost.toLocaleString()}</td>
                        <td className="px-6 py-4 text-[#9AA5B8]">{co.days}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded text-xs font-medium border",
                            co.status === 'Approved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            co.status === 'Rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                            "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          )}>
                            {co.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {changeOrders.filter(co => co.projectId === selectedProjectId).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[#7A8BA8]">No change orders found for this project.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── SUBMITTALS TAB ─── */}
        {activeTab === 'submittals' && (
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Submittals</h3>
              <button onClick={() => setImportSection('submittals')} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0D918C]/10 border border-[#0D918C]/30 rounded-lg text-xs font-medium text-[#0D918C] hover:bg-[#0D918C]/20 transition-colors duration-150">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Import
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Number</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Date Submitted</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2A45]">
                  {submittals.filter(s => s.projectId === selectedProjectId).map((s) => (
                    <tr key={s.id} className="hover:bg-[#1A2544] transition-colors">
                      <td className="px-6 py-4 font-mono text-[#9AA5B8]">{s.number}</td>
                      <td className="px-6 py-4 font-medium text-white">{s.description}</td>
                      <td className="px-6 py-4 text-[#9AA5B8] font-mono text-xs">{s.submitted || s.date || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded text-xs font-medium border",
                          s.status === 'Approved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          s.status === 'Rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {(s.status || 'Pending').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {submittals.filter(s => s.projectId === selectedProjectId).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-[#7A8BA8]">No submittals found for this project.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── CONTRACT OBLIGATIONS TAB ─── */}
        {activeTab === 'obligations' && (() => {
          const obligations = contractObligations.filter(o => o.projectId === selectedProjectId);
          const categories = ['All', 'Guarantee', 'Warranty', 'Reporting', 'Financial', 'Operational'];
          const filtered = catFilter === 'All' ? obligations : obligations.filter(o => o.category === catFilter);

          const completed = obligations.filter(o => o.status === 'Completed').length;
          const overdue = obligations.filter(o => o.status === 'Overdue').length;
          const comingDue = obligations.filter(o => o.status === 'Coming Due').length;
          const total = obligations.length;
          const upcoming90 = obligations.filter(o => o.status === 'Coming Due' || o.status === 'Overdue')
            .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

          return (
            <div className="space-y-6">
              {/* Compliance summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-5">
                  <p className="text-xs text-[#7A8BA8] uppercase tracking-wider mb-1">Total Obligations</p>
                  <p className="text-lg md:text-xl md:text-2xl font-bold text-white">{total}</p>
                </div>
                <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-5">
                  <p className="text-xs text-[#7A8BA8] uppercase tracking-wider mb-1">Completed</p>
                  <p className="text-lg md:text-xl md:text-2xl font-bold text-emerald-600">{completed}</p>
                </div>
                <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-5">
                  <p className="text-xs text-[#7A8BA8] uppercase tracking-wider mb-1">Coming Due</p>
                  <p className="text-lg md:text-xl md:text-2xl font-bold text-amber-600">{comingDue}</p>
                </div>
                <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-5">
                  <p className="text-xs text-[#7A8BA8] uppercase tracking-wider mb-1">Overdue</p>
                  <p className={cn('text-lg md:text-xl md:text-2xl font-bold', overdue > 0 ? 'text-red-600' : 'text-emerald-600')}>{overdue}</p>
                </div>
              </div>

              {/* Compliance donut */}
              <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Compliance Summary</h3>
                <div className="flex items-center gap-8">
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#F3F4F6" strokeWidth="3" />
                      {total > 0 && (
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#10B981" strokeWidth="3"
                          strokeDasharray={`${(completed / total) * 87.96} 87.96`} strokeLinecap="round" />
                      )}
                      {overdue > 0 && (
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#EF4444" strokeWidth="3"
                          strokeDasharray={`${(overdue / total) * 87.96} 87.96`}
                          strokeDashoffset={`-${(completed / total) * 87.96}`} strokeLinecap="round" />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">{total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500 rounded-full" /><span className="text-[#9AA5B8]">{completed} Completed on time</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-amber-400 rounded-full" /><span className="text-[#9AA5B8]">{comingDue} Coming due</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-full" /><span className="text-[#9AA5B8]">{overdue} Overdue</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#1E2A45] rounded-full" /><span className="text-[#9AA5B8]">{total - completed - comingDue - overdue} Not yet due</span></div>
                  </div>
                </div>
              </div>

              {/* Upcoming obligations */}
              {upcoming90.length > 0 && (
                <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-[#1E2A45]">
                    <h3 className="text-sm font-semibold text-white">Upcoming & Overdue Obligations</h3>
                  </div>
                  <div className="divide-y divide-[#1E2A45]">
                    {upcoming90.map(o => (
                      <div key={o.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-white">{o.description}</p>
                            <p className="text-xs text-[#7A8BA8] mt-1">
                              {o.category} &middot; {o.responsibleParty} {o.dueDate ? `\u00B7 Due: ${o.dueDate}` : ''}
                            </p>
                            <p className="text-xs text-[#5A6B88] mt-1 italic">Ref: {o.contractRef}</p>
                            {o.internalNote && <p className="text-xs text-amber-600 mt-1">{o.internalNote}</p>}
                          </div>
                          <span className={cn('px-2.5 py-1 rounded text-xs font-medium border flex-shrink-0',
                            o.status === 'Overdue' ? 'bg-red-50 text-red-600 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          )}>{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full obligations table */}
              <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
                <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">All Obligations</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setImportSection('contractObligations')} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0D918C]/10 border border-[#0D918C]/30 rounded-lg text-xs font-medium text-[#0D918C] hover:bg-[#0D918C]/20 transition-colors duration-150">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Import
                    </button>
                    {categories.map(c => (
                      <button
                        key={c}
                        onClick={() => setCatFilter(c)}
                        className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                          catFilter === c ? 'bg-emerald-50 text-emerald-700' : 'text-[#7A8BA8] hover:bg-[#1A2544]'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                      <tr>
                        <th className="px-6 py-4 font-medium">Description</th>
                        <th className="px-6 py-4 font-medium">Category</th>
                        <th className="px-6 py-4 font-medium">Responsible</th>
                        <th className="px-6 py-4 font-medium">Due Date</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2A45]">
                      {filtered.map(o => (
                        <tr key={o.id} className="hover:bg-[#1A2544] transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-white max-w-sm">{o.description}</p>
                            <div className="text-[10px] text-[#5A6B88] mt-0.5">
                              <EditableField value={o.evidence || ''} entityType="contractObligation" entityId={o.id} field="evidence" projectId={selectedProjectId} />
                            </div>
                            <AuditTrailPanel entityType="contractObligation" entityId={o.id} />
                          </td>
                          <td className="px-6 py-4"><span className="px-2.5 py-1 rounded bg-[#1E2A45] text-xs font-medium border border-[#2A3A5C]">{o.category}</span></td>
                          <td className="px-6 py-4 text-[#9AA5B8]">{o.responsibleParty}</td>
                          <td className="px-6 py-4 text-[#9AA5B8] font-mono text-xs">{o.dueDate || 'Ongoing'}</td>
                          <td className="px-6 py-4">
                            <EditableField value={o.status} entityType="contractObligation" entityId={o.id} field="status" projectId={selectedProjectId} type="select" options={['On Track', 'At Risk', 'Overdue', 'Complete']} />
                          </td>
                          <td className="px-6 py-4 text-xs text-[#5A6B88]">
                            <div className="flex items-center gap-1">
                              {o.contractRef}
                              {o.importBatchId && (
                                <button
                                  onClick={() => deleteItem(SECTION_CONFIGS[activeTab === 'obligations' ? 'contractObligations' : 'milestones']?.storeKey || 'contractObligations', o.id)}
                                  className="p-1 text-[#5A6B88] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                  title="Delete imported row"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-[#7A8BA8]">No obligations found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ─── ADD MILESTONE MODAL ─── */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-white">Add Milestone</h3><button onClick={() => setShowMilestoneModal(false)} className="text-[#7A8BA8] hover:text-white"><X className="w-4 h-4" /></button></div>
            <input placeholder="Milestone name" value={milestoneForm.name} onChange={e => setMilestoneForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white placeholder-[#5A6B88]" />
            <input type="date" value={milestoneForm.dueDate} onChange={e => setMilestoneForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white" />
            <select value={milestoneForm.status} onChange={e => setMilestoneForm(f => ({ ...f, status: e.target.value }))} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white">
              <option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
            </select>
            <input placeholder="Assigned to" value={milestoneForm.assignedTo} onChange={e => setMilestoneForm(f => ({ ...f, assignedTo: e.target.value }))} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white placeholder-[#5A6B88]" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowMilestoneModal(false)} className="px-4 py-2 text-sm text-[#7A8BA8] hover:text-white">Cancel</button>
              <button onClick={() => { if (!milestoneForm.name) return; addMilestone({ ...milestoneForm, projectId: selectedProjectId }); setMilestoneForm({ name: '', dueDate: '', status: 'pending', assignedTo: '' }); setShowMilestoneModal(false); }} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LOG RISK MODAL ─── */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-white">Log Risk</h3><button onClick={() => setShowRiskModal(false)} className="text-[#7A8BA8] hover:text-white"><X className="w-4 h-4" /></button></div>
            <textarea placeholder="Risk description" value={riskForm.description} onChange={e => setRiskForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white placeholder-[#5A6B88] min-h-[80px]" />
            <select value={riskForm.category} onChange={e => setRiskForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white">
              <option>Schedule</option><option>Financial</option><option>Technical</option><option>Regulatory</option><option>Operational</option>
            </select>
            <select value={riskForm.severity} onChange={e => setRiskForm(f => ({ ...f, severity: e.target.value }))} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white">
              <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
            </select>
            <input placeholder="Risk owner" value={riskForm.owner} onChange={e => setRiskForm(f => ({ ...f, owner: e.target.value }))} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white placeholder-[#5A6B88]" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowRiskModal(false)} className="px-4 py-2 text-sm text-[#7A8BA8] hover:text-white">Cancel</button>
              <button onClick={() => { if (!riskForm.description) return; addRisk({ ...riskForm, projectId: selectedProjectId, status: 'Open' }); setRiskForm({ description: '', category: 'Schedule', severity: 'Medium', owner: '' }); setShowRiskModal(false); }} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD CHANGE ORDER MODAL ─── */}
      {showCOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-white">Add Change Order</h3><button onClick={() => setShowCOModal(false)} className="text-[#7A8BA8] hover:text-white"><X className="w-4 h-4" /></button></div>
            <input placeholder="CO Number (e.g. CO-004)" value={coForm.number} onChange={e => setCoForm(f => ({ ...f, number: e.target.value }))} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white placeholder-[#5A6B88]" />
            <input placeholder="Description" value={coForm.description} onChange={e => setCoForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white placeholder-[#5A6B88]" />
            <input placeholder="Requested by" value={coForm.requestedBy} onChange={e => setCoForm(f => ({ ...f, requestedBy: e.target.value }))} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white placeholder-[#5A6B88]" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Cost ($)" value={coForm.cost} onChange={e => setCoForm(f => ({ ...f, cost: e.target.value }))} className="bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white placeholder-[#5A6B88]" />
              <input type="number" placeholder="Days impact" value={coForm.days} onChange={e => setCoForm(f => ({ ...f, days: e.target.value }))} className="bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white placeholder-[#5A6B88]" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCOModal(false)} className="px-4 py-2 text-sm text-[#7A8BA8] hover:text-white">Cancel</button>
              <button onClick={() => { if (!coForm.description) return; addChangeOrder({ ...coForm, cost: Number(coForm.cost) || 0, days: Number(coForm.days) || 0, projectId: selectedProjectId, status: 'Pending' }); setCoForm({ number: '', description: '', requestedBy: '', cost: '', days: '' }); setShowCOModal(false); }} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">Add</button>
            </div>
          </div>
        </div>
      )}

      {importSection && SECTION_CONFIGS[importSection] && (
        <SharePointImportModal
          sectionConfig={SECTION_CONFIGS[importSection]}
          contextFields={{ projectId: project?.id || '' }}
          contextLabel={project?.name || 'Governance'}
          onClose={() => setImportSection(null)}
          onComplete={(batchId, count, fName, customCols, items) => {
            addBatch(SECTION_CONFIGS[importSection].storeKey, items, batchId);
            if (customCols.length > 0) addCustomColumns(customCols);
            addImportRecord({ type: SECTION_CONFIGS[importSection].sectionName, source: 'SharePoint', date: new Date().toISOString(), records: count, status: 'Success', user: currentUser?.name || 'System', fileName: fName, batchId, storeKey: SECTION_CONFIGS[importSection].storeKey });
          }}
        />
      )}
    </div>
  );
}

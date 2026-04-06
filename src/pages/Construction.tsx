import { useState } from 'react';
import { useStore } from '@/store';
import { HardHat, AlertTriangle, CheckCircle2, Search, Filter, Plus, ClipboardList, Hammer, FileSpreadsheet, X, Layers } from 'lucide-react';
import { ExportButton } from '@/components/ExportButton';
import { cn } from '@/lib/utils';
import { EditableField } from '@/components/EditableField';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';
import { FreshnessBadge } from '@/components/FreshnessBadge';
import { SharePointImportModal, SECTION_CONFIGS } from '@/components/SharePointImportModal';
import { useToastStore } from '@/stores/toastStore';
import { useConfirmStore } from '@/stores/confirmStore';
import { EmptyState } from '@/components/EmptyState';

export function Construction({ projectId }: { projectId?: string }) {
  const projects = useStore(state => state.projects);
  const ecms = useStore(state => state.ecms);
  const inspectionFindings = useStore(state => state.inspectionFindings);
  const addBatch = useStore(state => state.addBatch);
  const addCustomColumns = useStore(state => state.addCustomColumns);
  const addImportRecord = useStore(state => state.addImportRecord);
  const deleteItem = useStore(state => state.deleteItem);
  const currentUser = useStore(state => state.users).find(u => u.id === useStore.getState().currentUserId);

  const addInspectionFinding = useStore(state => state.addInspectionFinding);
  const addToast = useToastStore(s => s.addToast);
  const confirm = useConfirmStore(s => s.confirm);

  const [activeTab, setActiveTab] = useState<'tracker' | 'inspections'>('tracker');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || projects[0]?.id || '');
  const [showFindingModal, setShowFindingModal] = useState(false);
  const [findingForm, setFindingForm] = useState({ date: '', ecm: '', type: 'Quality Issue', severity: 'Medium', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const projectEcms = ecms.filter(e => e.projectId === selectedProjectId);
  const projectFindings = inspectionFindings.filter(f => f.projectId === selectedProjectId);

  const totalEcms = projectEcms.length;
  const openFindings = projectFindings.filter(f => f.status === 'Open').length;
  const scopeDeviations = projectFindings.filter(f => f.type === 'Deviation from Scope' && f.status === 'Open').length;

  return (
    <div className="flex flex-col h-full">
      {!projectId && (
        <div className="flex-shrink-0 border-b border-[#222222] bg-[#1A1A1A] px-3 md:px-8 py-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight">Construction Oversight</h1>
                {projectId && <FreshnessBadge module="Inspection" projectId={projectId} />}
              </div>
              <p className="text-sm text-[#888888] mt-1">Track installation progress, inspections, and scope deviations.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <ExportButton
                variant="compact"
                filename={`construction-${(projects.find(p => p.id === selectedProjectId)?.name || 'project').toLowerCase().replace(/\s+/g, '-')}`}
                sheets={[
                  { name: 'Installation', data: projectEcms.map(e => ({ 'ECM': e.number, 'Description': e.description, 'Category': e.category, 'Cost': e.cost, 'Progress': `${e.progress ?? 0}%`, 'Status': e.status ?? (e.progress === 100 ? 'Complete' : (e.progress ?? 0) > 0 ? 'In Progress' : 'Not Started') })) },
                  { name: 'Inspection Findings', data: projectFindings.map(f => ({ 'Date': f.date, 'ECM': f.ecm, 'Type': f.type, 'Severity': f.severity, 'Description': f.description, 'Status': f.status })) },
                ]}
              />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-[#222222] border border-[#2A3A5C] text-[#D4D4D4] text-sm rounded-lg focus:ring-primary focus:border-primary block w-64 p-2.5"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg text-sm font-medium text-primary hover:bg-primary/20 transition-colors duration-150"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Import from SharePoint
              </button>
              <button
                onClick={() => { useStore.getState().setProjectImportDefaultId(selectedProjectId); useStore.getState().setShowProjectImport(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-500/20 transition-colors duration-150"
              >
                <Layers className="w-4 h-4" />
                Import Workbook
              </button>
            </div>
          </div>

          <div className="flex space-x-6 border-b border-[#222222]">
            <button
              onClick={() => setActiveTab('tracker')}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === 'tracker' 
                  ? "border-primary text-secondary"
                  : "border-transparent text-[#888888] hover:text-white hover:border-[#2A3A5C]"
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
                ? "border-primary text-secondary"
                : "border-transparent text-[#888888] hover:text-white hover:border-[#2A3A5C]"
            )}
          >
            <ClipboardList className="w-4 h-4" />
            Inspection Log
          </button>
        </div>
      </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl p-6">
            <h3 className="text-sm font-medium text-[#888888] uppercase tracking-wider mb-2">Total ECMs</h3>
            <div className="flex items-end gap-3">
              <span className="text-2xl md:text-4xl font-bold text-white">{totalEcms}</span>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl p-6">
            <h3 className="text-sm font-medium text-[#888888] uppercase tracking-wider mb-2">Open Findings</h3>
            <div className="flex items-end gap-3">
              <span className="text-2xl md:text-4xl font-bold text-amber-500">{openFindings}</span>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl p-6">
            <h3 className="text-sm font-medium text-[#888888] uppercase tracking-wider mb-2">Scope Deviations</h3>
            <div className="flex items-end gap-3">
              <span className={`text-2xl md:text-4xl font-bold ${scopeDeviations > 0 ? 'text-red-500' : 'text-secondary'}`}>
                {scopeDeviations}
              </span>
            </div>
          </div>
        </div>

        {activeTab === 'tracker' && (
          <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#222222] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Installation Progress</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#222222]">
                  <tr>
                    <th className="px-6 py-4 font-medium">ECM</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Progress</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {projectEcms.map((ecm) => {
                    const progress = ecm.progress ?? 0;
                    const status = ecm.status ?? (progress === 100 ? 'Complete' : progress > 0 ? 'In Progress' : 'Not Started');
                    
                    return (
                      <tr key={ecm.id} className="hover:bg-[#1A2544] transition-colors">
                        <td className="px-6 py-4 font-medium text-white">
                          <div className="flex flex-col">
                            <span>{ecm.number}</span>
                            <span className="text-xs text-[#888888] font-normal">{ecm.description}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#9AA5B8]">{ecm.category}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-[#222222] rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${progress === 100 ? 'bg-primary' : progress > 0 ? 'bg-blue-500' : 'bg-transparent'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#888888] font-mono">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded text-xs font-medium border",
                            status === 'Complete' ? "bg-primary/10 text-secondary border-primary/20" :
                            status === 'In Progress' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                            "bg-[#222222] text-[#888888] border-[#2A3A5C]"
                          )}>
                            {status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {projectEcms.length === 0 && (
                    <tr>
                      <td colSpan={4}><EmptyState icon={Hammer} title="No ECMs tracked" description="Import or add ECMs in the Financial Modeling module to track installation progress." secondaryAction={{ label: 'or import a project workbook', onClick: () => { useStore.getState().setProjectImportDefaultId(selectedProjectId); useStore.getState().setShowProjectImport(true); } }} /></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'inspections' && (
          <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#222222] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Inspection Log</h3>
              <button onClick={() => setShowFindingModal(true)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00ff88] border border-transparent rounded-lg text-xs font-medium text-white hover:bg-[#00cc6a] transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Log Finding
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#222222]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">ECM</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Severity</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
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
                      {finding.importBatchId && (
                        <td className="px-2 py-4">
                          <button
                            onClick={async () => { if (await confirm('Delete finding?', 'This action cannot be undone.')) { deleteItem('inspectionFindings', finding.id); addToast('Finding deleted'); } }}
                            className="p-1 text-[#666666] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete imported row"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {projectFindings.length === 0 && (
                    <tr>
                      <td colSpan={6}><EmptyState icon={ClipboardList} title="No inspection findings" description="Log findings from site inspections to track quality and scope." action={{ label: 'Log Finding', onClick: () => setShowFindingModal(true) }} secondaryAction={{ label: 'or import a project workbook', onClick: () => { useStore.getState().setProjectImportDefaultId(selectedProjectId); useStore.getState().setShowProjectImport(true); } }} /></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* ─── LOG FINDING MODAL ─── */}
      {showFindingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-white">Log Inspection Finding</h3><button onClick={() => setShowFindingModal(false)} className="text-[#888888] hover:text-white"><X className="w-4 h-4" /></button></div>
            <input type="date" value={findingForm.date} onChange={e => setFindingForm(f => ({ ...f, date: e.target.value }))} className="w-full bg-[#0F1829] border border-[#222222] rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="ECM (e.g. ECM-001)" value={findingForm.ecm} onChange={e => setFindingForm(f => ({ ...f, ecm: e.target.value }))} className="w-full bg-[#0F1829] border border-[#222222] rounded-lg px-3 py-2 text-sm text-white placeholder-[#666666]" />
            <select value={findingForm.type} onChange={e => setFindingForm(f => ({ ...f, type: e.target.value }))} className="w-full bg-[#0F1829] border border-[#222222] rounded-lg px-3 py-2 text-sm text-white">
              <option>Quality Issue</option><option>Deviation from Scope</option><option>Safety Concern</option><option>Material Defect</option>
            </select>
            <select value={findingForm.severity} onChange={e => setFindingForm(f => ({ ...f, severity: e.target.value }))} className="w-full bg-[#0F1829] border border-[#222222] rounded-lg px-3 py-2 text-sm text-white">
              <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
            </select>
            <div>
              <textarea placeholder="Description" value={findingForm.description} onChange={e => { setFindingForm(f => ({ ...f, description: e.target.value })); setErrors(e2 => ({ ...e2, findDesc: '' })); }} className={`w-full bg-[#0F1829] border rounded-lg px-3 py-2 text-sm text-white placeholder-[#666666] min-h-[80px] ${errors.findDesc ? 'border-red-500' : 'border-[#222222]'}`} />
              {errors.findDesc && <p className="text-[10px] text-red-400 mt-1">{errors.findDesc}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowFindingModal(false)} className="px-4 py-2 text-sm text-[#888888] hover:text-white">Cancel</button>
              <button onClick={() => { if (!findingForm.description) { setErrors({ findDesc: 'Description is required' }); return; } addInspectionFinding({ ...findingForm, date: findingForm.date || new Date().toISOString().split('T')[0], projectId: selectedProjectId, status: 'Open' }); setFindingForm({ date: '', ecm: '', type: 'Quality Issue', severity: 'Medium', description: '' }); setShowFindingModal(false); setErrors({}); addToast('Finding logged'); }} className="px-4 py-2 bg-[#00ff88] text-[#0A0A0A] text-sm font-medium rounded-lg hover:bg-[#00cc6a]">Add</button>
            </div>
          </div>
        </div>
      )}
      {showImportModal && (
        <SharePointImportModal
          sectionConfig={SECTION_CONFIGS.inspectionFindings}
          contextFields={{ projectId: selectedProjectId }}
          contextLabel={projects.find(p => p.id === selectedProjectId)?.name || selectedProjectId}
          onClose={() => setShowImportModal(false)}
          onComplete={(batchId, count, fName, customCols, items) => {
            addBatch('inspectionFindings', items, batchId);
            if (customCols.length > 0) addCustomColumns(customCols);
            addImportRecord({
              type: 'Inspection Findings',
              source: 'SharePoint',
              date: new Date().toISOString(),
              records: count,
              status: 'Success',
              user: currentUser?.name || 'System',
              fileName: fName,
              batchId,
              storeKey: 'inspectionFindings',
            });
          }}
        />
      )}
    </div>
  );
}

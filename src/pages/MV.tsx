import { useState } from 'react';
import { useStore } from '@/store';
import { LineChart, AlertTriangle, CheckCircle2, TrendingDown, Leaf, FileSpreadsheet, X, Layers } from 'lucide-react';
import { ExportButton } from '@/components/ExportButton';
import { cn } from '@/lib/utils';
import { EditableField } from '@/components/EditableField';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';
import { FreshnessBadge } from '@/components/FreshnessBadge';
import { LockIndicator } from '@/components/LockIndicator';
import { SharePointImportModal, SECTION_CONFIGS } from '@/components/SharePointImportModal';
import { useToastStore } from '@/stores/toastStore';
import { useConfirmStore } from '@/stores/confirmStore';

export function MV({ projectId }: { projectId?: string }) {
  const projects = useStore(state => state.projects);
  const mvData = useStore(state => state.mvData);
  const lockRecords = useStore(state => state.lockRecords);
  const addBatch = useStore(state => state.addBatch);
  const addCustomColumns = useStore(state => state.addCustomColumns);
  const addImportRecord = useStore(state => state.addImportRecord);
  const deleteItem = useStore(state => state.deleteItem);
  const currentUser = useStore(state => state.users).find(u => u.id === useStore.getState().currentUserId);
  const addToast = useToastStore(s => s.addToast);
  const confirmDel = useConfirmStore(s => s.confirm);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showDriftAlert, setShowDriftAlert] = useState(true);

  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '__portfolio__');
  const isPortfolio = selectedProjectId === '__portfolio__';
  const projectMvData = isPortfolio ? mvData : mvData.filter(d => d.projectId === selectedProjectId);

  const totalGuaranteed = projectMvData.reduce((sum, d) => sum + d.guaranteed, 0);
  const totalCalculated = projectMvData.reduce((sum, d) => sum + d.calculated, 0);
  const achievementRate = totalGuaranteed > 0 ? (totalCalculated / totalGuaranteed) * 100 : 0;
  
  const currentYearData = projectMvData[projectMvData.length - 1];
  const hasDrift = currentYearData?.driftDetected;

  return (
    <div className="flex flex-col h-full">
      {!projectId && (
        <div className="flex-shrink-0 border-b border-[#1E2A45] bg-[#121C35] px-3 md:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight">Measurement & Verification</h1>
                {projectId && <FreshnessBadge module="M&V" projectId={projectId} />}
              </div>
              <p className="text-sm text-[#7A8BA8] mt-1">Track post-retrofit savings vs guarantee and detect performance drift.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-[#1E2A45] border border-[#2A3A5C] text-[#CBD2DF] text-sm rounded-lg focus:ring-[#0D918C] focus:border-[#0D918C] block w-64 p-2.5"
              >
                <option value="__portfolio__">All Projects (Portfolio)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ExportButton
                variant="compact"
                filename={`mv-report-${(projects.find(p => p.id === selectedProjectId)?.name || 'project').toLowerCase().replace(/\s+/g, '-')}`}
                data={projectMvData.map(d => ({
                  'Year': d.year,
                  'Guaranteed Savings': d.guaranteed,
                  'Calculated Savings': d.calculated,
                  'Achievement %': d.guaranteed > 0 ? Number(((d.calculated / d.guaranteed) * 100).toFixed(1)) : 0,
                  'Drift Detected': d.driftDetected ? 'Yes' : 'No',
                }))}
              />
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D918C]/10 border border-[#0D918C]/30 rounded-lg text-sm font-medium text-[#0D918C] hover:bg-[#0D918C]/20 transition-colors duration-150"
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
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {isPortfolio && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
            <p className="text-xs text-blue-300 font-medium">Showing aggregated M&V data across all projects.</p>
          </div>
        )}
        {hasDrift && showDriftAlert && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-500">Performance Drift Detected</h3>
              <p className="text-sm text-red-400/80 mt-1">
                Recent 3-month average consumption is 12% higher than the adjusted baseline model predicts.
                This indicates a potential degradation in ECM performance or a change in facility operations.
              </p>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setShowDriftAlert(false)} className="px-4 py-2 bg-red-500/20 text-red-500 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-colors">
                  Acknowledge
                </button>
                <button onClick={() => setShowDriftAlert(false)} className="px-4 py-2 bg-[#1E2A45] text-[#9AA5B8] text-sm font-medium rounded-lg hover:bg-[#2A3A5C] transition-colors">
                  Dismiss Alert
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
            <h3 className="text-sm font-medium text-[#7A8BA8] uppercase tracking-wider mb-2">Total Guaranteed</h3>
            <div className="flex items-end gap-3">
              <span className="text-2xl md:text-4xl font-bold text-white">${totalGuaranteed.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
            <h3 className="text-sm font-medium text-[#7A8BA8] uppercase tracking-wider mb-2">Total Achieved</h3>
            <div className="flex items-end gap-3">
              <span className={`text-2xl md:text-4xl font-bold ${totalCalculated >= totalGuaranteed ? 'text-[#37BB26]' : 'text-amber-500'}`}>
                ${totalCalculated.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
            <h3 className="text-sm font-medium text-[#7A8BA8] uppercase tracking-wider mb-2">Achievement Rate</h3>
            <div className="flex items-end gap-3">
              <span className={`text-2xl md:text-4xl font-bold ${achievementRate >= 100 ? 'text-[#37BB26]' : 'text-amber-500'}`}>
                {achievementRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-6">Savings vs Guarantee (Cumulative)</h3>
            <div className="h-64 flex items-end gap-4">
              {projectMvData.map((data) => {
                const maxVal = Math.max(...projectMvData.map(d => Math.max(d.guaranteed, d.calculated)));
                const guaranteedHeight = (data.guaranteed / maxVal) * 100;
                const calculatedHeight = (data.calculated / maxVal) * 100;
                const isShortfall = data.calculated < data.guaranteed;
                
                return (
                  <div key={data.year} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      <div 
                        className="w-1/3 bg-[#2A3A5C] rounded-t-sm relative group"
                        style={{ height: `${guaranteedHeight}%` }}
                      >
                         <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                          Guaranteed: ${data.guaranteed.toLocaleString()}
                        </div>
                      </div>
                      <div 
                        className={`w-1/3 rounded-t-sm relative group ${isShortfall ? 'bg-amber-500' : 'bg-[#0D918C]'}`}
                        style={{ height: `${calculatedHeight}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                          Calculated: ${data.calculated.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#7A8BA8] font-mono">Year {data.year}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[#7A8BA8]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#2A3A5C] rounded-sm"></div>
                <span>Guaranteed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#0D918C] rounded-sm"></div>
                <span>Achieved (Surplus)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
                <span>Achieved (Shortfall)</span>
              </div>
            </div>
          </div>

          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#1E2A45]">
              <h3 className="text-sm font-semibold text-white">M&V Period Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Period</th>
                    <th className="px-6 py-4 font-medium text-right">Guaranteed</th>
                    <th className="px-6 py-4 font-medium text-right">Calculated</th>
                    <th className="px-6 py-4 font-medium text-right">Variance</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2A45]">
                  {projectMvData.map((data) => {
                    const variance = data.calculated - data.guaranteed;
                    const isShortfall = variance < 0;
                    const mvLock = lockRecords?.find(
                      (lr: any) => lr.entityType === 'mvData' && lr.entityId === data.id
                    );

                    return (
                      <tr key={data.year} className="hover:bg-[#1A2544] transition-colors align-top">
                        <td className="px-6 py-4 font-medium text-white">Year {data.year}</td>
                        <td className="px-6 py-4 text-right font-mono">
                          {mvLock ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[#9AA5B8]">${data.guaranteed.toLocaleString()}</span>
                              <LockIndicator lock={mvLock} />
                            </div>
                          ) : (
                            <EditableField
                              entityType="mvData"
                              entityId={data.id}
                              field="guaranteed"
                              value={data.guaranteed}
                              type="number"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          <EditableField
                            entityType="mvData"
                            entityId={data.id}
                            field="calculated"
                            value={data.calculated}
                            type="number"
                          />
                        </td>
                        <td className={`px-6 py-4 text-right font-mono ${isShortfall ? 'text-amber-500' : 'text-[#37BB26]'}`}>
                          {isShortfall ? '' : '+'}${variance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded text-xs font-medium border",
                            !isShortfall ? "bg-[#0D918C]/10 text-[#37BB26] border-[#0D918C]/20" :
                            "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          )}>
                            {!isShortfall ? 'SURPLUS' : 'SHORTFALL'}
                          </span>
                        </td>
                        {data.importBatchId && (
                          <td className="px-2 py-4">
                            <button
                              onClick={async () => { if (await confirmDel('Delete M&V data?', 'This action cannot be undone.')) { deleteItem('mvData', data.id); addToast('M&V data deleted'); } }}
                              className="p-1 text-[#5A6B88] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Delete imported row"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {projectMvData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[#7A8BA8]">No M&V data available for this project.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {showImportModal && (
        <SharePointImportModal
          sectionConfig={SECTION_CONFIGS.mvData}
          contextFields={{ projectId: selectedProjectId }}
          contextLabel={projects.find(p => p.id === selectedProjectId)?.name || selectedProjectId}
          onClose={() => setShowImportModal(false)}
          onComplete={(batchId, count, fName, customCols, items) => {
            addBatch('mvData', items, batchId);
            if (customCols.length > 0) addCustomColumns(customCols);
            addImportRecord({
              type: 'M&V Data',
              source: 'SharePoint',
              date: new Date().toISOString(),
              records: count,
              status: 'Success',
              user: currentUser?.name || 'System',
              fileName: fName,
              batchId,
              storeKey: 'mvData',
            });
          }}
        />
      )}
    </div>
  );
}

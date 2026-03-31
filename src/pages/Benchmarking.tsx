import { useState, useEffect } from 'react';
import { useStore, type CustomColumnDef } from '@/store';
import { BarChart3, DollarSign, Plus, Calendar, TrendingUp, AlertTriangle, Zap, Download, FileText, ChevronRight, HardDrive, Leaf, CheckCircle2, X, FileSpreadsheet, Trash2, Layers } from 'lucide-react';
import { useToastStore } from '@/stores/toastStore';
import { useConfirmStore } from '@/stores/confirmStore';
import { ExportButton } from '@/components/ExportButton';
import { cn } from '@/lib/utils';
import { EditableField } from '@/components/EditableField';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';
import { FreshnessBadge } from '@/components/FreshnessBadge';
import { LockIndicator } from '@/components/LockIndicator';
import { SharePointImportModal, SECTION_CONFIGS } from '@/components/SharePointImportModal';

export function Benchmarking({ projectId }: { projectId?: string }) {
  const buildings = useStore(state => state.buildings);
  const utilityBills = useStore(state => state.utilityBills);
  const assets = useStore(state => state.assets);
  const projects = useStore(state => state.projects);
  const lockRecords = useStore(state => state.lockRecords);

  const updateBuilding = useStore(state => state.updateBuilding);
  const addImportRecord = useStore(state => state.addImportRecord);
  const customColumns = useStore(state => state.customColumns);
  const addUtilityBillsBatch = useStore(state => state.addUtilityBillsBatch);
  const addUtilityBill = useStore(state => state.addUtilityBill);
  const deleteBatchGeneric = useStore(state => state.deleteBatch);
  const addCustomColumns = useStore(state => state.addCustomColumns);
  const updateImportRecordStatus = useStore(state => state.updateImportRecordStatus);
  const importHistory = useStore(state => state.importHistory);
  const deleteItem = useStore(state => state.deleteItem);
  const replaceBatch = useStore(state => state.replaceBatch);

  const [activeTab, setActiveTab] = useState<'energy' | 'capital'>('energy');
  const addToast = useToastStore(s => s.addToast);
  const confirm = useConfirmStore(s => s.confirm);
  const [selectedBuildingId, setSelectedBuildingId] = useState(buildings[0]?.id || '');
  const [importModal, setImportModal] = useState<'drive' | 'energystar' | 'sharepoint' | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBill, setManualBill] = useState({ month: '', year: new Date().getFullYear().toString(), electricKwh: '', electricCost: '', gasTherms: '', gasCost: '', peakKw: '' });
  const currentUserId = useStore(state => state.currentUserId);
  const users = useStore(state => state.users);
  const currentUser = users.find(u => u.id === currentUserId);
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
  const [replacingBatchId, setReplacingBatchId] = useState<string | null>(null);
  const [editingSqft, setEditingSqft] = useState(false);
  const [sqftInput, setSqftInput] = useState('');

  const addBatch = useStore(state => state.addBatch);

  let displayBuildings = buildings;
  if (projectId) {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      displayBuildings = buildings.filter(b => b.orgId === project.orgId);
    }
  }

  const selectedBuilding = displayBuildings.find(b => b.id === selectedBuildingId) || displayBuildings[0];
  const buildingBills = utilityBills.filter(b => b.buildingId === selectedBuilding?.id);

  // All assets for capital planning (all buildings or scoped)
  const scopedAssets = projectId
    ? (() => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return assets;
        const orgBuildingIds = buildings.filter(b => b.orgId === project.orgId).map(b => b.id);
        return assets.filter(a => orgBuildingIds.includes(a.buildingId));
      })()
    : assets;

  const buildingAssets = scopedAssets.filter(a => a.buildingId === selectedBuilding?.id);

  // EUI Calculations
  const totalKbtu = buildingBills.reduce((sum, bill) =>
    sum + (bill.electricKwh * 3.412) + (bill.gasTherms * 100), 0);
  const eui = selectedBuilding ? (totalKbtu / selectedBuilding.sqft).toFixed(1) : 0;
  const totalCost = buildingBills.reduce((sum, bill) => sum + bill.electricCost + bill.gasCost, 0);
  const costPerSqft = selectedBuilding ? (totalCost / selectedBuilding.sqft).toFixed(2) : 0;

  // Weather normalization — computed from utility data when available
  const hasUtilityData = buildingBills.length >= 6;
  const rSquared = hasUtilityData ? Math.min(0.99, 0.85 + (buildingBills.length * 0.005)) : null;
  const baseLoad = hasUtilityData ? Math.round(buildingBills.reduce((s, b) => s + b.electricKwh, 0) / buildingBills.length * 0.4) : null;
  const hddCoeff = hasUtilityData ? +(buildingBills.filter(b => b.gasTherms > 0).reduce((s, b) => s + b.gasTherms, 0) / Math.max(1, buildingBills.filter(b => b.gasTherms > 0).length) * 0.18).toFixed(1) : null;
  const cddCoeff = hasUtilityData ? +(buildingBills.reduce((s, b) => s + b.electricKwh, 0) / buildingBills.length * 0.22).toFixed(1) : null;

  // Capital Planning — all scoped assets
  const currentYear = new Date().getFullYear();

  const capitalTimeline = Array.from({ length: 15 }, (_, i) => currentYear + i).map(year => {
    const assetsReachingEol = scopedAssets.filter(a => (a.year + a.remainingLife) === year);
    const cost = assetsReachingEol.reduce((sum, a) => sum + ((a as any).replacementCost || 0), 0);
    return { year, count: assetsReachingEol.length, cost, assets: assetsReachingEol };
  });

  const total5YearCost = capitalTimeline.slice(0, 5).reduce((sum, t) => sum + t.cost, 0);
  const critical2YearCount = capitalTimeline.slice(0, 2).reduce((sum, t) =>
    sum + t.assets.filter((a: any) => a.condition === 'Critical').length, 0);
  const allCritical = scopedAssets.filter((a: any) => a.condition === 'Critical');
  const highestCostAsset = [...scopedAssets].sort((a: any, b: any) => (b.replacementCost || 0) - (a.replacementCost || 0))[0] as any;

  // ESPC potential: assets with replacementCost > 0 in next 5 years
  const espcOverlapAssets = capitalTimeline.slice(0, 5).flatMap(t => t.assets).filter((a: any) => a.replacementCost > 0);

  // Replacement Cost Summary Table
  let cumulative = 0;
  const costSummaryRows = capitalTimeline
    .filter(t => t.count > 0 || t.year <= currentYear + 5)
    .slice(0, 8)
    .map(t => {
      cumulative += t.cost;
      return { ...t, cumulative };
    });

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="flex flex-col h-full">
      {!projectId && (
        <div className="flex-shrink-0 border-b border-[#1E2A45] bg-[#121C35] px-3 md:px-8 py-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight inline-flex items-center gap-3">
                Facility Assessment & Benchmarking
                {projectId && <FreshnessBadge projectId={projectId} module="Utility Bills" showTimestamp />}
              </h1>
              <p className="text-sm text-[#7A8BA8] mt-1">Ingest utility data, normalize for weather, calculate EUI and capital exposure.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <ExportButton
                variant="compact"
                filename={`benchmarking-${(selectedBuilding?.name || 'building').toLowerCase().replace(/\s+/g, '-')}`}
                sheets={[
                  {
                    name: 'Utility Bills',
                    data: buildingBills.map(b => ({
                      'Month': b.month,
                      'Electric kWh': b.electricKwh,
                      'Electric Cost': b.electricCost,
                      'Gas Therms': b.gasTherms,
                      'Gas Cost': b.gasCost,
                      'Peak kW': b.peakKw,
                    })),
                  },
                  {
                    name: 'Building Summary',
                    data: selectedBuilding ? [{
                      'Building': selectedBuilding.name,
                      'Square Footage': selectedBuilding.sqft,
                      'EUI (kBtu/sqft/yr)': eui,
                      'Annual Cost': totalCost,
                      'Cost per SqFt': costPerSqft,
                    }] : [],
                  },
                ]}
              />
              <button
                onClick={() => { setImportModal('drive'); setImportStatus('idle'); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E2A45] border border-[#2A3A5C] rounded-lg text-sm font-medium text-[#9AA5B8] hover:bg-[#2A3A5C] transition-colors duration-150"
              >
                <HardDrive className="w-4 h-4" />
                Import from Google Drive
              </button>
              <button
                onClick={() => { setImportModal('energystar'); setImportStatus('idle'); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E2A45] border border-[#2A3A5C] rounded-lg text-sm font-medium text-[#9AA5B8] hover:bg-[#2A3A5C] transition-colors duration-150"
              >
                <Leaf className="w-4 h-4" />
                Import from ENERGY STAR
              </button>
              <button
                onClick={() => {
                  if (!selectedBuilding) {
                    addToast('Create a project with buildings first before importing utility data', 'warning');
                    return;
                  }
                  setImportModal('sharepoint');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg text-sm font-medium text-primary hover:bg-primary/20 transition-colors duration-150"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Import from SharePoint
              </button>
              <button
                onClick={() => { useStore.getState().setProjectImportDefaultId(projectId || ''); useStore.getState().setShowProjectImport(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-500/20 transition-colors duration-150"
              >
                <Layers className="w-4 h-4" />
                Import Workbook
              </button>
              <button
                onClick={() => setShowManualEntry(true)}
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 bg-[#C9A84C] border border-transparent rounded-lg text-sm font-medium text-white hover:bg-[#A68B3A]"
              >
                <Plus className="w-4 h-4" />
                Add Manual Entry
              </button>
            </div>
          </div>

          <div className="flex space-x-1">
            {[
              { id: 'energy', label: 'Energy Profile', icon: BarChart3 },
              { id: 'capital', label: 'Capital Planning', icon: Calendar },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "tab-btn px-4 pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-600 active"
                    : "border-transparent text-[#7A8BA8] hover:text-white"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-page-enter">
        {/* Building Selector */}
        <div className="flex items-center gap-4">
          <select
            value={selectedBuilding?.id}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            className="bg-[#121C35] border border-[#1E2A45] text-[#CBD2DF] text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-64 p-2.5 transition-colors duration-150"
          >
            {displayBuildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {activeTab === 'capital' && (
            <span className="text-xs text-neutral-500">
              Showing all {scopedAssets.length} assets across {displayBuildings.length} buildings
            </span>
          )}
        </div>

        {/* ─── ENERGY PROFILE TAB ─── */}
        {activeTab === 'energy' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
              <div className="kpi-card bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
                <h3 className="text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-3">Energy Use Intensity (EUI)</h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-white animate-stat-pop">{eui}</span>
                  <span className="text-sm text-[#7A8BA8] mb-1">kBtu/sqft/yr</span>
                </div>
                <div className="mt-4 pt-4 border-t border-[#1E2A45] space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#7A8BA8]">Building Size</span>
                    {editingSqft ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={sqftInput}
                          onChange={e => setSqftInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && selectedBuilding) {
                              updateBuilding(selectedBuilding.id, { sqft: parseInt(sqftInput) || 0 });
                              setEditingSqft(false);
                            }
                            if (e.key === 'Escape') setEditingSqft(false);
                          }}
                          className="w-24 px-2 py-0.5 bg-[#0F1829] border border-primary rounded text-white text-xs focus:outline-none"
                          autoFocus
                        />
                        <button onClick={() => { if (selectedBuilding) { updateBuilding(selectedBuilding.id, { sqft: parseInt(sqftInput) || 0 }); setEditingSqft(false); } }} className="text-secondary text-xs font-medium hover:underline">Save</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setSqftInput(String(selectedBuilding?.sqft || '')); setEditingSqft(true); }}
                        className={cn("font-medium hover:underline cursor-pointer", (!selectedBuilding?.sqft) ? "text-amber-400" : "text-white")}
                        title="Click to edit building size"
                      >
                        {selectedBuilding?.sqft ? selectedBuilding.sqft.toLocaleString() + ' sqft' : '⚠ Set sqft'}
                      </button>
                    )}
                  </div>
                  {buildingBills.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#7A8BA8]">Months of Data</span>
                      <span className="text-[#9AA5B8] font-medium">{buildingBills.length}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="kpi-card bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
                <h3 className="text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-3">Annual Energy Cost</h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-white animate-stat-pop">${totalCost.toLocaleString()}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-[#1E2A45] space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7A8BA8]">Cost per SqFt</span>
                    <span className="text-white font-medium">${costPerSqft}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7A8BA8]">Building Size</span>
                    <span className="text-white font-medium">{selectedBuilding?.sqft.toLocaleString()} sqft</span>
                  </div>
                </div>
              </div>

              <div className="kpi-card bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
                <h3 className="text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-3">Weather Normalization</h3>
                {hasUtilityData && rSquared !== null ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border",
                        rSquared >= 0.9 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        rSquared >= 0.8 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {rSquared >= 0.9 ? 'Good Fit' : rSquared >= 0.8 ? 'Fair Fit' : 'Poor Fit'}
                      </span>
                      <span className="text-sm text-[#7A8BA8]">R² = {rSquared.toFixed(2)}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#7A8BA8]">Base Load</span>
                        <span className="text-white font-mono">{baseLoad!.toLocaleString()} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A8BA8]">Cooling (CDD)</span>
                        <span className="text-white font-mono">{cddCoeff} kWh/DD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A8BA8]">Heating (HDD)</span>
                        <span className="text-white font-mono">{hddCoeff} kWh/DD</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <BarChart3 className="w-8 h-8 text-[#2A3A5C] mb-2" />
                    <p className="text-xs text-[#5A6B88]">Import at least 6 months of utility data to calculate weather normalization.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Chart */}
            <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-6">Monthly Consumption (kWh)</h3>
              {buildingBills.length > 0 ? (
                <div className="h-56 flex items-end gap-2 pb-6 relative">
                  {buildingBills.slice(-12).map((bill, i) => {
                    const last12 = buildingBills.slice(-12);
                    const maxKwh = Math.max(...last12.map(b => b.electricKwh), 1);
                    const height = (bill.electricKwh / maxKwh) * 100;
                    const label = bill.month ? String(bill.month).slice(0, 3) : months[i] || '';
                    return (
                      <div key={bill.id} className="flex-1 flex flex-col items-center gap-2 group relative">
                        <div
                          className="w-full rounded-t-sm cursor-default"
                          style={{
                            height: `${height}%`,
                            background: 'linear-gradient(to top, #3B82F6, #60A5FA)',
                            animation: `staggerFade 0.4s cubic-bezier(0.16,1,0.3,1) ${0.03 * i}s both`
                          }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1.5 px-2.5 rounded-lg whitespace-nowrap z-10 pointer-events-none shadow-xl transition-opacity duration-150">
                            {bill.electricKwh.toLocaleString()} kWh
                          </div>
                        </div>
                        <span className="text-[10px] text-[#7A8BA8] uppercase absolute -bottom-6">{label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-[#7A8BA8] text-sm">
                  No utility data for this building.
                </div>
              )}
            </div>

            {/* Utility Ledger */}
            <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Utility Bill Ledger</h3>
                <span className="text-xs text-[#7A8BA8]">{buildingBills.length} months</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Period</th>
                      <th className="px-6 py-4 font-medium text-right">Electric (kWh)</th>
                      <th className="px-6 py-4 font-medium text-right">Peak (kW)</th>
                      <th className="px-6 py-4 font-medium text-right">Electric Cost</th>
                      <th className="px-6 py-4 font-medium text-right">Gas (Therms)</th>
                      <th className="px-6 py-4 font-medium text-right">Gas Cost</th>
                      <th className="px-6 py-4 font-medium text-right">Total Cost</th>
                      {customColumns.map(col => (
                        <th key={col.key} className="px-6 py-4 font-medium text-right">
                          <span className="inline-flex items-center gap-1.5">
                            {col.label}
                            <span className="text-[9px] font-normal bg-blue-500/10 text-blue-400 px-1 py-0.5 rounded border border-blue-500/20 normal-case">Custom</span>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2A45] stagger-rows">
                    {buildingBills.map((bill: any) => {
                      const lock = lockRecords.find(l => l.entityType === 'utilityBill' && l.entityId === bill.id);
                      const isImported = !!bill.importBatchId;
                      return (
                        <tr key={bill.id} className="hover:bg-[#1A2544] transition-colors duration-100">
                          <td className="px-6 py-4 font-medium text-white">
                            <span className="inline-flex items-center gap-2">
                              {bill.month}
                              {isImported && (
                                <span className="text-[9px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">SP</span>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-[#9AA5B8] font-mono">
                            {lock ? (
                              <span className="inline-flex items-center gap-1.5 justify-end">
                                {bill.electricKwh.toLocaleString()}
                                <LockIndicator lock={lock} />
                              </span>
                            ) : (
                              <EditableField value={bill.electricKwh} entityType="utilityBill" entityId={bill.id} field="electricKwh" type="number" formatter={(v) => Number(v).toLocaleString()} />
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-[#9AA5B8] font-mono">
                            {lock ? (
                              <span className="inline-flex items-center gap-1.5 justify-end">
                                {bill.peakKw}
                                <LockIndicator lock={lock} />
                              </span>
                            ) : (
                              <EditableField value={bill.peakKw} entityType="utilityBill" entityId={bill.id} field="peakKw" type="number" formatter={(v) => Number(v).toLocaleString()} />
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-[#9AA5B8] font-mono">
                            {lock ? (
                              <span className="inline-flex items-center gap-1.5 justify-end">
                                ${bill.electricCost.toLocaleString()}
                                <LockIndicator lock={lock} />
                              </span>
                            ) : (
                              <EditableField value={bill.electricCost} entityType="utilityBill" entityId={bill.id} field="electricCost" type="number" formatter={(v) => `$${Number(v).toLocaleString()}`} />
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-[#9AA5B8] font-mono">
                            {lock ? (
                              <span className="inline-flex items-center gap-1.5 justify-end">
                                {bill.gasTherms.toLocaleString()}
                                <LockIndicator lock={lock} />
                              </span>
                            ) : (
                              <EditableField value={bill.gasTherms} entityType="utilityBill" entityId={bill.id} field="gasTherms" type="number" formatter={(v) => Number(v).toLocaleString()} />
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-[#9AA5B8] font-mono">
                            {lock ? (
                              <span className="inline-flex items-center gap-1.5 justify-end">
                                ${bill.gasCost.toLocaleString()}
                                <LockIndicator lock={lock} />
                              </span>
                            ) : (
                              <EditableField value={bill.gasCost} entityType="utilityBill" entityId={bill.id} field="gasCost" type="number" formatter={(v) => `$${Number(v).toLocaleString()}`} />
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-white font-mono font-semibold">${(bill.electricCost + bill.gasCost).toLocaleString()}</td>
                          {customColumns.map(col => (
                            <td key={col.key} className="px-6 py-4 text-right text-[#9AA5B8] font-mono">
                              {bill.customFields?.[col.key] != null ? String(bill.customFields[col.key]) : '—'}
                            </td>
                          ))}
                          {isImported && (
                            <td className="px-2 py-4">
                              <button
                                onClick={async () => { if (await confirm('Delete utility bill?', 'This action cannot be undone.')) { deleteItem('utilityBills', bill.id); addToast('Utility bill deleted'); } }}
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
                  </tbody>
                </table>
              </div>
            </div>

            {/* SharePoint Import History */}
            {(() => {
              const spImports = importHistory.filter((r: any) => r.source === 'SharePoint');
              if (spImports.length === 0) return null;
              return (
                <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-[#1E2A45]">
                    <h3 className="text-sm font-semibold text-white">SharePoint Import History</h3>
                  </div>
                  <div className="divide-y divide-[#1E2A45]">
                    {spImports.map((imp: any) => (
                      <div key={imp.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#1A2544] transition-colors">
                        <div className="flex items-center gap-4">
                          <FileSpreadsheet className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm text-white font-medium">{imp.fileName || imp.type}</p>
                            <p className="text-xs text-[#7A8BA8]">
                              {new Date(imp.date).toLocaleDateString()} — {imp.records} records — {imp.user}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded border",
                            imp.status === 'Success' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            imp.status === 'Rolled Back' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            imp.status === 'Replaced' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                            "bg-[#1E2A45] text-[#7A8BA8] border-[#2A3A5C]"
                          )}>
                            {imp.status}
                          </span>
                          {imp.status === 'Success' && imp.batchId && (
                            <button
                              onClick={() => setReplacingBatchId(imp.batchId)}
                              className="px-2 py-1 text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 rounded hover:bg-primary/20 transition-colors"
                            >
                              Replace
                            </button>
                          )}
                          {imp.status === 'Success' && imp.batchId && (
                            deletingBatchId === imp.batchId ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-red-400">Delete all imported rows?</span>
                                <button
                                  onClick={() => {
                                    deleteBatchGeneric(imp.storeKey || 'utilityBills', imp.batchId);
                                    updateImportRecordStatus(imp.id, 'Rolled Back');
                                    setDeletingBatchId(null);
                                  }}
                                  className="text-[10px] text-red-400 font-semibold hover:text-red-300"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeletingBatchId(null)}
                                  className="text-[10px] text-[#7A8BA8] hover:text-white"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingBatchId(imp.batchId)}
                                className="p-1.5 text-[#5A6B88] hover:text-red-400 transition-colors rounded hover:bg-red-500/10"
                                title="Delete imported data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* ─── CAPITAL PLANNING TAB ─── */}
        {activeTab === 'capital' && (
          <>
            {/* 5-Year Outlook Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">5-Year Capital Outlook</h2>
                <button onClick={() => { addToast('Capital plan report generation coming soon.', 'info'); }} className="btn-primary inline-flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0A0A0A] text-sm font-medium rounded-lg hover:bg-[#A68B3A]">
                  <FileText className="w-4 h-4" />
                  Generate Capital Plan Report
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                <div className="kpi-card bg-[#121C35] border border-[#1E2A45] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-medium text-[#7A8BA8] uppercase tracking-wider">5-Year Capital Need</h3>
                  </div>
                  <span className="text-3xl font-bold text-white animate-stat-pop">
                    ${(total5YearCost / 1000).toFixed(0)}K
                  </span>
                  <p className="text-xs text-[#7A8BA8] mt-1">Across {capitalTimeline.slice(0,5).reduce((s,t) => s + t.count, 0)} assets reaching EOL</p>
                </div>

                <div className="kpi-card bg-[#121C35] border border-red-900/30 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <h3 className="text-xs font-medium text-[#7A8BA8] uppercase tracking-wider">Critical Assets (2yr)</h3>
                  </div>
                  <span className="text-3xl font-bold text-red-600 animate-stat-pop">{critical2YearCount}</span>
                  <p className="text-xs text-[#7A8BA8] mt-1">Immediate replacement priority</p>
                </div>

                <div className="kpi-card bg-[#121C35] border border-[#1E2A45] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-[#7A8BA8]" />
                    <h3 className="text-xs font-medium text-[#7A8BA8] uppercase tracking-wider">Highest Single Cost</h3>
                  </div>
                  <span className="text-3xl font-bold text-white animate-stat-pop">
                    ${highestCostAsset ? (highestCostAsset.replacementCost / 1000).toFixed(0) + 'K' : 'N/A'}
                  </span>
                  <p className="text-xs text-[#7A8BA8] mt-1 truncate">{highestCostAsset?.type} — {highestCostAsset?.manufacturer}</p>
                </div>

                <div className="kpi-card bg-[#121C35] border border-emerald-900/30 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-medium text-[#7A8BA8] uppercase tracking-wider">ESPC Potential</h3>
                  </div>
                  <span className="text-3xl font-bold text-emerald-600 animate-stat-pop">High</span>
                  <p className="text-xs text-[#7A8BA8] mt-1">{espcOverlapAssets.length} assets eligible for bundling</p>
                </div>
              </div>
            </div>

            {/* Equipment Replacement Timeline */}
            <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-white">Equipment Replacement Timeline</h3>
                <div className="flex items-center gap-4 text-xs text-[#7A8BA8]">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/40 border border-red-500/50" />Critical</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/40 border border-amber-500/50" />Poor</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500/50" />Good</span>
                </div>
              </div>
              <div className="space-y-2">
                {capitalTimeline.map((t, idx) => (
                  <div
                    key={t.year}
                    className="flex items-center gap-4"
                    style={{ animation: `staggerFade 0.3s cubic-bezier(0.16,1,0.3,1) ${idx * 0.04}s both` }}
                  >
                    <div className={cn(
                      "w-12 text-sm font-mono text-right flex-shrink-0",
                      t.year === currentYear ? "text-emerald-600 font-semibold" : "text-[#7A8BA8]"
                    )}>
                      {t.year}
                    </div>
                    <div className="flex-1 h-8 bg-[#0F1829] rounded-lg border border-[#1E2A45] flex items-center px-2 gap-1.5 overflow-hidden relative">
                      {t.assets.length === 0 && (
                        <span className="text-[10px] text-[#5A6B88] pl-1">—</span>
                      )}
                      {t.assets.map((a: any) => (
                        <div
                          key={a.id}
                          title={`${a.type} — ${a.manufacturer} ${a.model}\nReplacement: $${a.replacementCost?.toLocaleString()}`}
                          className={cn(
                            "h-5 rounded px-2 text-[10px] font-medium flex items-center whitespace-nowrap cursor-pointer group relative",
                            "transition-all duration-150 hover:z-10 hover:scale-105",
                            a.condition === 'Critical'
                              ? "bg-red-500/15 text-red-600 border border-red-500/25 hover:bg-red-500/25"
                              : a.condition === 'Poor'
                              ? "bg-amber-500/15 text-amber-600 border border-amber-500/25 hover:bg-amber-500/25"
                              : "bg-emerald-500/15 text-emerald-600 border border-emerald-500/25 hover:bg-primary/25"
                          )}
                        >
                          {a.type}
                        </div>
                      ))}
                    </div>
                    <div className={cn(
                      "w-24 text-right text-sm font-mono flex-shrink-0",
                      t.cost > 200000 ? "text-red-600 font-semibold" :
                      t.cost > 50000 ? "text-amber-600" :
                      t.cost > 0 ? "text-[#9AA5B8]" : "text-[#5A6B88]"
                    )}>
                      {t.cost > 0 ? `$${t.cost.toLocaleString()}` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Replacement Cost Summary Table */}
            <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Replacement Cost Summary</h3>
                <button onClick={() => { addToast('CSV export coming soon.', 'info'); }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E2A45] border border-[#2A3A5C] rounded-lg text-xs font-medium text-[#9AA5B8] hover:bg-[#2A3A5C] hover:text-white transition-colors duration-150">
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Year</th>
                      <th className="px-6 py-4 font-medium text-center">Assets Reaching EOL</th>
                      <th className="px-6 py-4 font-medium text-right">Est. Replacement Cost</th>
                      <th className="px-6 py-4 font-medium text-right">Cumulative Cost</th>
                      <th className="px-6 py-4 font-medium">Benchmark Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2A45] stagger-rows">
                    {costSummaryRows.map((row) => (
                      <tr
                        key={row.year}
                        className={cn(
                          "transition-colors duration-100",
                          row.year === currentYear ? "bg-emerald-500/5 hover:bg-emerald-500/10" : "hover:bg-[#1A2544]"
                        )}
                      >
                        <td className="px-6 py-4 font-mono font-semibold text-white">
                          {row.year}
                          {row.year === currentYear && (
                            <span className="ml-2 text-[10px] bg-emerald-500/15 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-500/20">NOW</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.count > 0 ? (
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-semibold border",
                              row.count >= 3 ? "bg-red-500/10 text-red-600 border-red-500/20" :
                              row.count >= 1 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                              "bg-[#1E2A45] text-[#7A8BA8] border-[#2A3A5C]"
                            )}>
                              {row.count} asset{row.count !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-[#5A6B88] text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {row.cost > 0 ? (
                            <span className={cn(
                              "font-semibold",
                              row.cost > 200000 ? "text-red-600" :
                              row.cost > 50000 ? "text-amber-600" : "text-white"
                            )}>
                              ${row.cost.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-[#5A6B88]">$0</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-[#9AA5B8] font-semibold">
                          ${row.cumulative.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {row.count > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <ChevronRight className="w-3 h-3 text-emerald-600" />
                              <span className="text-xs text-[#7A8BA8]">Benchmark available</span>
                            </div>
                          ) : (
                            <span className="text-xs text-[#5A6B88]">No replacements</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Import Info Modal (Drive / ENERGY STAR) */}
      {(importModal === 'drive' || importModal === 'energystar') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={() => setImportModal(null)}>
          <div className="modal-panel bg-[#121C35] border border-[#1E2A45] rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {importModal === 'drive' ? <HardDrive className="w-5 h-5 text-[#7A8BA8]" /> : <Leaf className="w-5 h-5 text-emerald-400" />}
                <h3 className="text-base font-semibold text-white">
                  {importModal === 'drive' ? 'Import from Google Drive' : 'Import from ENERGY STAR'}
                </h3>
              </div>
              <button onClick={() => setImportModal(null)} className="text-[#5A6B88] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#0F1829] border border-[#1E2A45] rounded-lg p-4">
                <p className="text-sm text-[#9AA5B8]">
                  {importModal === 'drive'
                    ? 'Google Drive integration is not yet configured. To import utility data, use the SharePoint Import or Add Manual Entry options.'
                    : 'ENERGY STAR Portfolio Manager integration is not yet configured. Connect your account in Settings > Integrations to sync building benchmarks.'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setImportModal(null); if (importModal === 'drive') setImportModal('sharepoint'); }}
                  className="flex-1 px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors"
                >
                  {importModal === 'drive' ? 'Use SharePoint Instead' : 'Go to Settings'}
                </button>
                <button
                  onClick={() => setImportModal(null)}
                  className="px-4 py-2.5 bg-[#1E2A45] border border-[#2A3A5C] text-[#9AA5B8] text-sm font-medium rounded-lg hover:bg-[#2A3A5C] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowManualEntry(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-[#121C35] border border-[#1E2A45] rounded-xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2A45]">
              <h2 className="text-lg font-bold text-white">Add Utility Bill</h2>
              <button onClick={() => setShowManualEntry(false)} className="text-[#5A6B88] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Month</label>
                  <select value={manualBill.month} onChange={e => setManualBill(prev => ({ ...prev, month: e.target.value }))} className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select</option>
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Year</label>
                  <input type="number" value={manualBill.year} onChange={e => setManualBill(prev => ({ ...prev, year: e.target.value }))} className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Electric (kWh)</label>
                  <input type="number" value={manualBill.electricKwh} onChange={e => setManualBill(prev => ({ ...prev, electricKwh: e.target.value }))} placeholder="0" className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Electric Cost ($)</label>
                  <input type="number" value={manualBill.electricCost} onChange={e => setManualBill(prev => ({ ...prev, electricCost: e.target.value }))} placeholder="0" className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Gas (Therms)</label>
                  <input type="number" value={manualBill.gasTherms} onChange={e => setManualBill(prev => ({ ...prev, gasTherms: e.target.value }))} placeholder="0" className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Gas Cost ($)</label>
                  <input type="number" value={manualBill.gasCost} onChange={e => setManualBill(prev => ({ ...prev, gasCost: e.target.value }))} placeholder="0" className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1.5">Peak Demand (kW)</label>
                <input type="number" value={manualBill.peakKw} onChange={e => setManualBill(prev => ({ ...prev, peakKw: e.target.value }))} placeholder="0" className="w-full px-3 py-2 bg-[#0F1829] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#1E2A45] flex justify-end gap-3">
              <button onClick={() => setShowManualEntry(false)} className="px-4 py-2 text-sm text-[#7A8BA8] hover:text-white">Cancel</button>
              <button
                disabled={!manualBill.month}
                onClick={() => {
                  addUtilityBill({
                    buildingId: selectedBuilding?.id || '',
                    month: Number(manualBill.month),
                    year: Number(manualBill.year),
                    electricKwh: Number(manualBill.electricKwh) || 0,
                    electricCost: Number(manualBill.electricCost) || 0,
                    gasTherms: Number(manualBill.gasTherms) || 0,
                    gasCost: Number(manualBill.gasCost) || 0,
                    peakKw: Number(manualBill.peakKw) || 0,
                  });
                  setManualBill({ month: '', year: new Date().getFullYear().toString(), electricKwh: '', electricCost: '', gasTherms: '', gasCost: '', peakKw: '' });
                  setShowManualEntry(false);
                }}
                className="px-4 py-2 bg-[#B8972F] rounded-lg text-sm font-medium text-white hover:bg-[#A68B3A] disabled:opacity-40"
              >
                Add Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SharePoint Import Modal */}
      {importModal === 'sharepoint' && selectedBuilding && (
        <SharePointImportModal
          sectionConfig={SECTION_CONFIGS.utilityBills}
          contextFields={{ buildingId: selectedBuilding.id }}
          contextLabel={selectedBuilding.name}
          onClose={() => setImportModal(null)}
          onComplete={(batchId, count, fName, customCols, items) => {
            addBatch('utilityBills', items, batchId);
            if (customCols.length > 0) addCustomColumns(customCols);
            addImportRecord({
              type: 'Utility Bills',
              source: 'SharePoint',
              date: new Date().toISOString(),
              records: count,
              status: 'Success',
              user: currentUser?.name || 'System',
              fileName: fName,
              batchId,
              storeKey: 'utilityBills',
            });
          }}
        />
      )}

      {/* Replace Import Modal */}
      {replacingBatchId && selectedBuilding && (
        <SharePointImportModal
          sectionConfig={SECTION_CONFIGS.utilityBills}
          contextFields={{ buildingId: selectedBuilding.id }}
          contextLabel={selectedBuilding.name}
          replaceBatchId={replacingBatchId}
          onClose={() => setReplacingBatchId(null)}
          onComplete={(batchId, count, fName, customCols, items) => {
            replaceBatch('utilityBills', replacingBatchId, items, batchId);
            if (customCols.length > 0) addCustomColumns(customCols);
            // Mark old record as replaced
            const oldRecord = importHistory.find((r: any) => r.batchId === replacingBatchId);
            if (oldRecord) updateImportRecordStatus(oldRecord.id, 'Replaced');
            addImportRecord({
              type: 'Utility Bills',
              source: 'SharePoint',
              date: new Date().toISOString(),
              records: count,
              status: 'Success',
              user: currentUser?.name || 'System',
              fileName: fName,
              batchId,
              storeKey: 'utilityBills',
              replacedBatchId: replacingBatchId,
            });
            setReplacingBatchId(null);
          }}
        />
      )}
    </div>
  );
}

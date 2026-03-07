import { useState } from 'react';
import { useStore } from '@/store';
import { Camera, Upload, Mic, AlertTriangle, Search, Filter, FileSpreadsheet, X, Layers } from 'lucide-react';
import { ExportButton } from '@/components/ExportButton';
import { cn } from '@/lib/utils';
import { EditableField } from '@/components/EditableField';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';
import { FreshnessBadge } from '@/components/FreshnessBadge';
import { SharePointImportModal, SECTION_CONFIGS } from '@/components/SharePointImportModal';
import { useToastStore } from '@/stores/toastStore';
import { useConfirmStore } from '@/stores/confirmStore';
import { EmptyState } from '@/components/EmptyState';
import { BulkActions } from '@/components/BulkActions';

const ASSET_IMAGES: Record<string, string> = {
  'Chiller': '/assets/chiller.jpg',
  'AHU': '/assets/ahu.jpg',
  'Cooling Tower': '/assets/cooling-tower.jpg',
  'Pump': '/assets/pump.jpg',
  'Lighting Panel': '/assets/lighting.jpg',
  'Lighting': '/assets/office-lighting.jpg',
  'BAS Controller': '/assets/controls.jpg',
  'Domestic HW Heater': '/assets/water-heater.jpg',
  'Boiler': '/assets/boiler.jpg',
  'VFD': '/assets/electrical.jpg',
  'Cooling Unit': '/assets/cooling-unit.jpg',
  'Pool Heater': '/assets/pool.jpg',
  'DOAS Unit': '/assets/ventilation.jpg',
  'Generator': '/assets/generator.jpg',
  'UPS System': '/assets/controls.jpg',
};

export function FieldAudit({ projectId }: { projectId?: string }) {
  const [activeTab, setActiveTab] = useState<'capture' | 'assets'>('assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [conditionFilter, setConditionFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [buildingFilter, setBuildingFilter] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allAssets = useStore(state => state.assets);
  const projects = useStore(state => state.projects);
  const buildings = useStore(state => state.buildings);
  const addBatch = useStore(state => state.addBatch);
  const addCustomColumns = useStore(state => state.addCustomColumns);
  const addImportRecord = useStore(state => state.addImportRecord);
  const deleteItem = useStore(state => state.deleteItem);
  const currentUser = useStore(state => state.users).find(u => u.id === useStore.getState().currentUserId);
  const addToast = useToastStore(s => s.addToast);
  const confirm = useConfirmStore(s => s.confirm);

  let displayAssets = allAssets;
  
  if (projectId) {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const projectBuildings = buildings.filter(b => b.orgId === project.orgId).map(b => b.id);
      displayAssets = allAssets.filter(a => projectBuildings.includes(a.buildingId));
    }
  }

  const assetTypes = ['All', ...Array.from(new Set(displayAssets.map(a => a.type)))];
  const conditions = ['All', 'Good', 'Fair', 'Poor', 'Critical'];
  const buildingOptions = ['All', ...Array.from(new Set(displayAssets.map(a => buildings.find(b => b.id === a.buildingId)?.name).filter(Boolean))) as string[]];
  const activeFilterCount = [conditionFilter, typeFilter, buildingFilter].filter(f => f !== 'All').length;

  const filteredAssets = displayAssets.filter(a => {
    const matchSearch = a.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCondition = conditionFilter === 'All' || a.condition === conditionFilter;
    const matchType = typeFilter === 'All' || a.type === typeFilter;
    const matchBuilding = buildingFilter === 'All' || buildings.find(b => b.id === a.buildingId)?.name === buildingFilter;
    return matchSearch && matchCondition && matchType && matchBuilding;
  });

  return (
    <div className="flex flex-col h-full">
      {!projectId && (
        <div className="flex-shrink-0 border-b border-[#1E2A45] bg-[#121C35] px-3 md:px-8 py-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight">Field Audit & Asset Intelligence</h1>
                {projectId && <FreshnessBadge projectId={projectId} module="Assets" showTimestamp />}
              </div>
              <p className="text-sm text-[#7A8BA8] mt-1">Capture equipment data, transcribe notes, and flag deficiencies.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D918C]/10 border border-[#0D918C]/30 rounded-lg text-sm font-medium text-[#0D918C] hover:bg-[#0D918C]/20 transition-colors duration-150"
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
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E2A45] border border-[#2A3A5C] rounded-lg text-sm font-medium text-[#9AA5B8] hover:bg-[#2A3A5C] transition-colors"
              >
                <Upload className="w-4 h-4" />
                Batch Upload
              </button>
              <button
                onClick={() => setActiveTab('capture')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B7A76] border border-transparent rounded-lg text-sm font-medium text-white hover:bg-[#096A66] transition-colors"
              >
                <Camera className="w-4 h-4" />
                New Capture
              </button>
            </div>
          </div>

          <div className="flex space-x-6 border-b border-[#1E2A45]">
            <button
              onClick={() => setActiveTab('assets')}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'assets' 
                  ? "border-[#0D918C] text-[#37BB26]"
                  : "border-transparent text-[#7A8BA8] hover:text-white hover:border-[#2A3A5C]"
              )}
            >
              Asset Database
            </button>
            <button
              onClick={() => setActiveTab('capture')}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'capture' 
                  ? "border-[#0D918C] text-[#37BB26]"
                  : "border-transparent text-[#7A8BA8] hover:text-white hover:border-[#2A3A5C]"
              )}
            >
              AI Extraction Queue
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 md:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'assets' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Search assets by type or manufacturer..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#121C35] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C] focus:border-transparent shadow-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <ExportButton
                  variant="compact"
                  filename="asset-inventory"
                  data={displayAssets.map(a => ({
                    'Building': buildings.find(b => b.id === a.buildingId)?.name || '',
                    'Type': a.type,
                    'Manufacturer': a.manufacturer,
                    'Model': a.model,
                    'Year': a.year,
                    'Condition': a.condition,
                    'ECM Category': (a as any).ecmCategory || '',
                    'Remaining Life (yrs)': a.remainingLife,
                    'Flags': a.flags.join(', '),
                    'AI Confidence': (a as any).aiConfidence || '',
                    'Replacement Cost': (a as any).replacementCost || 0,
                  }))}
                />
                <div className="relative">
                  <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={cn("inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm", activeFilterCount > 0 ? "bg-[#0D918C]/10 border-[#0D918C]/30 text-[#37BB26]" : "bg-[#1E2A45] border-[#2A3A5C] text-[#9AA5B8] hover:bg-[#2A3A5C]")}>
                    <Filter className="w-4 h-4" />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#0D918C] text-white text-[10px] font-bold">{activeFilterCount}</span>
                    )}
                  </button>
                  {showFilterPanel && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-[#121C35] border border-[#1E2A45] rounded-xl shadow-2xl z-30 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white uppercase tracking-wider">Filters</span>
                        {activeFilterCount > 0 && (
                          <button onClick={() => { setConditionFilter('All'); setTypeFilter('All'); setBuildingFilter('All'); }} className="text-[10px] text-[#0D918C] hover:text-[#37BB26] font-medium">Clear all</button>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-[#7A8BA8] mb-1.5">Condition</label>
                        <select value={conditionFilter} onChange={e => setConditionFilter(e.target.value)} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white">
                          {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-[#7A8BA8] mb-1.5">Asset Type</label>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white">
                          {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-[#7A8BA8] mb-1.5">Building</label>
                        <select value={buildingFilter} onChange={e => setBuildingFilter(e.target.value)} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white">
                          {buildingOptions.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <button onClick={() => setShowFilterPanel(false)} className="w-full py-2 bg-[#0B7A76] text-white text-xs font-medium rounded-lg hover:bg-[#096A66] transition-colors">Apply</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className={cn("bg-[#121C35] border rounded-xl overflow-hidden hover:border-[#0D918C]/50 transition-colors group cursor-pointer relative", selectedIds.has(asset.id) ? 'border-[#0D918C] ring-1 ring-[#0D918C]/30' : 'border-[#1E2A45]')}>
                  <label className="absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(asset.id)} onChange={() => setSelectedIds(prev => { const next = new Set(prev); next.has(asset.id) ? next.delete(asset.id) : next.add(asset.id); return next; })} className="w-4 h-4 rounded border-[#2A3A5C] bg-[#0F1829] text-[#0D918C] focus:ring-[#0D918C]" />
                  </label>
                  {asset.importBatchId && (
                    <button
                      onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete asset?', 'This action cannot be undone.')) { deleteItem('assets', asset.id); addToast('Asset deleted'); } }}
                      className="absolute top-2 left-2 z-10 p-1 text-[#5A6B88] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors bg-[#121C35]/80 backdrop-blur-sm"
                      title="Delete imported row"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="h-48 relative bg-[#0F1829]">
                    <img
                      src={ASSET_IMAGES[asset.type] || '/assets/industrial.jpg'}
                      alt={`${asset.manufacturer} ${asset.model} ${asset.type}`}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      {asset.flags.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-500 text-xs font-medium border border-red-500/30 backdrop-blur-sm">
                          <AlertTriangle className="w-3 h-3" />
                          {asset.flags.length} Flags
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-[#37BB26] transition-colors">{asset.type}</h3>
                        <p className="text-sm text-[#7A8BA8]">{buildings.find(b => b.id === asset.buildingId)?.name}</p>
                      </div>
                      <EditableField
                        value={asset.condition}
                        entityType="asset"
                        entityId={asset.id}
                        field="condition"
                        projectId={projectId}
                        type="select"
                        options={['Good', 'Fair', 'Poor', 'Critical']}
                        formatter={(val) => String(val)}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                      <div>
                        <span className="block text-[#7A8BA8] text-xs font-medium uppercase tracking-wider mb-1">Manufacturer</span>
                        <span className="text-[#9AA5B8] font-medium">
                          <EditableField value={asset.manufacturer} entityType="asset" entityId={asset.id} field="manufacturer" projectId={projectId} />
                        </span>
                      </div>
                      <div>
                        <span className="block text-[#7A8BA8] text-xs font-medium uppercase tracking-wider mb-1">Year</span>
                        <span className="text-[#9AA5B8] font-medium">
                          <EditableField value={asset.year} entityType="asset" entityId={asset.id} field="year" projectId={projectId} type="number" />
                        </span>
                      </div>
                      <div>
                        <span className="block text-[#7A8BA8] text-xs font-medium uppercase tracking-wider mb-1">Model</span>
                        <span className="text-[#9AA5B8] font-medium">
                          <EditableField value={asset.model} entityType="asset" entityId={asset.id} field="model" projectId={projectId} />
                        </span>
                      </div>
                      <div>
                        <span className="block text-[#7A8BA8] text-xs font-medium uppercase tracking-wider mb-1">Remaining Life</span>
                        <span className="text-[#9AA5B8] font-medium">
                          <EditableField value={asset.remainingLife} entityType="asset" entityId={asset.id} field="remainingLife" projectId={projectId} type="number" formatter={(v) => `${v} yrs`} />
                        </span>
                      </div>
                    </div>

                    {asset.flags.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#1E2A45]">
                        <div className="flex flex-wrap gap-2">
                          {asset.flags.map((flag, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20">
                              {flag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <AuditTrailPanel entityType="asset" entityId={asset.id} />
                  </div>
                </div>
              ))}
              {filteredAssets.length === 0 && (
                <div className="col-span-full"><EmptyState icon={Camera} title="No assets found" description="Import asset data or start a new capture to build your equipment inventory." action={{ label: 'New Capture', onClick: () => setActiveTab('capture') }} secondaryAction={{ label: 'or import a project workbook', onClick: () => { useStore.getState().setProjectImportDefaultId(projectId || ''); useStore.getState().setShowProjectImport(true); } }} /></div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#1E2A45] bg-[#0F1829]">
                <h3 className="text-lg font-medium text-white mb-2">AI Extraction Queue</h3>
                <p className="text-sm text-[#7A8BA8]">Upload nameplate photos or record voice notes. Claude will extract structured data and flag deficiencies automatically.</p>
              </div>
              
              <div className="p-8">
                <div className="border-2 border-dashed border-[#2A3A5C] rounded-xl p-12 flex flex-col items-center justify-center text-center hover:bg-[#1A2544] hover:border-[#0D918C]/50 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-[#1E2A45] text-[#37BB26] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-1">Upload Equipment Photos</h4>
                  <p className="text-sm text-[#7A8BA8] max-w-sm">Drag and drop nameplate photos, wide shots, or inspection documents here.</p>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <div className="flex-1 h-px bg-[#1E2A45]"></div>
                  <span className="text-sm font-medium text-[#5A6B88] uppercase tracking-wider">OR</span>
                  <div className="flex-1 h-px bg-[#1E2A45]"></div>
                </div>

                <div className="mt-8 text-center">
                  <button onClick={() => alert('Voice recording coming soon — requires Whisper integration.')} className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E2A45] border border-[#2A3A5C] rounded-full text-[#9AA5B8] font-medium hover:border-[#0D918C] hover:text-[#37BB26] transition-colors shadow-sm">
                    <Mic className="w-5 h-5" />
                    Record Voice Audit Note
                  </button>
                  <p className="text-xs text-[#7A8BA8] mt-3">Whisper will transcribe and Claude will structure the data.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <BulkActions
        count={selectedIds.size}
        onDelete={async () => { if (await confirm('Delete selected assets?', `${selectedIds.size} assets will be permanently deleted.`)) { selectedIds.forEach(id => deleteItem('assets', id)); addToast(`${selectedIds.size} assets deleted`); setSelectedIds(new Set()); } }}
        onClear={() => setSelectedIds(new Set())}
      />
      {showImportModal && (
        <SharePointImportModal
          sectionConfig={SECTION_CONFIGS.assets}
          contextFields={{ projectId: projectId || '' }}
          contextLabel={projectId ? (projects.find(p => p.id === projectId)?.name || projectId) : 'All Projects'}
          onClose={() => setShowImportModal(false)}
          onComplete={(batchId, count, fName, customCols, items) => {
            addBatch('assets', items, batchId);
            if (customCols.length > 0) addCustomColumns(customCols);
            addImportRecord({
              type: 'Assets',
              source: 'SharePoint',
              date: new Date().toISOString(),
              records: count,
              status: 'Success',
              user: currentUser?.name || 'System',
              fileName: fName,
              batchId,
              storeKey: 'assets',
            });
          }}
        />
      )}
    </div>
  );
}

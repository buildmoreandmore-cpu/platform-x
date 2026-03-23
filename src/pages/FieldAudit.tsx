import { useState, useRef, useCallback } from 'react';
import { useStore } from '@/store';
import { Camera, Upload, AlertTriangle, Search, Filter, FileSpreadsheet, X, Layers, Trash2, ImageIcon } from 'lucide-react';
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

const EQUIPMENT_CATEGORIES = ['HVAC', 'Lighting', 'Controls', 'Envelope', 'Water', 'Renewables', 'Mechanical System', 'Electrical System', 'Other'];

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
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [captureProjectId, setCaptureProjectId] = useState<string>(projectId || '');
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ id: string; file: File; preview: string; name: string; projectId: string }>>([]);
  const [dragOver, setDragOver] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionResults, setExtractionResults] = useState<Array<{ photoName: string; extracted: any }>>([]);
  const captureInputRef = useRef<HTMLInputElement>(null);

  const allAssets = useStore(state => state.assets);
  const projects = useStore(state => state.projects);
  const buildings = useStore(state => state.buildings);
  const addBatch = useStore(state => state.addBatch);
  const addAsset = useStore(state => state.addAsset);
  const addCustomColumns = useStore(state => state.addCustomColumns);
  const addImportRecord = useStore(state => state.addImportRecord);
  const deleteItem = useStore(state => state.deleteItem);
  const currentUser = useStore(state => state.users).find(u => u.id === useStore.getState().currentUserId);
  const addToast = useToastStore(s => s.addToast);
  const confirm = useConfirmStore(s => s.confirm);

  const handlePhotoFiles = useCallback((files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    if (!captureProjectId) {
      addToast('Select a project before uploading photos', 'warning');
      return;
    }
    const newPhotos = imageFiles.map(file => ({
      id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      projectId: captureProjectId,
    }));
    setUploadedPhotos(prev => [...prev, ...newPhotos]);
  }, [captureProjectId, addToast]);

  const removePhoto = useCallback((id: string) => {
    setUploadedPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) URL.revokeObjectURL(photo.preview);
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const runClaudeExtraction = useCallback(async () => {
    if (uploadedPhotos.length === 0) return;
    setExtracting(true);
    setExtractionResults([]);
    const results: Array<{ photoName: string; extracted: any }> = [];

    for (const photo of uploadedPhotos) {
      try {
        const arrayBuffer = await photo.file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const mediaType = photo.file.type || 'image/jpeg';

        const res = await fetch('/api/ai-vision', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ image: base64, mediaType }),
        });

        const data = await res.json();
        const extracted = data.extracted || {};

        // Add to assets store
        addAsset({
          ...extracted,
          category: extracted.category || '',
          floor: extracted.floor || '',
          zone: extracted.zone || '',
          panel: extracted.panel || '',
          meter: extracted.meter || '',
          projectId: photo.projectId,
          buildingId: '',
          importBatchId: `claude_${Date.now()}`,
          lastAuditDate: new Date().toISOString().split('T')[0],
          customFields: {},
        });
        results.push({ photoName: photo.name, extracted });
      } catch (err) {
        results.push({ photoName: photo.name, extracted: { error: 'Extraction failed' } });
      }
    }

    setExtractionResults(results);
    setExtracting(false);
    // Clear the photo queue
    uploadedPhotos.forEach(p => URL.revokeObjectURL(p.preview));
    setUploadedPhotos([]);
    addToast(`Extracted ${results.filter(r => !r.extracted.error).length} of ${results.length} assets from photos`, 'success');
  }, [uploadedPhotos, addAsset, addToast]);

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
  const activeFilterCount = [conditionFilter, typeFilter, buildingFilter, categoryFilter].filter(f => f !== 'All').length;

  const filteredAssets = displayAssets.filter(a => {
    const matchSearch = a.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCondition = conditionFilter === 'All' || a.condition === conditionFilter;
    const matchType = typeFilter === 'All' || a.type === typeFilter;
    const matchBuilding = buildingFilter === 'All' || buildings.find(b => b.id === a.buildingId)?.name === buildingFilter;
    const matchCategory = categoryFilter === 'All' || (a as any).category === categoryFilter;
    return matchSearch && matchCondition && matchType && matchBuilding && matchCategory;
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
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E2A45] border border-[#2A3A5C] rounded-lg text-sm font-medium text-[#9AA5B8] hover:bg-[#2A3A5C] transition-colors"
              >
                <Upload className="w-4 h-4" />
                Batch Upload
              </button>
              <button 
                onClick={() => {
                  setActiveTab('capture');
                  setTimeout(() => {
                    const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
                    if (fileInput) fileInput.click();
                  }, 100);
                }}
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
                  ? "border-primary text-secondary"
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
                  ? "border-primary text-secondary"
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
                  className="w-full pl-10 pr-4 py-2 bg-[#121C35] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
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
                  <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={cn("inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm", activeFilterCount > 0 ? "bg-primary/10 border-primary/30 text-secondary" : "bg-[#1E2A45] border-[#2A3A5C] text-[#9AA5B8] hover:bg-[#2A3A5C]")}>
                    <Filter className="w-4 h-4" />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">{activeFilterCount}</span>
                    )}
                  </button>
                  {showFilterPanel && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-[#121C35] border border-[#1E2A45] rounded-xl shadow-2xl z-30 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white uppercase tracking-wider">Filters</span>
                        {activeFilterCount > 0 && (
                          <button onClick={() => { setConditionFilter('All'); setTypeFilter('All'); setBuildingFilter('All'); setCategoryFilter('All'); }} className="text-[10px] text-primary hover:text-secondary font-medium">Clear all</button>
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
                      <div>
                        <label className="block text-xs text-[#7A8BA8] mb-1.5">Category</label>
                        <div className="flex flex-wrap gap-1.5">
                          {['All', ...EQUIPMENT_CATEGORIES].map(cat => (
                            <button
                              key={cat}
                              onClick={() => setCategoryFilter(cat)}
                              className={cn(
                                "px-2 py-1 rounded text-[10px] font-medium border transition-colors",
                                categoryFilter === cat
                                  ? "bg-primary/20 text-secondary border-primary/40"
                                  : "bg-[#0F1829] text-[#7A8BA8] border-[#1E2A45] hover:text-white"
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => setShowFilterPanel(false)} className="w-full py-2 bg-[#0B7A76] text-white text-xs font-medium rounded-lg hover:bg-[#096A66] transition-colors">Apply</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className={cn("bg-[#121C35] border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group cursor-pointer relative", selectedIds.has(asset.id) ? 'border-primary ring-1 ring-primary/30' : 'border-[#1E2A45]')}>
                  <label className="absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(asset.id)} onChange={() => setSelectedIds(prev => { const next = new Set(prev); next.has(asset.id) ? next.delete(asset.id) : next.add(asset.id); return next; })} className="w-4 h-4 rounded border-[#2A3A5C] bg-[#0F1829] text-primary focus:ring-primary" />
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
                        <h3 className="text-lg font-semibold text-white group-hover:text-secondary transition-colors">{asset.type}</h3>
                        <p className="text-sm text-[#7A8BA8]">{buildings.find(b => b.id === asset.buildingId)?.name}</p>
                        {(asset as any).category && (
                          <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#1E2A45] text-[#7A8BA8] border border-[#2A3A5C]">
                            {(asset as any).category}
                          </span>
                        )}
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
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#1E2A45] bg-[#0F1829]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-white">AI Extraction Queue</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#7A8BA8]">Project:</span>
                    <select
                      value={captureProjectId}
                      onChange={e => setCaptureProjectId(e.target.value)}
                      className="bg-[#121C35] border border-[#1E2A45] text-[#CBD2DF] text-xs rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary min-w-[200px]"
                    >
                      <option value="">Select a project...</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-sm text-[#7A8BA8]">Upload nameplate photos, wide shots, or inspection documents. Claude Vision will extract structured data and flag deficiencies automatically.</p>
              </div>

              <div className="p-8">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handlePhotoFiles(e.dataTransfer.files); }}
                  onClick={() => captureInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer group",
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-[#2A3A5C] hover:bg-[#1A2544] hover:border-primary/50"
                  )}
                >
                  <div className="w-16 h-16 bg-[#1E2A45] text-secondary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-1">
                    {dragOver ? 'Drop photos here' : 'Upload Equipment Photos'}
                  </h4>
                  <p className="text-sm text-[#7A8BA8] max-w-sm">Drag and drop nameplate photos, wide shots, or inspection documents here.</p>
                  <p className="text-[10px] text-[#5A6B88] mt-2">JPG, PNG, WEBP — multiple files supported</p>
                  <input
                    ref={captureInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => { if (e.target.files) handlePhotoFiles(e.target.files); e.target.value = ''; }}
                  />
                </div>
              </div>
            </div>

            {uploadedPhotos.length > 0 && (
              <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#1E2A45] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-white">{uploadedPhotos.length} photo{uploadedPhotos.length !== 1 ? 's' : ''} queued</span>
                  </div>
                  <button
                    onClick={runClaudeExtraction}
                    disabled={extracting}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-[#0B7A76] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {extracting ? (
                      <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Extracting...</>
                    ) : (
                      <><Camera className="w-3.5 h-3.5" />Extract with Claude Vision</>
                    )}
                  </button>
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedPhotos.map(photo => (
                    <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-[#1E2A45]">
                      <img src={photo.preview} alt={photo.name} className="w-full h-40 object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-2 right-2 p-1.5 bg-[#121C35]/80 backdrop-blur-sm rounded-lg text-[#5A6B88] hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-[10px] text-white truncate">{photo.name}</p>
                        <p className="text-[9px] text-[#7A8BA8] truncate">{projects.find(p => p.id === photo.projectId)?.name || 'No project'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {extractionResults.length > 0 && (
              <div className="bg-[#121C35] border border-primary/30 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#1E2A45] flex items-center gap-2">
                  <Camera className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium text-white">Extraction Complete — {extractionResults.filter(r => !r.extracted.error).length} assets added</span>
                </div>
                <div className="divide-y divide-[#1E2A45]">
                  {extractionResults.map((r, i) => (
                    <div key={i} className="px-4 py-3">
                      <p className="text-xs font-medium text-[#7A8BA8] mb-1 truncate">{r.photoName}</p>
                      {r.extracted.error ? (
                        <p className="text-xs text-red-400">{r.extracted.error}</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {r.extracted.type && <span className="text-xs bg-primary/10 text-secondary px-2 py-0.5 rounded border border-primary/20">{r.extracted.type}</span>}
                          {r.extracted.manufacturer && <span className="text-xs text-[#9AA5B8]">{r.extracted.manufacturer}</span>}
                          {r.extracted.model && <span className="text-xs text-[#9AA5B8] font-mono">{r.extracted.model}</span>}
                          {r.extracted.condition && <span className="text-xs text-amber-400">{r.extracted.condition}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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

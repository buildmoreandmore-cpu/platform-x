import { useState } from 'react';
import { useStore } from '@/store';
import { Upload, MapPin, Search, Filter, Maximize2, X, Plus, ChevronDown, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const DRAWING_TYPES = ['All', 'Floor Plan', 'MEP', 'Site Plan', 'Electrical', 'Plumbing'];

export function Drawings({ projectId }: { projectId: string }) {
  const allDrawings = useStore(state => state.drawings);
  const buildings = useStore(state => state.buildings);
  const assets = useStore(state => state.assets);
  const addDrawing = useStore(state => state.addDrawing);

  const drawings = allDrawings.filter(d => d.projectId === projectId);

  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [drawingForm, setDrawingForm] = useState({ filename: '', type: 'Floor Plan', buildingId: '' });

  const drawing = drawings.find(d => d.id === selectedDrawing);

  const filtered = drawings.filter(d => {
    const matchSearch = d.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'All' || d.type === typeFilter;
    return matchSearch && matchType;
  });

  // Mock annotation pins per drawing type
  const annotationPins = drawing ? [
    { x: '30%', y: '35%', label: 'RTU-4', color: 'bg-[#0D918C]', asset: assets.find(a => a.type === 'AHU') },
    { x: '60%', y: '55%', label: 'Chiller Plant', color: 'bg-amber-500', asset: assets.find(a => a.type === 'Chiller') },
    drawing.annotations >= 3 ? { x: '45%', y: '25%', label: 'EF-3', color: 'bg-blue-500', asset: assets.find(a => a.type === 'Cooling Tower') } : null,
    drawing.annotations >= 4 ? { x: '20%', y: '65%', label: 'DHW-1', color: 'bg-purple-500', asset: assets.find(a => a.type === 'Domestic HW Heater') } : null,
    drawing.annotations >= 5 ? { x: '75%', y: '40%', label: 'P-2B', color: 'bg-red-500', asset: assets.find(a => a.type === 'Pump') } : null,
  ].filter(Boolean) : [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-6 animate-page-enter">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search drawings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#121C35] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0D918C] focus:border-transparent placeholder-gray-400 w-72 transition-all duration-150"
              />
            </div>
            <div className="flex items-center gap-1 bg-[#0F1829] border border-[#1E2A45] rounded-lg p-1">
              {DRAWING_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150",
                    typeFilter === type
                      ? "bg-[#1E2A45] text-white shadow-sm"
                      : "text-[#7A8BA8] hover:text-[#CBD2DF]"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setShowUploadModal(true)} className="btn-primary inline-flex items-center gap-2 px-4 py-2 bg-[#0B7A76] rounded-lg text-sm font-medium text-white hover:bg-[#096A66]">
            <Upload className="w-4 h-4" />
            Upload Drawing
          </button>
        </div>

        {/* Drawings Table */}
        <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
          <div className="p-5 border-b border-[#1E2A45] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Facility Drawings & Plans</h3>
            <span className="text-xs text-[#7A8BA8]">{filtered.length} drawing{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                <tr>
                  <th className="px-6 py-4 font-medium">Filename</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Building</th>
                  <th className="px-6 py-4 font-medium">Version</th>
                  <th className="px-6 py-4 font-medium">Uploaded</th>
                  <th className="px-6 py-4 font-medium">Annotations</th>
                  <th className="px-6 py-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2A45] stagger-rows">
                {filtered.map((d) => (
                  <>
                    <tr
                      key={d.id}
                      className="hover:bg-[#1A2544] transition-colors duration-100 cursor-pointer group"
                      onClick={() => setSelectedDrawing(d.id)}
                    >
                      <td className="px-6 py-4 font-medium text-white group-hover:text-[#37BB26] transition-colors duration-150">
                        {d.filename}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-[#1E2A45] text-xs text-[#9AA5B8] border border-[#2A3A5C]">
                          {d.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#9AA5B8]">{buildings.find(b => b.id === d.buildingId)?.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded bg-[#0D918C]/10 text-[#37BB26] text-xs font-semibold border border-[#0D918C]/20">
                            {d.version}
                          </span>
                          {(d as any).versions?.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowVersionHistory(showVersionHistory === d.id ? null : d.id);
                              }}
                              className="flex items-center gap-1 text-[10px] text-[#7A8BA8] hover:text-[#CBD2DF] transition-colors"
                            >
                              <History className="w-3 h-3" />
                              {(d as any).versions.length} versions
                              <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showVersionHistory === d.id ? "rotate-180" : "")} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#7A8BA8] font-mono text-xs">
                        {d.date}
                        <span className="block text-[#7A8BA8] text-[10px]">by {d.by}</span>
                      </td>
                      <td className="px-6 py-4">
                        {d.annotations > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0D918C]/10 text-[#37BB26] text-xs font-medium border border-[#0D918C]/20">
                            <MapPin className="w-3 h-3" />
                            {d.annotations} pins
                          </span>
                        ) : (
                          <span className="text-[#5A6B88] text-xs">No pins</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedDrawing(d.id)}
                          className="p-1.5 text-[#7A8BA8] hover:text-white hover:bg-[#1E2A45] rounded-lg transition-colors duration-150"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {/* Version History Row */}
                    {showVersionHistory === d.id && (
                      <tr key={`${d.id}-versions`} className="bg-[#0B1120]">
                        <td colSpan={7} className="px-6 py-3 animate-slide-down">
                          <div className="flex items-center gap-4 pl-4">
                            <span className="text-[10px] text-[#7A8BA8] uppercase tracking-wider flex-shrink-0">Version History</span>
                            <div className="flex items-center gap-3">
                              {(d as any).versions?.map((v: any, idx: number) => (
                                <div key={v.v} className="flex items-center gap-2">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-semibold border",
                                    v.v === d.version
                                      ? "bg-[#0D918C]/10 text-[#37BB26] border-[#0D918C]/20"
                                      : "bg-[#1E2A45] text-[#7A8BA8] border-[#2A3A5C]"
                                  )}>
                                    {v.v}
                                    {v.v === d.version && <span className="ml-1">current</span>}
                                  </span>
                                  <span className="text-[10px] text-[#5A6B88]">{v.date}</span>
                                  {idx < (d as any).versions.length - 1 && <span className="text-[#5A6B88]">→</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Upload className="w-8 h-8 text-[#5A6B88] mx-auto mb-3" />
                      <p className="text-[#7A8BA8] font-medium">No drawings found</p>
                      <p className="text-[#5A6B88] text-sm mt-1">Upload your first drawing or adjust your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── UPLOAD DRAWING MODAL ─── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-white">Upload Drawing</h3><button onClick={() => setShowUploadModal(false)} className="text-[#7A8BA8] hover:text-white"><X className="w-4 h-4" /></button></div>
            <input placeholder="Filename (e.g. Main-Building-L1.pdf)" value={drawingForm.filename} onChange={e => setDrawingForm(f => ({ ...f, filename: e.target.value }))} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white placeholder-[#5A6B88]" />
            <select value={drawingForm.type} onChange={e => setDrawingForm(f => ({ ...f, type: e.target.value }))} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white">
              {DRAWING_TYPES.filter(t => t !== 'All').map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={drawingForm.buildingId} onChange={e => setDrawingForm(f => ({ ...f, buildingId: e.target.value }))} className="w-full bg-[#0F1829] border border-[#1E2A45] rounded-lg px-3 py-2 text-sm text-white">
              <option value="">Select building...</option>
              {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm text-[#7A8BA8] hover:text-white">Cancel</button>
              <button onClick={() => { if (!drawingForm.filename) return; addDrawing({ ...drawingForm, projectId, version: 'v1.0', date: new Date().toISOString().split('T')[0], by: 'Current User', annotations: 0 }); setDrawingForm({ filename: '', type: 'Floor Plan', buildingId: '' }); setShowUploadModal(false); }} className="px-4 py-2 bg-[#0B7A76] text-white text-sm font-medium rounded-lg hover:bg-[#096A66]">Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* Drawing Detail Modal */}
      {selectedDrawing && drawing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 modal-backdrop">
          <div className="modal-panel bg-[#121C35] border border-[#1E2A45] rounded-2xl w-full h-full max-w-7xl flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1E2A45] bg-[#0F1829] flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-white">{drawing.filename}</h2>
                <p className="text-xs text-[#7A8BA8] mt-0.5">
                  {drawing.type} • {drawing.version} • {buildings.find(b => b.id === drawing.buildingId)?.name}
                  <span className="ml-2 text-[#5A6B88]">• {drawing.annotations} annotation{drawing.annotations !== 1 ? 's' : ''}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E2A45] border border-[#2A3A5C] rounded-lg text-xs font-medium text-[#9AA5B8] hover:bg-[#2A3A5C] transition-colors duration-150">
                  <Filter className="w-3.5 h-3.5" />
                  Annotation Filter
                </button>
                <button onClick={() => alert('Pin placement coming soon — requires canvas interaction.')} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B7A76] border border-transparent rounded-lg text-xs font-medium text-white hover:bg-[#096A66] transition-colors duration-150">
                  <Plus className="w-3.5 h-3.5" />
                  Add Pin
                </button>
                <button
                  onClick={() => setSelectedDrawing(null)}
                  className="p-2 text-[#7A8BA8] hover:text-white hover:bg-[#1E2A45] rounded-lg transition-colors duration-150 ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawing Canvas */}
            <div className="flex-1 bg-[#080B10] relative overflow-hidden flex items-center justify-center p-6">
              <div className="relative w-full max-w-5xl aspect-[4/3] bg-[#121C35] rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
                <img
                  src="/assets/floor-plan.jpg"
                  alt={`${drawing.name} Floor Plan`}
                  className="w-full h-full object-cover opacity-40 grayscale"
                />

                {/* Grid overlay — architectural feel */}
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: 'linear-gradient(#555 1px, transparent 1px), linear-gradient(90deg, #555 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                  }}
                />

                {/* Annotation Pins */}
                {annotationPins.map((pin: any, idx) => (
                  <div
                    key={pin.label}
                    className="absolute group cursor-pointer"
                    style={{
                      left: pin.x,
                      top: pin.y,
                      animation: `statPop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.08}s both`
                    }}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white -translate-x-1/2 -translate-y-1/2",
                      "transition-all duration-200 group-hover:scale-125 group-hover:z-20",
                      pin.color
                    )}>
                      <MapPin className="w-4 h-4 text-white" />
                    </div>

                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-[#121C35] border border-[#1E2A45] rounded-xl shadow-2xl p-3 w-52 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30"
                      style={{ transform: 'translateX(-50%) translateY(4px)', transition: 'opacity 0.2s ease, transform 0.2s ease' }}
                    >
                      <p className="text-xs font-bold text-white mb-1">{pin.label}</p>
                      {pin.asset && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-[#7A8BA8]">
                            {pin.asset.manufacturer} {pin.asset.model}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "text-[9px] font-bold px-1 py-0.5 rounded border",
                              pin.asset.condition === 'Critical' ? "bg-red-500/20 text-red-600 border-red-500/30" :
                              pin.asset.condition === 'Poor' ? "bg-amber-500/20 text-amber-600 border-amber-500/30" :
                              "bg-[#0D918C]/20 text-[#37BB26] border-[#0D918C]/30"
                            )}>
                              {pin.asset.condition}
                            </span>
                            <span className="text-[10px] text-[#7A8BA8]">Year {pin.asset.year}</span>
                          </div>
                          <p className="text-[10px] text-[#37BB26] font-semibold">
                            Replacement: ${pin.asset.replacementCost?.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Legend */}
            <div className="flex-shrink-0 border-t border-[#1E2A45] bg-[#0F1829] px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-[#7A8BA8]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#0D918C]" />
                  Good condition
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  Poor condition
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  Critical
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  Mechanical
                </span>
              </div>
              <span className="text-xs text-[#5A6B88]">Hover pins to see asset details</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

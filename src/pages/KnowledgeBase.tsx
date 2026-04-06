import { useState } from 'react';
import { useStore } from '@/store';
import { BookOpen, Filter, Lightbulb, TrendingDown, DollarSign, FileText, FileSpreadsheet, X } from 'lucide-react';
import { ExportButton } from '@/components/ExportButton';
import { SearchBar } from '@/components/SearchBar';
import { cn } from '@/lib/utils';
import { EditableField } from '@/components/EditableField';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';
import { SharePointImportModal, SECTION_CONFIGS } from '@/components/SharePointImportModal';
import { useToastStore } from '@/stores/toastStore';
import { useConfirmStore } from '@/stores/confirmStore';

export function KnowledgeBase() {
  const benchmarks = useStore(state => state.benchmarks);
  const lessonsLearned = useStore(state => state.lessonsLearned);
  const addBatch = useStore(state => state.addBatch);
  const addCustomColumns = useStore(state => state.addCustomColumns);
  const addImportRecord = useStore(state => state.addImportRecord);
  const deleteItem = useStore(state => state.deleteItem);
  const currentUser = useStore(state => state.users).find(u => u.id === useStore.getState().currentUserId);
  const addToast = useToastStore(s => s.addToast);
  const confirmDel = useConfirmStore(s => s.confirm);

  const [activeTab, setActiveTab] = useState<'benchmarks' | 'lessons' | 'templates'>('benchmarks');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-[#222222] bg-[#1A1A1A] px-3 md:px-8 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight">Knowledge Capture & Institutional Memory</h1>
            <p className="text-sm text-[#888888] mt-1">Store historical data, benchmark costs/savings, prevent repeating mistakes.</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton
              variant="compact"
              filename="knowledge-base"
              sheets={[
                { name: 'Benchmarks', data: benchmarks.map(b => ({ 'Category': b.category, 'Building Type': b.buildingType, 'Unit Cost (Mid)': b.unitCostMid, 'Unit': b.unit, 'Savings (Mid %)': b.savingsMid, 'Source': b.source })) },
                { name: 'Lessons Learned', data: lessonsLearned.map(l => ({ 'Title': l.title, 'Category': l.category, 'Description': l.description, 'Recommendation': l.recommendation })) },
              ]}
            />
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg text-sm font-medium text-primary hover:bg-primary/20 transition-colors duration-150"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Import from SharePoint
            </button>
          </div>
        </div>

        <div className="flex space-x-6 border-b border-[#222222]">
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'benchmarks' 
                ? "border-primary text-secondary"
                : "border-transparent text-[#888888] hover:text-white hover:border-[#2A3A5C]"
            )}
          >
            <DollarSign className="w-4 h-4" />
            Cost Benchmarks
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'lessons' 
                ? "border-primary text-secondary"
                : "border-transparent text-[#888888] hover:text-white hover:border-[#2A3A5C]"
            )}
          >
            <Lightbulb className="w-4 h-4" />
            Lessons Learned
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'templates' 
                ? "border-primary text-secondary"
                : "border-transparent text-[#888888] hover:text-white hover:border-[#2A3A5C]"
            )}
          >
            <FileText className="w-4 h-4" />
            Template Library
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between">
          <SearchBar
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-full md:w-96"
          />
          <button className="inline-flex items-center gap-2 px-3 py-2 bg-[#222222] border border-[#2A3A5C] rounded-lg text-sm font-medium text-[#9AA5B8] hover:bg-[#2A3A5C] transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {activeTab === 'benchmarks' && (
          <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#222222]">
              <h3 className="text-sm font-semibold text-white">Historical Cost & Savings Benchmarks</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#222222]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Building Type</th>
                    <th className="px-6 py-4 font-medium text-right">Unit Cost (Mid)</th>
                    <th className="px-6 py-4 font-medium">Unit</th>
                    <th className="px-6 py-4 font-medium text-right">Savings (Mid)</th>
                    <th className="px-6 py-4 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {benchmarks.filter(b => b.category.toLowerCase().includes(searchQuery.toLowerCase())).map((benchmark) => (
                    <tr key={benchmark.id} className="hover:bg-[#1A2544] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{benchmark.category}</td>
                      <td className="px-6 py-4 text-[#9AA5B8]">{benchmark.buildingType}</td>
                      <td className="px-6 py-4 text-right text-[#9AA5B8] font-mono">
                        <EditableField
                          value={benchmark.unitCostMid}
                          entityType="benchmark"
                          entityId={benchmark.id}
                          field="unitCostMid"
                          type="number"
                          formatter={(v) => `$${Number(v).toLocaleString()}`}
                        />
                      </td>
                      <td className="px-6 py-4 text-[#9AA5B8]">{benchmark.unit}</td>
                      <td className="px-6 py-4 text-right text-secondary font-mono">
                        <EditableField
                          value={benchmark.savingsMid}
                          entityType="benchmark"
                          entityId={benchmark.id}
                          field="savingsMid"
                          type="number"
                          formatter={(v) => `${v}%`}
                        />
                      </td>
                      <td className="px-6 py-4 text-[#9AA5B8]">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded bg-[#222222] text-xs font-medium border border-[#2A3A5C]">
                            {benchmark.source}
                          </span>
                          {benchmark.importBatchId && (
                            <button
                              onClick={async () => { if (await confirmDel('Delete benchmark?', 'This action cannot be undone.')) { deleteItem('benchmarks', benchmark.id); addToast('Benchmark deleted'); } }}
                              className="p-1 text-[#666666] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Delete imported row"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <AuditTrailPanel entityType="benchmark" entityId={benchmark.id} />
                      </td>
                    </tr>
                  ))}
                  {benchmarks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[#888888]">No benchmarks found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lessonsLearned.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase())).map((lesson) => (
              <div key={lesson.id} className="bg-[#1A1A1A] border border-[#222222] rounded-xl p-6 flex flex-col hover:border-primary/50 transition-colors group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-secondary transition-colors">{lesson.title}</h3>
                    <p className="text-sm text-[#888888] mt-1">Project: {useStore.getState().projects.find(p => p.id === lesson.projectId)?.name}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#222222] text-xs font-medium text-[#9AA5B8] border border-[#2A3A5C]">
                    {lesson.category}
                  </span>
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <h4 className="text-xs font-medium text-[#888888] uppercase tracking-wider mb-1">Description</h4>
                    <p className="text-sm text-[#9AA5B8] leading-relaxed">
                      <EditableField
                        value={lesson.description}
                        entityType="lesson"
                        entityId={lesson.id}
                        field="description"
                        type="text"
                      />
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-[#888888] uppercase tracking-wider mb-1">Recommendation</h4>
                    <p className="text-sm text-secondary leading-relaxed bg-primary/10 p-3 rounded-lg border border-primary/20">
                      <EditableField
                        value={lesson.recommendation}
                        entityType="lesson"
                        entityId={lesson.id}
                        field="recommendation"
                        type="text"
                      />
                    </p>
                  </div>
                  <AuditTrailPanel entityType="lesson" entityId={lesson.id} />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'templates' && (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-[#2A3A5C] mx-auto mb-4" />
            <h3 className="text-base font-semibold text-white mb-2">No templates yet</h3>
            <p className="text-sm text-[#666666] max-w-md mx-auto">
              Templates will appear here as you generate reports and save reusable formats. Use the Reporting module to create your first deliverable.
            </p>
          </div>
        )}
      </div>

      {showImportModal && (
        <SharePointImportModal
          sectionConfig={SECTION_CONFIGS.benchmarks}
          contextFields={{}}
          onClose={() => setShowImportModal(false)}
          onComplete={(batchId, count, fName, customCols, items) => {
            addBatch('benchmarks', items, batchId);
            if (customCols.length > 0) addCustomColumns(customCols);
            addImportRecord({ type: 'Benchmarks', source: 'SharePoint', date: new Date().toISOString(), records: count, status: 'Success', user: currentUser?.name || 'System', fileName: fName, batchId, storeKey: 'benchmarks' });
          }}
        />
      )}
    </div>
  );
}

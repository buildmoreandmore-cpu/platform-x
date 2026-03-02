import { useState } from 'react';
import { useStore } from '@/store';
import { BookOpen, Search, Filter, Lightbulb, TrendingDown, DollarSign, FileText } from 'lucide-react';
import { ExportButton } from '@/components/ExportButton';
import { cn } from '@/lib/utils';
import { EditableField } from '@/components/EditableField';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';

export function KnowledgeBase() {
  const benchmarks = useStore(state => state.benchmarks);
  const lessonsLearned = useStore(state => state.lessonsLearned);

  const [activeTab, setActiveTab] = useState<'benchmarks' | 'lessons' | 'templates'>('benchmarks');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-[#1E2A45] bg-[#121C35] px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Knowledge Capture & Institutional Memory</h1>
            <p className="text-sm text-[#7A8BA8] mt-1">Store historical data, benchmark costs/savings, prevent repeating mistakes.</p>
          </div>
          <ExportButton
            variant="compact"
            filename="knowledge-base"
            sheets={[
              { name: 'Benchmarks', data: benchmarks.map(b => ({ 'Category': b.category, 'Building Type': b.buildingType, 'Unit Cost (Mid)': b.unitCostMid, 'Unit': b.unit, 'Savings (Mid %)': b.savingsMid, 'Source': b.source })) },
              { name: 'Lessons Learned', data: lessonsLearned.map(l => ({ 'Title': l.title, 'Category': l.category, 'Description': l.description, 'Recommendation': l.recommendation })) },
            ]}
          />
        </div>

        <div className="flex space-x-6 border-b border-[#1E2A45]">
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'benchmarks' 
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-[#7A8BA8] hover:text-white hover:border-[#2A3A5C]"
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
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-[#7A8BA8] hover:text-white hover:border-[#2A3A5C]"
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
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-[#7A8BA8] hover:text-white hover:border-[#2A3A5C]"
            )}
          >
            <FileText className="w-4 h-4" />
            Template Library
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search knowledge base..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#121C35] border border-[#1E2A45] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
            />
          </div>
          <button className="inline-flex items-center gap-2 px-3 py-2 bg-[#1E2A45] border border-[#2A3A5C] rounded-lg text-sm font-medium text-[#9AA5B8] hover:bg-[#2A3A5C] transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {activeTab === 'benchmarks' && (
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#1E2A45]">
              <h3 className="text-sm font-semibold text-white">Historical Cost & Savings Benchmarks</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Building Type</th>
                    <th className="px-6 py-4 font-medium text-right">Unit Cost (Mid)</th>
                    <th className="px-6 py-4 font-medium">Unit</th>
                    <th className="px-6 py-4 font-medium text-right">Savings (Mid)</th>
                    <th className="px-6 py-4 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2A45]">
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
                      <td className="px-6 py-4 text-right text-emerald-500 font-mono">
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
                        <span className="px-2.5 py-1 rounded bg-[#1E2A45] text-xs font-medium border border-[#2A3A5C]">
                          {benchmark.source}
                        </span>
                        <AuditTrailPanel entityType="benchmark" entityId={benchmark.id} />
                      </td>
                    </tr>
                  ))}
                  {benchmarks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[#7A8BA8]">No benchmarks found.</td>
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
              <div key={lesson.id} className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6 flex flex-col hover:border-emerald-500/50 transition-colors group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-600 transition-colors">{lesson.title}</h3>
                    <p className="text-sm text-[#7A8BA8] mt-1">Project: {useStore.getState().projects.find(p => p.id === lesson.projectId)?.name}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#1E2A45] text-xs font-medium text-[#9AA5B8] border border-[#2A3A5C]">
                    {lesson.category}
                  </span>
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <h4 className="text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1">Description</h4>
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
                    <h4 className="text-xs font-medium text-[#7A8BA8] uppercase tracking-wider mb-1">Recommendation</h4>
                    <p className="text-sm text-emerald-600 leading-relaxed bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 't1', title: 'IGEA Report Structure', desc: 'Standardized outline for Investment Grade Energy Audits.', updated: '2024-02-15' },
              { id: 't2', title: 'RFP Checklist', desc: 'Comprehensive checklist for ESCO procurement.', updated: '2024-01-10' },
              { id: 't3', title: 'M&V Plan Outline', desc: 'IPMVP Option C compliant M&V plan template.', updated: '2023-11-20' },
              { id: 't4', title: 'Commissioning Checklist', desc: 'Pre-functional and functional testing forms.', updated: '2024-03-05' }
            ].filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).map((template) => (
              <div key={template.id} className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6 flex flex-col hover:border-emerald-500/50 transition-colors group">
                <div className="flex-1">
                  <div className="w-10 h-10 bg-[#1E2A45] rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                    <FileText className="w-5 h-5 text-[#7A8BA8] group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{template.title}</h3>
                  <p className="text-sm text-[#7A8BA8] leading-relaxed">{template.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#1E2A45] flex items-center justify-between">
                  <span className="text-xs text-[#7A8BA8] font-mono">Updated: {template.updated}</span>
                  <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">Download</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

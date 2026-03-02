import { useState } from 'react';
import { useStore } from '@/store';
import { Calculator, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Leaf, Search, Filter, Plus } from 'lucide-react';
import { ExportButton } from '@/components/ExportButton';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { EditableField } from '@/components/EditableField';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';
import { FreshnessBadge } from '@/components/FreshnessBadge';
import { LockIndicator } from '@/components/LockIndicator';

export function FinancialModeling({ projectId }: { projectId?: string }) {
  const projects = useStore(state => state.projects);
  const ecms = useStore(state => state.ecms);
  const pricingReview = useStore(state => state.pricingReview);
  const lockRecords = useStore(state => state.lockRecords);

  const [selectedProjectId, setSelectedProjectId] = useState(projectId || projects[1].id); // Default to project with ECMs
  const [term, setTerm] = useState(15);
  const [interestRate, setInterestRate] = useState(4.5);
  const [elecEscalation, setElecEscalation] = useState(3.0);
  const [subTab, setSubTab] = useState<'ecm' | 'pricing'>('ecm');
  
  const projectEcms = ecms.filter(e => e.projectId === selectedProjectId);
  
  const totalCost = projectEcms.reduce((sum, e) => sum + e.cost, 0);
  const totalSavings = projectEcms.reduce((sum, e) => sum + e.savings, 0);
  const simplePayback = totalSavings > 0 ? (totalCost / totalSavings).toFixed(1) : 0;
  
  // Financial Calculations
  const r = interestRate / 100;
  const debtService = totalCost * (r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1);
  const dscr = totalSavings > 0 ? (totalSavings / debtService).toFixed(2) : 0;
  
  let netCashFlow = 0;
  let cumulativeCashFlow = 0;
  let npv = 0;
  const discountRate = 0.05; // 5% discount rate for NPV

  const cashFlows = Array.from({ length: term }, (_, i) => {
    const year = i + 1;
    const escalatedSavings = totalSavings * Math.pow(1 + (elecEscalation / 100), year - 1);
    const net = escalatedSavings - debtService;
    cumulativeCashFlow += net;
    npv += net / Math.pow(1 + discountRate, year);
    
    return {
      year,
      savings: escalatedSavings,
      debtService,
      net,
      cumulative: cumulativeCashFlow
    };
  });

  return (
    <div className="flex flex-col h-full">
      {!projectId && (
        <div className="flex-shrink-0 border-b border-[#1E2A45] bg-[#121C35] px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight inline-flex items-center gap-3">
                Financial Modeling & ESPC Structuring
                {projectId && <FreshnessBadge projectId={projectId} module="Financial" showTimestamp />}
              </h1>
              <p className="text-sm text-[#7A8BA8] mt-1">Build ECM bundles, model cash flows, and analyze guarantee risk.</p>
            </div>
            <div className="flex items-center gap-3">
              <ExportButton
                variant="compact"
                filename={`financial-model-${(projects.find(p => p.id === selectedProjectId)?.name || 'project').toLowerCase().replace(/\s+/g, '-')}`}
                data={projectEcms.map(e => ({
                  'ECM Name': e.number,
                  'Category': e.category,
                  'Cost': e.cost,
                  'Annual Savings': e.savings,
                  'Simple Payback': e.savings > 0 ? Number((e.cost / e.savings).toFixed(1)) : 0,
                  'SIR': e.savings > 0 ? Number((e.savings * term / e.cost).toFixed(2)) : 0,
                }))}
              />
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E2A45] border border-[#2A3A5C] rounded-lg text-sm font-medium text-[#9AA5B8] hover:bg-[#2A3A5C] transition-colors">
                <Calculator className="w-4 h-4" />
                Compare Scenarios
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                <Plus className="w-4 h-4" />
                Add ECM
              </button>
            </div>
          </div>

          <div className="flex space-x-4 mt-4">
            {[
              { id: 'ecm', label: 'ECM Bundle Builder' },
              { id: 'pricing', label: 'Pricing Review' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id as any)}
                className={cn(
                  'pb-2 text-sm font-medium border-b-2 transition-colors',
                  subTab === t.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-[#7A8BA8] hover:text-white'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-8">
        {subTab === 'ecm' && (<>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">ECM Bundle Builder</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#7A8BA8]">Total Cost: <span className="text-white font-mono">${totalCost.toLocaleString()}</span></span>
                <span className="text-[#7A8BA8]">Total Savings: <span className="text-emerald-600 font-mono">${totalSavings.toLocaleString()}/yr</span></span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                  <tr>
                    <th className="px-6 py-4 font-medium">ECM</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium text-right">Cost</th>
                    <th className="px-6 py-4 font-medium text-right">Savings/Yr</th>
                    <th className="px-6 py-4 font-medium text-right">Payback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2A45]">
                  {projectEcms.map((ecm) => (
                    <tr key={ecm.id} className="hover:bg-[#1A2544] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        <div className="flex flex-col">
                          <span>{ecm.number}</span>
                          <span className="text-xs text-[#7A8BA8] font-normal">{ecm.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#9AA5B8]">
                        <span className="px-2.5 py-1 rounded bg-[#1E2A45] text-xs font-medium border border-[#2A3A5C]">
                          {ecm.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-[#9AA5B8] font-mono">
                        <EditableField value={ecm.cost} entityType="ecm" entityId={ecm.id} field="cost" projectId={selectedProjectId} type="number" formatter={(v) => `$${Number(v).toLocaleString()}`} />
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-mono">
                        <EditableField value={ecm.savings} entityType="ecm" entityId={ecm.id} field="savings" projectId={selectedProjectId} type="number" formatter={(v) => `$${Number(v).toLocaleString()}`} />
                      </td>
                      <td className="px-6 py-4 text-right text-[#9AA5B8] font-mono">
                        <EditableField value={ecm.life} entityType="ecm" entityId={ecm.id} field="life" projectId={selectedProjectId} type="number" formatter={(v) => `${v} yrs`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6 flex flex-col">
            <h3 className="text-sm font-semibold text-white mb-6">Financial Assumptions</h3>
            <div className="space-y-6 flex-1">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-[#7A8BA8]">Contract Term (Years)</label>
                  <span className="text-sm text-white font-mono">{term}</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="25" 
                  value={term} 
                  onChange={(e) => setTerm(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#1E2A45] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-[#7A8BA8]">Interest Rate (%)</label>
                  <span className="text-sm text-white font-mono">{interestRate.toFixed(2)}%</span>
                </div>
                <input 
                  type="range" 
                  min="2.0" 
                  max="8.0" 
                  step="0.1"
                  value={interestRate} 
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#1E2A45] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-[#7A8BA8]">Electric Escalation (%)</label>
                  <span className="text-sm text-white font-mono">{elecEscalation.toFixed(2)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="6.0" 
                  step="0.1"
                  value={elecEscalation} 
                  onChange={(e) => setElecEscalation(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#1E2A45] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                {elecEscalation > 3.5 && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Escalation &gt; 3.5% is considered aggressive and increases guarantee risk.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#1E2A45] grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs text-[#7A8BA8] uppercase tracking-wider mb-1">NPV (5%)</span>
                <span className={`text-lg font-bold font-mono ${npv >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${Math.round(npv).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="block text-xs text-[#7A8BA8] uppercase tracking-wider mb-1">DSCR</span>
                <span className={`text-lg font-bold font-mono ${parseFloat(dscr.toString()) >= 1.0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {dscr}x
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-6">Cash Flow Projection</h3>
          <div className="h-64 flex items-end gap-1">
            {cashFlows.map((cf) => {
              const maxVal = Math.max(...cashFlows.map(c => Math.abs(c.net)));
              const height = (Math.abs(cf.net) / maxVal) * 100;
              const isPositive = cf.net >= 0;
              return (
                <div key={cf.year} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                  <div
                    className={`w-full rounded-t-sm transition-colors ${isPositive ? 'bg-emerald-500/80 hover:bg-emerald-400' : 'bg-red-500/80 hover:bg-red-400'}`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                      Year {cf.year}: ${Math.round(cf.net).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[10px] text-[#7A8BA8] font-mono">{cf.year}</span>
                </div>
              );
            })}
          </div>
        </div>
        </>)}

        {/* ─── PRICING REVIEW TAB ─── */}
        {subTab === 'pricing' && (() => {
          const items = pricingReview.filter(p => p.projectId === selectedProjectId);
          const totalEsco = items.reduce((s, i) => s + i.escoCost, 0);
          const totalBenchMid = items.reduce((s, i) => s + i.benchMid, 0);
          const overallVariance = totalBenchMid > 0 ? ((totalEsco - totalBenchMid) / totalBenchMid) * 100 : 0;
          const flagged = items.filter(i => {
            const variance = ((i.escoCost - i.benchHigh) / i.benchHigh) * 100;
            return variance > 10;
          }).length;

          const getStatus = (item: typeof items[0]) => {
            if (item.escoCost >= item.benchLow && item.escoCost <= item.benchHigh) return 'within';
            const aboveHigh = ((item.escoCost - item.benchHigh) / item.benchHigh) * 100;
            if (aboveHigh > 25 || item.escoCost < item.benchLow * 0.75) return 'outlier';
            if (aboveHigh > 0) return 'review';
            return 'within';
          };

          return (
            <div className="space-y-6">
              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-5">
                  <p className="text-xs text-[#7A8BA8] uppercase tracking-wider mb-1">Total Proposed</p>
                  <p className="text-xl font-bold text-white font-mono">${totalEsco.toLocaleString()}</p>
                </div>
                <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-5">
                  <p className="text-xs text-[#7A8BA8] uppercase tracking-wider mb-1">Benchmark Mid</p>
                  <p className="text-xl font-bold text-white font-mono">${totalBenchMid.toLocaleString()}</p>
                </div>
                <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-5">
                  <p className="text-xs text-[#7A8BA8] uppercase tracking-wider mb-1">Overall Variance</p>
                  <p className={cn('text-xl font-bold font-mono', overallVariance > 10 ? 'text-red-600' : overallVariance > 5 ? 'text-amber-600' : 'text-emerald-600')}>
                    {overallVariance > 0 ? '+' : ''}{overallVariance.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-5">
                  <p className="text-xs text-[#7A8BA8] uppercase tracking-wider mb-1">Flagged Items</p>
                  <p className={cn('text-xl font-bold', flagged > 0 ? 'text-amber-600' : 'text-emerald-600')}>{flagged}</p>
                </div>
              </div>

              {/* Pricing table */}
              <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
                <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Line Item Pricing Review</h3>
                  <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E2A45] border border-[#2A3A5C] rounded-lg text-xs font-medium text-[#9AA5B8] hover:bg-[#2A3A5C] transition-colors">
                    <Icon icon="solar:export-bold-duotone" className="w-3.5 h-3.5" />
                    Export Pricing Review
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                      <tr>
                        <th className="px-6 py-4 font-medium">ECM Description</th>
                        <th className="px-6 py-4 font-medium text-right">ESCO Proposed</th>
                        <th className="px-6 py-4 font-medium text-right">Bench Low</th>
                        <th className="px-6 py-4 font-medium text-right">Bench Mid</th>
                        <th className="px-6 py-4 font-medium text-right">Bench High</th>
                        <th className="px-6 py-4 font-medium text-right">Variance</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2A45]">
                      {items.map(item => {
                        const status = getStatus(item);
                        const variance = ((item.escoCost - item.benchMid) / item.benchMid) * 100;
                        const pricingLock = lockRecords.find(l => l.entityType === 'pricingReview' && l.entityId === item.id);
                        return (
                          <tr key={item.id} className="hover:bg-[#1A2544] transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-medium text-white">{item.description}</p>
                              <p className="text-xs text-[#5A6B88] mt-1 italic">{item.internalNote}</p>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-white">
                              {pricingLock ? (
                                <span className="inline-flex items-center gap-1.5 justify-end">
                                  ${item.escoCost.toLocaleString()}
                                  <LockIndicator lock={pricingLock} />
                                </span>
                              ) : (
                                <EditableField value={item.escoCost} entityType="pricingReview" entityId={item.id} field="escoCost" projectId={selectedProjectId} type="number" formatter={(v) => `$${Number(v).toLocaleString()}`} />
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-[#7A8BA8]">${item.benchLow.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right font-mono text-[#7A8BA8]">${item.benchMid.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right font-mono text-[#7A8BA8]">${item.benchHigh.toLocaleString()}</td>
                            <td className={cn('px-6 py-4 text-right font-mono', variance > 15 ? 'text-red-600' : variance > 5 ? 'text-amber-600' : 'text-emerald-600')}>
                              {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn('px-2.5 py-1 rounded text-xs font-medium border',
                                status === 'within' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                status === 'review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-red-50 text-red-600 border-red-200'
                              )}>
                                {status === 'within' ? 'Within Range' : status === 'review' ? 'Review' : 'Outlier'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {items.length === 0 && (
                        <tr><td colSpan={7} className="px-6 py-8 text-center text-[#7A8BA8]">No pricing review data for this project.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

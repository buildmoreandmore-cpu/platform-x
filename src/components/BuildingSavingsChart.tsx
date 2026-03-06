import { useState } from 'react';
import { useStore } from '@/store';
import { Icon } from '@iconify/react';

const PHASES = ['Prospect', 'Audit', 'IGEA', 'RFP', 'Contract', 'Construction', 'M&V', 'Closeout'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CO2_FACTOR = 0.000417; // tCO2 per kWh — EPA eGRID Southeast

const SHORT_NAMES: Record<string, string> = {
  'Clayton County HS': 'HS',
  'Clayton County MS': 'MS',
  'Jonesboro Elementary': 'Jonesboro Elem',
  'Riverdale Elementary': 'Riverdale Elem',
  'Admin Building': 'Admin',
  'Transportation Center': 'Transport',
};

interface Props {
  projectId: string;
  projectPhase: string;
}

export function BuildingSavingsChart({ projectId, projectPhase }: Props) {
  const buildingSavings = useStore(s => s.buildingSavings);
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);

  const phaseIndex = PHASES.indexOf(projectPhase);
  const data = buildingSavings.filter(b => b.projectId === projectId);

  // Empty state: phase < M&V (index 6) or no data
  if (phaseIndex < 6 || data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <Icon icon="solar:chart-square-bold-duotone" className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 mb-4">
          Savings tracking begins after construction is complete and the first year of utility data is collected.
        </p>
        <div className="flex items-center justify-center gap-1.5">
          {PHASES.map((ph, i) => (
            <div key={ph} className="flex items-center gap-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  i < phaseIndex ? 'bg-[#0D918C]' : i === phaseIndex ? 'bg-[#0D918C] ring-2 ring-[#0D918C]/30' : 'bg-gray-200'
                }`}
                title={ph}
              />
              {i < PHASES.length - 1 && <div className={`w-4 h-px ${i < phaseIndex ? 'bg-[#0D918C]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <span className="text-[10px] text-gray-400">Current: {projectPhase}</span>
          <span className="text-[10px] text-gray-300">&rarr;</span>
          <span className="text-[10px] text-gray-400">M&V</span>
        </div>
      </div>
    );
  }

  const belowCount = data.filter(b => b.currentAnnualKwh < b.baselineAnnualKwh).length;
  const aboveCount = data.length - belowCount;
  const maxKwh = Math.max(...data.flatMap(b => [b.baselineAnnualKwh, b.currentAnnualKwh]));

  // Portfolio totals
  const totalBaseline = data.reduce((s, b) => s + b.baselineAnnualKwh, 0);
  const totalCurrent = data.reduce((s, b) => s + b.currentAnnualKwh, 0);
  const totalDiff = totalBaseline - totalCurrent;
  const totalPct = totalBaseline > 0 ? (totalDiff / totalBaseline) * 100 : 0;
  const totalCO2 = totalDiff * CO2_FACTOR;

  const expandedData = data.find(b => b.id === expandedBuilding);

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div
        className={`rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${
          aboveCount === 0
            ? 'bg-[#0D918C]/10 text-[#228B17] border border-[#0D918C]/30'
            : belowCount === 0
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
        }`}
      >
        <Icon
          icon={aboveCount === 0 ? 'solar:check-circle-bold' : belowCount === 0 ? 'solar:danger-triangle-bold' : 'solar:info-circle-bold'}
          className="w-4 h-4 flex-shrink-0"
        />
        {aboveCount === 0
          ? `All ${data.length} buildings performing below baseline — portfolio on track.`
          : belowCount === 0
            ? `All ${data.length} buildings exceeding baseline — investigation recommended.`
            : `${belowCount} of ${data.length} buildings performing below baseline. ${aboveCount} building${aboveCount > 1 ? 's' : ''} exceeding baseline.`}
      </div>

      {/* Grouped Bar Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-6">Savings Performance by Building</h3>
        <div className="overflow-x-auto">
          <div className="h-52 flex items-end gap-4" style={{ minWidth: '600px' }}>
            {data.map(b => {
              const saving = b.currentAnnualKwh <= b.baselineAnnualKwh;
              const baseH = (b.baselineAnnualKwh / maxKwh) * 100;
              const curH = (b.currentAnnualKwh / maxKwh) * 100;
              const diff = b.baselineAnnualKwh - b.currentAnnualKwh;
              const pct = b.baselineAnnualKwh > 0 ? (diff / b.baselineAnnualKwh) * 100 : 0;
              const label = SHORT_NAMES[b.buildingName] || b.buildingName;
              return (
                <div
                  key={b.id}
                  className="flex-1 flex flex-col items-center gap-2 cursor-pointer"
                  onClick={() => setExpandedBuilding(expandedBuilding === b.id ? null : b.id)}
                >
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    <div className="w-2/5 bg-[#CBD2DF] rounded-t relative group" style={{ height: `${baseH}%` }}>
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1.5 px-2.5 rounded whitespace-nowrap z-10 pointer-events-none">
                        <p className="font-semibold mb-0.5">{b.buildingName}</p>
                        <p>Baseline: {b.baselineAnnualKwh.toLocaleString()} kWh</p>
                        <p>Current: {b.currentAnnualKwh.toLocaleString()} kWh</p>
                        <p className={saving ? 'text-[#37BB26]' : 'text-red-300'}>
                          {saving ? 'Savings' : 'Over'}: {Math.abs(diff).toLocaleString()} kWh ({Math.abs(pct).toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-2/5 rounded-t relative group ${saving ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
                      style={{ height: `${curH}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1.5 px-2.5 rounded whitespace-nowrap z-10 pointer-events-none">
                        <p className="font-semibold mb-0.5">{b.buildingName}</p>
                        <p>Baseline: {b.baselineAnnualKwh.toLocaleString()} kWh</p>
                        <p>Current: {b.currentAnnualKwh.toLocaleString()} kWh</p>
                        <p className={saving ? 'text-[#37BB26]' : 'text-red-300'}>
                          {saving ? 'Savings' : 'Over'}: {Math.abs(diff).toLocaleString()} kWh ({Math.abs(pct).toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 text-center leading-tight">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-5 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-[#CBD2DF] rounded-sm inline-block" />Baseline</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-[#10B981] rounded-sm inline-block" />Current (Saving)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-[#EF4444] rounded-sm inline-block" />Current (Over Baseline)</span>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">Click a building to view monthly breakdown</p>
      </div>

      {/* Monthly Breakdown */}
      {expandedData && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 animate-slide-down">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-900">{expandedData.buildingName} — Monthly Breakdown</h3>
            <button
              onClick={() => setExpandedBuilding(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <div className="h-40 flex items-end gap-2" style={{ minWidth: '600px' }}>
              {expandedData.monthlyBaseline.map((baseline, i) => {
                const actual = expandedData.monthlyActual[i];
                const monthMax = Math.max(...expandedData.monthlyBaseline, ...expandedData.monthlyActual);
                const baseH = (baseline / monthMax) * 100;
                const actH = (actual / monthMax) * 100;
                const saving = actual <= baseline;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      <div className="w-2/5 bg-[#CBD2DF] rounded-t relative group" style={{ height: `${baseH}%` }}>
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                          Baseline: {baseline.toLocaleString()} kWh
                        </div>
                      </div>
                      <div
                        className={`w-2/5 rounded-t relative group ${saving ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
                        style={{ height: `${actH}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                          Actual: {actual.toLocaleString()} kWh
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400">{MONTHS[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {/* Portfolio Total */}
        <div className="bg-[#F5F7FB] rounded-xl p-5 border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Portfolio Total</p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Baseline</span>
              <span className="font-medium text-gray-900">{totalBaseline.toLocaleString()} kWh</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Current</span>
              <span className="font-medium text-gray-900">{totalCurrent.toLocaleString()} kWh</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between text-xs">
              <span className="text-gray-500">Difference</span>
              <span className={`font-semibold ${totalDiff >= 0 ? 'text-[#37BB26]' : 'text-red-600'}`}>
                {totalDiff >= 0 ? '-' : '+'}{Math.abs(totalDiff).toLocaleString()} kWh ({Math.abs(totalPct).toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">CO&#8322; Avoided</span>
              <span className={`font-semibold ${totalCO2 >= 0 ? 'text-[#37BB26]' : 'text-red-600'}`}>
                {Math.abs(totalCO2).toFixed(1)} tCO&#8322;
              </span>
            </div>
          </div>
        </div>

        {/* Per-building cards */}
        {data.map(b => {
          const diff = b.baselineAnnualKwh - b.currentAnnualKwh;
          const pct = b.baselineAnnualKwh > 0 ? (diff / b.baselineAnnualKwh) * 100 : 0;
          const co2 = diff * CO2_FACTOR;
          const saving = diff >= 0;
          return (
            <div key={b.id} className="bg-[#F5F7FB] rounded-xl p-5 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{b.buildingName}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Baseline</span>
                  <span className="font-medium text-gray-900">{b.baselineAnnualKwh.toLocaleString()} kWh</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Current</span>
                  <span className="font-medium text-gray-900">{b.currentAnnualKwh.toLocaleString()} kWh</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-xs">
                  <span className="text-gray-500">Difference</span>
                  <span className={`font-semibold ${saving ? 'text-[#37BB26]' : 'text-red-600'}`}>
                    {saving ? '-' : '+'}{Math.abs(diff).toLocaleString()} kWh ({Math.abs(pct).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">CO&#8322; Impact</span>
                  <span className={`font-semibold ${saving ? 'text-[#37BB26]' : 'text-red-600'}`}>
                    {saving ? '-' : '+'}{Math.abs(co2).toFixed(1)} tCO&#8322;
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

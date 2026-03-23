import { useState } from 'react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

interface CompletenessBarProps {
  projectId: string;
  onClick?: () => void;
}

export function CompletenessBar({ projectId, onClick }: CompletenessBarProps) {
  const [showPopover, setShowPopover] = useState(false);

  const project = useStore(s => s.projects.find(p => p.id === projectId));
  const buildings = useStore(s => s.buildings);
  const assets = useStore(s => s.assets);
  const utilityBills = useStore(s => s.utilityBills);
  const ecms = useStore(s => s.ecms);
  const submittals = useStore(s => s.submittals);
  const inspectionFindings = useStore(s => s.inspectionFindings);
  const mvData = useStore(s => s.mvData);

  if (!project) return null;

  const orgBuildings = buildings.filter(b => b.orgId === project.orgId);
  const orgBuildingIds = orgBuildings.map(b => b.id);
  const projectAssets = assets.filter(a => orgBuildingIds.includes(a.buildingId));
  const projectBills = utilityBills.filter(b => orgBuildingIds.includes(b.buildingId));
  const projectEcms = ecms.filter(e => e.projectId === projectId);
  const projectSubmittals = submittals.filter(s => s.projectId === projectId);
  const projectFindings = inspectionFindings.filter(f => f.projectId === projectId);
  const projectMv = mvData.filter(d => d.projectId === projectId);

  const gaps: string[] = [];
  let score = 0;
  let total = 0;

  // Assets loaded?
  total++;
  if (projectAssets.length > 0) score++;
  else gaps.push('No assets captured');

  // 24 months of utility bills?
  total++;
  if (projectBills.length >= 12) score++;
  else gaps.push(`Only ${projectBills.length}/12 months of utility data`);

  // Buildings complete?
  total++;
  if (orgBuildings.length > 0) score++;
  else gaps.push('No buildings assigned');

  // ECMs identified?
  total++;
  if (projectEcms.length > 0) score++;
  else gaps.push('No ECMs identified');

  // Submittals (construction phase)?
  if (project.phase === 'Construction' || project.phase === 'M&V' || project.phase === 'Closeout') {
    total++;
    if (projectSubmittals.length > 0) score++;
    else gaps.push('No submittals filed');

    // Inspection findings reviewed?
    total++;
    const resolvedFindings = projectFindings.filter(f => f.status === 'Resolved').length;
    if (projectFindings.length === 0 || resolvedFindings === projectFindings.length) score++;
    else gaps.push(`${projectFindings.length - resolvedFindings} open inspection findings`);
  }

  // M&V data?
  if (project.phase === 'M&V' || project.phase === 'Closeout') {
    total++;
    if (projectMv.length > 0) score++;
    else gaps.push('No M&V baseline data');
  }

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const color = percentage >= 80 ? 'bg-primary' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = percentage >= 80 ? 'text-secondary' : percentage >= 50 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => { onClick?.(); setShowPopover(!showPopover); }}
      >
        <div className="flex-1 h-1.5 bg-[#1E2A45] rounded-full overflow-hidden min-w-[60px]">
          <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${percentage}%` }} />
        </div>
        <span className={cn('text-[10px] font-mono font-semibold', textColor)}>{percentage}%</span>
      </div>

      {showPopover && gaps.length > 0 && (
        <div className="absolute top-full left-0 mt-2 bg-[#121C35] border border-[#1E2A45] rounded-lg p-3 shadow-xl z-40 min-w-[200px]">
          <p className="text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider mb-2">Gaps</p>
          <ul className="space-y-1">
            {gaps.map((gap, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-[#9AA5B8]">
                <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import {
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  DollarSign, Leaf, Activity, Clock, FileText, ArrowUpRight,
  ChevronRight, Zap, ShieldAlert, CircleDot, Database
} from 'lucide-react';
import { getFreshnessStatus, daysSinceUpdate } from '@/lib/freshness';
import { ExportButton } from '@/components/ExportButton';

const PHASE_ORDER = ['Prospect', 'Audit', 'IGEA', 'RFP', 'Contract', 'Construction', 'M&V', 'Closeout'] as const;

export function Dashboard() {
  const navigate = useNavigate();
  const mode = useStore(s => s.serviceLineMode);
  const projects = useStore(s => s.projects);
  const risks = useStore(s => s.risks);
  const milestones = useStore(s => s.milestones);
  const mvData = useStore(s => s.mvData);
  const tasks = useStore(s => s.tasks);
  const reports = useStore(s => s.reports);
  const assets = useStore(s => s.assets);
  const activityFeed = useStore(s => s.activityFeed);
  const contractObligations = useStore(s => s.contractObligations);
  const inspectionFindings = useStore(s => s.inspectionFindings);
  const ecms = useStore(s => s.ecms);
  const moduleLastUpdated = useStore(s => s.moduleLastUpdated);
  const freshnessConfig = useStore(s => s.freshnessConfig);

  // Computed KPIs
  const totalValue = projects.reduce((sum, p) => sum + p.value, 0);
  const highRisks = risks.filter(r => r.severity === 'High' || r.severity === 'Critical').length;
  const avgRisk = Math.round(projects.reduce((sum, p) => sum + p.riskScore, 0) / projects.length);
  const totalGuaranteed = mvData.reduce((sum, d) => sum + d.guaranteed, 0);
  const totalCalculated = mvData.reduce((sum, d) => sum + d.calculated, 0);
  const avgAchievement = totalGuaranteed > 0 ? Math.round((totalCalculated / totalGuaranteed) * 100) : 0;
  const openTasks = tasks.filter(t => t.status !== 'Done').length;
  const reportsDue = reports.filter(r => r.status === 'Draft' || r.status === 'In Review').length;
  const driftDetected = mvData.some(d => d.driftDetected);

  // Alert items — critical/overdue only
  const alerts = useMemo(() => {
    const items: { id: string; text: string; severity: 'red' | 'amber'; project: string }[] = [];
    // M&V drift
    mvData.filter(d => d.driftDetected).forEach(d => {
      const p = projects.find(pr => pr.id === d.projectId);
      const pctDrift = Math.round(((d.calculated - d.guaranteed) / d.guaranteed) * 100);
      items.push({ id: `mv-${d.id}`, text: `M&V drift detected — Year ${d.year} ${Math.abs(pctDrift)}% ${pctDrift < 0 ? 'below' : 'above'} guarantee`, severity: 'red', project: p?.name || '' });
    });
    // High/Critical risks
    risks.filter(r => r.status === 'Open').forEach(r => {
      const p = projects.find(pr => pr.id === r.projectId);
      items.push({ id: `risk-${r.id}`, text: r.description, severity: r.severity === 'Critical' ? 'red' : 'amber', project: p?.name || '' });
    });
    // Overdue milestones
    milestones.filter(m => m.status === 'overdue').forEach(m => {
      const p = projects.find(pr => pr.id === m.projectId);
      items.push({ id: `ms-${m.id}`, text: `${m.name} — overdue since ${m.dueDate}`, severity: 'red', project: p?.name || '' });
    });
    // Overdue contract obligations
    contractObligations.filter(c => c.status === 'Overdue').forEach(c => {
      const p = projects.find(pr => pr.id === c.projectId);
      items.push({ id: `co-${c.id}`, text: c.description, severity: 'red', project: p?.name || '' });
    });
    // Coming due obligations
    contractObligations.filter(c => c.status === 'Coming Due').forEach(c => {
      const p = projects.find(pr => pr.id === c.projectId);
      items.push({ id: `co-${c.id}`, text: `${c.description} — due ${c.dueDate}`, severity: 'amber', project: p?.name || '' });
    });
    return items;
  }, [mvData, risks, milestones, contractObligations, projects]);

  // Action-required items (not FYI milestones)
  const actionItems = useMemo(() => {
    const items: { id: string; name: string; action: string; assignedTo: string; urgency: 'red' | 'amber' | 'blue'; project: string }[] = [];
    milestones.filter(m => m.status === 'overdue').forEach(m => {
      const p = projects.find(pr => pr.id === m.projectId);
      items.push({ id: m.id, name: m.name, action: 'Draft due', assignedTo: m.assignedTo, urgency: 'red', project: p?.name?.split(' ')[0] || '' });
    });
    milestones.filter(m => m.status === 'in progress').forEach(m => {
      const p = projects.find(pr => pr.id === m.projectId);
      items.push({ id: m.id, name: m.name, action: 'Review needed', assignedTo: m.assignedTo, urgency: 'amber', project: p?.name?.split(' ')[0] || '' });
    });
    reports.filter(r => r.status === 'In Review').forEach(r => {
      const p = projects.find(pr => pr.id === r.projectId);
      items.push({ id: r.id, name: r.type, action: 'QA review needed', assignedTo: r.by, urgency: 'amber', project: p?.name?.split(' ')[0] || '' });
    });
    reports.filter(r => r.status === 'Draft').forEach(r => {
      const p = projects.find(pr => pr.id === r.projectId);
      items.push({ id: r.id, name: r.type, action: 'Draft incomplete', assignedTo: r.by, urgency: 'blue', project: p?.name?.split(' ')[0] || '' });
    });
    tasks.filter(t => t.priority === 'High').forEach(t => {
      const p = projects.find(pr => pr.id === t.projectId);
      items.push({ id: t.id, name: t.title, action: t.status, assignedTo: t.assignedTo, urgency: 'amber', project: p?.name?.split(' ')[0] || '' });
    });
    return items;
  }, [milestones, reports, tasks, projects]);

  // Mode-specific KPIs
  const modeKpis = useMemo(() => {
    if (mode === 'Audit') return [
      { label: 'Assets Captured', value: assets.length, icon: Activity, color: 'text-cyan-400', trend: '+3 this week' },
      { label: 'Buildings Surveyed', value: 4, icon: BarChart3, color: 'text-blue-400', trend: '4 of 4' },
      { label: 'Deficiencies Flagged', value: assets.filter(a => a.flags.length > 0).length, icon: AlertTriangle, color: 'text-amber-400', trend: null },
      { label: 'ECMs Identified', value: ecms.length, icon: Zap, color: 'text-emerald-400', trend: null },
    ];
    if (mode === 'OR') return [
      { label: 'Savings Achievement', value: `${avgAchievement}%`, icon: TrendingUp, color: avgAchievement >= 100 ? 'text-emerald-400' : 'text-red-400', trend: driftDetected ? 'Drift detected' : 'On track' },
      { label: 'Proposals in Review', value: reports.filter(r => r.type.includes('IGEA')).length, icon: FileText, color: 'text-blue-400', trend: null },
      { label: 'Reports Due', value: reportsDue, icon: Clock, color: 'text-amber-400', trend: null },
      { label: 'Open Risks', value: highRisks, icon: ShieldAlert, color: 'text-red-400', trend: null },
    ];
    if (mode === 'Construction') return [
      { label: 'Inspections', value: inspectionFindings.length, icon: CheckCircle2, color: 'text-emerald-400', trend: `${inspectionFindings.filter(i => i.status === 'Open').length} open` },
      { label: 'Scope Deviations', value: inspectionFindings.filter(i => i.type === 'Deviation from Scope').length, icon: AlertTriangle, color: 'text-amber-400', trend: null },
      { label: '% Installed', value: '62%', icon: Activity, color: 'text-blue-400', trend: null },
      { label: 'Change Orders', value: 1, icon: FileText, color: 'text-cyan-400', trend: '$45K approved' },
    ];
    return null;
  }, [mode, assets, ecms, avgAchievement, driftDetected, reports, reportsDue, highRisks, inspectionFindings]);

  // Data Health — stale modules
  const staleModules = useMemo(() => {
    const items: { projectName: string; module: string; daysStale: number; severity: 'amber' | 'red' }[] = [];
    for (const p of projects) {
      for (const config of freshnessConfig) {
        const key = `${p.id}-${config.module}`;
        const lastUpdated = moduleLastUpdated[key];
        if (!lastUpdated) continue;
        const status = getFreshnessStatus(lastUpdated, config);
        if (status !== 'fresh') {
          items.push({
            projectName: p.name.split(' ').slice(0, 2).join(' '),
            module: config.module,
            daysStale: daysSinceUpdate(lastUpdated),
            severity: status,
          });
        }
      }
    }
    return items.sort((a, b) => b.daysStale - a.daysStale);
  }, [projects, freshnessConfig, moduleLastUpdated]);

  // Extended activity feed
  const feedItems = useMemo(() => {
    const items = [
      ...activityFeed.map(a => ({ ...a, timeAgo: '2h ago' })),
      { id: 'af3', type: 'inspection', title: 'Inspection Completed', description: 'David completed inspection #14 at Henry County', user: 'David', date: '2024-03-26T08:00:00Z', timeAgo: 'yesterday' },
      { id: 'af4', type: 'report', title: 'Report Submitted', description: 'Sarah submitted Council Presentation draft for City of Morrow', user: 'Sarah', date: '2024-03-25T16:00:00Z', timeAgo: '2 days ago' },
      { id: 'af5', type: 'pricing', title: 'Pricing Outlier', description: 'System flagged ECM-2 chiller pricing 22% above benchmark', user: 'System', date: '2024-03-25T14:00:00Z', timeAgo: '2 days ago' },
    ];
    return items.slice(0, 6);
  }, [activityFeed]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Portfolio Dashboard</h1>
          <p className="text-xs text-[#5A6B88] mt-0.5">
            {mode === 'Full' ? 'Executive overview — all active ESPC projects' :
             mode === 'Audit' ? 'Energy audit operations overview' :
             mode === 'OR' ? "Owner's representative oversight" :
             'Construction management overview'}
          </p>
        </div>
        <ExportButton
          variant="compact"
          filename="portfolio-summary"
          sheets={[
            { name: 'Projects', data: projects.map(p => ({ 'Name': p.name, 'Phase': p.phase, 'ESCO': p.esco, 'Value': p.value, 'Risk Score': p.riskScore, 'Engineer': p.engineer })) },
            { name: 'Risks', data: risks.map(r => ({ 'Risk': r.description, 'Category': r.category, 'Severity': r.severity, 'Status': r.status, 'Owner': r.owner })) },
            { name: 'Recent Tasks', data: tasks.slice(0, 20).map(t => ({ 'Task': t.title, 'Project': projects.find(p => p.id === t.projectId)?.name || '', 'Assignee': t.assignedTo, 'Priority': t.priority, 'Due Date': t.dueDate, 'Status': t.status })) },
          ]}
        />
      </div>

      {/* Row 1: Primary KPIs — compact, dense */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Active Projects', value: projects.length, icon: BarChart3, color: 'text-blue-400', trend: '+0', trendUp: true },
          { label: 'Capital Exposure', value: `$${(totalValue / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-emerald-400', trend: null, trendUp: true },
          { label: 'Avg Risk Score', value: avgRisk, icon: Activity, color: avgRisk > 55 ? 'text-amber-400' : 'text-emerald-400', trend: avgRisk > 55 ? 'Elevated' : 'Normal', trendUp: false },
          { label: 'High/Crit Risks', value: highRisks, icon: AlertTriangle, color: highRisks > 0 ? 'text-red-400' : 'text-emerald-400', trend: null, trendUp: false },
          { label: 'Carbon Avoided', value: '1,240', icon: Leaf, color: 'text-purple-400', trend: 'tCO2e', trendUp: true },
          { label: 'Open Tasks', value: openTasks, icon: Zap, color: 'text-cyan-400', trend: null, trendUp: true },
        ].map((kpi, i) => (
          <div key={kpi.label} className="kpi-card bg-[#121C35] border border-[#1E2A45] rounded-lg px-4 py-3 animate-stat-pop" style={{ animationDelay: `${i * 0.04}s` }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-[#5A6B88] uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className={cn("w-3.5 h-3.5", kpi.color)} />
            </div>
            <p className={cn("text-2xl font-bold tracking-tight", kpi.color === 'text-red-400' ? 'text-red-400' : 'text-white')}>{kpi.value}</p>
            {kpi.trend && (
              <div className="flex items-center gap-1 mt-0.5">
                {kpi.trendUp ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-amber-500" />}
                <span className="text-[10px] text-[#5A6B88]">{kpi.trend}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Row 1b: Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Guaranteed Savings', value: `$${(totalGuaranteed / 1000).toFixed(0)}K`, sub: '3-year cumulative', color: 'text-emerald-400' },
          { label: 'Avg Achievement', value: `${avgAchievement}%`, sub: driftDetected ? 'Drift detected Year 3' : 'On track', color: avgAchievement >= 96 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Reports Due', value: reportsDue, sub: 'Draft or in review', color: reportsDue > 0 ? 'text-amber-400' : 'text-emerald-400' },
          { label: 'Obligations Coming Due', value: contractObligations.filter(c => c.status === 'Coming Due').length, sub: 'Next 90 days', color: 'text-cyan-400' },
        ].map((kpi, i) => (
          <div key={kpi.label} className="bg-[#121C35] border border-[#1E2A45] rounded-lg px-4 py-3 animate-stat-pop" style={{ animationDelay: `${(i + 6) * 0.04}s` }}>
            <span className="text-[10px] font-medium text-[#5A6B88] uppercase tracking-wider">{kpi.label}</span>
            <p className={cn("text-2xl font-bold tracking-tight mt-0.5", kpi.color)}>{kpi.value}</p>
            <span className="text-[10px] text-[#5A6B88]">{kpi.sub}</span>
          </div>
        ))}
      </div>

      {/* Mode-specific KPI row */}
      {modeKpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {modeKpis.map((kpi, i) => (
            <div key={kpi.label} className="bg-[#0F1829] border border-[#1E2A45] rounded-lg px-4 py-3 animate-stat-pop" style={{ animationDelay: `${(i + 10) * 0.04}s` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-[#5A6B88] uppercase tracking-wider">{kpi.label}</span>
                <kpi.icon className={cn("w-3.5 h-3.5", kpi.color)} />
              </div>
              <p className="text-xl font-bold text-white tracking-tight">{kpi.value}</p>
              {kpi.trend && <span className="text-[10px] text-[#5A6B88]">{kpi.trend}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Alert Strip — only shows if there are alerts */}
      {alerts.length > 0 && (
        <div className="bg-[#1A0F0F] border border-red-900/40 rounded-lg overflow-hidden">
          <div className="px-4 py-2 flex items-center gap-2 border-b border-red-900/20">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Needs Attention</span>
          </div>
          <div className="divide-y divide-red-900/10">
            {alerts.slice(0, 4).map(alert => (
              <div key={alert.id} className="px-4 py-2.5 flex items-center gap-3">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  alert.severity === 'red' ? 'bg-red-500' : 'bg-amber-500'
                )} />
                <span className="text-xs font-medium text-[#CBD2DF] flex-1">{alert.project}: {alert.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Health — stale module alerts */}
      {staleModules.length > 0 && (
        <div className="bg-[#121C35] border border-[#1E2A45] rounded-lg overflow-hidden">
          <div className="px-4 py-2 flex items-center gap-2 border-b border-[#1E2A45]">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Data Health</span>
            <span className="bg-[#1E2A45] text-[#7A8BA8] px-1.5 py-0.5 rounded border border-[#2A3A5C] font-mono text-[10px]">
              {staleModules.length}
            </span>
          </div>
          <div className="divide-y divide-[#1E2A45]">
            {staleModules.slice(0, 5).map((item, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  item.severity === 'red' ? 'bg-red-500' : 'bg-amber-500'
                )} />
                <span className="text-xs text-[#CBD2DF] flex-1">
                  <span className="font-medium text-white">{item.projectName}</span>
                  {' — '}{item.module} data is {item.daysStale} days old
                </span>
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded",
                  item.severity === 'red' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                )}>
                  {item.severity === 'red' ? 'Overdue' : 'Stale'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content grid: Pipeline + Actions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Project Pipeline — 7 cols */}
        <div className="lg:col-span-7 bg-[#121C35] border border-[#1E2A45] rounded-lg">
          <div className="px-5 py-4 border-b border-[#1E2A45] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Project Pipeline</h3>
            <button onClick={() => navigate('/app/projects')} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-[#1E2A45]">
            {projects.map(project => {
              const phaseIdx = PHASE_ORDER.indexOf(project.phase as any);
              const progressPct = ((phaseIdx + 1) / PHASE_ORDER.length) * 100;
              const projectRisks = risks.filter(r => r.projectId === project.id);
              const topRisk = projectRisks.find(r => r.severity === 'Critical') || projectRisks[0];
              const projMvData = mvData.filter(d => d.projectId === project.id);
              const yearlyGuarantee = projMvData.length > 0 ? projMvData[projMvData.length - 1].guaranteed : 0;

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/app/projects/${project.id}`)}
                  className="group px-5 py-4 hover:bg-[#1A2544] cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white truncate">{project.name}</h4>
                        <ChevronRight className="w-3.5 h-3.5 text-[#3A4B68] group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                      </div>
                      <p className="text-[11px] text-[#5A6B88] mt-0.5">{project.esco} • {project.engineer}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {project.value > 0 && (
                        <span className="text-xs font-semibold text-[#CBD2DF] tabular-nums">${(project.value / 1000000).toFixed(1)}M</span>
                      )}
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider",
                        project.phase === 'Construction' ? "bg-amber-500/10 text-amber-400" :
                        project.phase === 'M&V' ? "bg-blue-500/10 text-blue-400" :
                        project.phase === 'Audit' ? "bg-emerald-500/10 text-emerald-400" :
                        "bg-cyan-500/10 text-cyan-400"
                      )}>
                        {project.phase}
                      </span>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold",
                        project.riskScore > 60 ? 'bg-red-500/15 text-red-400' :
                        project.riskScore > 40 ? 'bg-amber-500/15 text-amber-400' :
                        'bg-emerald-500/15 text-emerald-400'
                      )} title={topRisk ? `Top risk: ${topRisk.description}` : 'No active risks'}>
                        {project.riskScore}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar + savings */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-1.5 bg-[#1E2A45] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500/60 rounded-full progress-bar-fill"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-[#5A6B88] flex-shrink-0">
                      {yearlyGuarantee > 0 && (
                        <span className="tabular-nums">${(yearlyGuarantee / 1000).toFixed(0)}K/yr guaranteed</span>
                      )}
                      <span className="tabular-nums">{Math.round(progressPct)}% lifecycle</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Actions + Activity */}
        <div className="lg:col-span-5 space-y-5">
          {/* Action Required panel */}
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-lg">
            <div className="px-5 py-3 border-b border-[#1E2A45]">
              <h3 className="text-sm font-semibold text-white">Action Required</h3>
            </div>
            <div className="divide-y divide-[#1E2A45]">
              {actionItems.length === 0 ? (
                <div className="px-5 py-6 text-center text-xs text-[#5A6B88]">No pending actions</div>
              ) : (
                actionItems.map(item => (
                  <div key={item.id} className="px-5 py-3 flex items-start gap-3">
                    <div className={cn(
                      "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                      item.urgency === 'red' ? 'bg-red-500' :
                      item.urgency === 'amber' ? 'bg-amber-500' :
                      'bg-blue-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white truncate">{item.name}</span>
                        <span className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded",
                          item.urgency === 'red' ? 'bg-red-500/10 text-red-400' :
                          item.urgency === 'amber' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-blue-500/10 text-blue-400'
                        )}>
                          {item.action}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#5A6B88] mt-0.5">{item.project} • {item.assignedTo}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-lg">
            <div className="px-5 py-3 border-b border-[#1E2A45]">
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
            </div>
            <div className="divide-y divide-[#1E2A45]">
              {feedItems.map(item => (
                <div key={item.id} className="px-5 py-3 flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
                    item.user === 'System' ? 'bg-amber-500/15 text-amber-400' :
                    item.user === 'Martin' ? 'bg-emerald-500/15 text-emerald-400' :
                    item.user === 'Sarah' ? 'bg-blue-500/15 text-blue-400' :
                    'bg-purple-500/15 text-purple-400'
                  )}>
                    {item.user === 'System' ? <CircleDot className="w-3 h-3" /> : item.user.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#CBD2DF]">
                      <span className="font-medium text-white">{item.user}</span>{' '}
                      {item.description}
                    </p>
                    <span className="text-[10px] text-[#5A6B88]">{item.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useStore } from '@/store';
import { useTenantName } from '@/hooks/useTenantName';
import {
  FileText, Download, CheckCircle2, AlertTriangle, MessageSquare, Clock,
  ShieldCheck, FileCheck, Send, Lock, ChevronRight, BarChart2,
  Leaf, TrendingUp, Users, CheckSquare, Copy, Printer, Star,
  CircleDot, CheckCircle
} from 'lucide-react';
import { ExportButton } from '@/components/ExportButton';
import { cn } from '@/lib/utils';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';
import { LockIndicator } from '@/components/LockIndicator';

const REPORT_TYPES = [
  'IGEA Report',
  'RFP Package',
  'Executive Summary',
  'Council Presentation',
  'One-Page Executive Summary',
  'M&V Annual Report',
  'Carbon Impact Report',
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'Draft':       { label: 'DRAFT',      color: 'text-[#888888]',     bg: 'bg-[#222222]',        border: 'border-[#2A3A5C]' },
  'In Review':   { label: 'IN REVIEW',  color: 'text-amber-600',    bg: 'bg-amber-500/10',     border: 'border-amber-500/20' },
  'QA Complete': { label: 'QA COMPLETE',color: 'text-blue-600',     bg: 'bg-blue-500/10',      border: 'border-blue-500/20' },
  'Approved':    { label: 'APPROVED',   color: 'text-secondary',  bg: 'bg-primary/10',   border: 'border-primary/20' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Draft'];
  return (
    <span className={cn(
      "status-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
      cfg.color, cfg.bg, cfg.border
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

// Council/Board Presentation Slides
function CouncilPresentation({ project, ecms, risks }: { project: any, ecms: any[], risks: any[] }) {
  const { company } = useTenantName();
  const [copiedSlide, setCopiedSlide] = useState<number | null>(null);
  const mvData = useStore(state => state.mvData);
  const milestones = useStore(state => state.milestones);

  const handleCopy = (idx: number, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedSlide(idx);
    setTimeout(() => setCopiedSlide(null), 1500);
  };

  const totalCost = ecms.reduce((s, e) => s + e.cost, 0);
  const totalSavings = ecms.reduce((s, e) => s + e.savings, 0);
  const co2Reduced = Math.round(totalSavings * 0.000744 * 1000); // rough tCO2e
  const projMv = mvData.filter(d => d.projectId === project.id);
  const totalGuaranteed = projMv.reduce((s: number, d: any) => s + d.guaranteed, 0);
  const totalCalculated = projMv.reduce((s: number, d: any) => s + d.calculated, 0);
  const achievement = totalGuaranteed > 0 ? Math.round((totalCalculated / totalGuaranteed) * 100) : 0;
  const npv = totalSavings > 0 ? Math.round(totalSavings * 12.46 - totalCost) : 0; // 20yr @ 5%
  const projMilestones = milestones.filter((m: any) => m.projectId === project.id);

  const slides = [
    {
      title: 'Project Overview',
      icon: <Star className="w-5 h-5 text-secondary" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Project', val: project.name },
              { label: 'ESCO Partner', val: project.esco },
              { label: 'Contract Value', val: `$${(project.value / 1000000).toFixed(1)}M` },
              { label: 'Current Phase', val: project.phase.toUpperCase() },
            ].map(({ label, val }) => (
              <div key={label} className="bg-[#0F1829] rounded-lg p-3 border border-[#222222]">
                <p className="text-[10px] text-[#888888] uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-white mt-1">{val}</p>
              </div>
            ))}
          </div>
        </div>
      ),
      copyText: `Project Overview\nProject: ${project.name}\nESCO: ${project.esco}\nContract: $${(project.value / 1000000).toFixed(1)}M\nPhase: ${project.phase}`
    },
    {
      title: 'Savings Performance',
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-secondary">${totalSavings.toLocaleString()}</span>
            <span className="text-sm text-[#888888] mb-1">/ year guaranteed savings</span>
          </div>
          <div className="w-full bg-[#0F1829] rounded-full h-3 border border-[#222222] overflow-hidden">
            <div className="bg-primary h-full rounded-full progress-bar-fill" style={{ width: `${Math.min(achievement, 100)}%` }} />
          </div>
          <p className="text-xs text-[#888888]">Achievement rate: <span className="text-secondary font-semibold">{achievement > 0 ? `${achievement}%` : 'N/A'}</span> of guaranteed baseline</p>
        </div>
      ),
      copyText: `Savings Performance\nAnnual Guaranteed Savings: $${totalSavings.toLocaleString()}\nAchievement Rate: ${achievement > 0 ? `${achievement}%` : 'N/A'}`
    },
    {
      title: 'Financial Summary',
      icon: <BarChart2 className="w-5 h-5 text-amber-400" />,
      content: (
        <div className="space-y-3">
          {[
            { label: 'Total Project Investment', val: `$${(totalCost / 1000000).toFixed(2)}M`, highlight: false },
            { label: 'Annual Energy Savings', val: `$${totalSavings.toLocaleString()}`, highlight: true },
            { label: 'Simple Payback', val: totalSavings > 0 ? `${(totalCost / totalSavings).toFixed(1)} years` : 'N/A', highlight: false },
            { label: 'NPV (20yr, 5%)', val: npv > 0 ? `$${npv.toLocaleString()}` : 'N/A', highlight: true },
          ].map(({ label, val, highlight }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-[#222222] last:border-0">
              <span className="text-sm text-[#888888]">{label}</span>
              <span className={cn("text-sm font-bold", highlight ? "text-secondary" : "text-white")}>{val}</span>
            </div>
          ))}
        </div>
      ),
      copyText: `Financial Summary\nTotal Investment: $${(totalCost / 1000000).toFixed(2)}M\nAnnual Savings: $${totalSavings.toLocaleString()}\nNPV: ${npv > 0 ? `$${npv.toLocaleString()}` : 'N/A'}`
    },
    {
      title: 'Risk Summary',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      content: (
        <div className="space-y-2">
          {risks.slice(0, 3).map((risk) => (
            <div key={risk.id} className={cn(
              "flex items-start gap-3 p-3 rounded-lg border",
              risk.severity === 'Critical' ? "bg-red-500/5 border-red-500/20" :
              risk.severity === 'High' ? "bg-amber-500/5 border-amber-500/20" :
              "bg-[#0F1829] border-[#222222]"
            )}>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded border mt-0.5 uppercase flex-shrink-0",
                risk.severity === 'Critical' ? "bg-red-500/15 text-red-600 border-red-500/25" :
                "bg-amber-500/15 text-amber-600 border-amber-500/25"
              )}>{risk.severity}</span>
              <div>
                <p className="text-xs text-[#D4D4D4] font-medium">{risk.description}</p>
                <p className="text-[10px] text-[#888888] mt-0.5">{risk.status}</p>
              </div>
            </div>
          ))}
          {risks.length === 0 && <p className="text-sm text-[#888888]">No active risks identified.</p>}
        </div>
      ),
      copyText: `Risk Summary\n${risks.slice(0,3).map(r => `• ${r.severity}: ${r.description} (${r.status})`).join('\n')}`
    },
    {
      title: 'Carbon Impact',
      icon: <Leaf className="w-5 h-5 text-secondary" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-secondary animate-stat-pop">{co2Reduced.toLocaleString()}</span>
            <span className="text-sm text-[#888888] mb-1">tCO₂e / year</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Equivalent to', val: `${Math.round(co2Reduced / 4.6)} cars off road` },
              { label: 'Trees Planted Equiv.', val: `${(co2Reduced * 16.5).toLocaleString()}` },
            ].map(({ label, val }) => (
              <div key={label} className="bg-primary/5 border border-primary/15 rounded-lg p-3">
                <p className="text-[10px] text-secondary/70 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-[#2A9A1E] mt-1">{val}</p>
              </div>
            ))}
          </div>
        </div>
      ),
      copyText: `Carbon Impact\n${co2Reduced.toLocaleString()} tCO₂e reduced annually`
    },
    {
      title: 'Next Steps & Milestones',
      icon: <CheckSquare className="w-5 h-5 text-blue-600" />,
      content: (
        <div className="space-y-2">
          {projMilestones.length > 0 ? projMilestones.slice(0, 4).map((m: any) => (
            <div key={m.id} className="flex items-center gap-3 py-2 border-b border-[#222222] last:border-0">
              {m.status === 'completed'
                ? <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0" />
                : <CircleDot className="w-4 h-4 text-[#666666] flex-shrink-0" />
              }
              <span className={cn("text-sm", m.status === 'completed' ? "text-[#666666] line-through" : "text-[#D4D4D4]")}>{m.name}</span>
            </div>
          )) : (
            <p className="text-sm text-[#888888]">No milestones defined yet.</p>
          )}
        </div>
      ),
      copyText: `Next Steps\n${projMilestones.slice(0, 4).map((m: any) => `• ${m.name} (${m.status})`).join('\n') || '• No milestones defined'}`
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-[#888888]">Slide-by-slide presentation preview — copy each card to clipboard</p>
        <span className="text-xs text-[#888888]">{slides.length} slides</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 stagger-children">
        {slides.map((slide, idx) => (
          <div
            key={slide.title}
            className="card-hover bg-[#1A1A1A] border border-[#222222] rounded-xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-[#222222] bg-[#0F1829] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {slide.icon}
                <div>
                  <p className="text-[10px] text-[#888888] uppercase tracking-wider">Slide {idx + 1}</p>
                  <h4 className="text-sm font-bold text-white">{slide.title}</h4>
                </div>
              </div>
              <button
                onClick={() => handleCopy(idx, slide.copyText)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#222222] border border-[#2A3A5C] rounded-lg text-xs text-[#888888] hover:text-white hover:border-[#3A4B68] transition-all duration-150"
              >
                {copiedSlide === idx
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                  : <Copy className="w-3.5 h-3.5" />
                }
                {copiedSlide === idx ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-5 flex-1">
              {slide.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// One-Page Executive Summary
function OnePageSummary({ project, risks }: { project: any, risks: any[] }) {
  const { company } = useTenantName();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const mvData = useStore(state => state.mvData);
  const milestones = useStore(state => state.milestones);
  const ecms = useStore(state => state.ecms);
  const tasks = useStore(state => state.tasks);

  const projMv = mvData.filter((d: any) => d.projectId === project.id);
  const totalGuaranteed = projMv.reduce((s: number, d: any) => s + d.guaranteed, 0);
  const totalCalculated = projMv.reduce((s: number, d: any) => s + d.calculated, 0);
  const achievementRate = totalGuaranteed > 0 ? Math.round((totalCalculated / totalGuaranteed) * 100) : 0;
  const variance = totalCalculated - totalGuaranteed;
  const onTrack = achievementRate >= 90;
  const projMilestones = milestones.filter((m: any) => m.projectId === project.id);
  const projEcms = ecms.filter((e: any) => e.projectId === project.id);
  const projTasks = tasks.filter((t: any) => t.projectId === project.id);
  const PHASE_ORDER = ['Prospect', 'Audit', 'IGEA', 'RFP', 'Contract', 'Construction', 'M&V', 'Closeout'];
  const phaseIdx = PHASE_ORDER.indexOf(project.phase);
  const progressPct = Math.round(((phaseIdx + 1) / PHASE_ORDER.length) * 100);
  const nextMilestone = projMilestones.find((m: any) => m.status !== 'completed');
  const nextMilestoneDays = nextMilestone?.dueDate
    ? Math.max(0, Math.round((new Date(nextMilestone.dueDate).getTime() - Date.now()) / 86400000))
    : null;

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#888888]">Single-page formatted summary — designed for printing or email</p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 bg-[#222222] border border-[#2A3A5C] rounded-lg text-sm text-[#9AA5B8] hover:bg-[#2A3A5C] transition-colors duration-150 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            {generating ? 'Generating…' : generated ? 'Re-generate PDF' : 'Generate PDF'}
          </button>
        </div>
      </div>

      {/* Clean Executive Summary Card */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden text-black max-w-3xl mx-auto">
        {/* Header bar */}
        <div className="bg-[#00cc6a] text-[#0A0A0A] px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-secondary">One-Page Executive Summary</p>
              <h2 className="text-xl font-bold mt-1">{project.name}</h2>
            </div>
            <div className="text-right text-xs text-secondary">
              <p>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p className="mt-1">Prepared by {company}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 grid grid-cols-2 gap-6">
          {/* Project Status */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 pb-2 border-b border-neutral-200">Project Status</h3>
            <div className="space-y-2">
              {[
                { label: 'Phase', val: project.phase },
                { label: 'Progress', val: `${progressPct}% Complete` },
                { label: 'Next Milestone', val: nextMilestoneDays !== null ? `${nextMilestoneDays} days` : 'None set' },
                { label: 'ESCO', val: project.esco },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-neutral-500">{label}</span>
                  <span className="font-semibold text-neutral-800">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Health */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 pb-2 border-b border-neutral-200">Financial Health</h3>
            <div className="space-y-2">
              {[
                { label: 'Savings On Track', val: projMv.length > 0 ? (onTrack ? 'YES' : 'NO') : 'N/A', green: onTrack },
                { label: 'Achievement Rate', val: projMv.length > 0 ? `${achievementRate}%` : 'N/A', green: achievementRate >= 90 },
                { label: 'YTD Variance', val: projMv.length > 0 ? `${variance >= 0 ? '+' : ''}$${Math.abs(variance).toLocaleString()}` : 'N/A', green: variance >= 0 },
                { label: 'Contract Value', val: `$${(project.value / 1000000).toFixed(1)}M`, green: false },
              ].map(({ label, val, green }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-neutral-500">{label}</span>
                  <span className={cn("font-semibold", green ? "text-[#2A9A1E]" : "text-neutral-800")}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 Risks */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 pb-2 border-b border-neutral-200">Top Risks</h3>
            <div className="space-y-2">
              {risks.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-start gap-2">
                  <span className={cn(
                    "text-[9px] font-bold px-1 py-0.5 rounded mt-0.5 uppercase flex-shrink-0",
                    r.severity === 'Critical' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {r.severity}
                  </span>
                  <span className="text-xs text-neutral-600">{r.description}</span>
                </div>
              ))}
              {risks.length === 0 && <p className="text-xs text-neutral-400">No active risks.</p>}
            </div>
          </div>

          {/* 30-Day Outlook */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 pb-2 border-b border-neutral-200">30-Day Outlook</h3>
            <div className="space-y-1.5">
              {(() => {
                const upcoming = [
                  ...projMilestones.filter((m: any) => m.status !== 'completed').slice(0, 2).map((m: any) => m.name),
                  ...projTasks.filter((t: any) => t.status !== 'Done').slice(0, 2).map((t: any) => t.title),
                ];
                if (upcoming.length === 0) return <p className="text-xs text-neutral-400">No upcoming items.</p>;
                return upcoming.map((item: string) => (
                  <div key={item} className="flex items-start gap-1.5 text-xs text-neutral-600">
                    <ChevronRight className="w-3 h-3 text-secondary flex-shrink-0 mt-0.5" />
                    {item}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Key Decisions Needed */}
        <div className="px-8 pb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 pb-2 border-b border-neutral-200">Key Decisions Needed</h3>
          <div className="grid grid-cols-3 gap-3">
            {(() => {
              const decisions = [
                ...projTasks.filter((t: any) => t.priority === 'High' && t.status !== 'Done').slice(0, 2).map((t: any) => ({ text: t.title, urgent: true })),
                ...projMilestones.filter((m: any) => m.status === 'overdue').slice(0, 1).map((m: any) => ({ text: `${m.name} — overdue`, urgent: true })),
                ...projMilestones.filter((m: any) => m.status === 'in progress').slice(0, 1).map((m: any) => ({ text: m.name, urgent: false })),
              ].slice(0, 3);
              if (decisions.length === 0) return <p className="text-xs text-neutral-400 col-span-3">No pending decisions.</p>;
              return decisions.map(({ text, urgent }) => (
                <div key={text} className={cn(
                  "p-2.5 rounded-lg border text-xs",
                  urgent ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-neutral-50 border-neutral-200 text-neutral-700"
                )}>
                  {urgent && <span className="block text-[9px] font-bold text-amber-600 uppercase mb-1">Action Required</span>}
                  {text}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-between items-center text-[10px] text-neutral-400">
          <span>{company} • Confidential</span>
          <span>Generated {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

export function Reporting({ projectId }: { projectId?: string }) {
  const { company } = useTenantName();
  const projects = useStore(state => state.projects);
  const reports = useStore(state => state.reports);
  const ecms = useStore(state => state.ecms);
  const risks = useStore(state => state.risks);
  const addReport = useStore(state => state.addReport);
  const addActivity = useStore(state => state.addActivity);
  const toggleQAItem = useStore(state => state.toggleQAItem);
  const addQAComment = useStore(state => state.addQAComment);
  const approveReport = useStore(state => state.approveReport);
  const lockRecords = useStore(state => state.lockRecords);
  const currentUserId = useStore(state => state.currentUserId);
  const users = useStore(state => state.users);
  const currentUser = users.find(u => u.id === currentUserId);

  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'qa'>('generate');
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || projects[0]?.id || '');
  const [reportType, setReportType] = useState('IGEA Report');
  const [reportAshraeLevel, setReportAshraeLevel] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectEcms = ecms.filter(e => e.projectId === selectedProjectId);
  const projectRisks = risks.filter(r => r.projectId === selectedProjectId);

  const handleAddComment = (reportId: string) => {
    const text = commentInputs[reportId]?.trim();
    if (!text) return;
    addQAComment(reportId, { author: currentUser?.name || 'System', text });
    setCommentInputs(prev => ({ ...prev, [reportId]: '' }));
  };

  return (
    <div className="flex flex-col h-full">
      {!projectId && (
        <div className="flex-shrink-0 border-b border-[#222222] bg-[#1A1A1A] px-3 md:px-8 py-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Automated Reporting & QA</h1>
              <p className="text-sm text-[#888888] mt-1">Generate standardized deliverables and manage QA/QC workflows.</p>
            </div>
            <div className="flex items-center gap-3">
              <ExportButton
                variant="compact"
                filename="reports"
                data={reports.map(r => ({
                  'Report Type': r.type,
                  'Project': projects.find(p => p.id === r.projectId)?.name || '',
                  'Version': r.version,
                  'Date': r.date,
                  'Generated By': r.by,
                  'Status': r.status,
                }))}
              />
              <select
                value={selectedProjectId}
                onChange={(e) => { setSelectedProjectId(e.target.value); setReportAshraeLevel((projects.find(p => p.id === e.target.value) as any)?.ashraeLevel || ''); }}
                className="bg-[#222222] border border-[#2A3A5C] text-[#D4D4D4] text-sm rounded-lg focus:ring-primary focus:border-primary block w-64 p-2.5 transition-colors"
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex space-x-1">
            {[
              { id: 'generate', label: 'Generate Report', icon: FileText },
              { id: 'history', label: 'Report History', icon: Clock },
              { id: 'qa', label: 'QA/QC Workflow', icon: ShieldCheck },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "tab-btn px-4 pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                  activeTab === tab.id
                    ? "border-primary text-secondary active"
                    : "border-transparent text-[#888888] hover:text-white"
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

        {/* ─── GENERATE REPORT TAB ─── */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Type Selector */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl p-6">
                <h3 className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-4">Report Type</h3>
                <div className="space-y-1.5">
                  {REPORT_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setReportType(type)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 border flex items-center justify-between group",
                        reportType === type
                          ? "bg-primary/10 text-[#2A9A1E] border-primary/20"
                          : "bg-[#0F1829] text-[#888888] border-[#222222] hover:bg-[#1A2544] hover:text-white hover:border-[#2A3A5C]"
                      )}
                    >
                      {type}
                      {reportType === type && <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-[#222222] space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#888888] uppercase tracking-wider mb-1.5">ASHRAE Level</label>
                    <select
                      value={reportAshraeLevel || (selectedProject as any)?.ashraeLevel || ''}
                      onChange={e => setReportAshraeLevel(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0F1829] border border-[#222222] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">— Select level —</option>
                      <option value="Level I — Walk-Through">Level I — Walk-Through</option>
                      <option value="Level II — Energy Survey">Level II — Energy Survey</option>
                      <option value="Level III — IGEA/Investment Grade">Level III — IGEA/Investment Grade</option>
                    </select>
                  </div>
                  <button
                    disabled={!selectedProject}
                    onClick={() => {
                      if (!selectedProject) return;
                      addReport({
                        type: reportType,
                        projectId: selectedProjectId,
                        version: 'v1.0',
                        date: new Date().toISOString().split('T')[0],
                        by: currentUser?.name || 'System',
                        status: 'Draft',
                        ashraeLevel: reportAshraeLevel || (selectedProject as any)?.ashraeLevel || '',
                        qaChecklistItems: [
                          { id: `qa1_${Date.now()}`, label: 'Data accuracy verified', checked: false },
                          { id: `qa2_${Date.now()}`, label: 'Calculations reviewed', checked: false },
                          { id: `qa3_${Date.now()}`, label: 'Formatting checked', checked: false },
                        ],
                        qaCompleted: 0,
                        comments: [],
                      } as any);
                      addActivity({ user: currentUser?.name || 'System', description: `generated ${reportType} draft for ${selectedProject.name}` });
                      setActiveTab('history');
                    }}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00ff88] rounded-lg text-sm font-medium text-white hover:bg-[#00cc6a] disabled:opacity-40"
                  >
                    <FileText className="w-4 h-4" />
                    Generate Draft
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-2">
              {reportType === 'Council Presentation' && selectedProject ? (
                <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-[#222222] bg-[#0F1829] flex items-center justify-between">
                    <h3 className="text-sm font-medium text-[#888888]">Preview: Council/Board Presentation</h3>
                    <StatusBadge status="Draft" />
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[700px]">
                    <CouncilPresentation
                      project={selectedProject}
                      ecms={projectEcms}
                      risks={projectRisks}
                    />
                  </div>
                </div>
              ) : reportType === 'One-Page Executive Summary' && selectedProject ? (
                <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-[#222222] bg-[#0F1829] flex items-center justify-between">
                    <h3 className="text-sm font-medium text-[#888888]">Preview: One-Page Executive Summary</h3>
                    <StatusBadge status="Draft" />
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[700px]">
                    <OnePageSummary project={selectedProject} risks={projectRisks} />
                  </div>
                </div>
              ) : (
                <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl overflow-hidden h-full min-h-[600px] flex flex-col">
                  <div className="p-4 border-b border-[#222222] bg-[#0F1829] flex items-center justify-between">
                    <h3 className="text-sm font-medium text-[#888888]">Preview: {reportType}</h3>
                    <button onClick={() => window.print()} className="p-1.5 text-[#888888] hover:text-white hover:bg-[#222222] rounded transition-colors duration-150" title="Print / Save as PDF">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 p-8 bg-[#0A0A0A] overflow-y-auto">
                    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl min-h-[700px] p-12">
                      <div className="border-b-4 border-[#00ff88] pb-6 mb-8">
                        <h1 className="text-3xl font-bold text-neutral-900 mb-2">{selectedProject?.name}</h1>
                        <h2 className="text-xl text-neutral-500">{reportType}</h2>
                        <p className="text-sm text-neutral-500 mt-4">Prepared by: {company}</p>
                        <p className="text-sm text-neutral-500">Date: {new Date().toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-6">
                        <section>
                          <h3 className="text-lg font-bold text-neutral-900 mb-3">1. Executive Summary</h3>
                          <p className="text-sm text-neutral-700 leading-relaxed">
                            This report details the findings and recommendations for the {selectedProject?.name} project.
                            Based on our analysis, the proposed Energy Conservation Measures represent a viable path forward
                            for achieving the facility's energy reduction goals while addressing critical deferred maintenance.
                          </p>
                        </section>
                        <section>
                          <h3 className="text-lg font-bold text-neutral-900 mb-3">2. Financial Overview</h3>
                          <table className="w-full text-sm text-left border-collapse">
                            <thead>
                              <tr className="bg-neutral-100">
                                <th className="border border-neutral-300 px-4 py-2 font-semibold">Metric</th>
                                <th className="border border-neutral-300 px-4 py-2 font-semibold">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-neutral-300 px-4 py-2">Total Project Cost</td>
                                <td className="border border-neutral-300 px-4 py-2">${(selectedProject?.value || 0).toLocaleString()}</td>
                              </tr>
                              <tr>
                                <td className="border border-neutral-300 px-4 py-2">Simple Payback</td>
                                <td className="border border-neutral-300 px-4 py-2">{(() => { const totalS = projectEcms.reduce((s: number, e: any) => s + e.savings, 0); const totalC = projectEcms.reduce((s: number, e: any) => s + e.cost, 0); return totalS > 0 ? `${(totalC / totalS).toFixed(1)} Years` : '—'; })()}</td>
                              </tr>
                              <tr>
                                <td className="border border-neutral-300 px-4 py-2">NPV (20yr, 5%)</td>
                                <td className="border border-neutral-300 px-4 py-2 text-secondary font-semibold">{(() => { const totalS = projectEcms.reduce((s: number, e: any) => s + e.savings, 0); const totalC = projectEcms.reduce((s: number, e: any) => s + e.cost, 0); const npvVal = totalS > 0 ? Math.round(totalS * 12.46 - totalC) : 0; return `$${npvVal.toLocaleString()}`; })()}</td>
                              </tr>
                            </tbody>
                          </table>
                        </section>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── REPORT HISTORY TAB ─── */}
        {activeTab === 'history' && (
          <div className="bg-[#1A1A1A] border border-[#222222] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#222222] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Report History</h3>
              <span className="text-xs text-[#888888]">{reports.length} reports</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#222222]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Report Type</th>
                    <th className="px-6 py-4 font-medium">Version</th>
                    <th className="px-6 py-4 font-medium">Generated Date</th>
                    <th className="px-6 py-4 font-medium">Generated By</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222] stagger-rows">
                  {reports.map((report) => {
                    const reportLock = lockRecords.find(l => l.entityType === 'report' && l.entityId === report.id);
                    return (
                    <tr key={report.id} className="hover:bg-[#1A2544] transition-colors duration-100">
                      <td className="px-6 py-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <div>
                            <span>{report.type}</span>
                            <span className="block text-xs text-[#888888] font-normal mt-0.5">
                              {projects.find(p => p.id === report.projectId)?.name}
                            </span>
                          </div>
                          {reportLock && <LockIndicator lock={reportLock} />}
                        </div>
                        <AuditTrailPanel entityType="report" entityId={report.id} />
                      </td>
                      <td className="px-6 py-4 text-[#9AA5B8] font-mono">{report.version}</td>
                      <td className="px-6 py-4 text-[#9AA5B8] font-mono text-xs">{report.date}</td>
                      <td className="px-6 py-4 text-[#9AA5B8]">{report.by}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={report.status} />
                          {reportLock && <LockIndicator lock={reportLock} />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => window.print()} className="p-1.5 text-[#888888] hover:text-white hover:bg-[#222222] rounded transition-colors duration-150" title="Print / Save as PDF">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── QA/QC WORKFLOW TAB ─── */}
        {activeTab === 'qa' && (
          <div className="space-y-8">
            {reports.map((report) => {
              const qaItems = (report as any).qaChecklistItems || [];
              const comments = (report as any).comments || [];
              const isApproved = report.status === 'Approved';
              const approvedBy = (report as any).approvedBy;
              const completedCount = qaItems.filter((q: any) => q.checked).length;
              const progress = qaItems.length > 0 ? (completedCount / qaItems.length) * 100 : 0;
              const showComments = expandedComments[report.id];
              const qaReportLock = lockRecords.find(l => l.entityType === 'report' && l.entityId === report.id);

              return (
                <div key={report.id} className="card-hover bg-[#1A1A1A] border border-[#222222] rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="p-6 border-b border-[#222222] bg-[#0F1829] flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{report.type}</h3>
                        {qaReportLock && <LockIndicator lock={qaReportLock} />}
                      </div>
                      <p className="text-xs text-[#888888] mt-1">
                        {projects.find(p => p.id === report.projectId)?.name} • {report.version} • By {report.by} on {report.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={report.status} />
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* QA Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-[#D4D4D4] flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-secondary" />
                          QA Checklist
                        </h4>
                        <span className="text-xs font-mono text-[#888888]">{completedCount}/{qaItems.length} items</span>
                      </div>
                      <div className="w-full h-2 bg-[#222222] rounded-full overflow-hidden mb-4">
                        <div
                          className={cn(
                            "h-full rounded-full progress-bar-fill",
                            progress === 100 ? "bg-primary" :
                            progress >= 50 ? "bg-blue-500" : "bg-amber-500"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Checklist Items */}
                      <div className="space-y-2">
                        {qaItems.map((item: any) => (
                          <label
                            key={item.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150",
                              item.checked
                                ? "bg-primary/5 border-primary/15 opacity-80"
                                : "bg-[#0F1829] border-[#222222] hover:border-[#2A3A5C]"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={item.checked}
                              disabled={isApproved}
                              onChange={() => toggleQAItem(report.id, item.id)}
                              className="mt-0.5 rounded border-[#2A3A5C] text-secondary focus:ring-primary bg-[#222222] flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className={cn(
                                "text-sm block",
                                item.checked ? "text-[#666666] line-through" : "text-[#D4D4D4]"
                              )}>
                                {item.text}
                              </span>
                              {item.checked && item.reviewer && (
                                <span className="text-[10px] text-[#888888] block mt-0.5">
                                  ✓ Checked by {item.reviewer} on {item.reviewDate}
                                </span>
                              )}
                            </div>
                            {item.checked && <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Comments Thread */}
                    <div>
                      <button
                        onClick={() => setExpandedComments(prev => ({ ...prev, [report.id]: !prev[report.id] }))}
                        className="flex items-center gap-2 text-sm font-semibold text-[#9AA5B8] hover:text-white transition-colors duration-150 mb-3"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Review Comments
                        <span className="text-xs bg-[#222222] text-[#888888] px-1.5 py-0.5 rounded border border-[#2A3A5C] font-mono">
                          {comments.length}
                        </span>
                        <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-200", showComments ? "rotate-90" : "")} />
                      </button>

                      {showComments && (
                        <div className="animate-slide-down space-y-3">
                          {comments.length === 0 && (
                            <p className="text-sm text-[#888888] italic">No comments yet.</p>
                          )}
                          {comments.map((comment: any) => (
                            <div
                              key={comment.id}
                              className={cn(
                                "p-3 rounded-lg border text-sm",
                                comment.resolved
                                  ? "bg-[#0F1829] border-[#222222] opacity-70"
                                  : "bg-[#1A1A1A] border-[#2A3A5C]"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-white">{comment.author}</span>
                                  <span className="text-[10px] text-[#888888]">
                                    {new Date(comment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {comment.resolved && (
                                  <span className="text-[10px] text-secondary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">Resolved</span>
                                )}
                              </div>
                              <p className="text-[#9AA5B8] leading-relaxed">{comment.text}</p>
                            </div>
                          ))}

                          {!isApproved && (
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                placeholder="Add a comment…"
                                value={commentInputs[report.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [report.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(report.id); }}
                                className="flex-1 bg-[#0F1829] border border-[#222222] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400 transition-colors"
                              />
                              <button
                                onClick={() => handleAddComment(report.id)}
                                className="btn-primary p-2 bg-[#00ff88] rounded-lg text-white hover:bg-[#00cc6a]"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Approved by banner */}
                    {isApproved && approvedBy && (
                      <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <Lock className="w-4 h-4 text-secondary flex-shrink-0" />
                        <p className="text-sm text-secondary">
                          Approved by <strong>{approvedBy}</strong> on{' '}
                          {new Date((report as any).approvedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          <span className="text-[#888888]"> — Report locked</span>
                        </p>
                      </div>
                    )}

                    {/* Audit Trail */}
                    <AuditTrailPanel entityType="report" entityId={report.id} />
                  </div>

                  {/* Footer Actions */}
                  {!isApproved && (
                    <div className="px-6 py-4 border-t border-[#222222] bg-[#0F1829] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-[#888888]">
                        <Users className="w-3.5 h-3.5" />
                        {completedCount}/{qaItems.length} checks complete
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setExpandedComments(prev => ({ ...prev, [report.id]: true }))}
                          className="px-4 py-2 bg-[#222222] text-[#9AA5B8] text-sm font-medium rounded-lg hover:bg-[#2A3A5C] transition-colors duration-150 border border-[#2A3A5C]"
                        >
                          Add Comment
                        </button>
                        <button
                          disabled={progress < 100}
                          onClick={() => approveReport(report.id, currentUser?.name || 'System')}
                          className={cn(
                            "btn-primary px-4 py-2 text-sm font-medium rounded-lg border border-transparent transition-all duration-150",
                            progress === 100
                              ? "bg-[#00ff88] text-[#0A0A0A] hover:bg-[#00cc6a]"
                              : "bg-[#222222] text-[#666666] cursor-not-allowed border-[#222222]"
                          )}
                          title={progress < 100 ? "Complete all QA items to approve" : "Approve and lock report"}
                        >
                          <span className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            {progress === 100 ? 'Approve & Lock' : `${Math.round(progress)}% Complete`}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

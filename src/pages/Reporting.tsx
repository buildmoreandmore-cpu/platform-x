import { useState } from 'react';
import { useStore } from '@/store';
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
  'Draft':       { label: 'DRAFT',      color: 'text-[#7A8BA8]',     bg: 'bg-[#1E2A45]',        border: 'border-[#2A3A5C]' },
  'In Review':   { label: 'IN REVIEW',  color: 'text-amber-600',    bg: 'bg-amber-500/10',     border: 'border-amber-500/20' },
  'QA Complete': { label: 'QA COMPLETE',color: 'text-blue-600',     bg: 'bg-blue-500/10',      border: 'border-blue-500/20' },
  'Approved':    { label: 'APPROVED',   color: 'text-emerald-600',  bg: 'bg-emerald-500/10',   border: 'border-emerald-500/20' },
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
  const [copiedSlide, setCopiedSlide] = useState<number | null>(null);

  const handleCopy = (idx: number, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedSlide(idx);
    setTimeout(() => setCopiedSlide(null), 1500);
  };

  const totalCost = ecms.reduce((s, e) => s + e.cost, 0);
  const totalSavings = ecms.reduce((s, e) => s + e.savings, 0);
  const co2Reduced = Math.round(totalSavings * 0.000744 * 1000); // rough tCO2e

  const slides = [
    {
      title: 'Project Overview',
      icon: <Star className="w-5 h-5 text-emerald-600" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Project', val: project.name },
              { label: 'ESCO Partner', val: project.esco },
              { label: 'Contract Value', val: `$${(project.value / 1000000).toFixed(1)}M` },
              { label: 'Current Phase', val: project.phase.toUpperCase() },
            ].map(({ label, val }) => (
              <div key={label} className="bg-[#0F1829] rounded-lg p-3 border border-[#1E2A45]">
                <p className="text-[10px] text-[#7A8BA8] uppercase tracking-wider">{label}</p>
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
            <span className="text-4xl font-bold text-emerald-600">${totalSavings.toLocaleString()}</span>
            <span className="text-sm text-[#7A8BA8] mb-1">/ year guaranteed savings</span>
          </div>
          <div className="w-full bg-[#0F1829] rounded-full h-3 border border-[#1E2A45] overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full progress-bar-fill" style={{ width: '94%' }} />
          </div>
          <p className="text-xs text-[#7A8BA8]">Achievement rate: <span className="text-emerald-600 font-semibold">94%</span> of guaranteed baseline</p>
        </div>
      ),
      copyText: `Savings Performance\nAnnual Guaranteed Savings: $${totalSavings.toLocaleString()}\nAchievement Rate: 94%`
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
            { label: 'NPV (20yr, 5%)', val: '$425,000', highlight: true },
          ].map(({ label, val, highlight }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-[#1E2A45] last:border-0">
              <span className="text-sm text-[#7A8BA8]">{label}</span>
              <span className={cn("text-sm font-bold", highlight ? "text-emerald-600" : "text-white")}>{val}</span>
            </div>
          ))}
        </div>
      ),
      copyText: `Financial Summary\nTotal Investment: $${(totalCost / 1000000).toFixed(2)}M\nAnnual Savings: $${totalSavings.toLocaleString()}\nNPV: $425,000`
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
              "bg-[#0F1829] border-[#1E2A45]"
            )}>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded border mt-0.5 uppercase flex-shrink-0",
                risk.severity === 'Critical' ? "bg-red-500/15 text-red-600 border-red-500/25" :
                "bg-amber-500/15 text-amber-600 border-amber-500/25"
              )}>{risk.severity}</span>
              <div>
                <p className="text-xs text-[#CBD2DF] font-medium">{risk.description}</p>
                <p className="text-[10px] text-[#7A8BA8] mt-0.5">{risk.status}</p>
              </div>
            </div>
          ))}
          {risks.length === 0 && <p className="text-sm text-[#7A8BA8]">No active risks identified.</p>}
        </div>
      ),
      copyText: `Risk Summary\n${risks.slice(0,3).map(r => `• ${r.severity}: ${r.description} (${r.status})`).join('\n')}`
    },
    {
      title: 'Carbon Impact',
      icon: <Leaf className="w-5 h-5 text-emerald-600" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-emerald-600 animate-stat-pop">{co2Reduced.toLocaleString()}</span>
            <span className="text-sm text-[#7A8BA8] mb-1">tCO₂e / year</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Equivalent to', val: `${Math.round(co2Reduced / 4.6)} cars off road` },
              { label: 'Trees Planted Equiv.', val: `${(co2Reduced * 16.5).toLocaleString()}` },
            ].map(({ label, val }) => (
              <div key={label} className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
                <p className="text-[10px] text-emerald-500/70 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-emerald-700 mt-1">{val}</p>
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
          {[
            { text: 'ESCO final proposal review', done: true },
            { text: 'Council contract approval vote', done: false },
            { text: 'Construction mobilization', done: false },
            { text: 'M&V baseline period begins', done: false },
          ].map(({ text, done }) => (
            <div key={text} className="flex items-center gap-3 py-2 border-b border-[#1E2A45] last:border-0">
              {done
                ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                : <CircleDot className="w-4 h-4 text-[#5A6B88] flex-shrink-0" />
              }
              <span className={cn("text-sm", done ? "text-[#5A6B88] line-through" : "text-[#CBD2DF]")}>{text}</span>
            </div>
          ))}
        </div>
      ),
      copyText: `Next Steps\n• ESCO final proposal review (Done)\n• Council contract approval vote\n• Construction mobilization\n• M&V baseline period begins`
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-[#7A8BA8]">Slide-by-slide presentation preview — copy each card to clipboard</p>
        <span className="text-xs text-[#7A8BA8]">{slides.length} slides</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 stagger-children">
        {slides.map((slide, idx) => (
          <div
            key={slide.title}
            className="card-hover bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-[#1E2A45] bg-[#0F1829] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {slide.icon}
                <div>
                  <p className="text-[10px] text-[#7A8BA8] uppercase tracking-wider">Slide {idx + 1}</p>
                  <h4 className="text-sm font-bold text-white">{slide.title}</h4>
                </div>
              </div>
              <button
                onClick={() => handleCopy(idx, slide.copyText)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1E2A45] border border-[#2A3A5C] rounded-lg text-xs text-[#7A8BA8] hover:text-white hover:border-[#3A4B68] transition-all duration-150"
              >
                {copiedSlide === idx
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
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
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#7A8BA8]">Single-page formatted summary — designed for printing or email</p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 bg-[#1E2A45] border border-[#2A3A5C] rounded-lg text-sm text-[#9AA5B8] hover:bg-[#2A3A5C] transition-colors duration-150 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            {generating ? 'Generating…' : generated ? 'Re-generate PDF' : 'Generate PDF'}
          </button>
        </div>
      </div>

      {/* Clean Executive Summary Card */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden text-black max-w-3xl mx-auto">
        {/* Header bar */}
        <div className="bg-emerald-700 text-white px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-emerald-200">One-Page Executive Summary</p>
              <h2 className="text-xl font-bold mt-1">{project.name}</h2>
            </div>
            <div className="text-right text-xs text-emerald-200">
              <p>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p className="mt-1">Prepared by 2KB Energy Services</p>
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
                { label: 'Progress', val: '47% Complete' },
                { label: 'Next Milestone', val: '45 days' },
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
                { label: 'Savings On Track', val: 'YES ✓', green: true },
                { label: 'Achievement Rate', val: '94%', green: true },
                { label: 'YTD Variance', val: '+$18,200', green: true },
                { label: 'Contract Value', val: `$${(project.value / 1000000).toFixed(1)}M`, green: false },
              ].map(({ label, val, green }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-neutral-500">{label}</span>
                  <span className={cn("font-semibold", green ? "text-emerald-700" : "text-neutral-800")}>{val}</span>
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
              {[
                'Final submittal review (ECM-3)',
                'Site inspection — Building 2',
                'Contractor coordination meeting',
                'Draft M&V plan for Year 2',
              ].map((item) => (
                <div key={item} className="flex items-start gap-1.5 text-xs text-neutral-600">
                  <ChevronRight className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Decisions Needed */}
        <div className="px-8 pb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 pb-2 border-b border-neutral-200">Key Decisions Needed</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { text: 'Approve CO-01 scope extension', urgent: true },
              { text: 'Confirm M&V Option A or B', urgent: false },
              { text: 'Council presentation date', urgent: false },
            ].map(({ text, urgent }) => (
              <div key={text} className={cn(
                "p-2.5 rounded-lg border text-xs",
                urgent ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-neutral-50 border-neutral-200 text-neutral-700"
              )}>
                {urgent && <span className="block text-[9px] font-bold text-amber-600 uppercase mb-1">Action Required</span>}
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-between items-center text-[10px] text-neutral-400">
          <span>2KB Energy Services • Confidential</span>
          <span>Generated {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

export function Reporting({ projectId }: { projectId?: string }) {
  const projects = useStore(state => state.projects);
  const reports = useStore(state => state.reports);
  const ecms = useStore(state => state.ecms);
  const risks = useStore(state => state.risks);
  const toggleQAItem = useStore(state => state.toggleQAItem);
  const addQAComment = useStore(state => state.addQAComment);
  const approveReport = useStore(state => state.approveReport);
  const lockRecords = useStore(state => state.lockRecords);

  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'qa'>('generate');
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || projects[1].id);
  const [reportType, setReportType] = useState('IGEA Report');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectEcms = ecms.filter(e => e.projectId === selectedProjectId);
  const projectRisks = risks.filter(r => r.projectId === selectedProjectId);

  const handleAddComment = (reportId: string) => {
    const text = commentInputs[reportId]?.trim();
    if (!text) return;
    addQAComment(reportId, { author: 'Martin', text });
    setCommentInputs(prev => ({ ...prev, [reportId]: '' }));
  };

  return (
    <div className="flex flex-col h-full">
      {!projectId && (
        <div className="flex-shrink-0 border-b border-[#1E2A45] bg-[#121C35] px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Automated Reporting & QA</h1>
              <p className="text-sm text-[#7A8BA8] mt-1">Generate standardized deliverables and manage QA/QC workflows.</p>
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
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-[#1E2A45] border border-[#2A3A5C] text-[#CBD2DF] text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-64 p-2.5 transition-colors"
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
                    ? "border-emerald-500 text-emerald-600 active"
                    : "border-transparent text-[#7A8BA8] hover:text-white"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-8 animate-page-enter">

        {/* ─── GENERATE REPORT TAB ─── */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Type Selector */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl p-6">
                <h3 className="text-xs font-semibold text-[#7A8BA8] uppercase tracking-wider mb-4">Report Type</h3>
                <div className="space-y-1.5">
                  {REPORT_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setReportType(type)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 border flex items-center justify-between group",
                        reportType === type
                          ? "bg-emerald-50 text-emerald-700 border-emerald-500/20"
                          : "bg-[#0F1829] text-[#7A8BA8] border-[#1E2A45] hover:bg-[#1A2544] hover:text-white hover:border-[#2A3A5C]"
                      )}
                    >
                      {type}
                      {reportType === type && <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-[#1E2A45]">
                  <button className="btn-primary w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 rounded-lg text-sm font-medium text-white hover:bg-emerald-700">
                    <FileText className="w-4 h-4" />
                    Generate Draft
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-2">
              {reportType === 'Council Presentation' && selectedProject ? (
                <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-[#1E2A45] bg-[#0F1829] flex items-center justify-between">
                    <h3 className="text-sm font-medium text-[#7A8BA8]">Preview: Council/Board Presentation</h3>
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
                <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-[#1E2A45] bg-[#0F1829] flex items-center justify-between">
                    <h3 className="text-sm font-medium text-[#7A8BA8]">Preview: One-Page Executive Summary</h3>
                    <StatusBadge status="Draft" />
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[700px]">
                    <OnePageSummary project={selectedProject} risks={projectRisks} />
                  </div>
                </div>
              ) : (
                <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden h-full min-h-[600px] flex flex-col">
                  <div className="p-4 border-b border-[#1E2A45] bg-[#0F1829] flex items-center justify-between">
                    <h3 className="text-sm font-medium text-[#7A8BA8]">Preview: {reportType}</h3>
                    <button className="p-1.5 text-[#7A8BA8] hover:text-white hover:bg-[#1E2A45] rounded transition-colors duration-150">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 p-8 bg-[#0B1120] overflow-y-auto">
                    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl min-h-[700px] p-12">
                      <div className="border-b-4 border-emerald-600 pb-6 mb-8">
                        <h1 className="text-3xl font-bold text-neutral-900 mb-2">{selectedProject?.name}</h1>
                        <h2 className="text-xl text-neutral-500">{reportType}</h2>
                        <p className="text-sm text-neutral-500 mt-4">Prepared by: 2KB Energy Services</p>
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
                                <td className="border border-neutral-300 px-4 py-2">14.2 Years</td>
                              </tr>
                              <tr>
                                <td className="border border-neutral-300 px-4 py-2">NPV (20yr, 5%)</td>
                                <td className="border border-neutral-300 px-4 py-2 text-emerald-600 font-semibold">$425,000</td>
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
          <div className="bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#1E2A45] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Report History</h3>
              <span className="text-xs text-[#7A8BA8]">{reports.length} reports</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-[#0F1829] border-b border-[#1E2A45]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Report Type</th>
                    <th className="px-6 py-4 font-medium">Version</th>
                    <th className="px-6 py-4 font-medium">Generated Date</th>
                    <th className="px-6 py-4 font-medium">Generated By</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2A45] stagger-rows">
                  {reports.map((report) => {
                    const reportLock = lockRecords.find(l => l.entityType === 'report' && l.entityId === report.id);
                    return (
                    <tr key={report.id} className="hover:bg-[#1A2544] transition-colors duration-100">
                      <td className="px-6 py-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <div>
                            <span>{report.type}</span>
                            <span className="block text-xs text-[#7A8BA8] font-normal mt-0.5">
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
                        <button className="p-1.5 text-[#7A8BA8] hover:text-white hover:bg-[#1E2A45] rounded transition-colors duration-150">
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
                <div key={report.id} className="card-hover bg-[#121C35] border border-[#1E2A45] rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="p-6 border-b border-[#1E2A45] bg-[#0F1829] flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{report.type}</h3>
                        {qaReportLock && <LockIndicator lock={qaReportLock} />}
                      </div>
                      <p className="text-xs text-[#7A8BA8] mt-1">
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
                        <h4 className="text-sm font-semibold text-[#CBD2DF] flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          QA Checklist
                        </h4>
                        <span className="text-xs font-mono text-[#7A8BA8]">{completedCount}/{qaItems.length} items</span>
                      </div>
                      <div className="w-full h-2 bg-[#1E2A45] rounded-full overflow-hidden mb-4">
                        <div
                          className={cn(
                            "h-full rounded-full progress-bar-fill",
                            progress === 100 ? "bg-emerald-500" :
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
                                ? "bg-emerald-500/5 border-emerald-500/15 opacity-80"
                                : "bg-[#0F1829] border-[#1E2A45] hover:border-[#2A3A5C]"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={item.checked}
                              disabled={isApproved}
                              onChange={() => toggleQAItem(report.id, item.id)}
                              className="mt-0.5 rounded border-[#2A3A5C] text-emerald-500 focus:ring-emerald-500 bg-[#1E2A45] flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className={cn(
                                "text-sm block",
                                item.checked ? "text-[#5A6B88] line-through" : "text-[#CBD2DF]"
                              )}>
                                {item.text}
                              </span>
                              {item.checked && item.reviewer && (
                                <span className="text-[10px] text-[#7A8BA8] block mt-0.5">
                                  ✓ Checked by {item.reviewer} on {item.reviewDate}
                                </span>
                              )}
                            </div>
                            {item.checked && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
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
                        <span className="text-xs bg-[#1E2A45] text-[#7A8BA8] px-1.5 py-0.5 rounded border border-[#2A3A5C] font-mono">
                          {comments.length}
                        </span>
                        <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-200", showComments ? "rotate-90" : "")} />
                      </button>

                      {showComments && (
                        <div className="animate-slide-down space-y-3">
                          {comments.length === 0 && (
                            <p className="text-sm text-[#7A8BA8] italic">No comments yet.</p>
                          )}
                          {comments.map((comment: any) => (
                            <div
                              key={comment.id}
                              className={cn(
                                "p-3 rounded-lg border text-sm",
                                comment.resolved
                                  ? "bg-[#0F1829] border-[#1E2A45] opacity-70"
                                  : "bg-[#121C35] border-[#2A3A5C]"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-white">{comment.author}</span>
                                  <span className="text-[10px] text-[#7A8BA8]">
                                    {new Date(comment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {comment.resolved && (
                                  <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Resolved</span>
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
                                className="flex-1 bg-[#0F1829] border border-[#1E2A45] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400 transition-colors"
                              />
                              <button
                                onClick={() => handleAddComment(report.id)}
                                className="btn-primary p-2 bg-emerald-600 rounded-lg text-white hover:bg-emerald-700"
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
                      <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                        <Lock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <p className="text-sm text-emerald-600">
                          Approved by <strong>{approvedBy}</strong> on{' '}
                          {new Date((report as any).approvedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          <span className="text-[#7A8BA8]"> — Report locked</span>
                        </p>
                      </div>
                    )}

                    {/* Audit Trail */}
                    <AuditTrailPanel entityType="report" entityId={report.id} />
                  </div>

                  {/* Footer Actions */}
                  {!isApproved && (
                    <div className="px-6 py-4 border-t border-[#1E2A45] bg-[#0F1829] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-[#7A8BA8]">
                        <Users className="w-3.5 h-3.5" />
                        {completedCount}/{qaItems.length} checks complete
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setExpandedComments(prev => ({ ...prev, [report.id]: true }))}
                          className="px-4 py-2 bg-[#1E2A45] text-[#9AA5B8] text-sm font-medium rounded-lg hover:bg-[#2A3A5C] transition-colors duration-150 border border-[#2A3A5C]"
                        >
                          Add Comment
                        </button>
                        <button
                          disabled={progress < 100}
                          onClick={() => approveReport(report.id, 'Martin')}
                          className={cn(
                            "btn-primary px-4 py-2 text-sm font-medium rounded-lg border border-transparent transition-all duration-150",
                            progress === 100
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-[#1E2A45] text-[#5A6B88] cursor-not-allowed border-[#1E2A45]"
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

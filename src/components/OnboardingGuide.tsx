import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { useTenantName } from '@/hooks/useTenantName';
import {
  FolderOpen, Upload, BarChart3, Zap, ArrowRight,
  LayoutDashboard, Camera, FileText, BookOpen, CalendarRange,
  Settings, ShieldCheck, LineChart
} from 'lucide-react';

const steps = [
  {
    num: 1,
    title: 'Create Your First Project',
    desc: 'Set up an ESPC project with building info, ESCO details, and phase tracking.',
    cta: 'Go to Projects',
    icon: FolderOpen,
    route: '/app/projects',
  },
  {
    num: 2,
    title: 'Import Project Data',
    desc: 'Upload an Excel workbook to auto-populate assets, utility bills, ECMs, and more.',
    cta: 'Import File',
    icon: Upload,
    route: null, // opens modal
  },
  {
    num: 3,
    title: 'Review & Benchmark',
    desc: 'Verify imported data, flag equipment deficiencies, and compare energy baselines.',
    cta: 'Open Benchmarking',
    icon: BarChart3,
    route: '/app/benchmarking',
  },
  {
    num: 4,
    title: 'Set Up Workflows',
    desc: 'Assign tasks, set due dates, and track deliverables across your project lifecycle.',
    cta: 'Open Workflows',
    icon: Zap,
    route: '/app/workflows',
  },
];

const capabilities = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Field Audit', icon: Camera },
  { label: 'Benchmarking', icon: BarChart3 },
  { label: 'Financial Modeling', icon: LineChart },
  { label: 'Construction', icon: ShieldCheck },
  { label: 'M&V', icon: BarChart3 },
  { label: 'Reports', icon: FileText },
  { label: 'Knowledge Base', icon: BookOpen },
  { label: 'Schedule', icon: CalendarRange },
  { label: 'Settings', icon: Settings },
];

export function OnboardingGuide() {
  const navigate = useNavigate();
  const { name } = useTenantName();
  const setShowProjectImport = useStore(s => s.setShowProjectImport);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to {name}</h1>
        <p className="text-sm text-[#7A8BA8] mt-2 max-w-lg mx-auto">
          Your energy engineering command center is ready. Follow these steps to set up your first project.
        </p>
      </div>

      {/* Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className="bg-[#121C35] border border-[#1E2A45] rounded-lg p-5 animate-stat-pop"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{step.num}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                <p className="text-xs text-[#5A6B88] mt-1 leading-relaxed">{step.desc}</p>
                <button
                  onClick={() => step.route ? navigate(step.route) : setShowProjectImport(true)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-[#4DD636] transition-colors"
                >
                  {step.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Import Banner */}
      <div
        className="bg-[#121C35] border border-[#1E2A45] rounded-lg p-5 animate-stat-pop"
        style={{ animationDelay: '0.28s' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Have a project workbook ready?</h3>
              <p className="text-xs text-[#5A6B88] mt-0.5">Auto-detects sheet types and routes data to the correct modules.</p>
            </div>
          </div>
          <button
            onClick={() => setShowProjectImport(true)}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
          >
            Import Project File
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Platform Capabilities */}
      <div
        className="bg-[#121C35] border border-[#1E2A45] rounded-lg p-5 animate-stat-pop"
        style={{ animationDelay: '0.34s' }}
      >
        <h3 className="text-[10px] font-semibold text-[#5A6B88] uppercase tracking-wider mb-3">Platform Capabilities</h3>
        <div className="flex flex-wrap gap-2">
          {capabilities.map(cap => (
            <span
              key={cap.label}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0B1120] border border-[#1E2A45] rounded-md text-xs text-[#7A8BA8]"
            >
              <cap.icon className="w-3 h-3" />
              {cap.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

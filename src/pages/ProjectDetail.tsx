import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { ArrowLeft, Camera, BarChart3, Calculator, ShieldCheck, HardHat, LineChart, FileText, MapPin, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompletenessBar } from '@/components/CompletenessBar';
import { FreshnessBadge } from '@/components/FreshnessBadge';
import { FieldAudit } from './FieldAudit';
import { Benchmarking } from './Benchmarking';
import { FinancialModeling } from './FinancialModeling';
import { Governance } from './Governance';
import { Construction } from './Construction';
import { MV } from './MV';
import { Drawings } from './Drawings';
import { Timeline } from './Timeline';
import { ClientAccess } from '@/components/ClientAccess';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = useStore(state => state.projects.find(p => p.id === id));
  const org = useStore(state => state.organizations.find(o => o.id === project?.orgId));

  const [activeTab, setActiveTab] = useState<'audit' | 'drawings' | 'energy' | 'financial' | 'governance' | 'construction' | 'mv' | 'timeline' | 'clients'>('audit');

  if (!project) {
    return <div className="p-8 text-[#888888]">Project not found</div>;
  }

  const tabs = [
    { id: 'audit', label: 'Audit', icon: Camera, freshnessModule: 'Assets' as string | null },
    { id: 'drawings', label: 'Drawings', icon: MapPin, freshnessModule: null },
    { id: 'energy', label: 'Energy', icon: BarChart3, freshnessModule: 'Utility Bills' },
    { id: 'financial', label: 'Financial', icon: Calculator, freshnessModule: 'Financial' },
    { id: 'governance', label: 'Governance', icon: ShieldCheck, freshnessModule: 'Risk' },
    { id: 'construction', label: 'Construction', icon: HardHat, freshnessModule: 'Inspection' },
    { id: 'mv', label: 'M&V', icon: LineChart, freshnessModule: 'M&V' },
    { id: 'timeline', label: 'Timeline', icon: Calendar, freshnessModule: null },
    { id: 'clients', label: 'Client Access', icon: Users, freshnessModule: null },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      <div className="flex-shrink-0 border-b border-[#222222] bg-[#1A1A1A] px-8 py-6">
        <button 
          onClick={() => navigate('/app/projects')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#888888] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-[#888888]">{org?.name} • {project.esco} • ${(project.value / 1000000).toFixed(1)}M</p>
              <div className="w-32">
                <CompletenessBar projectId={project.id} />
              </div>
            </div>
          </div>
          <span className={cn(
            "px-3 py-1.5 rounded text-sm font-medium border",
            project.phase === 'Construction' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
            project.phase === 'M&V' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
            "bg-primary/10 text-secondary border-primary/20"
          )}>
            {project.phase.toUpperCase()}
          </span>
        </div>

        <div className="flex space-x-6 border-b border-[#222222]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === tab.id 
                  ? "border-primary text-secondary"
                  : "border-transparent text-[#888888] hover:text-white hover:border-[#2A3A5C]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.freshnessModule && (
                <FreshnessBadge projectId={project.id} module={tab.freshnessModule} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'audit' && <FieldAudit projectId={project.id} />}
        {activeTab === 'drawings' && <Drawings projectId={project.id} />}
        {activeTab === 'energy' && <Benchmarking projectId={project.id} />}
        {activeTab === 'financial' && <FinancialModeling projectId={project.id} />}
        {activeTab === 'governance' && <Governance projectId={project.id} />}
        {activeTab === 'construction' && <Construction projectId={project.id} />}
        {activeTab === 'mv' && <MV projectId={project.id} />}
        {activeTab === 'timeline' && <Timeline projectId={project.id} />}
        {activeTab === 'clients' && <ClientAccess projectId={project.id} />}
      </div>
    </div>
  );
}

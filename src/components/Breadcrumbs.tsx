import { useLocation, useParams, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useStore } from '@/store';

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export function Breadcrumbs() {
  const location = useLocation();
  const params = useParams();
  const projects = useStore(s => s.projects);

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Dashboard
    breadcrumbs.push({ label: 'Dashboard', href: '/app' });

    // Parse the current path
    const segments = path.split('/').filter(Boolean);
    
    if (segments.length <= 1) {
      // We're at /app (dashboard)
      breadcrumbs[0].active = true;
      return breadcrumbs;
    }

    // Map route segments to breadcrumb labels
    const routeMap: Record<string, string> = {
      projects: 'Projects',
      assets: 'Assets',
      benchmarking: 'Benchmarking',
      reporting: 'Reports',
      knowledge: 'Knowledge Base',
      timeline: 'Schedule',
      workflows: 'Tasks & Workflow',
      settings: 'Settings',
      financial: 'Financial Modeling',
      governance: 'Governance',
      construction: 'Construction',
      mv: 'M&V',
    };

    // Build breadcrumbs based on current path
    if (segments[1] === 'projects') {
      breadcrumbs.push({ label: 'Projects', href: '/app/projects' });
      
      if (params.id) {
        // We're viewing a specific project
        const project = projects.find(p => p.id === params.id);
        if (project) {
          breadcrumbs.push({ 
            label: project.name, 
            href: `/app/projects/${params.id}`,
            active: !segments[3] // Active if we're on the project detail page itself
          });
          
          // Check if we're on a specific tab within the project
          if (segments[3]) {
            const tabMap: Record<string, string> = {
              financial: 'Financial',
              governance: 'Governance',
              construction: 'Construction',
              mv: 'M&V',
              assets: 'Assets',
              reports: 'Reports',
            };
            
            const tabLabel = tabMap[segments[3]] || segments[3];
            breadcrumbs.push({ label: tabLabel, active: true });
          }
        }
      } else {
        breadcrumbs[1].active = true;
      }
    } else {
      // Other main sections
      const sectionLabel = routeMap[segments[1]] || segments[1];
      breadcrumbs.push({ label: sectionLabel, active: true });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center space-x-1 text-sm mb-6 px-1" aria-label="Breadcrumb">
      <Home className="w-3.5 h-3.5 text-[#666666]" />
      
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="w-3.5 h-3.5 text-[#666666] flex-shrink-0" />
          
          {item.href && !item.active ? (
            <Link
              to={item.href}
              className="text-[#888888] hover:text-secondary transition-colors font-medium truncate max-w-[200px]"
            >
              {item.label}
            </Link>
          ) : (
            <span className={`font-medium truncate max-w-[200px] ${
              item.active ? 'text-white' : 'text-[#888888]'
            }`}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
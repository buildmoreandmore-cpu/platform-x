import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Search, LayoutDashboard, FolderOpen, Camera, BarChart3, FileText, Zap, BookOpen, Settings, ArrowRight } from 'lucide-react';

interface SearchResult {
  id: string;
  label: string;
  description: string;
  category: 'Pages' | 'Projects' | 'ECMs' | 'Buildings';
  href: string;
  icon: typeof Search;
}

const PAGES: SearchResult[] = [
  { id: 'p-dash', label: 'Dashboard', description: 'Portfolio overview', category: 'Pages', href: '/app', icon: LayoutDashboard },
  { id: 'p-proj', label: 'Projects', description: 'All projects', category: 'Pages', href: '/app/projects', icon: FolderOpen },
  { id: 'p-assets', label: 'All Assets', description: 'Field audit & asset intelligence', category: 'Pages', href: '/app/assets', icon: Camera },
  { id: 'p-bench', label: 'Benchmarking', description: 'Utility data & capital planning', category: 'Pages', href: '/app/benchmarking', icon: BarChart3 },
  { id: 'p-fin', label: 'Financial Modeling', description: 'ECM bundles & cash flows', category: 'Pages', href: '/app/financial', icon: Zap },
  { id: 'p-gov', label: 'Governance', description: 'Milestones, risks, obligations', category: 'Pages', href: '/app/governance', icon: FileText },
  { id: 'p-con', label: 'Construction', description: 'Installation & inspections', category: 'Pages', href: '/app/construction', icon: Camera },
  { id: 'p-rep', label: 'Reports', description: 'Report generation & QA', category: 'Pages', href: '/app/reporting', icon: FileText },
  { id: 'p-kb', label: 'Knowledge Base', description: 'Benchmarks & lessons learned', category: 'Pages', href: '/app/knowledge', icon: BookOpen },
  { id: 'p-set', label: 'Settings', description: 'Preferences & admin', category: 'Pages', href: '/app/settings', icon: Settings },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const projects = useStore(s => s.projects);
  const ecms = useStore(s => s.ecms);
  const buildings = useStore(s => s.buildings);

  const results = useMemo(() => {
    if (!query.trim()) return PAGES.slice(0, 6);
    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    // Pages
    PAGES.filter(p => p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      .forEach(p => matches.push(p));

    // Projects
    projects.filter(p => p.name.toLowerCase().includes(q) || p.esco?.toLowerCase().includes(q))
      .forEach(p => matches.push({
        id: `proj-${p.id}`, label: p.name, description: `${p.phase} — ${p.esco}`,
        category: 'Projects', href: `/app/projects/${p.id}`, icon: FolderOpen,
      }));

    // ECMs
    ecms.filter(e => e.description?.toLowerCase().includes(q) || e.number?.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach(e => matches.push({
        id: `ecm-${e.id}`, label: e.number || e.description, description: `${e.category} — $${e.cost?.toLocaleString()}`,
        category: 'ECMs', href: '/app/financial', icon: Zap,
      }));

    // Buildings
    buildings.filter(b => b.name?.toLowerCase().includes(q))
      .forEach(b => matches.push({
        id: `bld-${b.id}`, label: b.name, description: `${b.sqft?.toLocaleString()} sqft`,
        category: 'Buildings', href: '/app/assets', icon: Camera,
      }));

    return matches.slice(0, 12);
  }, [query, projects, ecms, buildings]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.href);
    setIsOpen(false);
    setQuery('');
  }, [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && results[selectedIndex]) { handleSelect(results[selectedIndex]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, results, selectedIndex, handleSelect]);

  if (!isOpen) return null;

  // Group results by category
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  let flatIdx = 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[15vh] modal-backdrop" onClick={() => setIsOpen(false)}>
      <div
        className="modal-panel bg-[#121C35] border border-[#1E2A45] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1E2A45]">
          <Search className="w-4 h-4 text-[#5A6B88] flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects, ECMs, pages..."
            className="flex-1 bg-transparent text-sm text-white placeholder-[#5A6B88] outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1E2A45] text-[10px] text-[#5A6B88] border border-[#2A3A5C]">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="px-4 py-1.5 text-[10px] font-semibold text-[#5A6B88] uppercase tracking-wider">{category}</div>
              {items.map(item => {
                const idx = flatIdx++;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      idx === selectedIndex ? 'bg-[#1A2544]' : 'hover:bg-[#1A2544]/50'
                    }`}
                  >
                    <item.icon className="w-4 h-4 text-[#5A6B88] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.label}</p>
                      <p className="text-[11px] text-[#5A6B88] truncate">{item.description}</p>
                    </div>
                    {idx === selectedIndex && <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
          {results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[#5A6B88]">No results found for "{query}"</div>
          )}
        </div>

        <div className="border-t border-[#1E2A45] px-4 py-2 flex items-center gap-4 text-[10px] text-[#5A6B88]">
          <span><kbd className="px-1 py-0.5 bg-[#1E2A45] rounded border border-[#2A3A5C]">↑↓</kbd> navigate</span>
          <span><kbd className="px-1 py-0.5 bg-[#1E2A45] rounded border border-[#2A3A5C]">↵</kbd> select</span>
          <span><kbd className="px-1 py-0.5 bg-[#1E2A45] rounded border border-[#2A3A5C]">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { MessageSquare, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TenantLogo } from '@/components/TenantLogo';
import { useTenantName } from '@/hooks/useTenantName';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUERIES = [
  'Show me all assets with R-22 refrigerant',
  'What buildings have the highest EUI?',
  'Flag all critical deficiencies across the portfolio',
  'Which ECMs have the best payback?',
  'Are we on track for M&V guarantees?',
  'What risks need attention this week?',
  'Summarize project status',
  'Draft an executive summary',
];

export function AIAssistant() {
  const { name, company } = useTenantName();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hi, I'm your ${name} assistant. I can help you analyze assets, review financials, check project status, flag risks, and draft reports. What do you need?`,
      timestamp: new Date(),
    }]);
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pull store data for context
  const projects = useStore(s => s.projects);
  const assets = useStore(s => s.assets);
  const buildings = useStore(s => s.buildings);
  const organizations = useStore(s => s.organizations);
  const ecms = useStore(s => s.ecms);
  const risks = useStore(s => s.risks);
  const mvData = useStore(s => s.mvData);
  const milestones = useStore(s => s.milestones);
  const utilityBills = useStore(s => s.utilityBills);
  const contractObligations = useStore(s => s.contractObligations);
  const inspectionFindings = useStore(s => s.inspectionFindings);
  const reports = useStore(s => s.reports);
  const tasks = useStore(s => s.tasks);
  const pricingReview = useStore(s => s.pricingReview);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const buildContext = () => {
    return `You are the AI assistant for ${company}'s intelligence platform. ${company} is an energy engineering consulting firm that serves as Owner's Representative on Energy Savings Performance Contracts (ESPCs). They protect building owners from aggressive ESCO assumptions.

CURRENT PORTFOLIO DATA:

ORGANIZATIONS: ${JSON.stringify(organizations)}

BUILDINGS: ${JSON.stringify(buildings)}

PROJECTS: ${JSON.stringify(projects)}

ASSETS (${assets.length} total): ${JSON.stringify(assets.slice(0, 25))}

ECMs: ${JSON.stringify(ecms)}

RISKS: ${JSON.stringify(risks)}

M&V DATA: ${JSON.stringify(mvData)}

MILESTONES: ${JSON.stringify(milestones)}

CONTRACT OBLIGATIONS: ${JSON.stringify(contractObligations.slice(0, 8))}

INSPECTION FINDINGS: ${JSON.stringify(inspectionFindings)}

REPORTS: ${JSON.stringify(reports.map(r => ({ id: r.id, type: r.type, status: r.status, project: r.projectId })))}

TASKS: ${JSON.stringify(tasks)}

PRICING REVIEW: ${JSON.stringify(pricingReview)}

UTILITY BILLS SUMMARY: ${buildings.map(b => {
      const bills = utilityBills.filter(u => u.buildingId === b.id);
      const totalElec = bills.reduce((s, u) => s + u.electricKwh, 0);
      const totalGas = bills.reduce((s, u) => s + u.gasTherms, 0);
      const totalCost = bills.reduce((s, u) => s + u.electricCost + u.gasCost, 0);
      const eui = b.sqft ? Math.round(((totalElec * 3.412) + (totalGas * 100)) / b.sqft) : 0;
      return `${b.name} (${b.sqft?.toLocaleString()} sqft): EUI=${eui} kBtu/sqft, Annual Cost=$${totalCost.toLocaleString()}`;
    }).join('\n')}

RULES:
- Be specific with data — reference actual numbers, asset IDs, building names
- Flag aggressive ESCO assumptions (escalation rates >4% electric, >3.5% gas)
- When discussing M&V, reference IPMVP methodology
- When flagging R-22 equipment, note it's a critical phaseout issue
- For financial analysis, use conservative assumptions
- Be concise but thorough — this is for experienced energy engineers
- Format responses with clear structure (bullets, headers when needed)`;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_MINIMAX_API_KEY || '';
      
      const chatHistory = messages.filter(m => m.id !== 'welcome').map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

      const response = await fetch('https://api.minimax.io/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'MiniMax-Text-01',
          messages: [
            { role: 'system', content: buildContext() },
            ...chatHistory,
            { role: 'user', content: userMsg.content },
          ],
          max_tokens: 2048,
          temperature: 0.3,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      let assistantContent = data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t process that. Try rephrasing your question.';
      
      // Strip any <think> tags
      assistantContent = assistantContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-resp`,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      }]);
    } catch (err) {
      // Fallback — generate smart response from local data
      const fallback = generateLocalResponse(userMsg.content);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-resp`,
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateLocalResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('r-22') || q.includes('refrigerant')) {
      const r22Assets = assets.filter(a => a.flags.some(f => f.toLowerCase().includes('r-22')));
      if (r22Assets.length === 0) return 'No assets with R-22 refrigerant flags found in the current portfolio.';
      return `**⚠️ R-22 Refrigerant — Critical Phaseout Risk**\n\n${r22Assets.length} assets flagged:\n\n${r22Assets.map(a => {
        const bld = buildings.find(b => b.id === a.buildingId);
        return `• **${a.type}** — ${a.manufacturer} ${a.model} (${a.year})\n  📍 ${bld?.name} | Condition: ${a.condition} | RUL: ${a.remainingLife} yrs | Replacement: $${a.replacementCost.toLocaleString()}`;
      }).join('\n\n')}\n\n**Total replacement cost: $${r22Assets.reduce((s, a) => s + a.replacementCost, 0).toLocaleString()}**\n\nR-22 production ended Jan 2020. These units should be prioritized for replacement in the next ECM bundle.`;
    }

    if (q.includes('eui') || q.includes('energy use') || q.includes('highest')) {
      const buildingEUIs = buildings.map(b => {
        const bills = utilityBills.filter(u => u.buildingId === b.id);
        const totalElec = bills.reduce((s, u) => s + u.electricKwh, 0);
        const totalGas = bills.reduce((s, u) => s + u.gasTherms, 0);
        const eui = b.sqft ? Math.round(((totalElec * 3.412) + (totalGas * 100)) / b.sqft) : 0;
        return { ...b, eui };
      }).sort((a, b) => b.eui - a.eui);

      return `**Portfolio EUI Ranking (kBtu/sqft/yr)**\n\n${buildingEUIs.map((b, i) => `${i + 1}. **${b.name}** — ${b.eui} kBtu/sqft (${b.sqft?.toLocaleString()} sqft, ${b.type})`).join('\n')}\n\n${buildingEUIs[0].name} has the highest energy intensity. Recommend detailed sub-metering analysis and ECM targeting for HVAC and envelope improvements.`;
    }

    if (q.includes('critical') || q.includes('deficien') || q.includes('flag')) {
      const critical = assets.filter(a => a.condition === 'Critical' || a.flags.some(f => f.toLowerCase().includes('safety')));
      return `**🚨 Critical Assets Requiring Immediate Attention**\n\n${critical.map(a => {
        const bld = buildings.find(b => b.id === a.buildingId);
        return `• **${a.type}** — ${a.manufacturer} ${a.model} (${a.year})\n  📍 ${bld?.name} | Flags: ${a.flags.join(', ')} | RUL: ${a.remainingLife} yrs\n  💰 Replacement: $${a.replacementCost.toLocaleString()}`;
      }).join('\n\n')}\n\n**Total critical replacement cost: $${critical.reduce((s, a) => s + a.replacementCost, 0).toLocaleString()}**`;
    }

    if (q.includes('risk') || q.includes('attention')) {
      return `**Open Risks**\n\n${risks.filter(r => r.status === 'Open').map(r => {
        const p = projects.find(pr => pr.id === r.projectId);
        return `• **[${r.severity}]** ${r.description}\n  Project: ${p?.name} | Category: ${r.category} | Owner: ${r.owner}`;
      }).join('\n\n')}\n\n**Overdue Tasks:**\n${tasks.filter(t => t.status === 'To Do' && t.priority === 'High').map(t => `• ${t.title} — assigned to ${t.assignedTo}, due ${t.dueDate}`).join('\n')}`;
    }

    if (q.includes('m&v') || q.includes('guarantee') || q.includes('drift') || q.includes('savings')) {
      const driftYears = mvData.filter(d => d.driftDetected);
      const mvProject = projects.find(p => mvData.some(d => d.projectId === p.id));
      return `**M&V Performance Summary${mvProject ? ` — ${mvProject.name}` : ''}**\n\n${mvData.map(d => {
        const pct = Math.round((d.calculated / d.guaranteed) * 100);
        const status = d.driftDetected ? '🔴 DRIFT' : pct >= 100 ? '🟢 ON TRACK' : '🟡 WATCH';
        return `• Year ${d.year}: Guaranteed $${d.guaranteed.toLocaleString()} | Actual $${d.calculated.toLocaleString()} | ${pct}% ${status}`;
      }).join('\n')}\n\n${driftYears.length > 0 ? `⚠️ **Year ${driftYears[0].year} drift detected** — savings $${(driftYears[0].guaranteed - driftYears[0].calculated).toLocaleString()} below guarantee. Root cause investigation needed. May trigger shortfall remedy per Section 4.3.1.` : 'All years tracking at or above guarantee.'}`;
    }

    if (q.includes('payback') || q.includes('ecm') || q.includes('best')) {
      const ecmProject = projects.find(p => ecms.some(e => e.projectId === p.id));
      if (ecms.length === 0) return 'No ECMs found in the portfolio. Import ECM data to see payback analysis.';
      const sorted = [...ecms].sort((a, b) => (a.cost / a.savings) - (b.cost / b.savings));
      const best = sorted[0];
      return `**ECM Analysis${ecmProject ? ` — ${ecmProject.name}` : ''}**\n\n${sorted.map(e => {
        const payback = e.savings > 0 ? (e.cost / e.savings).toFixed(1) : 'N/A';
        return `• **${e.number}: ${e.description}**\n  Cost: $${e.cost.toLocaleString()} | Annual Savings: $${e.savings.toLocaleString()} | Payback: ${payback} yrs | Life: ${e.life} yrs`;
      }).join('\n\n')}\n\nBest payback: ${best.description} at ${best.savings > 0 ? (best.cost / best.savings).toFixed(1) : 'N/A'} years.`;
    }

    return `I can help with:\n\n• **Asset queries** — "Show R-22 equipment" or "List critical assets"\n• **Energy analysis** — "What buildings have highest EUI?"\n• **Financial review** — "Which ECMs have best payback?"\n• **M&V tracking** — "Are we on track for guarantees?"\n• **Risk monitoring** — "What risks need attention?"\n• **Report drafting** — "Draft executive summary for [project]"\n\nTry asking a specific question about your portfolio.`;
  };

  const handleSuggestion = (query: string) => {
    setInput(query);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-xl bg-[#080D1A] border border-[#1E2A45] hover:border-primary/40 text-white shadow-lg shadow-black/40 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-primary/10 hover:shadow-xl active:scale-95 group"
      >
        <TenantLogo className="w-7 h-7 opacity-90 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed z-50 bg-[#080D1A] border border-[#1E2A45] rounded-2xl shadow-2xl shadow-black/50 flex flex-col transition-all duration-300",
      isExpanded
        ? "bottom-4 right-4 left-4 top-4 md:left-auto md:w-[700px] md:top-4"
        : "bottom-6 right-6 w-[420px] h-[600px]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2A45]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Bot className="w-4 h-4 text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{name}</h3>
            <p className="text-[10px] text-secondary">AI Assistant • Portfolio-aware</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-[#121C35] text-[#5A6B88] hover:text-white transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-[#121C35] text-[#5A6B88] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' && "flex-row-reverse")}>
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
              msg.role === 'assistant' ? "bg-primary/15" : "bg-sky-500/15"
            )}>
              {msg.role === 'assistant' 
                ? <Bot className="w-3.5 h-3.5 text-secondary" />
                : <User className="w-3.5 h-3.5 text-sky-400" />
              }
            </div>
            <div className={cn(
              "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed",
              msg.role === 'assistant'
                ? "bg-[#0F1829] text-[#CBD2DF] border border-[#1E2A45]"
                : "bg-sky-500/10 text-sky-100 border border-sky-500/20"
            )}>
              <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ 
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                  .replace(/\n/g, '<br/>')
              }} />
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-secondary" />
            </div>
            <div className="bg-[#0F1829] border border-[#1E2A45] rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-[#5A6B88]">Analyzing portfolio data...</span>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions — show only after welcome message */}
        {messages.length === 1 && (
          <div className="space-y-2 pt-2">
            <p className="text-[11px] text-[#5A6B88] uppercase tracking-wider font-medium">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestion(q)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#121C35] border border-[#1E2A45] text-[#7A8BA8] hover:text-white hover:border-primary/30 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-center gap-2 bg-[#0F1829] border border-[#1E2A45] rounded-xl px-4 py-2 focus-within:border-primary/40 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your portfolio..."
            className="flex-1 bg-transparent text-sm text-white placeholder-[#5A6B88] outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              input.trim() && !isLoading
                ? "bg-primary text-white hover:bg-primary"
                : "text-[#5A6B88]"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-[#3A4A68] text-center mt-2">Powered by {name} Engine</p>
      </div>
    </div>
  );
}

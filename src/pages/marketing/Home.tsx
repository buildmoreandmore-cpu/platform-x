import React, { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

/* ─── colour tokens ─── */
const GREEN = '#00ff88';
const DARK = '#020c06';

/* ─── building data for the canvas cityscape ─── */
const BUILDINGS = [
  { x: 0.55, y: 0.72, w: 0.07, h: 0.38, depth: 0.04, delay: 0 },
  { x: 0.62, y: 0.68, w: 0.05, h: 0.42, depth: 0.03, delay: 0.1 },
  { x: 0.67, y: 0.74, w: 0.08, h: 0.30, depth: 0.05, delay: 0.15 },
  { x: 0.75, y: 0.65, w: 0.06, h: 0.50, depth: 0.04, delay: 0.2 },
  { x: 0.81, y: 0.70, w: 0.07, h: 0.36, depth: 0.04, delay: 0.25 },
  { x: 0.88, y: 0.66, w: 0.05, h: 0.44, depth: 0.03, delay: 0.3 },
  { x: 0.93, y: 0.72, w: 0.08, h: 0.32, depth: 0.05, delay: 0.35 },
  { x: 0.52, y: 0.78, w: 0.09, h: 0.28, depth: 0.06, delay: 0.4 },
  { x: 0.61, y: 0.75, w: 0.06, h: 0.34, depth: 0.04, delay: 0.45 },
  { x: 0.67, y: 0.80, w: 0.10, h: 0.24, depth: 0.06, delay: 0.5 },
  { x: 0.77, y: 0.73, w: 0.07, h: 0.40, depth: 0.04, delay: 0.55 },
  { x: 0.84, y: 0.77, w: 0.09, h: 0.28, depth: 0.05, delay: 0.6 },
  { x: 0.93, y: 0.74, w: 0.06, h: 0.36, depth: 0.04, delay: 0.65 },
  { x: 0.58, y: 0.82, w: 0.08, h: 0.55, depth: 0.05, delay: 0.7, tall: true as const },
  { x: 0.70, y: 0.80, w: 0.06, h: 0.62, depth: 0.04, delay: 0.75, tall: true as const },
  { x: 0.80, y: 0.82, w: 0.09, h: 0.48, depth: 0.06, delay: 0.8, tall: true as const },
  { x: 0.92, y: 0.79, w: 0.07, h: 0.58, depth: 0.04, delay: 0.85, tall: true as const },
];

/* ─── services data — six pillars ─── */
const services = [
  {
    num: '01',
    title: 'ESPC Procurement & Advisory',
    headline: "Don't sign until we've read it.",
    subhead: 'Most agencies enter an ESPC already at a disadvantage. We fix that before the ink dries.',
    body: "The investment-grade audit is written by the ESCO. The savings projections are written by the ESCO. The M&V methodology \u2014 the rulebook for how your savings will be measured for the next fifteen years \u2014 is written by the ESCO. We review all of it before you commit.",
    bullets: [
      'RFP development and ESCO evaluation support',
      'Investment-grade audit independent review',
      'Savings guarantee and baseline analysis',
      'M&V methodology review and negotiation',
      'Contract red-flag assessment',
      'Financing structure analysis (DSCR, tax-exempt leases, bonds)',
    ],
    audience: 'Agencies entering their first ESPC, or renegotiating an existing one.',
  },
  {
    num: '02',
    title: "Owner's Representative",
    headline: 'Someone in your corner during construction.',
    subhead: 'Retrofits are where promises meet reality. We make sure the ESCO delivers what they sold you.',
    body: "Once the contract is signed, the ESCO gets to work \u2014 installing equipment, commissioning systems, and declaring completion. Without independent oversight, you have no way to know if the installed equipment matches what was specified.",
    bullets: [
      'Construction phase oversight and site representation',
      'Equipment specification compliance review',
      'Change order analysis and approval support',
      'Commissioning and functional performance testing oversight',
      'Milestone tracking and project governance',
      'Punch list and substantial completion verification',
    ],
    audience: 'Agencies with active ESPC construction phases.',
  },
  {
    num: '03',
    title: 'Measurement & Verification',
    headline: 'Independent savings verification. Every month.',
    subhead: "The ESCO says you saved $400,000 last year. Do you know if that's true?",
    body: "M&V is where most ESPC disputes begin. The methodology is technical. The calculations are complex. And the ESCO has every incentive to interpret the data in their favor. Vantage runs independent M&V verification against your guaranteed baselines \u2014 not the ESCO's self-reported figures.",
    bullets: [
      'Independent monthly savings verification',
      'IPMVP Options A, B, C, and D compliance',
      'Automated drift detection and performance alerts',
      'CMVP-signed M&V reports',
      'Baseline adjustment review and challenge',
      'Annual savings reconciliation',
    ],
    audience: 'Any agency with an active ESPC in its performance period.',
  },
  {
    num: '04',
    title: 'Financial Modeling & Analysis',
    headline: 'Know your numbers before the ESCO does.',
    subhead: "A savings shortfall isn't just an energy problem. It's a budget problem. We model both.",
    body: "Your ESPC is financed. That means savings have to cover debt service \u2014 and if they don't, your agency is exposed. We model your contract's financial performance in real time.",
    bullets: [
      'DSCR monitoring and early warning modeling',
      'NPV, IRR, and payback analysis',
      'Utility rate escalation scenario modeling',
      'ECM-level financial performance attribution',
      'Portfolio benchmarking across multiple facilities',
      'Budget impact and cash flow forecasting',
    ],
    audience: 'Finance directors, CFOs, and budget officers who need to understand ESPC financial risk.',
  },
  {
    num: '05',
    title: 'Portfolio Intelligence',
    headline: 'One view. Every contract. Every building.',
    subhead: 'Most agencies managing multiple ESPCs have no idea how their portfolio is performing as a whole.',
    body: "You have three contracts across four facilities. Different ESCOs. Different baselines. Different M&V methodologies. No one is looking at all of them together. Vantage gives you a single dashboard across your entire portfolio.",
    bullets: [
      'Multi-contract portfolio dashboard',
      'Cross-facility performance benchmarking',
      'Aggregate savings verification and shortfall tracking',
      'Portfolio-level DSCR and financial exposure monitoring',
      'Natural language queries across all your contract data',
      'Executive reporting for leadership and council presentations',
    ],
    audience: 'Sustainability directors, facilities managers, and CFOs managing multiple performance contracts.',
  },
  {
    num: '06',
    title: 'Dispute Support',
    headline: "When the ESCO won't make you whole.",
    subhead: 'Savings guarantees are only as good as your ability to enforce them. We build that case.',
    body: "If your M&V reports show a shortfall and the ESCO disputes the findings, you need more than a spreadsheet. You need a forensic analysis produced by a credentialed professional who can defend it.",
    bullets: [
      'Forensic M&V analysis and savings recalculation',
      'Baseline manipulation identification',
      'Methodology deviation documentation',
      'Expert support for contract remedy proceedings',
      'CMVP-signed dispute reports',
      'Litigation support documentation if required',
    ],
    audience: 'Agencies that have discovered savings shortfalls and need an independent analysis to pursue remedy.',
  },
];

/* ─── intel panel status lines ─── */
const intelLines = [
  { label: 'Platform Status', value: 'ACTIVE' },
  { label: 'M&V Engine', value: 'ONLINE' },
  { label: 'Data Feeds', value: '12 ACTIVE' },
  { label: 'Last Sync', value: '< 1 MIN' },
  { label: 'Threat Level', value: 'NOMINAL' },
  { label: 'Uptime', value: '99.97%' },
];

/* ─── data ticker metrics ─── */
const tickerItems = [
  { label: 'Portfolio Savings', value: '$4,218,440' },
  { label: 'Active Contracts', value: '12' },
  { label: 'ECMs Monitored', value: '48' },
  { label: 'Alerts Active', value: '3' },
];

/* ─── how it works steps ─── */
const steps = [
  {
    num: '01',
    title: 'Upload your contract and utility bills.',
    body: 'Our document intelligence extracts every guaranteed savings figure, every ECM, every baseline parameter automatically.',
  },
  {
    num: '02',
    title: 'Your dashboard goes live with real data.',
    body: 'Verified savings vs guaranteed savings. DSCR. ECM performance by measure. Drift alerts the moment they appear.',
  },
  {
    num: '03',
    title: 'Your CMVP reviews and signs each M&V cycle.',
    body: 'Every report is IPMVP-compliant and defensible. Every anomaly is documented from the moment it\u2019s detected.',
  },
  {
    num: '04',
    title: 'You always know where you stand.',
    body: 'Ask anything in plain English. Get answers from your actual contract data. No more waiting for the ESCO\u2019s report.',
  },
];

/* ─── CSS-in-JS styles ─── */
const S: Record<string, React.CSSProperties> = {
  page: {
    background: 'var(--dark)',
    color: 'var(--text)',
    fontFamily: "'Syne', sans-serif",
    minHeight: '100vh',
    overflow: 'hidden',
    position: 'relative',
  },
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    background: 'linear-gradient(180deg, rgba(2,12,6,0.95) 0%, rgba(2,12,6,0) 100%)',
  },
  logo: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '14px',
    letterSpacing: '2px',
    color: GREEN,
    textDecoration: 'none',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  navLink: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '12px',
    letterSpacing: '1px',
    color: 'var(--text-dim)',
    textDecoration: 'none',
    transition: 'color 0.3s',
  },
  ctaBtn: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '12px',
    letterSpacing: '1px',
    padding: '10px 24px',
    background: 'transparent',
    border: `1px solid ${GREEN}`,
    color: GREEN,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.3s',
    display: 'inline-block',
  },
  hero: {
    position: 'relative',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  gridFloor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    background: `
      linear-gradient(180deg, transparent 0%, rgba(0,255,136,0.03) 100%),
      repeating-linear-gradient(90deg, rgba(0,255,136,0.05) 0px, rgba(0,255,136,0.05) 1px, transparent 1px, transparent 80px),
      repeating-linear-gradient(0deg, rgba(0,255,136,0.05) 0px, rgba(0,255,136,0.05) 1px, transparent 1px, transparent 80px)
    `,
    transform: 'perspective(500px) rotateX(45deg)',
    transformOrigin: 'bottom',
    opacity: 0.4,
    pointerEvents: 'none',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.03) 2px, rgba(0,255,136,0.03) 4px)',
    pointerEvents: 'none',
    zIndex: 5,
  },
  noiseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.04,
    background:
      "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==\")",
    pointerEvents: 'none',
    zIndex: 6,
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
    padding: '0 40px',
    maxWidth: '680px',
  },
  tag: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '11px',
    letterSpacing: '3px',
    color: GREEN,
    marginBottom: '20px',
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  h1: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 'clamp(36px, 5vw, 64px)',
    fontWeight: 800,
    lineHeight: 1.05,
    color: '#ffffff',
    marginBottom: '24px',
  },
  subtitle: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '14px',
    lineHeight: 1.8,
    color: 'var(--text-dim)',
    maxWidth: '520px',
    marginBottom: '40px',
  },
  heroCtas: {
    display: 'flex',
    gap: '16px',
  },
  primaryBtn: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '12px',
    letterSpacing: '1px',
    padding: '14px 32px',
    background: GREEN,
    color: DARK,
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    fontWeight: 700,
    display: 'inline-block',
  },
  secondaryBtn: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '12px',
    letterSpacing: '1px',
    padding: '14px 32px',
    background: 'transparent',
    color: GREEN,
    border: '1px solid rgba(0,255,136,0.3)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  intelPanel: {
    position: 'absolute',
    right: '40px',
    bottom: '120px',
    zIndex: 10,
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '11px',
    width: '220px',
  },
  intelTitle: {
    fontSize: '9px',
    letterSpacing: '3px',
    color: GREEN,
    marginBottom: '12px',
    opacity: 0.6,
  },
  intelLine: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid rgba(0,255,136,0.08)',
  },
  intelLabel: {
    color: 'var(--text-dim)',
  },
  intelValue: {
    color: GREEN,
  },
  dataTicker: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    display: 'flex',
    borderTop: '1px solid rgba(0,255,136,0.1)',
    background: 'rgba(2,12,6,0.9)',
  },
  tickerItem: {
    flex: 1,
    padding: '16px 24px',
    borderRight: '1px solid rgba(0,255,136,0.08)',
    fontFamily: "'Share Tech Mono', monospace",
  },
  tickerLabel: {
    fontSize: '9px',
    letterSpacing: '2px',
    color: 'var(--text-dim)',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
  },
  tickerValue: {
    fontSize: '18px',
    color: GREEN,
    fontWeight: 700,
  },
  footerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 40px',
    borderTop: '1px solid rgba(0,255,136,0.08)',
    background: 'var(--dark)',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '10px',
    letterSpacing: '1px',
    color: 'var(--text-dim)',
  },
  statusDot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: GREEN,
    marginRight: '8px',
    boxShadow: `0 0 8px ${GREEN}`,
  },
};

/* shared section styles */
const sectionBase: React.CSSProperties = {
  position: 'relative',
  borderTop: '1px solid #0d2a18',
  background: '#020c06',
};

const sectionTag: React.CSSProperties = {
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: 10,
  color: GREEN,
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  marginBottom: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const sectionHeadline: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 'clamp(28px, 3.5vw, 48px)',
  fontWeight: 800,
  lineHeight: 1.1,
  color: '#ffffff',
  maxWidth: 700,
};

const sectionBody: React.CSSProperties = {
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: 14,
  color: '#4a7a5a',
  lineHeight: 1.8,
  maxWidth: 640,
};

const monoSmall: React.CSSProperties = {
  fontFamily: "'Share Tech Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.2em',
  color: '#2a4a32',
};

/* ─── responsive media-query CSS (injected once) ─── */
const RESPONSIVE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Syne:wght@400;600;700;800&display=swap');

:root {
  --green: #00ff88;
  --green-dim: #00ff8844;
  --green-glow: #00ff8822;
  --dark: #020c06;
  --dark-2: #050f08;
  --dark-3: #0a1a10;
  --grid: #0d2a18;
  --text: #c8f0d8;
  --text-dim: #4a7a5a;
}

.vantage-home * { box-sizing: border-box; }

@media (max-width: 900px) {
  .vantage-services-grid {
    grid-template-columns: 1fr 1fr !important;
  }
  .vantage-steps-grid {
    grid-template-columns: 1fr 1fr !important;
  }
}
@media (max-width: 600px) {
  .vantage-services-grid {
    grid-template-columns: 1fr !important;
  }
  .vantage-steps-grid {
    grid-template-columns: 1fr !important;
  }
  .vantage-nav-links { display: none !important; }
  .vantage-hero-content { padding: 0 20px !important; }
  .vantage-intel-panel { display: none !important; }
  .vantage-ticker { flex-wrap: wrap !important; }
  .vantage-ticker-item { flex: 1 1 50% !important; }
  .vantage-portals-grid { grid-template-columns: 1fr !important; }
  .vantage-proof-grid { grid-template-columns: 1fr !important; }
}
`;

/* ─── component ─── */
export function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number }>>([]);
  const windowFlickerRef = useRef<Map<string, number>>(new Map());
  const styleRef = useRef<HTMLStyleElement | null>(null);

  /* inject responsive CSS + fonts */
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = RESPONSIVE_CSS;
    document.head.appendChild(style);
    styleRef.current = style;
    return () => { style.remove(); };
  }, []);

  const easeOutCubic = useCallback((t: number) => 1 - Math.pow(1 - t, 3), []);

  /* canvas animation */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    startTimeRef.current = performance.now();

    /* ---- drawing helpers ---- */

    function drawBuilding(
      c: CanvasRenderingContext2D,
      W: number,
      H: number,
      b: (typeof BUILDINGS)[number],
      progress: number,
    ) {
      const bx = b.x * W;
      const by = b.y * H;
      const bw = b.w * W;
      const bh = b.h * H * progress;
      const bd = b.depth * W;

      if (bh < 1) return;

      // front face
      c.fillStyle = 'rgba(0,255,136,0.04)';
      c.fillRect(bx, by - bh, bw, bh);
      c.strokeStyle = 'rgba(0,255,136,0.15)';
      c.lineWidth = 0.5;
      c.strokeRect(bx, by - bh, bw, bh);

      // top face
      c.beginPath();
      c.moveTo(bx, by - bh);
      c.lineTo(bx + bd, by - bh - bd);
      c.lineTo(bx + bw + bd, by - bh - bd);
      c.lineTo(bx + bw, by - bh);
      c.closePath();
      c.fillStyle = 'rgba(0,255,136,0.07)';
      c.fill();
      c.strokeStyle = 'rgba(0,255,136,0.15)';
      c.stroke();

      // right face
      c.beginPath();
      c.moveTo(bx + bw, by - bh);
      c.lineTo(bx + bw + bd, by - bh - bd);
      c.lineTo(bx + bw + bd, by - bd);
      c.lineTo(bx + bw, by);
      c.closePath();
      c.fillStyle = 'rgba(0,255,136,0.02)';
      c.fill();
      c.strokeStyle = 'rgba(0,255,136,0.12)';
      c.stroke();

      // windows
      const winW = 4;
      const winH = 6;
      const gapX = 10;
      const gapY = 12;
      const cols = Math.floor((bw - 8) / gapX);
      const rows = Math.floor((bh - 8) / gapY);

      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const wx = bx + 6 + col * gapX;
          const wy = by - bh + 6 + r * gapY;
          const key = `${b.x}-${r}-${col}`;
          const flicker = windowFlickerRef.current.get(key);
          if (flicker && flicker > performance.now()) {
            c.fillStyle = 'rgba(0,255,136,0.5)';
          } else {
            c.fillStyle = Math.random() > 0.7 ? 'rgba(0,255,136,0.2)' : 'rgba(0,255,136,0.06)';
          }
          c.fillRect(wx, wy, winW, winH);
        }
      }
    }

    function drawDataLine(
      c: CanvasRenderingContext2D,
      W: number,
      H: number,
      from: (typeof BUILDINGS)[number],
      to: (typeof BUILDINGS)[number],
      time: number,
    ) {
      const x1 = from.x * W + (from.w * W) / 2;
      const y1 = from.y * H - from.h * H * 0.5;
      const x2 = to.x * W + (to.w * W) / 2;
      const y2 = to.y * H - to.h * H * 0.5;

      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.strokeStyle = 'rgba(0,255,136,0.06)';
      c.lineWidth = 0.5;
      c.stroke();

      const t = (time * 0.0003) % 1;
      const dx = x1 + (x2 - x1) * t;
      const dy = y1 + (y2 - y1) * t;
      c.beginPath();
      c.arc(dx, dy, 2, 0, Math.PI * 2);
      c.fillStyle = 'rgba(0,255,136,0.6)';
      c.fill();
    }

    function drawGroundGlow(c: CanvasRenderingContext2D, W: number, H: number) {
      const grd = c.createRadialGradient(W * 0.72, H * 0.85, 0, W * 0.72, H * 0.85, W * 0.35);
      grd.addColorStop(0, 'rgba(0,255,136,0.04)');
      grd.addColorStop(1, 'transparent');
      c.fillStyle = grd;
      c.fillRect(0, 0, W, H);
    }

    function drawScanLine(c: CanvasRenderingContext2D, W: number, H: number, time: number) {
      const y = (time * 0.05) % H;
      const grd = c.createLinearGradient(0, y - 40, 0, y + 40);
      grd.addColorStop(0, 'transparent');
      grd.addColorStop(0.5, 'rgba(0,255,136,0.03)');
      grd.addColorStop(1, 'transparent');
      c.fillStyle = grd;
      c.fillRect(0, y - 40, W, 80);
    }

    function updateParticles(c: CanvasRenderingContext2D, W: number, H: number) {
      const particles = particlesRef.current;
      if (particles.length < 30 && Math.random() > 0.95) {
        particles.push({
          x: W * (0.5 + Math.random() * 0.5),
          y: H * (0.5 + Math.random() * 0.4),
          vx: (Math.random() - 0.5) * 0.3,
          vy: -Math.random() * 0.5 - 0.2,
          life: 0,
          maxLife: 100 + Math.random() * 200,
        });
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = 1 - p.life / p.maxLife;
        c.beginPath();
        c.arc(p.x, p.y, 1, 0, Math.PI * 2);
        c.fillStyle = `rgba(0,255,136,${alpha * 0.3})`;
        c.fill();
      }
    }

    function randomlyFlickerWindows() {
      if (Math.random() > 0.98) {
        const b = BUILDINGS[Math.floor(Math.random() * BUILDINGS.length)];
        const r = Math.floor(Math.random() * 8);
        const col = Math.floor(Math.random() * 6);
        windowFlickerRef.current.set(`${b.x}-${r}-${col}`, performance.now() + 200 + Math.random() * 600);
      }
    }

    /* ---- main loop ---- */
    function animate() {
      const W = canvas!.width;
      const H = canvas!.height;
      const now = performance.now();
      const elapsed = (now - startTimeRef.current) / 1000;

      ctx!.clearRect(0, 0, W, H);
      ctx!.fillStyle = DARK;
      ctx!.fillRect(0, 0, W, H);

      drawGroundGlow(ctx!, W, H);

      for (const b of BUILDINGS) {
        const t = Math.max(0, Math.min(1, (elapsed - b.delay) / 1.2));
        const progress = easeOutCubic(t);
        drawBuilding(ctx!, W, H, b, progress);
      }

      if (elapsed > 1.5) {
        drawDataLine(ctx!, W, H, BUILDINGS[0], BUILDINGS[3], now);
        drawDataLine(ctx!, W, H, BUILDINGS[1], BUILDINGS[5], now);
        drawDataLine(ctx!, W, H, BUILDINGS[3], BUILDINGS[6], now);
        drawDataLine(ctx!, W, H, BUILDINGS[7], BUILDINGS[10], now);
        drawDataLine(ctx!, W, H, BUILDINGS[13], BUILDINGS[14], now);
        drawDataLine(ctx!, W, H, BUILDINGS[14], BUILDINGS[16], now);
      }

      updateParticles(ctx!, W, H);
      drawScanLine(ctx!, W, H, now);
      randomlyFlickerWindows();

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [easeOutCubic]);

  return (
    <div className="vantage-home" style={S.page}>
      {/* ─── NAV ─── */}
      <nav style={S.nav}>
        <Link to="/" style={S.logo}>VANTAGE // INFRASTRUCTURE</Link>
        <div style={S.navLinks} className="vantage-nav-links">
          <a href="#problem" style={S.navLink}>The Problem</a>
          <a href="#services" style={S.navLink}>Services</a>
          <a href="#platform" style={S.navLink}>Platform</a>
          <Link to="/demo" style={S.navLink}>Demo</Link>
          <a href="#portals" style={S.navLink}>Sign In</a>
          <Link to="/contact" style={S.navLink}>Contact</Link>
          <Link to="/demo" style={S.ctaBtn}>See Your Building</Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={S.hero}>
        <canvas ref={canvasRef} style={S.canvas} />
        <div style={S.gridFloor} />
        <div style={S.scanLine} />
        <div style={S.noiseOverlay} />

        <div style={S.heroContent} className="vantage-hero-content">
          <div style={S.tag}>Independent Owner&apos;s Representative</div>
          <h1 style={S.h1}>
            Your interests.<br />
            Always protected.
          </h1>
          <p style={S.subtitle}>
            Energy Savings Performance Contracts promise guaranteed savings.
            We make sure you actually get them.<br /><br />
            ESCOs design the project, build the project, and measure whether
            the project worked. That&apos;s a conflict of interest your agency
            can&apos;t afford to ignore. Vantage sits on your side of the table.
          </p>
          <div style={S.heroCtas}>
            <Link to="/demo" style={S.primaryBtn}>See Your Building &rarr;</Link>
            <a href="#portals" style={S.secondaryBtn}>Sign In</a>
          </div>
        </div>

        {/* intel panel */}
        <div style={S.intelPanel} className="vantage-intel-panel">
          <div style={S.intelTitle}>// SYSTEM INTEL</div>
          {intelLines.map((line) => (
            <div key={line.label} style={S.intelLine}>
              <span style={S.intelLabel}>{line.label}</span>
              <span style={S.intelValue}>{line.value}</span>
            </div>
          ))}
        </div>

        {/* data ticker */}
        <div style={S.dataTicker} className="vantage-ticker">
          {tickerItems.map((item) => (
            <div key={item.label} style={S.tickerItem} className="vantage-ticker-item">
              <div style={S.tickerLabel}>{item.label}</div>
              <div style={S.tickerValue}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── POSITIONING STATEMENT ─── */}
      <div style={{
        padding: '48px 40px',
        textAlign: 'center',
        borderTop: '1px solid #0d2a18',
        background: '#020c06',
      }}>
        <p style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.4em',
          color: 'rgba(0,255,136,0.5)',
          margin: 0,
        }}>
          &ldquo;ESCOs have always had the data. Now so do you.&rdquo;
        </p>
      </div>

      {/* ─── THE PROBLEM ─── */}
      <section id="problem" style={{ ...sectionBase, padding: '120px 48px' }}>
        <div style={sectionTag}>
          <span style={{ width: 24, height: 1, background: GREEN, display: 'inline-block' }} />
          The Problem
        </div>
        <h2 style={{ ...sectionHeadline, marginBottom: 32 }}>
          The ESCO controls what you see.
        </h2>
        <div style={{ ...sectionBody, marginBottom: 32 }}>
          <p style={{ margin: '0 0 20px 0' }}>
            An Energy Savings Performance Contract is one of the most complex
            financial instruments your agency will ever sign. Millions of dollars.
            Ten to twenty-five years. Guaranteed savings that are supposed to pay
            for themselves.
          </p>
          <p style={{ margin: '0 0 20px 0' }}>
            But here&apos;s what most owners don&apos;t realize until it&apos;s too late: the
            same company that promised you savings is also the one measuring
            whether they delivered. They write the M&amp;V report. They define the
            baseline. They decide what counts.
          </p>
          <p style={{ margin: '0 0 20px 0' }}>
            By the time you notice the savings are short, years of shortfall
            have already accumulated &mdash; and the contract&apos;s remedy provisions have
            a clock on them.
          </p>
          <p style={{ margin: 0, color: GREEN, fontSize: 15 }}>
            Vantage exists because owners deserve an independent view.
          </p>
        </div>
      </section>

      {/* ─── PLATFORM DEMO ─── */}
      <section id="platform" style={{
        position: 'relative' as const,
        padding: '120px 48px',
        borderTop: '1px solid #0d2a18',
        background: '#020c06',
      }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          color: GREEN,
          letterSpacing: '0.4em',
          textTransform: 'uppercase' as const,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ width: 24, height: 1, background: GREEN, display: 'inline-block' }} />
          Platform Intelligence
        </div>
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(32px, 4vw, 52px)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 24,
          maxWidth: 600,
          color: '#c8f0d8',
        }}>
          See your building.<br />Know your contract.
        </h2>
        <p style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 14,
          color: '#4a7a5a',
          lineHeight: 1.7,
          maxWidth: 520,
          marginBottom: 48,
        }}>
          Real-time energy performance monitoring with AI-powered drift detection,
          ECM zone mapping, and DSCR tracking &mdash; all overlaid on your actual facility.
        </p>

        {/* Demo preview card */}
        <Link to="/demo" style={{
          display: 'block',
          border: '1px solid #0d2a18',
          background: '#050f08',
          position: 'relative' as const,
          overflow: 'hidden',
          textDecoration: 'none',
          cursor: 'pointer',
          maxWidth: 960,
          transition: 'border-color 0.3s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = GREEN)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#0d2a18')}
        >
          {/* Simulated dashboard preview */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #0d2a18',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10,
              color: GREEN,
              letterSpacing: '0.3em',
            }}>
              VANTAGE<span style={{ color: '#4a7a5a' }}> // ESPC PERFORMANCE MONITOR</span>
            </div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9,
              color: '#4a7a5a',
              letterSpacing: '0.2em',
            }}>
              ATLANTA CITY HALL &mdash; 55 TRINITY AVE SW
            </div>
          </div>

          {/* Mock dashboard grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 1,
            background: '#0d2a18',
            borderBottom: '1px solid #0d2a18',
          }}>
            {[
              { label: 'VERIFIED SAVINGS', value: '$221K', sub: 'of $312K target', color: '#ffaa00' },
              { label: 'SHORTFALL', value: '$90.6K', sub: 'YTD exposure', color: '#ff4444' },
              { label: 'ECMs ON TRACK', value: '4/6', sub: 'performing', color: GREEN },
              { label: 'DSCR', value: '1.04', sub: 'min 1.0 required', color: '#ffaa00' },
            ].map((m) => (
              <div key={m.label} style={{ background: '#050f08', padding: '16px 20px' }}>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 8,
                  color: '#4a7a5a',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase' as const,
                  marginBottom: 4,
                }}>{m.label}</div>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 24,
                  color: m.color,
                  lineHeight: 1,
                  marginBottom: 2,
                }}>{m.value}</div>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 8,
                  color: '#4a7a5a',
                }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* ECM status bars */}
          <div style={{ padding: '16px 24px' }}>
            {[
              { name: 'HVAC Retrofit', pct: 71, color: '#ffaa00' },
              { name: 'LED Lighting', pct: 97, color: GREEN },
              { name: 'BMS Controls', pct: 103, color: GREEN },
              { name: 'Building Envelope', pct: 52, color: '#ff4444' },
            ].map((ecm) => (
              <div key={ecm.name} style={{ marginBottom: 10 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 9,
                  marginBottom: 4,
                }}>
                  <span style={{ color: '#c8f0d8' }}>{ecm.name}</span>
                  <span style={{ color: ecm.color }}>{ecm.pct}%</span>
                </div>
                <div style={{ background: '#0d2a18', height: 3 }}>
                  <div style={{
                    width: `${Math.min(100, ecm.pct)}%`,
                    height: '100%',
                    background: ecm.color,
                    transition: 'width 1s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* CTA overlay */}
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #0d2a18',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9,
              color: '#4a7a5a',
              letterSpacing: '0.3em',
            }}>CLICK TO EXPLORE FULL INTERACTIVE DEMO</span>
            <span style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11,
              color: GREEN,
              letterSpacing: '0.2em',
            }}>LAUNCH DEMO &rarr;</span>
          </div>
        </Link>
      </section>

      {/* ─── SERVICES — SIX PILLARS ─── */}
      <section id="services" style={{
        padding: '120px 48px',
        background: '#050f08',
        position: 'relative',
        borderTop: '1px solid #0d2a18',
      }}>
        <div style={sectionTag}>
          <span style={{ width: 24, height: 1, background: GREEN, display: 'inline-block' }} />
          What We Do
        </div>
        <h2 style={{ ...sectionHeadline, marginBottom: 64 }}>
          Six pillars of independent oversight.
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          background: 'rgba(0,255,136,0.08)',
        }} className="vantage-services-grid">
          {services.map((svc) => (
            <div key={svc.num} style={{
              background: '#050f08',
              padding: '48px 36px',
              transition: 'background 0.3s',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 11,
                color: GREEN,
                marginBottom: 12,
                opacity: 0.5,
              }}>{svc.num}</div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: GREEN,
                marginBottom: 16,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}>{svc.title}</div>
              <h3 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: 10,
                lineHeight: 1.2,
              }}>{svc.headline}</h3>
              <p style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 11,
                color: '#c8f0d8',
                lineHeight: 1.6,
                marginBottom: 16,
              }}>{svc.subhead}</p>
              <p style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 11,
                color: '#4a7a5a',
                lineHeight: 1.7,
                marginBottom: 20,
              }}>{svc.body}</p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 20px 0',
              }}>
                {svc.bullets.map((b) => (
                  <li key={b} style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 10,
                    color: '#4a7a5a',
                    padding: '5px 0',
                    borderBottom: '1px solid rgba(0,255,136,0.05)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}>
                    <span style={{ color: GREEN, fontSize: 8, marginTop: 3, flexShrink: 0 }}>&#9670;</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 9,
                color: '#2a4a32',
                letterSpacing: '0.1em',
                marginTop: 'auto',
              }}>{svc.audience}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── WHY VANTAGE ─── */}
      <section id="why" style={{ ...sectionBase, padding: '120px 48px' }}>
        <div style={sectionTag}>
          <span style={{ width: 24, height: 1, background: GREEN, display: 'inline-block' }} />
          Why Vantage
        </div>
        <h2 style={{ ...sectionHeadline, marginBottom: 32, maxWidth: 620 }}>
          What makes us different isn&apos;t the credentials.<br />It&apos;s the platform.
        </h2>
        <div style={{ ...sectionBody, marginBottom: 32 }}>
          <p style={{ margin: '0 0 20px 0' }}>
            Traditional Owner&apos;s Rep firms send you a PDF once a quarter.
            By the time you read it, three months of drift have already
            compounded.
          </p>
          <p style={{ margin: '0 0 20px 0' }}>
            Vantage monitors your contract continuously. Our AI platform
            reads your utility data, compares it against your guaranteed
            baselines, and flags anomalies the moment they appear &mdash;
            not at the next reporting cycle.
          </p>
          <p style={{ margin: '0 0 20px 0' }}>
            When you upload your ESPC contract, our document intelligence
            extracts every ECM, every guaranteed savings figure, every
            baseline parameter, and every M&amp;V methodology specified.
            Those numbers live in your dashboard in real time.
          </p>
          <p style={{ margin: '0 0 20px 0' }}>
            Every M&amp;V report we produce is reviewed and signed by a
            Certified Measurement &amp; Verification Professional. That&apos;s
            the credential that makes your findings defensible.
          </p>
          <p style={{ margin: 0, color: '#c8f0d8', fontSize: 15 }}>
            We are not a consulting firm that happens to have software.
            We are a tech-enabled Owner&apos;s Representative firm where
            the platform is the product and independent oversight
            is the delivery mechanism.
          </p>
        </div>

        {/* Platform proof points */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          background: '#0d2a18',
          border: '1px solid #0d2a18',
          maxWidth: 800,
          marginTop: 48,
        }}>
          <div style={{ background: '#020c06', padding: '32px 28px' }}>
            <h3 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 12,
              lineHeight: 1.3,
            }}>
              Your staff will change. Your platform won&apos;t.
            </h3>
            <p style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11,
              color: '#4a7a5a',
              lineHeight: 1.7,
              margin: 0,
            }}>
              Our institutional knowledge module preserves every
              decision, every baseline, every communication permanently &mdash;
              regardless of who is in the role.
            </p>
          </div>
          <div style={{ background: '#020c06', padding: '32px 28px' }}>
            <h3 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 12,
              lineHeight: 1.3,
            }}>
              The baseline governs everything.<br />We make sure it was set correctly.
            </h3>
            <p style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11,
              color: '#4a7a5a',
              lineHeight: 1.7,
              margin: 0,
            }}>
              IGA assumptions extraction and baseline registry
              surface the numbers ESCOs rely on for 25 years of
              M&amp;V calculations &mdash; before you sign.
            </p>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" style={{ ...sectionBase, padding: '120px 48px' }}>
        <div style={sectionTag}>
          <span style={{ width: 24, height: 1, background: GREEN, display: 'inline-block' }} />
          How It Works
        </div>
        <h2 style={{ ...sectionHeadline, marginBottom: 64 }}>
          From contract to command in 48 hours.
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          background: '#0d2a18',
          border: '1px solid #0d2a18',
          maxWidth: 960,
        }} className="vantage-steps-grid">
          {steps.map((step) => (
            <div key={step.num} style={{
              background: '#020c06',
              padding: '36px 28px',
            }}>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 11,
                color: GREEN,
                marginBottom: 16,
                opacity: 0.5,
              }}>{step.num}</div>
              <h3 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: 12,
                lineHeight: 1.3,
              }}>{step.title}</h3>
              <p style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 11,
                color: '#4a7a5a',
                lineHeight: 1.7,
                margin: 0,
              }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CLOSING CTA ─── */}
      <section style={{
        ...sectionBase,
        padding: '120px 48px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(28px, 3.5vw, 44px)',
          fontWeight: 800,
          lineHeight: 1.15,
          color: '#ffffff',
          marginBottom: 16,
          maxWidth: 600,
        }}>
          Your ESCO knows exactly how your contract is performing.
        </h2>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(20px, 2.5vw, 32px)',
          fontWeight: 700,
          color: GREEN,
          marginBottom: 32,
        }}>
          Now you can too.
        </p>
        <p style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 13,
          color: '#4a7a5a',
          lineHeight: 1.8,
          maxWidth: 520,
          marginBottom: 48,
          textAlign: 'center',
        }}>
          Schedule a conversation. We&apos;ll load your building into
          the platform and show you what your contract looks like
          with independent eyes on it.<br /><br />
          No obligation. No pitch deck.
          Just your data, your building, and a clear picture
          of where you actually stand.
        </p>
        <Link to="/contact" style={{
          ...S.primaryBtn,
          fontSize: 14,
          padding: '18px 40px',
          marginBottom: 32,
        }}>
          Request Access &rarr;
        </Link>
        <p style={{ ...monoSmall, textAlign: 'center', maxWidth: 480 }}>
          Georgia-based &middot; DBE Certified (pending) &middot;
          CMVP-credentialed M&amp;V &middot; Serving public sector
          agencies throughout Metro Atlanta and Georgia
        </p>
      </section>

      {/* ─── PORTAL ACCESS ─── */}
      <section id="portals" style={{
        position: 'relative' as const,
        padding: '100px 48px',
        borderTop: '1px solid #0d2a18',
        background: '#020c06',
      }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          color: GREEN,
          letterSpacing: '0.4em',
          textTransform: 'uppercase' as const,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ width: 24, height: 1, background: GREEN, display: 'inline-block' }} />
          Secure Access
        </div>
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(28px, 3.5vw, 44px)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 48,
          color: '#c8f0d8',
        }}>
          Sign in to your portal.
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          background: '#0d2a18',
          border: '1px solid #0d2a18',
          maxWidth: 900,
        }} className="vantage-portals-grid">
          {/* Admin Portal */}
          <Link to="/admin" style={{
            background: '#050f08',
            padding: '40px 32px',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 16,
            transition: 'background 0.3s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0a1a10')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#050f08')}
          >
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9,
              color: '#4a7a5a',
              letterSpacing: '0.3em',
            }}>01 //</div>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: '#c8f0d8',
            }}>Admin Portal</div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11,
              color: '#4a7a5a',
              lineHeight: 1.6,
            }}>
              Document intelligence, contract management, user provisioning, and platform administration.
            </div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10,
              color: GREEN,
              letterSpacing: '0.2em',
              marginTop: 'auto',
            }}>SIGN IN &rarr;</div>
          </Link>

          {/* Client Portal */}
          <Link to="/client/login" style={{
            background: '#050f08',
            padding: '40px 32px',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 16,
            transition: 'background 0.3s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0a1a10')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#050f08')}
          >
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9,
              color: '#4a7a5a',
              letterSpacing: '0.3em',
            }}>02 //</div>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: '#c8f0d8',
            }}>Client Portal</div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11,
              color: '#4a7a5a',
              lineHeight: 1.6,
            }}>
              View your contract performance, verified savings, ECM status, and ask Vantage AI questions in plain English.
            </div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10,
              color: GREEN,
              letterSpacing: '0.2em',
              marginTop: 'auto',
            }}>SIGN IN &rarr;</div>
          </Link>

          {/* CMVP Portal */}
          <Link to="/cmvp" style={{
            background: '#050f08',
            padding: '40px 32px',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 16,
            transition: 'background 0.3s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0a1a10')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#050f08')}
          >
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9,
              color: '#4a7a5a',
              letterSpacing: '0.3em',
            }}>03 //</div>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: '#c8f0d8',
            }}>M&amp;V Professional</div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11,
              color: '#4a7a5a',
              lineHeight: 1.6,
            }}>
              Review assigned M&amp;V tasks, verify savings calculations, flag discrepancies, and digitally sign off on reports.
            </div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10,
              color: GREEN,
              letterSpacing: '0.2em',
              marginTop: 'auto',
            }}>SIGN IN &rarr;</div>
          </Link>
        </div>

        <p style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          color: '#2a4a32',
          marginTop: 24,
          letterSpacing: '0.2em',
        }}>
          Access provisioned by Vantage Infrastructure Group. Contact your project manager for credentials.
        </p>
      </section>

      {/* ─── FOOTER BAR ─── */}
      <footer style={S.footerBar}>
        <span>&copy; 2026 VANTAGE INFRASTRUCTURE GROUP // ATLANTA, GA</span>
        <span>
          <span style={S.statusDot} />
          PLATFORM ONLINE
        </span>
      </footer>
    </div>
  );
}

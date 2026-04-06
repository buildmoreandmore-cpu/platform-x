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

/* ─── services data ─── */
const services = [
  {
    num: '01',
    title: 'ESPC Lifecycle Management',
    bullets: [
      "Full Owner's Rep from feasibility through contract close",
      'RFP development, ESCO evaluation & selection',
      'Construction oversight and commissioning QA',
    ],
  },
  {
    num: '02',
    title: 'Measurement & Verification',
    bullets: [
      'IPMVP-compliant savings verification',
      'Automated drift detection and performance alerts',
      'Stakeholder and regulatory reporting',
    ],
  },
  {
    num: '03',
    title: 'Financial Modeling & Analysis',
    bullets: [
      'Lifecycle cost analysis for ECM bundles',
      'Utility rate escalation scenario modeling',
      'ROI forecasting and sensitivity analysis',
    ],
  },
  {
    num: '04',
    title: 'AI-Powered Project Intelligence',
    bullets: [
      'Natural language queries across project data',
      'Document intelligence and extraction',
      'Automated reporting with QA workflow',
    ],
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
    maxWidth: '480px',
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
  servicesSection: {
    padding: '120px 40px',
    background: 'var(--dark-2)',
    position: 'relative',
  },
  sectionTag: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '10px',
    letterSpacing: '4px',
    color: GREEN,
    textTransform: 'uppercase' as const,
    marginBottom: '16px',
    opacity: 0.6,
  },
  sectionTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 'clamp(28px, 3.5vw, 44px)',
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: '60px',
    maxWidth: '600px',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1px',
    background: 'rgba(0,255,136,0.08)',
  },
  serviceCard: {
    background: 'var(--dark-2)',
    padding: '40px 32px',
    transition: 'background 0.3s',
  },
  serviceNum: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '11px',
    color: GREEN,
    marginBottom: '16px',
    opacity: 0.5,
  },
  serviceTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '18px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '20px',
    lineHeight: 1.3,
  },
  serviceBullets: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  serviceBullet: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '11px',
    color: 'var(--text-dim)',
    padding: '6px 0',
    borderBottom: '1px solid rgba(0,255,136,0.05)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  bulletDot: {
    color: GREEN,
    fontSize: '8px',
    marginTop: '3px',
    flexShrink: 0,
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
}
@media (max-width: 600px) {
  .vantage-services-grid {
    grid-template-columns: 1fr !important;
  }
  .vantage-nav-links { display: none !important; }
  .vantage-hero-content { padding: 0 20px !important; }
  .vantage-intel-panel { display: none !important; }
  .vantage-ticker { flex-wrap: wrap !important; }
  .vantage-ticker-item { flex: 1 1 50% !important; }
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

      // moving dot
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

      // buildings rise in with easeOutCubic
      for (const b of BUILDINGS) {
        const t = Math.max(0, Math.min(1, (elapsed - b.delay) / 1.2));
        const progress = easeOutCubic(t);
        drawBuilding(ctx!, W, H, b, progress);
      }

      // data lines between buildings
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
          <a href="#services" style={S.navLink}>Services</a>
          <Link to="/portal" style={S.navLink}>Platform</Link>
          <Link to="/contact" style={S.navLink}>About</Link>
          <Link to="/contact" style={S.navLink}>Contact</Link>
          <Link to="/contact" style={S.ctaBtn}>Request Access</Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={S.hero}>
        <canvas ref={canvasRef} style={S.canvas} />
        <div style={S.gridFloor} />
        <div style={S.scanLine} />
        <div style={S.noiseOverlay} />

        <div style={S.heroContent} className="vantage-hero-content">
          <div style={S.tag}>Energy Performance Advisory</div>
          <h1 style={S.h1}>
            Your interests.<br />
            Always protected.
          </h1>
          <p style={S.subtitle}>
            Independent Owner&apos;s Rep for Energy Savings Performance Contracts.
            We protect your investment from feasibility through post-construction M&amp;V.
          </p>
          <div style={S.heroCtas}>
            <Link to="/contact" style={S.primaryBtn}>Request Access</Link>
            <Link to="/portal" style={S.secondaryBtn}>Enter Platform</Link>
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

      {/* ─── SERVICES ─── */}
      <section id="services" style={S.servicesSection}>
        <div style={S.sectionTag}>Capabilities</div>
        <h2 style={S.sectionTitle}>Full-spectrum ESPC oversight.</h2>
        <div style={S.servicesGrid} className="vantage-services-grid">
          {services.map((svc) => (
            <div key={svc.num} style={S.serviceCard}>
              <div style={S.serviceNum}>{svc.num}</div>
              <div style={S.serviceTitle}>{svc.title}</div>
              <ul style={S.serviceBullets}>
                {svc.bullets.map((b) => (
                  <li key={b} style={S.serviceBullet}>
                    <span style={S.bulletDot}>&#9670;</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
          ECM zone mapping, and DSCR tracking — all overlaid on your actual facility.
          One API key swap from Google's photorealistic 3D tiles.
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
              ATLANTA CITY HALL — 55 TRINITY AVE SW
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
            }}>LAUNCH DEMO →</span>
          </div>
        </Link>
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

import { useRef, useEffect, useState, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const surroundBuildings = [
  { rx: -0.55, ry: -0.25, w: 60, h: 220, color: 'rgba(5,18,12,0.9)' },
  { rx: -0.45, ry: -0.18, w: 45, h: 180, color: 'rgba(6,20,13,0.9)' },
  { rx: -0.35, ry: -0.32, w: 55, h: 260, color: 'rgba(4,16,10,0.9)' },
  { rx: -0.25, ry: -0.28, w: 40, h: 230, color: 'rgba(7,22,14,0.9)' },
  { rx: 0.35, ry: -0.22, w: 50, h: 200, color: 'rgba(5,18,12,0.9)' },
  { rx: 0.45, ry: -0.15, w: 65, h: 160, color: 'rgba(6,20,13,0.9)' },
  { rx: 0.55, ry: -0.28, w: 40, h: 240, color: 'rgba(4,16,10,0.9)' },
  { rx: -0.48, ry: 0.05, w: 70, h: 120, color: 'rgba(6,20,13,0.85)' },
  { rx: -0.38, ry: 0.08, w: 55, h: 100, color: 'rgba(7,22,14,0.85)' },
  { rx: 0.32, ry: 0.02, w: 60, h: 110, color: 'rgba(5,18,12,0.85)' },
  { rx: 0.42, ry: 0.06, w: 45, h: 95, color: 'rgba(6,20,13,0.85)' },
];

const zones = [
  { id: 'main-tower', label: 'Main Tower', ecm: 'envelope', floors: '1\u20138', rx: 0, ry: 0, rw: 0.18, rh: 0.55, status: 'red', kw: 18.4 },
  { id: 'annex-north', label: 'North Annex', ecm: 'hvac', floors: '1\u20134', rx: 0.19, ry: 0.12, rw: 0.11, rh: 0.32, status: 'amber', kw: 14.1 },
  { id: 'council', label: 'Council Chambers', ecm: 'lighting', floors: '1\u20132', rx: -0.15, ry: 0.28, rw: 0.14, rh: 0.18, status: 'green', kw: 6.2 },
  { id: 'mechanical', label: 'Mechanical', ecm: 'bms', floors: 'B1\u2013B2', rx: 0.02, ry: 0.58, rw: 0.16, rh: 0.1, status: 'green', kw: 22.8 },
];

const sensors = [
  { rx: -0.05, ry: 0.1, label: 'RTU-01', val: '142\u00b0F' },
  { rx: 0.12, ry: 0.05, label: 'CHW-03', val: '44\u00b0F' },
  { rx: 0.22, ry: 0.22, label: 'AHU-07', val: '68\u00b0F' },
  { rx: -0.1, ry: 0.35, label: 'LUX-02', val: '480 lx' },
  { rx: 0.08, ry: 0.48, label: 'BTU-01', val: '1,240' },
];

interface ECMItem {
  id: string;
  label: string;
  pct: number;
  status: 'green' | 'amber' | 'red';
  detail: string;
}

const ecmList: ECMItem[] = [
  { id: 'hvac', label: 'HVAC Retrofit', pct: 71, status: 'amber', detail: 'drift -$18,400' },
  { id: 'lighting', label: 'LED Lighting', pct: 97, status: 'green', detail: 'on track +$2,100' },
  { id: 'bms', label: 'BMS Controls', pct: 103, status: 'green', detail: 'outperforming +$4,800' },
  { id: 'envelope', label: 'Building Envelope', pct: 52, status: 'red', detail: 'shortfall -$31,200' },
  { id: 'water', label: 'Water Conservation', pct: 88, status: 'green', detail: 'minor drift -$1,900' },
  { id: 'solar', label: 'Solar PV', pct: 94, status: 'green', detail: '148,200 kWh YTD' },
];

const alerts = [
  { status: 'red', title: 'BUILDING ENVELOPE DRIFT', body: 'Insulation ECM 48% below guaranteed baseline. ESCO notified.', time: 'TODAY 06:14' },
  { status: 'amber', title: 'HVAC CHILLER UNDERPERFORM', body: 'Unit 3 runtime 22% over baseline.', time: 'TODAY 02:31' },
  { status: 'green', title: 'M&V REPORT GENERATED', body: 'March 2026 savings verification complete.', time: 'YESTERDAY 23:58' },
  { status: 'green', title: 'BMS CONTROLS OUTPERFORM', body: 'Scheduling optimization yielding 3% above.', time: 'APR 4 09:12' },
];

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const STATUS_COLORS: Record<string, string> = {
  green: '#00ff88',
  amber: '#ffaa00',
  red: '#ff4444',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function Demo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const [activeECM, setActiveECM] = useState<string | null>(null);
  const [layers, setLayers] = useState({
    heatMap: true,
    ecmZones: true,
    sensorPoints: true,
    baselineOverlay: false,
  });
  const [savings, setSavings] = useState(221400);

  const toggleLayer = useCallback((key: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  /* ---- style injection ---- */
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Syne:wght@400;600;700;800&display=swap');

      :root {
        --green: #00ff88;
        --green-dim: rgba(0,255,136,0.15);
        --amber: #ffaa00;
        --red: #ff4444;
        --dark: #020c06;
        --dark-2: #050f08;
        --dark-3: #0a1a10;
        --grid: #0d2a18;
        --text: #c8f0d8;
        --text-dim: #4a7a5a;
        --panel-bg: rgba(2,12,6,0.92);
      }

      .demo-root {
        margin: 0;
        padding: 0;
        background: var(--dark);
        color: var(--text);
        font-family: 'Share Tech Mono', monospace;
        overflow: hidden;
        width: 100vw;
        height: 100vh;
        position: relative;
      }

      .demo-root * { box-sizing: border-box; }

      .demo-canvas {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        z-index: 0;
      }

      /* ---------- top nav ---------- */
      .demo-topnav {
        position: absolute; top: 0; left: 0; right: 0;
        height: 48px;
        background: var(--panel-bg);
        border-bottom: 1px solid var(--grid);
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 20px;
        z-index: 10;
        backdrop-filter: blur(12px);
      }
      .demo-topnav-left {
        display: flex; align-items: center; gap: 16px;
      }
      .demo-topnav-logo {
        font-family: 'Syne', sans-serif;
        font-weight: 800;
        font-size: 14px;
        color: var(--green);
        letter-spacing: 0.08em;
      }
      .demo-topnav-divider {
        width: 1px; height: 24px;
        background: var(--grid);
      }
      .demo-topnav-contract {
        display: flex; gap: 20px; font-size: 10px; letter-spacing: 0.06em;
        color: var(--text-dim);
      }
      .demo-topnav-contract span { display: flex; align-items: center; gap: 4px; }
      .demo-topnav-contract .val { color: var(--text); }
      .demo-topnav-contract .amber { color: var(--amber); }
      .demo-topnav-right {
        display: flex; align-items: center; gap: 12px; font-size: 10px;
        color: var(--text-dim);
      }
      .demo-topnav-right .live-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--green);
        animation: pulse-dot 2s infinite;
      }
      @keyframes pulse-dot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }

      /* ---------- left panel ---------- */
      .demo-left-panel {
        position: absolute;
        top: 56px; left: 12px;
        width: 260px;
        background: var(--panel-bg);
        border: 1px solid var(--grid);
        border-radius: 4px;
        z-index: 10;
        backdrop-filter: blur(12px);
        max-height: calc(100vh - 120px);
        overflow-y: auto;
      }
      .demo-panel-header {
        padding: 12px 14px 8px;
        font-size: 9px;
        letter-spacing: 0.15em;
        color: var(--text-dim);
        border-bottom: 1px solid var(--grid);
      }
      .demo-ecm-item {
        padding: 10px 14px;
        border-bottom: 1px solid rgba(13,42,24,0.5);
        cursor: pointer;
        transition: background 0.2s;
      }
      .demo-ecm-item:hover, .demo-ecm-item.active {
        background: var(--green-dim);
      }
      .demo-ecm-item .ecm-row {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 4px;
      }
      .demo-ecm-item .ecm-label {
        font-size: 11px; font-weight: 600;
      }
      .demo-ecm-item .ecm-pct {
        font-size: 12px; font-weight: 700;
      }
      .demo-ecm-item .ecm-bar {
        height: 3px; width: 100%;
        background: rgba(13,42,24,0.6);
        border-radius: 2px;
        margin-bottom: 3px;
      }
      .demo-ecm-item .ecm-bar-fill {
        height: 100%; border-radius: 2px;
        transition: width 0.4s;
      }
      .demo-ecm-item .ecm-detail {
        font-size: 9px; color: var(--text-dim);
      }

      /* ---------- right panel ---------- */
      .demo-right-panel {
        position: absolute;
        top: 56px; right: 12px;
        width: 280px;
        background: var(--panel-bg);
        border: 1px solid var(--grid);
        border-radius: 4px;
        z-index: 10;
        backdrop-filter: blur(12px);
        max-height: calc(100vh - 120px);
        overflow-y: auto;
      }
      .demo-metrics-grid {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 1px; background: var(--grid);
        border-bottom: 1px solid var(--grid);
      }
      .demo-metric {
        background: var(--dark-2);
        padding: 12px 10px;
      }
      .demo-metric .metric-label {
        font-size: 8px; letter-spacing: 0.12em;
        color: var(--text-dim); margin-bottom: 4px;
      }
      .demo-metric .metric-value {
        font-size: 18px; font-weight: 700;
      }
      .demo-metric .metric-sub {
        font-size: 8px; color: var(--text-dim); margin-top: 2px;
      }

      .demo-alert-feed { padding: 0; }
      .demo-alert-item {
        padding: 10px 14px;
        border-bottom: 1px solid rgba(13,42,24,0.5);
      }
      .demo-alert-item .alert-header {
        display: flex; align-items: center; gap: 6px;
        margin-bottom: 3px;
      }
      .demo-alert-item .alert-dot {
        width: 6px; height: 6px; border-radius: 50%;
        flex-shrink: 0;
      }
      .demo-alert-item .alert-title {
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.06em;
      }
      .demo-alert-item .alert-body {
        font-size: 9px; color: var(--text-dim);
        line-height: 1.4; margin-left: 12px;
      }
      .demo-alert-item .alert-time {
        font-size: 8px; color: var(--text-dim);
        margin-left: 12px; margin-top: 3px;
        opacity: 0.6;
      }

      /* ---------- layer controls ---------- */
      .demo-layers {
        position: absolute;
        bottom: 68px; left: 12px;
        display: flex; gap: 6px;
        z-index: 10;
      }
      .demo-layer-btn {
        padding: 6px 12px;
        font-family: 'Share Tech Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.08em;
        background: var(--panel-bg);
        border: 1px solid var(--grid);
        color: var(--text-dim);
        border-radius: 3px;
        cursor: pointer;
        backdrop-filter: blur(8px);
        transition: all 0.2s;
      }
      .demo-layer-btn.on {
        border-color: var(--green);
        color: var(--green);
        background: var(--green-dim);
      }

      /* ---------- building pin ---------- */
      .demo-building-pin {
        position: absolute;
        z-index: 5;
        pointer-events: none;
        display: flex; flex-direction: column; align-items: center;
      }
      .demo-building-pin .pin-label {
        background: var(--panel-bg);
        border: 1px solid var(--green);
        padding: 4px 10px;
        font-size: 9px;
        letter-spacing: 0.08em;
        color: var(--green);
        white-space: nowrap;
        border-radius: 3px;
        margin-bottom: 4px;
        backdrop-filter: blur(8px);
      }
      .demo-building-pin .pin-line {
        width: 1px; height: 40px;
        background: linear-gradient(to bottom, var(--green), transparent);
      }
      .demo-building-pin .pin-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        background: var(--green);
        box-shadow: 0 0 12px var(--green);
      }

      /* ---------- bottom timeline ---------- */
      .demo-timeline {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 56px;
        background: var(--panel-bg);
        border-top: 1px solid var(--grid);
        display: flex; align-items: center;
        padding: 0 20px;
        z-index: 10;
        backdrop-filter: blur(12px);
        gap: 16px;
      }
      .demo-timeline-label {
        font-size: 9px; letter-spacing: 0.1em;
        color: var(--text-dim);
        white-space: nowrap;
      }
      .demo-timeline-months {
        flex: 1; display: flex; align-items: center;
        gap: 2px; height: 100%;
      }
      .demo-timeline-month {
        flex: 1; display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        font-size: 8px; letter-spacing: 0.06em;
        color: var(--text-dim);
        position: relative;
        cursor: pointer;
        height: 100%;
        transition: color 0.2s;
      }
      .demo-timeline-month.active {
        color: var(--green);
      }
      .demo-timeline-month.active::after {
        content: '';
        position: absolute; bottom: 0; left: 0; right: 0;
        height: 2px; background: var(--green);
      }
      .demo-timeline-month.past::after {
        content: '';
        position: absolute; bottom: 0; left: 0; right: 0;
        height: 2px; background: var(--grid);
      }
      .demo-timeline-progress {
        width: 80px; text-align: right;
        font-size: 11px; color: var(--amber); font-weight: 700;
      }

      /* ---------- scan line ---------- */
      .demo-scan-line {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--green), transparent);
        opacity: 0.3;
        z-index: 4;
        animation: scan-sweep 6s linear infinite;
      }
      @keyframes scan-sweep {
        0% { top: 0; }
        100% { top: 100%; }
      }

      /* ---------- scrollbar ---------- */
      .demo-left-panel::-webkit-scrollbar,
      .demo-right-panel::-webkit-scrollbar {
        width: 3px;
      }
      .demo-left-panel::-webkit-scrollbar-thumb,
      .demo-right-panel::-webkit-scrollbar-thumb {
        background: var(--grid);
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  /* ---- reposition pin on resize ---- */
  const repositionPin = useCallback(() => {
    if (!pinRef.current) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.38;
    pinRef.current.style.left = `${cx - 60}px`;
    pinRef.current.style.top = `${cy - 90}px`;
  }, []);

  useEffect(() => {
    repositionPin();
    window.addEventListener('resize', repositionPin);
    return () => window.removeEventListener('resize', repositionPin);
  }, [repositionPin]);

  /* ---- savings counter ---- */
  useEffect(() => {
    const id = setInterval(() => {
      setSavings(prev => {
        const delta = (Math.random() - 0.45) * 800;
        return Math.round(Math.max(218000, Math.min(225000, prev + delta)));
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  /* ---- canvas animation ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let t = 0;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function drawGrid() {
      const w = canvas!.width;
      const h = canvas!.height;
      const horizon = h * 0.35;
      ctx.strokeStyle = 'rgba(13,42,24,0.4)';
      ctx.lineWidth = 0.5;

      // perspective lines from horizon center
      const cx = w / 2;
      for (let i = -20; i <= 20; i++) {
        ctx.beginPath();
        ctx.moveTo(cx, horizon);
        ctx.lineTo(cx + i * (w / 10), h);
        ctx.stroke();
      }
      // horizontal lines receding
      for (let i = 0; i < 20; i++) {
        const y = horizon + (h - horizon) * (i / 20);
        const spread = (y - horizon) / (h - horizon);
        ctx.globalAlpha = 0.15 + spread * 0.3;
        ctx.beginPath();
        ctx.moveTo(cx - spread * w, y);
        ctx.lineTo(cx + spread * w, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function drawSurroundBuildings() {
      const w = canvas!.width;
      const h = canvas!.height;
      const cx = w / 2;
      const cy = h * 0.38;

      for (const b of surroundBuildings) {
        const bx = cx + b.rx * w;
        const by = cy + b.ry * h;
        const bw = b.w;
        const bh = b.h;

        // front face
        ctx.fillStyle = b.color;
        ctx.fillRect(bx - bw / 2, by - bh, bw, bh);

        // side face (isometric)
        const sideW = bw * 0.3;
        ctx.fillStyle = 'rgba(2,10,6,0.7)';
        ctx.beginPath();
        ctx.moveTo(bx + bw / 2, by - bh);
        ctx.lineTo(bx + bw / 2 + sideW, by - bh - sideW * 0.5);
        ctx.lineTo(bx + bw / 2 + sideW, by - sideW * 0.5);
        ctx.lineTo(bx + bw / 2, by);
        ctx.closePath();
        ctx.fill();

        // windows
        const cols = Math.floor(bw / 10);
        const rows = Math.floor(bh / 16);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (Math.random() > 0.6) {
              ctx.fillStyle = `rgba(0,255,136,${0.02 + Math.random() * 0.06})`;
              const wx = bx - bw / 2 + 4 + c * (bw / cols);
              const wy = by - bh + 6 + r * (bh / rows);
              ctx.fillRect(wx, wy, 4, 6);
            }
          }
        }
      }
    }

    function drawCityHall(activeEcm: string | null, layerState: typeof layers) {
      const w = canvas!.width;
      const h = canvas!.height;
      const cx = w / 2;
      const cy = h * 0.38;
      const bw = w * 0.18;
      const bh = h * 0.42;
      const bx = cx - bw / 2;
      const by = cy - bh * 0.4;

      // Main building body
      ctx.fillStyle = 'rgba(8,28,16,0.95)';
      ctx.fillRect(bx, by, bw, bh);

      // Building top accent
      ctx.fillStyle = 'rgba(0,255,136,0.08)';
      ctx.fillRect(bx, by, bw, 3);

      // Side face
      const sideW = bw * 0.25;
      ctx.fillStyle = 'rgba(4,14,8,0.9)';
      ctx.beginPath();
      ctx.moveTo(bx + bw, by);
      ctx.lineTo(bx + bw + sideW, by - sideW * 0.5);
      ctx.lineTo(bx + bw + sideW, by + bh - sideW * 0.5);
      ctx.lineTo(bx + bw, by + bh);
      ctx.closePath();
      ctx.fill();

      // Zone overlays
      if (layerState.ecmZones) {
        for (const z of zones) {
          const zx = bx + bw * 0.5 + z.rx * bw;
          const zy = by + z.ry * bh;
          const zw = z.rw * bw;
          const zh = z.rh * bh;
          const color = STATUS_COLORS[z.status] || '#00ff88';
          const isActive = activeEcm === z.ecm;

          ctx.fillStyle = hexToRgba(color, isActive ? 0.25 : 0.08);
          ctx.fillRect(zx - zw / 2, zy, zw, zh);

          ctx.strokeStyle = hexToRgba(color, isActive ? 0.7 : 0.2);
          ctx.lineWidth = isActive ? 2 : 1;
          ctx.strokeRect(zx - zw / 2, zy, zw, zh);

          // zone label
          if (isActive) {
            ctx.fillStyle = hexToRgba(color, 0.9);
            ctx.font = '9px "Share Tech Mono"';
            ctx.fillText(z.label.toUpperCase(), zx - zw / 2 + 4, zy + 12);
            ctx.fillStyle = hexToRgba(color, 0.6);
            ctx.font = '8px "Share Tech Mono"';
            ctx.fillText(`${z.kw} kW  FL ${z.floors}`, zx - zw / 2 + 4, zy + 22);
          }
        }
      }

      // Windows (8 cols x 14 rows)
      const winCols = 8;
      const winRows = 14;
      const winW = 6;
      const winH = 8;
      const padX = (bw - winCols * (winW + 6)) / 2;
      const padY = 14;
      for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
          const wx = bx + padX + c * (winW + 6);
          const wy = by + padY + r * ((bh - padY * 2) / winRows);

          // determine window color based on zone
          let winColor = 'rgba(0,255,136,0.04)';
          for (const z of zones) {
            const zx = bx + bw * 0.5 + z.rx * bw;
            const zy = by + z.ry * bh;
            const zw = z.rw * bw;
            const zh = z.rh * bh;
            if (wx >= zx - zw / 2 && wx <= zx + zw / 2 && wy >= zy && wy <= zy + zh) {
              const sc = STATUS_COLORS[z.status];
              winColor = hexToRgba(sc, 0.06 + Math.random() * 0.08);
              break;
            }
          }
          ctx.fillStyle = winColor;
          ctx.fillRect(wx, wy, winW, winH);
        }
      }

      // Facade columns
      ctx.strokeStyle = 'rgba(0,255,136,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const colX = bx + (bw / 4) * i;
        ctx.beginPath();
        ctx.moveTo(colX, by);
        ctx.lineTo(colX, by + bh);
        ctx.stroke();
      }
      // horizontal bands
      for (let i = 0; i <= 3; i++) {
        const bandY = by + (bh / 3) * i;
        ctx.beginPath();
        ctx.moveTo(bx, bandY);
        ctx.lineTo(bx + bw, bandY);
        ctx.stroke();
      }

      // Sensor points
      if (layerState.sensorPoints) {
        for (const s of sensors) {
          const sx = cx + s.rx * bw * 2;
          const sy = cy + s.ry * bh;
          // glow
          const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 14);
          grad.addColorStop(0, 'rgba(0,255,136,0.4)');
          grad.addColorStop(1, 'rgba(0,255,136,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(sx - 14, sy - 14, 28, 28);
          // dot
          ctx.fillStyle = '#00ff88';
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
          // label
          ctx.fillStyle = 'rgba(0,255,136,0.7)';
          ctx.font = '8px "Share Tech Mono"';
          ctx.fillText(`${s.label}: ${s.val}`, sx + 8, sy + 3);
        }
      }

      // Reticle around building
      drawReticle(cx, cy - bh * 0.15);
    }

    function drawEnergyPulse() {
      if (!layers.heatMap) return;
      const w = canvas!.width;
      const h = canvas!.height;
      const cx = w / 2;
      const cy = h * 0.38;
      const pulse = (t % 180) / 180;

      for (let i = 0; i < 3; i++) {
        const p = (pulse + i * 0.33) % 1;
        const radius = 30 + p * 200;
        const alpha = (1 - p) * 0.15;
        ctx.strokeStyle = `rgba(0,255,136,${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 20, radius * 1.5, radius * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function drawReticle(rx: number, ry: number) {
      const size = 60;
      const corner = 12;
      ctx.strokeStyle = 'rgba(0,255,136,0.35)';
      ctx.lineWidth = 1;

      // top-left
      ctx.beginPath();
      ctx.moveTo(rx - size, ry - size + corner);
      ctx.lineTo(rx - size, ry - size);
      ctx.lineTo(rx - size + corner, ry - size);
      ctx.stroke();
      // top-right
      ctx.beginPath();
      ctx.moveTo(rx + size - corner, ry - size);
      ctx.lineTo(rx + size, ry - size);
      ctx.lineTo(rx + size, ry - size + corner);
      ctx.stroke();
      // bottom-left
      ctx.beginPath();
      ctx.moveTo(rx - size, ry + size - corner);
      ctx.lineTo(rx - size, ry + size);
      ctx.lineTo(rx - size + corner, ry + size);
      ctx.stroke();
      // bottom-right
      ctx.beginPath();
      ctx.moveTo(rx + size - corner, ry + size);
      ctx.lineTo(rx + size, ry + size);
      ctx.lineTo(rx + size, ry + size - corner);
      ctx.stroke();
    }

    function drawCoordinates() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.fillStyle = 'rgba(0,255,136,0.25)';
      ctx.font = '9px "Share Tech Mono"';
      ctx.fillText('33.7484\u00b0 N  84.3903\u00b0 W', w / 2 - 70, h * 0.38 + h * 0.42 * 0.5 + 30);
      ctx.fillText('ATLANTA CITY HALL', w / 2 - 55, h * 0.38 + h * 0.42 * 0.5 + 44);
    }

    /* capture current state for the draw loop */
    let currentActiveECM = activeECM;
    let currentLayers = layers;

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      t++;

      // sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.4);
      sky.addColorStop(0, '#010804');
      sky.addColorStop(1, '#020c06');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.4);

      // ground
      const ground = ctx.createLinearGradient(0, h * 0.35, 0, h);
      ground.addColorStop(0, '#030e07');
      ground.addColorStop(1, '#020c06');
      ctx.fillStyle = ground;
      ctx.fillRect(0, h * 0.35, w, h * 0.65);

      drawGrid();
      drawSurroundBuildings();
      drawCityHall(currentActiveECM, currentLayers);
      drawEnergyPulse();
      drawCoordinates();

      // Baseline overlay grid
      if (currentLayers.baselineOverlay) {
        ctx.strokeStyle = 'rgba(255,170,0,0.06)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < w; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    // Sync state into draw loop closure
    currentActiveECM = activeECM;
    currentLayers = layers;

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, [activeECM, layers]);

  const savingsStr = `$${Math.floor(savings / 1000)}K`;

  return (
    <div className="demo-root">
      <canvas ref={canvasRef} className="demo-canvas" />

      {/* Scan sweep line */}
      <div className="demo-scan-line" />

      {/* Top nav */}
      <div className="demo-topnav">
        <div className="demo-topnav-left">
          <div className="demo-topnav-logo">VANTAGE</div>
          <div className="demo-topnav-divider" />
          <div className="demo-topnav-contract">
            <span>ESCO: <span className="val">AMERESCO INC.</span></span>
            <span>CONTRACT: <span className="val">$4,200,000</span></span>
            <span>TERM: <span className="val">15 YEARS</span></span>
            <span>YEAR: <span className="val">3 OF 15</span></span>
            <span>DSCR: <span className="val amber">1.04 WATCH</span></span>
            <span>GUARANTEED: <span className="val">$312,000/yr</span></span>
            <span>VERIFIED YTD: <span className="val amber">{savingsStr}</span></span>
          </div>
        </div>
        <div className="demo-topnav-right">
          <div className="live-dot" />
          <span>LIVE</span>
        </div>
      </div>

      {/* Left panel — ECM Performance */}
      <div className="demo-left-panel">
        <div className="demo-panel-header">ECM PERFORMANCE</div>
        {ecmList.map(ecm => (
          <div
            key={ecm.id}
            className={`demo-ecm-item${activeECM === ecm.id ? ' active' : ''}`}
            onClick={() => setActiveECM(activeECM === ecm.id ? null : ecm.id)}
          >
            <div className="ecm-row">
              <span className="ecm-label" style={{ color: STATUS_COLORS[ecm.status] }}>{ecm.label}</span>
              <span className="ecm-pct" style={{ color: STATUS_COLORS[ecm.status] }}>{ecm.pct}%</span>
            </div>
            <div className="ecm-bar">
              <div
                className="ecm-bar-fill"
                style={{
                  width: `${Math.min(ecm.pct, 100)}%`,
                  background: STATUS_COLORS[ecm.status],
                }}
              />
            </div>
            <div className="ecm-detail">{ecm.detail}</div>
          </div>
        ))}
      </div>

      {/* Right panel — Performance Snapshot + Alerts */}
      <div className="demo-right-panel">
        <div className="demo-panel-header">PERFORMANCE SNAPSHOT</div>
        <div className="demo-metrics-grid">
          <div className="demo-metric">
            <div className="metric-label">VERIFIED SAVINGS</div>
            <div className="metric-value" style={{ color: '#ffaa00' }}>{savingsStr}</div>
            <div className="metric-sub">of $312K target</div>
          </div>
          <div className="demo-metric">
            <div className="metric-label">SHORTFALL</div>
            <div className="metric-value" style={{ color: '#ff4444' }}>$90.6K</div>
            <div className="metric-sub">YTD exposure</div>
          </div>
          <div className="demo-metric">
            <div className="metric-label">ECMs ON TRACK</div>
            <div className="metric-value" style={{ color: '#00ff88' }}>4/6</div>
            <div className="metric-sub">&nbsp;</div>
          </div>
          <div className="demo-metric">
            <div className="metric-label">DSCR</div>
            <div className="metric-value" style={{ color: '#ffaa00' }}>1.04</div>
            <div className="metric-sub">min 1.0 required</div>
          </div>
        </div>

        <div className="demo-panel-header">ALERT FEED</div>
        <div className="demo-alert-feed">
          {alerts.map((a, i) => (
            <div key={i} className="demo-alert-item">
              <div className="alert-header">
                <div className="alert-dot" style={{ background: STATUS_COLORS[a.status] }} />
                <div className="alert-title" style={{ color: STATUS_COLORS[a.status] }}>{a.title}</div>
              </div>
              <div className="alert-body">{a.body}</div>
              <div className="alert-time">{a.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Building pin */}
      <div className="demo-building-pin" ref={pinRef}>
        <div className="pin-label">ATLANTA CITY HALL &mdash; ESPC CONTRACT</div>
        <div className="pin-line" />
        <div className="pin-dot" />
      </div>

      {/* Layer controls */}
      <div className="demo-layers">
        <button className={`demo-layer-btn${layers.heatMap ? ' on' : ''}`} onClick={() => toggleLayer('heatMap')}>
          Energy Heat Map
        </button>
        <button className={`demo-layer-btn${layers.ecmZones ? ' on' : ''}`} onClick={() => toggleLayer('ecmZones')}>
          ECM Zones
        </button>
        <button className={`demo-layer-btn${layers.sensorPoints ? ' on' : ''}`} onClick={() => toggleLayer('sensorPoints')}>
          Sensor Points
        </button>
        <button className={`demo-layer-btn${layers.baselineOverlay ? ' on' : ''}`} onClick={() => toggleLayer('baselineOverlay')}>
          Baseline Overlay
        </button>
      </div>

      {/* Bottom timeline */}
      <div className="demo-timeline">
        <div className="demo-timeline-label">CONTRACT YEAR 3</div>
        <div className="demo-timeline-months">
          {months.map((m, i) => (
            <div
              key={m}
              className={`demo-timeline-month${i === 3 ? ' active' : i < 3 ? ' past' : ''}`}
            >
              {m}
            </div>
          ))}
        </div>
        <div className="demo-timeline-progress">68%</div>
      </div>
    </div>
  );
}

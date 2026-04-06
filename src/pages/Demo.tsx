import React, { useRef, useEffect, useState, useCallback } from 'react';

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

interface ZoneData {
  id: string;
  label: string;
  ecm: string;
  floors: string;
  rx: number;
  ry: number;
  rw: number;
  rh: number;
  status: string;
  kw: number;
  baselineKw: number;
}

const zones: ZoneData[] = [
  { id: 'main-tower', label: 'Main Tower', ecm: 'envelope', floors: '1\u20138', rx: 0, ry: 0, rw: 0.18, rh: 0.55, status: 'red', kw: 18.4, baselineKw: 24.2 },
  { id: 'annex-north', label: 'North Annex', ecm: 'hvac', floors: '1\u20134', rx: 0.19, ry: 0.12, rw: 0.11, rh: 0.32, status: 'amber', kw: 14.1, baselineKw: 18.8 },
  { id: 'council', label: 'Council Chambers', ecm: 'lighting', floors: '1\u20132', rx: -0.15, ry: 0.28, rw: 0.14, rh: 0.18, status: 'green', kw: 6.2, baselineKw: 11.4 },
  { id: 'mechanical', label: 'Mechanical', ecm: 'bms', floors: 'B1\u2013B2', rx: 0.02, ry: 0.58, rw: 0.16, rh: 0.1, status: 'green', kw: 22.8, baselineKw: 31.0 },
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

const ecmListBase: ECMItem[] = [
  { id: 'hvac', label: 'HVAC Retrofit', pct: 71, status: 'amber', detail: 'drift -$18,400' },
  { id: 'lighting', label: 'LED Lighting', pct: 97, status: 'green', detail: 'on track +$2,100' },
  { id: 'bms', label: 'BMS Controls', pct: 103, status: 'green', detail: 'outperforming +$4,800' },
  { id: 'envelope', label: 'Building Envelope', pct: 52, status: 'red', detail: 'shortfall -$31,200' },
  { id: 'water', label: 'Water Conservation', pct: 88, status: 'green', detail: 'minor drift -$1,900' },
  { id: 'solar', label: 'Solar PV', pct: 94, status: 'green', detail: '148,200 kWh YTD' },
];

const baseAlerts = [
  { status: 'red', title: 'BUILDING ENVELOPE DRIFT', body: 'Insulation ECM 48% below guaranteed baseline. ESCO notified.', time: 'TODAY 06:14', driftMonth: 6 },
  { status: 'amber', title: 'HVAC CHILLER UNDERPERFORM', body: 'Unit 3 runtime 22% over baseline.', time: 'TODAY 02:31', driftMonth: 3 },
  { status: 'green', title: 'M&V REPORT GENERATED', body: 'March 2026 savings verification complete.', time: 'YESTERDAY 23:58', driftMonth: -1 },
  { status: 'green', title: 'BMS CONTROLS OUTPERFORM', body: 'Scheduling optimization yielding 3% above.', time: 'APR 4 09:12', driftMonth: -1 },
];

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ---- Historical ECM data by month ---- */
interface MonthSnapshot {
  ecms: { id: string; pct: number; status: 'green' | 'amber' | 'red'; detail: string }[];
  zoneStatuses: Record<string, string>;
  savings: number;
  shortfall: string;
  dscr: string;
  onTrack: string;
}

function getStatusForPct(pct: number): 'green' | 'amber' | 'red' {
  if (pct >= 85) return 'green';
  if (pct >= 65) return 'amber';
  return 'red';
}

function buildMonthData(month: number): MonthSnapshot {
  // HVAC: Jan-Mar 95%, Apr 85, May 78, Jun 74, Jul+ 71
  const hvacPcts = [95, 95, 96, 85, 78, 74, 71, 71, 71, 71, 71, 71];
  // Envelope: Jan-Jun ~92%, Jul 68, Aug 58, Sep+ 52
  const envPcts = [94, 93, 92, 91, 90, 89, 68, 58, 52, 52, 52, 52];
  // Others stay mostly stable
  const lightPcts = [96, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97];
  const bmsPcts = [100, 101, 102, 103, 103, 103, 103, 103, 103, 103, 103, 103];
  const waterPcts = [90, 90, 89, 89, 88, 88, 88, 88, 88, 88, 88, 88];
  const solarPcts = [88, 90, 92, 93, 94, 95, 96, 95, 94, 93, 92, 91];

  const hp = hvacPcts[month];
  const ep = envPcts[month];
  const lp = lightPcts[month];
  const bp = bmsPcts[month];
  const wp = waterPcts[month];
  const sp = solarPcts[month];

  const ecms = [
    { id: 'hvac', pct: hp, status: getStatusForPct(hp), detail: hp >= 85 ? `on track +$${Math.round((hp-85)*200)}` : `drift -$${Math.round((85-hp)*1100)}` },
    { id: 'lighting', pct: lp, status: getStatusForPct(lp), detail: `on track +$${Math.round((lp-85)*175)}` },
    { id: 'bms', pct: bp, status: getStatusForPct(bp), detail: `outperforming +$${Math.round((bp-95)*600)}` },
    { id: 'envelope', pct: ep, status: getStatusForPct(ep), detail: ep >= 85 ? `on track +$${Math.round((ep-85)*300)}` : `shortfall -$${Math.round((85-ep)*960)}` },
    { id: 'water', pct: wp, status: getStatusForPct(wp), detail: wp >= 85 ? `on track +$${Math.round((wp-85)*380)}` : `drift -$${Math.round((85-wp)*380)}` },
    { id: 'solar', pct: sp, status: getStatusForPct(sp), detail: `${Math.round(sp * 1577)} kWh YTD` },
  ] as MonthSnapshot['ecms'];

  const greenCount = ecms.filter(e => e.status === 'green').length;
  const avgPct = (hp + lp + bp + ep + wp + sp) / 6;
  const totalSavings = Math.round(312000 * (avgPct / 100));
  const shortfall = Math.max(0, 312000 - totalSavings);

  return {
    ecms,
    zoneStatuses: {
      envelope: getStatusForPct(ep),
      hvac: getStatusForPct(hp),
      lighting: getStatusForPct(lp),
      bms: getStatusForPct(bp),
    },
    savings: totalSavings,
    shortfall: shortfall > 0 ? `$${(shortfall / 1000).toFixed(1)}K` : '$0',
    dscr: (totalSavings / 300000).toFixed(2),
    onTrack: `${greenCount}/6`,
  };
}

/* ---- Weather data by month (Atlanta) ---- */
interface WeatherData {
  temp: number;
  humidity: number;
  hdd: number;
  cdd: number;
  wind: number;
  conditions: string;
}

const monthlyWeather: WeatherData[] = [
  { temp: 42, humidity: 58, hdd: 24, cdd: 0, wind: 10, conditions: 'OVERCAST' },
  { temp: 46, humidity: 55, hdd: 20, cdd: 0, wind: 9, conditions: 'PARTLY CLOUDY' },
  { temp: 55, humidity: 52, hdd: 10, cdd: 2, wind: 8, conditions: 'CLEAR' },
  { temp: 65, humidity: 56, hdd: 3, cdd: 6, wind: 7, conditions: 'CLEAR' },
  { temp: 74, humidity: 62, hdd: 0, cdd: 10, wind: 6, conditions: 'PARTLY CLOUDY' },
  { temp: 82, humidity: 68, hdd: 0, cdd: 16, wind: 5, conditions: 'HAZY' },
  { temp: 88, humidity: 72, hdd: 0, cdd: 22, wind: 4, conditions: 'HOT / CLEAR' },
  { temp: 86, humidity: 70, hdd: 0, cdd: 20, wind: 5, conditions: 'HUMID' },
  { temp: 78, humidity: 64, hdd: 0, cdd: 12, wind: 8, conditions: 'CLEAR' },
  { temp: 65, humidity: 54, hdd: 4, cdd: 4, wind: 9, conditions: 'COOL' },
  { temp: 50, humidity: 56, hdd: 16, cdd: 0, wind: 10, conditions: 'OVERCAST' },
  { temp: 43, humidity: 60, hdd: 22, cdd: 0, wind: 11, conditions: 'COLD / RAIN' },
];

/* ---- Particle type ---- */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  phase: number;
}

/* ---- Timeline weather markers ---- */
const weatherMarkers: Record<number, string> = { 0: '\u2744', 6: '\uD83C\uDF21', 7: '\uD83C\uDF21' };

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
  const particlesRef = useRef<Particle[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastDriftFlashRef = useRef<number>(-1);
  const driftFlashActiveRef = useRef<{ zone: string; startTime: number; text: string } | null>(null);
  const godModeFlashRef = useRef<number>(0);
  const godModePrevLayersRef = useRef<Record<string, boolean> | null>(null);
  const hoverZoneRef = useRef<string | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isHoveringBuildingRef = useRef(false);
  const weatherFluctuationRef = useRef<{ temp: number; humidity: number; wind: number }>({ temp: 0, humidity: 0, wind: 0 });
  const taglineOpacityRef = useRef(0);
  const taglinePulseRef = useRef(0);
  const particleBurstRef = useRef(0);

  const [activeECM, setActiveECM] = useState<string | null>(null);
  const [layers, setLayers] = useState({
    heatMap: true,
    ecmZones: true,
    sensorPoints: true,
    baselineOverlay: false,
    weatherCorrelation: false,
    energyFlow: false,
  });
  const [godMode, setGodMode] = useState(false);
  const [savings, setSavings] = useState(221400);
  const [currentMonth, setCurrentMonth] = useState(8); // Sep = current
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [godModeOverlayVisible, setGodModeOverlayVisible] = useState(false);
  const [taglineFadedIn, setTaglineFadedIn] = useState(false);

  // Computed state from timeline
  const monthData = buildMonthData(currentMonth);
  const weather = monthlyWeather[currentMonth];

  const toggleLayer = useCallback((key: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Tagline fade-in
  useEffect(() => {
    const timer = setTimeout(() => setTaglineFadedIn(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // God Mode toggle
  const toggleGodMode = useCallback(() => {
    setGodMode(prev => {
      const next = !prev;
      if (next) {
        // Save current layer state, activate all
        godModePrevLayersRef.current = { ...layers };
        setLayers({
          heatMap: true,
          ecmZones: true,
          sensorPoints: true,
          baselineOverlay: true,
          weatherCorrelation: true,
          energyFlow: true,
        });
        setGodModeOverlayVisible(true);
        godModeFlashRef.current = performance.now();
        taglinePulseRef.current = performance.now();
        particleBurstRef.current = performance.now();
        setTimeout(() => setGodModeOverlayVisible(false), 2500);
      } else {
        // Restore previous layer state
        if (godModePrevLayersRef.current) {
          setLayers(godModePrevLayersRef.current as typeof layers);
          godModePrevLayersRef.current = null;
        }
      }
      return next;
    });
  }, [layers]);

  // Play/Pause timeline
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCurrentMonth(prev => {
        const next = prev + 1;
        if (next > 11) {
          setIsPlaying(false);
          return 11;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying]);

  // Check for drift events when month changes
  useEffect(() => {
    // HVAC drift at month 3 (April), Envelope drift at month 6 (July)
    const driftEvents: Record<number, { zone: string; text: string }> = {
      3: { zone: 'hvac', text: 'HVAC DRIFT DETECTED' },
      6: { zone: 'envelope', text: 'ENVELOPE DRIFT DETECTED' },
    };
    const event = driftEvents[currentMonth];
    if (event && lastDriftFlashRef.current !== currentMonth) {
      lastDriftFlashRef.current = currentMonth;
      driftFlashActiveRef.current = { zone: event.zone, startTime: performance.now(), text: event.text };
      // Play alert ping
      playAlertPing();
    }
  }, [currentMonth]);

  // Web Audio API alert ping
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
  }, []);

  const playAlertPing = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 400;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }, []);

  // Timeline dragging
  const handleTimelineMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    initAudio();
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const month = Math.max(0, Math.min(11, Math.floor((x / rect.width) * 12)));
    setCurrentMonth(month);
  }, [initAudio]);

  const handleTimelineMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const month = Math.max(0, Math.min(11, Math.floor((x / rect.width) * 12)));
    setCurrentMonth(month);
  }, [isDragging]);

  const handleTimelineMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Replay drift event from alert
  const replayDrift = useCallback((driftMonth: number) => {
    if (driftMonth < 0) return;
    lastDriftFlashRef.current = -1; // Reset so flash triggers again
    setCurrentMonth(driftMonth);
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
        --purple: #aa44ff;
        --cyan: #00ccff;
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

      /* ---------- sousveillance tagline ---------- */
      .demo-sousveillance {
        position: absolute;
        top: 50px;
        left: 0; right: 0;
        text-align: center;
        z-index: 10;
        font-family: 'Share Tech Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.4em;
        pointer-events: none;
        transition: opacity 1.5s ease;
      }

      /* ---------- weather bar ---------- */
      .demo-weather-bar {
        position: absolute;
        top: 48px;
        left: 0; right: 0;
        height: 28px;
        background: rgba(2,12,6,0.88);
        border-bottom: 1px solid var(--grid);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 28px;
        z-index: 10;
        font-size: 9px;
        letter-spacing: 0.1em;
        backdrop-filter: blur(8px);
      }
      .demo-weather-bar .wx-label {
        color: var(--text-dim);
      }
      .demo-weather-bar .wx-val {
        color: #44aaff;
      }

      /* ---------- playback badge ---------- */
      .demo-playback-badge {
        position: absolute;
        top: 56px;
        right: 16px;
        padding: 4px 12px;
        font-size: 9px;
        letter-spacing: 0.15em;
        color: var(--amber);
        background: rgba(255,170,0,0.08);
        border: 1px solid rgba(255,170,0,0.3);
        z-index: 12;
        pointer-events: none;
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
        max-height: calc(100vh - 130px);
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
      .demo-ecm-item.highlight-hover {
        background: rgba(0,255,136,0.1);
        border-left: 2px solid var(--green);
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
        max-height: calc(100vh - 130px);
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
        transition: color 0.3s;
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
      .demo-alert-replay {
        margin-left: 12px;
        margin-top: 4px;
        font-size: 8px;
        letter-spacing: 0.08em;
        color: var(--amber);
        background: rgba(255,170,0,0.06);
        border: 1px solid rgba(255,170,0,0.2);
        padding: 2px 8px;
        cursor: pointer;
        font-family: 'Share Tech Mono', monospace;
        transition: all 0.2s;
      }
      .demo-alert-replay:hover {
        background: rgba(255,170,0,0.15);
        border-color: var(--amber);
      }

      /* ---------- layer controls ---------- */
      .demo-layers {
        position: absolute;
        bottom: 72px; left: 12px;
        display: flex; gap: 6px;
        flex-wrap: wrap;
        max-width: 600px;
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
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .demo-layer-btn.on {
        border-color: var(--green);
        color: var(--green);
        background: var(--green-dim);
      }
      .demo-layer-btn.god-on {
        border-color: var(--amber);
        color: var(--amber);
        background: rgba(255,170,0,0.08);
      }
      .demo-layer-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .demo-god-btn {
        padding: 6px 14px;
        font-family: 'Share Tech Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.12em;
        background: rgba(255,170,0,0.06);
        border: 1px solid rgba(255,170,0,0.3);
        color: var(--amber);
        border-radius: 3px;
        cursor: pointer;
        backdrop-filter: blur(8px);
        transition: all 0.2s;
        font-weight: 700;
      }
      .demo-god-btn.active {
        background: rgba(255,170,0,0.15);
        border-color: var(--amber);
        box-shadow: 0 0 12px rgba(255,170,0,0.2);
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
        height: 60px;
        background: var(--panel-bg);
        border-top: 1px solid var(--grid);
        display: flex; align-items: center;
        padding: 0 20px;
        z-index: 10;
        backdrop-filter: blur(12px);
        gap: 12px;
      }
      .demo-timeline-label {
        font-size: 9px; letter-spacing: 0.1em;
        color: var(--text-dim);
        white-space: nowrap;
      }
      .demo-timeline-play {
        width: 28px; height: 28px;
        display: flex; align-items: center; justify-content: center;
        background: var(--dark-2);
        border: 1px solid var(--grid);
        color: var(--green);
        font-size: 12px;
        cursor: pointer;
        border-radius: 3px;
        font-family: 'Share Tech Mono', monospace;
        transition: all 0.2s;
        flex-shrink: 0;
      }
      .demo-timeline-play:hover {
        border-color: var(--green);
        background: var(--green-dim);
      }
      .demo-timeline-track {
        flex: 1;
        height: 36px;
        position: relative;
        cursor: pointer;
        user-select: none;
      }
      .demo-timeline-track-bg {
        position: absolute;
        top: 14px;
        left: 0; right: 0;
        height: 6px;
        border-radius: 3px;
        overflow: hidden;
      }
      .demo-timeline-track-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s;
      }
      .demo-timeline-thumb {
        position: absolute;
        top: 10px;
        width: 3px;
        height: 14px;
        background: #fff;
        border-radius: 2px;
        transition: left 0.15s;
        box-shadow: 0 0 8px rgba(255,255,255,0.4);
        pointer-events: none;
      }
      .demo-timeline-months {
        position: absolute;
        top: 24px;
        left: 0; right: 0;
        display: flex;
      }
      .demo-timeline-month {
        flex: 1;
        text-align: center;
        font-size: 7px;
        letter-spacing: 0.06em;
        color: var(--text-dim);
        transition: color 0.2s;
        position: relative;
      }
      .demo-timeline-month.active {
        color: var(--green);
        font-weight: 700;
      }
      .demo-timeline-month.past {
        color: var(--text-dim);
      }
      .demo-timeline-wx-marker {
        position: absolute;
        top: -14px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 10px;
        pointer-events: none;
      }
      .demo-timeline-current-label {
        font-size: 11px;
        color: var(--green);
        font-weight: 700;
        letter-spacing: 0.1em;
        white-space: nowrap;
        min-width: 36px;
        text-align: center;
      }
      .demo-timeline-progress {
        width: 50px; text-align: right;
        font-size: 11px; color: var(--amber); font-weight: 700;
        white-space: nowrap;
      }

      /* ---------- god mode overlay ---------- */
      .demo-god-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 20;
        pointer-events: none;
        animation: god-fade 2.5s ease forwards;
      }
      .demo-god-overlay .god-line1 {
        font-family: 'Share Tech Mono', monospace;
        font-size: 14px;
        letter-spacing: 0.4em;
        color: var(--amber);
        margin-bottom: 8px;
      }
      .demo-god-overlay .god-line2 {
        font-family: 'Share Tech Mono', monospace;
        font-size: 10px;
        letter-spacing: 0.3em;
        color: rgba(255,170,0,0.6);
      }
      @keyframes god-fade {
        0% { opacity: 0; }
        15% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; }
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

  /* ---- weather fluctuation ---- */
  useEffect(() => {
    const id = setInterval(() => {
      weatherFluctuationRef.current = {
        temp: (Math.random() - 0.5) * 4,
        humidity: (Math.random() - 0.5) * 6,
        wind: (Math.random() - 0.5) * 3,
      };
    }, 3000);
    return () => clearInterval(id);
  }, []);

  /* ---- mouse tracking for hover intel ---- */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };

      // Check if hovering building
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h * 0.38;
      const bw = w * 0.18;
      const bh = h * 0.42;
      const bx = cx - bw / 2;
      const by = cy - bh * 0.4;

      const mx = e.clientX;
      const my = e.clientY;
      isHoveringBuildingRef.current = mx >= bx && mx <= bx + bw && my >= by && my <= by + bh;

      // Check zone hover
      let foundZone: string | null = null;
      for (const z of zones) {
        const zx = bx + bw * 0.5 + z.rx * bw;
        const zy = by + z.ry * bh;
        const zw = z.rw * bw;
        const zh = z.rh * bh;
        if (mx >= zx - zw / 2 && mx <= zx + zw / 2 && my >= zy && my <= zy + zh) {
          foundZone = z.ecm;
          break;
        }
      }
      hoverZoneRef.current = foundZone;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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

      const cx = w / 2;
      for (let i = -20; i <= 20; i++) {
        ctx.beginPath();
        ctx.moveTo(cx, horizon);
        ctx.lineTo(cx + i * (w / 10), h);
        ctx.stroke();
      }
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

        ctx.fillStyle = b.color;
        ctx.fillRect(bx - bw / 2, by - bh, bw, bh);

        const sideW = bw * 0.3;
        ctx.fillStyle = 'rgba(2,10,6,0.7)';
        ctx.beginPath();
        ctx.moveTo(bx + bw / 2, by - bh);
        ctx.lineTo(bx + bw / 2 + sideW, by - bh - sideW * 0.5);
        ctx.lineTo(bx + bw / 2 + sideW, by - sideW * 0.5);
        ctx.lineTo(bx + bw / 2, by);
        ctx.closePath();
        ctx.fill();

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

    function drawBaselineGhost(layerState: typeof layers) {
      if (!layerState.baselineOverlay) return;
      const w = canvas!.width;
      const h = canvas!.height;
      const cx = w / 2;
      const cy = h * 0.38;
      const bw = w * 0.18;
      const bh = h * 0.42;
      const bx = cx - bw / 2;
      const by = cy - bh * 0.4;

      const offsetX = 8;
      const offsetY = -8;

      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = '#aa44ff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(bx + offsetX, by + offsetY, bw, bh);

      // Side face ghost
      const sideW = bw * 0.25;
      ctx.beginPath();
      ctx.moveTo(bx + bw + offsetX, by + offsetY);
      ctx.lineTo(bx + bw + sideW + offsetX, by - sideW * 0.5 + offsetY);
      ctx.lineTo(bx + bw + sideW + offsetX, by + bh - sideW * 0.5 + offsetY);
      ctx.lineTo(bx + bw + offsetX, by + bh + offsetY);
      ctx.closePath();
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#aa44ff';
      ctx.font = '8px "Share Tech Mono"';
      ctx.fillText('PRE-RETROFIT BASELINE', bx + offsetX, by + offsetY - 6);
      ctx.restore();
    }

    function drawCityHall(activeEcm: string | null, layerState: typeof layers, snapshot: MonthSnapshot, now: number) {
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

      // Weather correlation tint on HVAC zone
      if (layerState.weatherCorrelation) {
        const wTemp = monthlyWeather[currentMonth].temp;
        // Warm = amber tint on HVAC, cold = blue tint
        if (wTemp > 75) {
          const intensity = Math.min(0.12, (wTemp - 75) / 100);
          ctx.fillStyle = `rgba(255,170,0,${intensity})`;
          ctx.fillRect(bx, by, bw, bh);
        } else if (wTemp < 50) {
          const intensity = Math.min(0.1, (50 - wTemp) / 200);
          ctx.fillStyle = `rgba(68,170,255,${intensity})`;
          ctx.fillRect(bx, by, bw, bh);
        }
      }

      // Zone overlays
      if (layerState.ecmZones) {
        for (const z of zones) {
          const zx = bx + bw * 0.5 + z.rx * bw;
          const zy = by + z.ry * bh;
          const zw = z.rw * bw;
          const zh = z.rh * bh;
          const zoneStatus = snapshot.zoneStatuses[z.ecm] || z.status;
          const color = STATUS_COLORS[zoneStatus] || '#00ff88';
          const isActive = activeEcm === z.ecm;
          const isHovered = hoverZoneRef.current === z.ecm;

          // Anomaly pulsing for drift/critical zones
          let pulseAlpha = 0;
          if (zoneStatus === 'amber' || zoneStatus === 'red') {
            pulseAlpha = Math.sin(now / 1000) * 0.5 + 0.5; // 0..1 over ~2s
          }

          const baseAlpha = isActive || isHovered ? 0.25 : 0.08;
          const fillAlpha = zoneStatus !== 'green' ? baseAlpha * (0.5 + pulseAlpha * 0.5) : baseAlpha;
          ctx.fillStyle = hexToRgba(color, fillAlpha);
          ctx.fillRect(zx - zw / 2, zy, zw, zh);

          const strokeAlpha = isActive || isHovered ? 0.7 : 0.2;
          ctx.strokeStyle = hexToRgba(color, zoneStatus !== 'green' ? strokeAlpha * (0.5 + pulseAlpha * 0.5) : strokeAlpha);
          ctx.lineWidth = isActive || isHovered ? 2 : 1;
          ctx.strokeRect(zx - zw / 2, zy, zw, zh);

          // Zone label
          if (isActive) {
            ctx.fillStyle = hexToRgba(color, 0.9);
            ctx.font = '9px "Share Tech Mono"';
            ctx.fillText(z.label.toUpperCase(), zx - zw / 2 + 4, zy + 12);
            ctx.fillStyle = hexToRgba(color, 0.6);
            ctx.font = '8px "Share Tech Mono"';
            ctx.fillText(`${z.kw} kW  FL ${z.floors}`, zx - zw / 2 + 4, zy + 22);
          }

          // Hover intel reticle
          if (isHovered && !isActive) {
            drawZoneReticle(zx, zy + zh / 2, zw / 2 + 4, zh / 2 + 4, color, now);
            // Draw tooltip
            const ttX = zx + zw / 2 + 8;
            const ttY = zy;
            const variance = ((z.kw - z.baselineKw) / z.baselineKw * 100).toFixed(1);
            ctx.fillStyle = 'rgba(2,12,6,0.94)';
            ctx.fillRect(ttX, ttY, 150, 68);
            ctx.strokeStyle = hexToRgba(color, 0.5);
            ctx.lineWidth = 1;
            ctx.strokeRect(ttX, ttY, 150, 68);

            ctx.fillStyle = hexToRgba(color, 0.9);
            ctx.font = '9px "Share Tech Mono"';
            ctx.fillText(z.label.toUpperCase(), ttX + 6, ttY + 13);
            ctx.fillStyle = '#c8f0d8';
            ctx.font = '8px "Share Tech Mono"';
            ctx.fillText(`Current: ${z.kw} kWh/sqft`, ttX + 6, ttY + 26);
            ctx.fillText(`Baseline: ${z.baselineKw} kWh/sqft`, ttX + 6, ttY + 38);
            ctx.fillStyle = hexToRgba(color, 0.8);
            ctx.fillText(`Variance: ${variance}%`, ttX + 6, ttY + 50);
            ctx.fillStyle = '#4a7a5a';
            ctx.fillText(`ECM: ${z.ecm.toUpperCase()} | ${zoneStatus.toUpperCase()}`, ttX + 6, ttY + 62);
          }

          // Drift flash event
          if (driftFlashActiveRef.current && driftFlashActiveRef.current.zone === z.ecm) {
            const elapsed = now - driftFlashActiveRef.current.startTime;
            if (elapsed < 400) {
              // White flash → status color
              const progress = elapsed / 400;
              const flashAlpha = 1 - progress;
              ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.5})`;
              ctx.fillRect(zx - zw / 2, zy, zw, zh);
            }
            if (elapsed < 2000) {
              // "DRIFT DETECTED" text
              const textAlpha = elapsed < 400 ? 1 : Math.max(0, 1 - (elapsed - 400) / 1600);
              ctx.fillStyle = `rgba(255,255,255,${textAlpha})`;
              ctx.font = 'bold 11px "Share Tech Mono"';
              ctx.fillText(driftFlashActiveRef.current.text, zx - zw / 2 - 10, zy + zh / 2);
            } else {
              driftFlashActiveRef.current = null;
            }
          }
        }
      }

      // Windows
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

          let winColor = 'rgba(0,255,136,0.04)';
          for (const z of zones) {
            const zx = bx + bw * 0.5 + z.rx * bw;
            const zy = by + z.ry * bh;
            const zw = z.rw * bw;
            const zh = z.rh * bh;
            if (wx >= zx - zw / 2 && wx <= zx + zw / 2 && wy >= zy && wy <= zy + zh) {
              const zoneStatus = snapshot.zoneStatuses[z.ecm] || z.status;
              const sc = STATUS_COLORS[zoneStatus];
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
          const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 14);
          grad.addColorStop(0, 'rgba(0,255,136,0.4)');
          grad.addColorStop(1, 'rgba(0,255,136,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(sx - 14, sy - 14, 28, 28);
          ctx.fillStyle = '#00ff88';
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(0,255,136,0.7)';
          ctx.font = '8px "Share Tech Mono"';
          ctx.fillText(`${s.label}: ${s.val}`, sx + 8, sy + 3);
        }
      }

      // Reticle around building
      const reticleSize = godMode ? bw * 0.6 : 60;
      drawReticle(cx, cy - bh * 0.15, reticleSize);
    }

    function drawZoneReticle(cx: number, cy: number, halfW: number, halfH: number, color: string, now: number) {
      const corner = 8;
      const pulse = Math.sin(now / 300) * 2;
      const w2 = halfW + pulse;
      const h2 = halfH + pulse;
      ctx.strokeStyle = hexToRgba(color, 0.7);
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(cx - w2, cy - h2 + corner);
      ctx.lineTo(cx - w2, cy - h2);
      ctx.lineTo(cx - w2 + corner, cy - h2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + w2 - corner, cy - h2);
      ctx.lineTo(cx + w2, cy - h2);
      ctx.lineTo(cx + w2, cy - h2 + corner);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - w2, cy + h2 - corner);
      ctx.lineTo(cx - w2, cy + h2);
      ctx.lineTo(cx - w2 + corner, cy + h2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + w2 - corner, cy + h2);
      ctx.lineTo(cx + w2, cy + h2);
      ctx.lineTo(cx + w2, cy + h2 - corner);
      ctx.stroke();
    }

    function drawEnergyPulse(layerState: typeof layers) {
      if (!layerState.heatMap) return;
      const w = canvas!.width;
      const h = canvas!.height;
      const cx = w / 2;
      const cy = h * 0.38;
      const pulse = (t % 180) / 180;

      // Ring color matches overall performance
      const avgPct = monthData.ecms.reduce((s, e) => s + e.pct, 0) / monthData.ecms.length;
      const ringColor = avgPct >= 85 ? '#00ff88' : avgPct >= 65 ? '#ffaa00' : '#ff4444';

      for (let i = 0; i < 3; i++) {
        const p = (pulse + i * 0.33) % 1;
        const radius = 30 + p * 200;
        const alpha = (1 - p) * 0.15;
        ctx.strokeStyle = hexToRgba(ringColor, alpha);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 20, radius * 1.5, radius * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function drawEnergyParticles(layerState: typeof layers, snapshot: MonthSnapshot, now: number) {
      if (!layerState.energyFlow) return;
      const w = canvas!.width;
      const h = canvas!.height;
      const cx = w / 2;
      const cy = h * 0.38;
      const bh = h * 0.42;
      const baseY = cy + bh * 0.3;

      const particles = particlesRef.current;

      // Target count
      const isBurst = particleBurstRef.current > 0 && (now - particleBurstRef.current) < 3000;
      const baseCount = isHoveringBuildingRef.current ? 80 : (isBurst ? 150 : 50);
      const speedMultiplier = isHoveringBuildingRef.current ? 1.8 : (isBurst ? 2.5 : 1);

      // Spawn particles
      while (particles.length < baseCount) {
        const zoneIdx = Math.floor(Math.random() * zones.length);
        const z = zones[zoneIdx];
        const zoneStatus = snapshot.zoneStatuses[z.ecm] || z.status;
        const color = STATUS_COLORS[zoneStatus] || '#00ff88';

        particles.push({
          x: cx + (Math.random() - 0.5) * w * 0.16,
          y: baseY + Math.random() * 20,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -(0.5 + Math.random() * 1.5) * speedMultiplier,
          life: 0,
          maxLife: 60 + Math.random() * 60,
          color,
          phase: Math.random() * Math.PI * 2,
        });
      }

      // Update and draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        if (p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        // Arc motion with sin/cos
        p.x += p.vx + Math.sin(p.life * 0.08 + p.phase) * 0.5;
        p.y += p.vy + Math.cos(p.life * 0.06 + p.phase) * 0.3;

        const alpha = Math.min(1, (1 - p.life / p.maxLife)) * 0.7;
        ctx.fillStyle = hexToRgba(p.color, alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawReticle(rx: number, ry: number, size = 60) {
      const corner = size > 80 ? 20 : 12;
      ctx.strokeStyle = 'rgba(0,255,136,0.35)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(rx - size, ry - size + corner);
      ctx.lineTo(rx - size, ry - size);
      ctx.lineTo(rx - size + corner, ry - size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx + size - corner, ry - size);
      ctx.lineTo(rx + size, ry - size);
      ctx.lineTo(rx + size, ry - size + corner);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx - size, ry + size - corner);
      ctx.lineTo(rx - size, ry + size);
      ctx.lineTo(rx - size + corner, ry + size);
      ctx.stroke();
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
    let currentMonthData = monthData;

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      const now = performance.now();
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
      drawBaselineGhost(currentLayers);
      drawCityHall(currentActiveECM, currentLayers, currentMonthData, now);
      drawEnergyPulse(currentLayers);
      drawEnergyParticles(currentLayers, currentMonthData, now);
      drawCoordinates();

      frameRef.current = requestAnimationFrame(draw);
    }

    // Sync state into draw loop closure
    currentActiveECM = activeECM;
    currentLayers = layers;
    currentMonthData = monthData;

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, [activeECM, layers, monthData, godMode, currentMonth]);

  const savingsStr = `$${Math.floor(monthData.savings / 1000)}K`;
  const avgPct = Math.round(monthData.ecms.reduce((s, e) => s + e.pct, 0) / monthData.ecms.length);
  const isPlaybackMode = isPlaying || isDragging || currentMonth !== 8;

  // Weather display with fluctuations
  const wxTemp = Math.round(weather.temp + weatherFluctuationRef.current.temp);
  const wxHumidity = Math.round(weather.humidity + weatherFluctuationRef.current.humidity);
  const wxWind = Math.round(weather.wind + weatherFluctuationRef.current.wind);

  // Timeline fill gradient stops
  const getTrackGradient = () => {
    // green start → amber middle → red end matching performance
    return 'linear-gradient(90deg, #00ff88 0%, #00ff88 25%, #ffaa00 42%, #ffaa00 58%, #ff4444 75%, #ff4444 100%)';
  };

  // Tagline opacity
  const taglineAlpha = taglinePulseRef.current > 0 && (performance.now() - taglinePulseRef.current) < 2000
    ? 1 : 0.5;

  return (
    <div className="demo-root" onClick={initAudio}>
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
            <span>DSCR: <span className="val amber">{monthData.dscr} {parseFloat(monthData.dscr) < 1.1 ? 'WATCH' : ''}</span></span>
            <span>GUARANTEED: <span className="val">$312,000/yr</span></span>
            <span>VERIFIED YTD: <span className="val amber">{savingsStr}</span></span>
          </div>
        </div>
        <div className="demo-topnav-right">
          {isPlaybackMode && (
            <span style={{ color: '#ffaa00', letterSpacing: '0.12em', marginRight: 8, fontSize: 9 }}>
              \u25C0 PLAYBACK MODE
            </span>
          )}
          <div className="live-dot" />
          <span>LIVE</span>
        </div>
      </div>

      {/* Sousveillance tagline */}
      <div
        className="demo-sousveillance"
        style={{
          opacity: taglineFadedIn ? 1 : 0,
          color: `rgba(0,255,136,${taglineAlpha})`,
          top: layers.weatherCorrelation ? 78 : 50,
          transition: 'opacity 1.5s ease, color 0.5s ease, top 0.3s ease',
        }}
      >
        ESCOs have always had the data. Now so do you.
      </div>

      {/* Weather bar */}
      {layers.weatherCorrelation && (
        <div className="demo-weather-bar">
          <span className="wx-label">TEMP:</span>
          <span className="wx-val">{wxTemp}\u00b0F</span>
          <span className="wx-label">HUMIDITY:</span>
          <span className="wx-val">{wxHumidity}%</span>
          <span className="wx-label">HDD:</span>
          <span className="wx-val">{weather.hdd}</span>
          <span className="wx-label">CDD:</span>
          <span className="wx-val">{weather.cdd}</span>
          <span className="wx-label">WIND:</span>
          <span className="wx-val">{wxWind}mph</span>
          <span className="wx-label">CONDITIONS:</span>
          <span className="wx-val">{weather.conditions}</span>
        </div>
      )}

      {/* God mode overlay */}
      {godModeOverlayVisible && (
        <div className="demo-god-overlay">
          <div className="god-line1">ALL LAYERS ACTIVE / FULL SPECTRUM VISIBILITY</div>
          <div className="god-line2">GOD MODE ENGAGED</div>
        </div>
      )}

      {/* Left panel — ECM Performance */}
      <div className="demo-left-panel" style={{ top: layers.weatherCorrelation ? 84 : 56 }}>
        <div className="demo-panel-header">ECM PERFORMANCE &mdash; {months[currentMonth].toUpperCase()}</div>
        {monthData.ecms.map(ecm => (
          <div
            key={ecm.id}
            className={`demo-ecm-item${activeECM === ecm.id ? ' active' : ''}${hoverZoneRef.current === ecm.id ? ' highlight-hover' : ''}`}
            onClick={() => setActiveECM(activeECM === ecm.id ? null : ecm.id)}
          >
            <div className="ecm-row">
              <span className="ecm-label" style={{ color: STATUS_COLORS[ecm.status] }}>{
                ecmListBase.find(e => e.id === ecm.id)?.label || ecm.id
              }</span>
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
      <div className="demo-right-panel" style={{ top: layers.weatherCorrelation ? 84 : 56 }}>
        <div className="demo-panel-header">PERFORMANCE SNAPSHOT &mdash; {months[currentMonth].toUpperCase()}</div>
        <div className="demo-metrics-grid">
          <div className="demo-metric">
            <div className="metric-label">VERIFIED SAVINGS</div>
            <div className="metric-value" style={{ color: '#ffaa00' }}>{savingsStr}</div>
            <div className="metric-sub">of $312K target</div>
          </div>
          <div className="demo-metric">
            <div className="metric-label">SHORTFALL</div>
            <div className="metric-value" style={{ color: '#ff4444' }}>{monthData.shortfall}</div>
            <div className="metric-sub">YTD exposure</div>
          </div>
          <div className="demo-metric">
            <div className="metric-label">ECMs ON TRACK</div>
            <div className="metric-value" style={{ color: '#00ff88' }}>{monthData.onTrack}</div>
            <div className="metric-sub">&nbsp;</div>
          </div>
          <div className="demo-metric">
            <div className="metric-label">DSCR</div>
            <div className="metric-value" style={{ color: parseFloat(monthData.dscr) >= 1.1 ? '#00ff88' : '#ffaa00' }}>{monthData.dscr}</div>
            <div className="metric-sub">min 1.0 required</div>
          </div>
        </div>

        <div className="demo-panel-header">ALERT FEED</div>
        <div className="demo-alert-feed">
          {baseAlerts.map((a, i) => (
            <div key={i} className="demo-alert-item">
              <div className="alert-header">
                <div className="alert-dot" style={{ background: STATUS_COLORS[a.status] }} />
                <div className="alert-title" style={{ color: STATUS_COLORS[a.status] }}>{a.title}</div>
              </div>
              <div className="alert-body">{a.body}</div>
              <div className="alert-time">{a.time}</div>
              {a.driftMonth >= 0 && (
                <button
                  className="demo-alert-replay"
                  onClick={() => replayDrift(a.driftMonth)}
                >
                  REPLAY DRIFT EVENT
                </button>
              )}
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
        <button className={`demo-layer-btn${layers.heatMap ? ' on' : ''}${godMode ? ' god-on' : ''}`} onClick={() => toggleLayer('heatMap')}>
          <span className="demo-layer-dot" style={{ background: '#00ff88' }} />
          Energy Heat Map
        </button>
        <button className={`demo-layer-btn${layers.ecmZones ? ' on' : ''}${godMode ? ' god-on' : ''}`} onClick={() => toggleLayer('ecmZones')}>
          <span className="demo-layer-dot" style={{ background: '#00ff88' }} />
          ECM Zones
        </button>
        <button className={`demo-layer-btn${layers.sensorPoints ? ' on' : ''}${godMode ? ' god-on' : ''}`} onClick={() => toggleLayer('sensorPoints')}>
          <span className="demo-layer-dot" style={{ background: '#4488ff' }} />
          Sensor Points
        </button>
        <button className={`demo-layer-btn${layers.weatherCorrelation ? ' on' : ''}${godMode ? ' god-on' : ''}`} onClick={() => toggleLayer('weatherCorrelation')}>
          <span className="demo-layer-dot" style={{ background: '#4488ff' }} />
          Weather Correlation
        </button>
        <button className={`demo-layer-btn${layers.energyFlow ? ' on' : ''}${godMode ? ' god-on' : ''}`} onClick={() => toggleLayer('energyFlow')}>
          <span className="demo-layer-dot" style={{ background: '#00ccff' }} />
          Energy Flow
        </button>
        <button className={`demo-layer-btn${layers.baselineOverlay ? ' on' : ''}${godMode ? ' god-on' : ''}`} onClick={() => toggleLayer('baselineOverlay')}>
          <span className="demo-layer-dot" style={{ background: '#aa44ff' }} />
          Baseline Overlay
        </button>
        <button className={`demo-god-btn${godMode ? ' active' : ''}`} onClick={toggleGodMode}>
          \u2295 GOD MODE
        </button>
      </div>

      {/* Bottom timeline */}
      <div className="demo-timeline">
        <div className="demo-timeline-label">YEAR 3</div>
        <button
          className="demo-timeline-play"
          onClick={() => { initAudio(); setIsPlaying(p => !p); }}
        >
          {isPlaying ? '\u2016' : '\u25B6'}
        </button>
        <div
          className="demo-timeline-track"
          onMouseDown={handleTimelineMouseDown}
          onMouseMove={handleTimelineMouseMove}
          onMouseUp={handleTimelineMouseUp}
          onMouseLeave={handleTimelineMouseUp}
        >
          {/* Track background */}
          <div className="demo-timeline-track-bg" style={{ background: '#0d2a18' }}>
            <div
              className="demo-timeline-track-fill"
              style={{
                width: `${((currentMonth + 1) / 12) * 100}%`,
                background: getTrackGradient(),
              }}
            />
          </div>
          {/* Scrub thumb */}
          <div
            className="demo-timeline-thumb"
            style={{ left: `${(currentMonth / 11) * 100}%` }}
          />
          {/* Month labels */}
          <div className="demo-timeline-months">
            {months.map((m, i) => (
              <div
                key={m}
                className={`demo-timeline-month${i === currentMonth ? ' active' : i < currentMonth ? ' past' : ''}`}
                onClick={() => { initAudio(); setCurrentMonth(i); }}
              >
                {weatherMarkers[i] && layers.weatherCorrelation && (
                  <span className="demo-timeline-wx-marker">{weatherMarkers[i]}</span>
                )}
                {m}
              </div>
            ))}
          </div>
        </div>
        <div className="demo-timeline-current-label">{months[currentMonth].toUpperCase()}</div>
        <div className="demo-timeline-progress">{avgPct}%</div>
      </div>
    </div>
  );
}

import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

/* ══════════════════════════════════════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════════════════════════════════════ */
const _MB = 'cGsuZXlKMUlqb2liV0Z5ZEdsdVpuSmhibU5wY3lJc0ltRWlPaUpqYlRsNVpuUnRiMjR3ZEhWMk1tbHhNVzlyZGpscmJYcG1JbjAua1hNOVZKa09xRlhYQm43Vm5xR3BXUQ==';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || atob(_MB);

const CENTER: [number, number] = [-84.39027, 33.74841];
const BUILDING_NAME = 'Atlanta City Hall';
const BUILDING_ADDRESS = '55 Trinity Ave SW, Atlanta, GA 30303';
const CONTRACT_REF = 'Contract #ATL-2024-007';

/* ══════════════════════════════════════════════════════════════════════════
   DEMO DATA
   ══════════════════════════════════════════════════════════════════════════ */
const MONTHS = ['MAY 25','JUN 25','JUL 25','AUG 25','SEP 25','OCT 25','NOV 25','DEC 25','JAN 26','FEB 26','MAR 26','APR 26'];

interface ECMItem {
  id: string; name: string; perf: number; guaranteed: number;
  status: 'green' | 'amber' | 'red'; trend: string;
}

const ECM_DATA: ECMItem[] = [
  { id:'hvac', name:'HVAC Retrofit', perf:71, guaranteed:84000, status:'amber', trend:'-3.2%/mo' },
  { id:'envelope', name:'Building Envelope', perf:52, guaranteed:62000, status:'red', trend:'-5.1%/mo' },
  { id:'lighting', name:'LED Lighting', perf:97, guaranteed:38000, status:'green', trend:'+0.2%/mo' },
  { id:'controls', name:'BAS Controls', perf:89, guaranteed:44000, status:'green', trend:'+1.1%/mo' },
  { id:'vfd', name:'VFD Upgrades', perf:93, guaranteed:28000, status:'green', trend:'+0.4%/mo' },
  { id:'solar', name:'Solar Thermal', perf:78, guaranteed:56000, status:'amber', trend:'-1.8%/mo' },
];

interface ZoneGeo {
  id: string; name: string; status: string; performance: number;
  polygon: number[][]; color: string; hoverColor: string;
}

const ECM_ZONES: ZoneGeo[] = [
  { id:'hvac', name:'HVAC Retrofit', status:'amber', performance:71,
    polygon:[[-84.39050,33.74858],[-84.39022,33.74858],[-84.39022,33.74843],[-84.39050,33.74843],[-84.39050,33.74858]],
    color:'rgba(255,170,0,0.25)', hoverColor:'rgba(255,170,0,0.5)' },
  { id:'envelope', name:'Building Envelope', status:'red', performance:52,
    polygon:[[-84.39055,33.74852],[-84.39005,33.74852],[-84.39005,33.74828],[-84.39055,33.74828],[-84.39055,33.74852]],
    color:'rgba(255,51,51,0.2)', hoverColor:'rgba(255,51,51,0.45)' },
  { id:'lighting', name:'LED Lighting', status:'green', performance:97,
    polygon:[[-84.39042,33.74836],[-84.39018,33.74836],[-84.39018,33.74822],[-84.39042,33.74822],[-84.39042,33.74836]],
    color:'rgba(0,255,136,0.2)', hoverColor:'rgba(0,255,136,0.4)' },
  { id:'controls', name:'BAS Controls', status:'green', performance:89,
    polygon:[[-84.39048,33.74845],[-84.39030,33.74845],[-84.39030,33.74835],[-84.39048,33.74835],[-84.39048,33.74845]],
    color:'rgba(0,255,136,0.15)', hoverColor:'rgba(0,255,136,0.35)' },
  { id:'vfd', name:'VFD Upgrades', status:'green', performance:93,
    polygon:[[-84.39028,33.74848],[-84.39010,33.74848],[-84.39010,33.74838],[-84.39028,33.74838],[-84.39028,33.74848]],
    color:'rgba(0,255,136,0.18)', hoverColor:'rgba(0,255,136,0.38)' },
  { id:'solar', name:'Solar Thermal', status:'amber', performance:78,
    polygon:[[-84.39044,33.74860],[-84.39016,33.74860],[-84.39016,33.74853],[-84.39044,33.74853],[-84.39044,33.74860]],
    color:'rgba(255,170,0,0.2)', hoverColor:'rgba(255,170,0,0.45)' },
];

interface SensorData {
  id: string; coordinates: [number, number]; value: string;
  type: string; status: 'normal' | 'warning' | 'critical';
}

const SENSORS: SensorData[] = [
  { id:'RTU-01', coordinates:[-84.39035,33.74848], value:'142\u00b0F', type:'Rooftop Unit', status:'warning' },
  { id:'CHW-03', coordinates:[-84.39020,33.74845], value:'44\u00b0F', type:'Chilled Water', status:'normal' },
  { id:'AHU-07', coordinates:[-84.39015,33.74838], value:'68\u00b0F', type:'Air Handler', status:'normal' },
  { id:'LUX-02', coordinates:[-84.39038,33.74832], value:'480 lx', type:'Lighting Sensor', status:'normal' },
  { id:'BTU-01', coordinates:[-84.39025,33.74840], value:'1,240 BTU', type:'Thermal Meter', status:'normal' },
  { id:'RTU-02', coordinates:[-84.39042,33.74852], value:'128\u00b0F', type:'Rooftop Unit', status:'normal' },
  { id:'FLOW-01', coordinates:[-84.39012,33.74830], value:'34 GPM', type:'Flow Meter', status:'normal' },
  { id:'PWR-01', coordinates:[-84.39030,33.74855], value:'847 kW', type:'Power Meter', status:'warning' },
];

const ALERTS = [
  { status:'critical', time:'14:32 EST \u00b7 TODAY', text:'RTU-01 discharge temp 142\u00b0F \u2014 exceeds 130\u00b0F threshold. HVAC drift accelerating.' },
  { status:'warning', time:'11:15 EST \u00b7 TODAY', text:'Building envelope R-value degradation detected. Thermal imaging recommends inspection.' },
  { status:'info', time:'09:00 EST \u00b7 TODAY', text:'LED lighting ECM verified at 97% of guaranteed savings. No action required.' },
  { status:'warning', time:'16:45 EST \u00b7 YESTERDAY', text:'Weather correlation: 3-day heat wave forecast may stress HVAC beyond baseline adjustment capacity.' },
];

/* ══════════════════════════════════════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════════════════════════════════════ */
const C = {
  bg: '#020c06', bgPanel: 'rgba(2,12,6,0.94)', border: '#0d2a18',
  accent: '#00ff88', muted: '#4a7a5a', text: '#c8f0d8',
  amber: '#ffaa00', red: '#ff3333',
};

const font = { mono: "'Share Tech Mono', monospace", heading: "'Syne', sans-serif" };

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
export function Demo() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const orbitRef = useRef<number>(0);
  const orbitPausedRef = useRef(false);
  const orbitTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [currentMonth, setCurrentMonth] = useState(11);
  const [playing, setPlaying] = useState(false);
  const [selectedEcm, setSelectedEcm] = useState<string | null>(null);
  const [layers, setLayers] = useState({ zones: true, sensors: true, flow: false, god: false });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; rows: [string,string][] } | null>(null);
  const [mapError, setMapError] = useState('');

  const playRef = useRef(playing);
  playRef.current = playing;
  const monthRef = useRef(currentMonth);
  monthRef.current = currentMonth;
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const selectedRef = useRef(selectedEcm);
  selectedRef.current = selectedEcm;

  /* ── init map ── */
  useEffect(() => {
    if (!mapContainer.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    if (!MAPBOX_TOKEN) {
      setMapError('MAPBOX_TOKEN is empty — check VITE_MAPBOX_TOKEN env var');
      return;
    }

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: CENTER,
        zoom: 15,
        pitch: 40,
        bearing: 0,
        antialias: true,
      });
    } catch (err) {
      setMapError('Map init failed: ' + (err instanceof Error ? err.message : String(err)));
      return;
    }
    mapRef.current = map;

    map.on('error', (e) => {
      console.error('Mapbox error:', e);
      setMapError('Map error: ' + (e.error?.message || 'unknown'));
    });

    map.on('load', () => {
      // 3D buildings
      const ls = map.getStyle().layers || [];
      let labelLayer: string | undefined;
      for (const l of ls) {
        if (l.type === 'symbol' && (l.layout as Record<string,unknown>)?.['text-field']) {
          labelLayer = l.id; break;
        }
      }
      map.addLayer({
        id: '3d-buildings', source: 'composite', 'source-layer': 'building',
        filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 14,
        paint: {
          'fill-extrusion-color': '#0a1e12',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.75,
        },
      }, labelLayer);

      // ECM zone polygons
      ECM_ZONES.forEach((zone) => {
        map.addSource(`zone-${zone.id}`, {
          type: 'geojson',
          data: { type: 'Feature', properties: { id: zone.id }, geometry: { type: 'Polygon', coordinates: [zone.polygon] } },
        });
        map.addLayer({
          id: `zone-fill-${zone.id}`, type: 'fill', source: `zone-${zone.id}`,
          paint: { 'fill-color': zone.color, 'fill-opacity': 1 },
        });
        map.addLayer({
          id: `zone-line-${zone.id}`, type: 'line', source: `zone-${zone.id}`,
          paint: {
            'line-color': zone.status === 'red' ? C.red : zone.status === 'amber' ? C.amber : C.accent,
            'line-width': 1.5, 'line-opacity': 0.8,
          },
        });
        map.addLayer({
          id: `zone-extrusion-${zone.id}`, type: 'fill-extrusion', source: `zone-${zone.id}`,
          paint: {
            'fill-extrusion-color': zone.status === 'red' ? C.red : zone.status === 'amber' ? C.amber : C.accent,
            'fill-extrusion-height': 4, 'fill-extrusion-base': 0, 'fill-extrusion-opacity': 0.15,
          },
        });
      });

      // Sensor markers
      addSensorMarkers(map);

      // Building label marker
      const labelEl = document.createElement('div');
      labelEl.innerHTML = `
        <div style="text-align:center;pointer-events:none">
          <div style="font-family:${font.heading};font-size:11px;font-weight:700;letter-spacing:.2em;color:${C.accent};text-transform:uppercase;text-shadow:0 0 20px rgba(0,255,136,.4)">${BUILDING_NAME}</div>
          <div style="font-size:8px;letter-spacing:.15em;color:${C.muted};margin-top:4px">${BUILDING_ADDRESS} \u00b7 CONTRACT ACTIVE \u00b7 DRIFT DETECTED</div>
          <div style="width:1px;height:40px;background:linear-gradient(to bottom,${C.accent},transparent);margin:6px auto 0"></div>
        </div>`;
      new mapboxgl.Marker({ element: labelEl, anchor: 'bottom' })
        .setLngLat(CENTER).setOffset([0, -60]).addTo(map);

      // Cinematic intro
      setTimeout(() => {
        map.flyTo({
          center: CENTER, zoom: 18.5, pitch: 65, bearing: -30,
          duration: 4000,
          easing: (t: number) => t < 0.5 ? 2*t*t : -1+(4-2*t)*t,
        });
        setTimeout(() => startOrbit(map), 4500);
      }, 500);

      // Zone click
      ECM_ZONES.forEach((zone) => {
        map.on('click', `zone-fill-${zone.id}`, (e) => {
          setSelectedEcm(prev => prev === zone.id ? null : zone.id);
          const pt = e.point;
          setTooltip({
            x: pt.x + 12, y: pt.y - 20,
            title: zone.name,
            rows: [
              ['Performance', `${zone.performance}%`],
              ['Status', zone.status.toUpperCase()],
              ['Trend', ECM_DATA.find(d => d.id === zone.id)?.trend || ''],
            ],
          });
        });
        map.on('mouseenter', `zone-fill-${zone.id}`, () => {
          map.getCanvas().style.cursor = 'pointer';
          map.setPaintProperty(`zone-fill-${zone.id}`, 'fill-color', zone.hoverColor);
        });
        map.on('mouseleave', `zone-fill-${zone.id}`, () => {
          map.getCanvas().style.cursor = '';
          map.setPaintProperty(`zone-fill-${zone.id}`, 'fill-color', zone.color);
        });
      });
    });

    // Orbit pause on interaction
    const pause = () => {
      orbitPausedRef.current = true;
      clearTimeout(orbitTimeoutRef.current);
      orbitTimeoutRef.current = setTimeout(() => { orbitPausedRef.current = false; }, 3000);
    };
    map.on('mousedown', pause);
    map.on('touchstart', pause);
    map.on('wheel', pause);

    // Page visibility
    const vis = () => {
      if (document.hidden) orbitPausedRef.current = true;
      else {
        clearTimeout(orbitTimeoutRef.current);
        orbitTimeoutRef.current = setTimeout(() => { orbitPausedRef.current = false; }, 1500);
      }
    };
    document.addEventListener('visibilitychange', vis);

    return () => {
      cancelAnimationFrame(orbitRef.current);
      document.removeEventListener('visibilitychange', vis);
      map.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addSensorMarkers(map: mapboxgl.Map) {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    SENSORS.forEach((s) => {
      const color = s.status === 'warning' ? C.amber : s.status === 'critical' ? C.red : C.accent;
      const el = document.createElement('div');
      el.style.cssText = `width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};cursor:pointer;${s.status !== 'normal' ? 'animation:sensor-pulse 2s infinite;' : ''}`;
      const marker = new mapboxgl.Marker({ element: el }).setLngLat(s.coordinates).addTo(map);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setTooltip({
          x: (e as MouseEvent).clientX + 12, y: (e as MouseEvent).clientY - 20,
          title: s.id,
          rows: [['Type', s.type], ['Reading', s.value], ['Status', s.status.toUpperCase()]],
        });
      });
      markersRef.current.push(marker);
    });
  }

  function startOrbit(map: mapboxgl.Map) {
    function rotate() {
      if (!orbitPausedRef.current) {
        map.setBearing(map.getBearing() + 0.015);
      }
      orbitRef.current = requestAnimationFrame(rotate);
    }
    rotate();
  }

  /* ── Layer visibility ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    ECM_ZONES.forEach((zone) => {
      const vis = layers.zones ? 'visible' : 'none';
      ['fill', 'line', 'extrusion'].forEach((t) => {
        const id = `zone-${t}-${zone.id}`;
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);
      });
    });
    markersRef.current.forEach(m => {
      const el = m.getElement();
      el.style.display = layers.sensors ? '' : 'none';
    });
  }, [layers.zones, layers.sensors]);

  /* ── Selected ECM highlight ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    ECM_ZONES.forEach((zone) => {
      const active = selectedEcm === zone.id;
      if (map.getLayer(`zone-extrusion-${zone.id}`)) {
        map.setPaintProperty(`zone-extrusion-${zone.id}`, 'fill-extrusion-height', active ? 12 : 4);
        map.setPaintProperty(`zone-extrusion-${zone.id}`, 'fill-extrusion-opacity', active ? 0.35 : 0.15);
      }
      if (map.getLayer(`zone-line-${zone.id}`)) {
        map.setPaintProperty(`zone-line-${zone.id}`, 'line-width', active ? 3 : 1.5);
      }
    });
  }, [selectedEcm]);

  /* ── Play timeline ── */
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      setCurrentMonth(prev => (prev + 1) % MONTHS.length);
    }, 1200);
    return () => clearInterval(iv);
  }, [playing]);

  /* ── Layer toggle ── */
  const toggleLayer = useCallback((key: keyof typeof layers) => {
    setLayers(prev => {
      if (key === 'god') {
        const next = !prev.god;
        return next
          ? { zones: true, sensors: true, flow: true, god: true }
          : { ...prev, flow: false, god: false };
      }
      const updated = { ...prev, [key]: !prev[key] };
      if (!updated[key] && prev.god) updated.god = false;
      return updated;
    });
  }, []);

  const statusColor = (s: string) => s === 'green' || s === 'normal' || s === 'info' ? C.accent : s === 'amber' || s === 'warning' ? C.amber : C.red;

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, fontFamily: font.mono, color: C.text }}>
      {/* Injected keyframes */}
      <style>{`
        @keyframes sensor-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.8);opacity:.4}100%{transform:scale(1);opacity:1}}
        @keyframes pulse-dot{0%,100%{box-shadow:0 0 4px ${C.accent}}50%{box-shadow:0 0 12px ${C.accent},0 0 24px rgba(0,255,136,.3)}}
        .mapboxgl-ctrl-bottom-left,.mapboxgl-ctrl-bottom-right{display:none!important}
      `}</style>

      {/* Map */}
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

      {/* Map error display */}
      {mapError && (
        <div style={{ position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'rgba(255,68,68,0.15)', border: '1px solid #ff4444', color: '#ff4444', padding: '12px 24px', fontSize: 11, fontFamily: font.mono, maxWidth: 500 }}>
          {mapError}
        </div>
      )}

      {/* ── Top Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 52, background: C.bgPanel,
        borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 20px', zIndex: 10, backdropFilter: 'blur(8px)',
      }}>
        <div style={{ fontFamily: font.heading, fontWeight: 800, fontSize: 13, letterSpacing: '.15em', color: C.accent, textTransform: 'uppercase' as const }}>
          Vantage // Energy Command
        </div>
        <div style={{ fontSize: 9, letterSpacing: '.12em', color: C.muted, textAlign: 'center' as const }}>
          <span style={{ color: C.text }}>{CONTRACT_REF}</span> &nbsp;&middot;&nbsp;
          <span style={{ color: C.text }}>{BUILDING_NAME}</span> &nbsp;&middot;&nbsp;
          {CENTER[1].toFixed(5)}, {CENTER[0].toFixed(5)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, letterSpacing: '.15em', color: C.accent, textTransform: 'uppercase' as const }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, animation: 'pulse-dot 2s infinite' }} />
          Live M&V Feed
        </div>
      </nav>

      {/* ── Left Panel: ECM List ── */}
      <div style={{
        position: 'fixed', top: 62, left: 10, width: 268, background: C.bgPanel,
        border: `1px solid ${C.border}`, zIndex: 10, backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
          fontFamily: font.heading, fontSize: 9, fontWeight: 700,
          letterSpacing: '.2em', textTransform: 'uppercase' as const, color: C.accent,
          display: 'flex', justifyContent: 'space-between',
        }}>
          ECM Performance <span>{ECM_DATA.length}</span>
        </div>
        {ECM_DATA.map(ecm => (
          <div
            key={ecm.id}
            onClick={() => setSelectedEcm(prev => prev === ecm.id ? null : ecm.id)}
            style={{
              padding: '10px 16px', borderBottom: `1px solid rgba(13,42,24,0.5)`,
              cursor: 'pointer', transition: 'background .2s',
              background: selectedEcm === ecm.id ? 'rgba(0,255,136,0.04)' : 'transparent',
            }}
          >
            <div style={{ fontSize: 9, letterSpacing: '.15em', textTransform: 'uppercase' as const, color: C.muted, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>
                <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: statusColor(ecm.status), marginRight: 6 }} />
                {ecm.name}
              </span>
              <span style={{ color: C.text }}>{ecm.perf}%</span>
            </div>
            <div style={{ height: 3, background: C.border, position: 'relative', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${ecm.perf}%`, background: statusColor(ecm.status), transition: 'width .6s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Right Panel: Metrics + Alerts ── */}
      <div style={{
        position: 'fixed', top: 62, right: 10, width: 248, background: C.bgPanel,
        border: `1px solid ${C.border}`, zIndex: 10, backdropFilter: 'blur(8px)',
      }}>
        {[
          { label: 'Verified Savings', value: '$221,400', sub: 'YTD through Apr 2026', color: C.accent },
          { label: 'Shortfall Risk', value: '$90,600', sub: 'HVAC + Envelope drift', color: C.amber },
          { label: 'ECMs On Track', value: '4 / 6', sub: '2 requiring intervention', color: C.accent },
          { label: 'DSCR', value: '1.18x', sub: 'Debt service coverage ratio', color: C.accent },
        ].map((m, i) => (
          <div key={i} style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 8, letterSpacing: '.2em', textTransform: 'uppercase' as const, color: C.muted, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 18, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 8, color: C.muted, marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
        <div style={{
          padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
          fontFamily: font.heading, fontSize: 9, fontWeight: 700,
          letterSpacing: '.2em', textTransform: 'uppercase' as const, color: C.accent,
        }}>
          Alert Feed
        </div>
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {ALERTS.map((a, i) => (
            <div key={i} style={{
              padding: '10px 16px', borderBottom: `1px solid rgba(13,42,24,0.3)`,
              fontSize: 10, lineHeight: 1.5, borderLeft: `2px solid ${statusColor(a.status)}`,
            }}>
              <div style={{ fontSize: 8, color: C.muted, letterSpacing: '.1em' }}>{a.time}</div>
              {a.text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Layer Controls ── */}
      <div style={{ position: 'fixed', bottom: 80, right: 10, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {([
          { key: 'zones' as const, icon: '\u25A0', label: 'Energy Zones' },
          { key: 'sensors' as const, icon: '\u2022', label: 'Sensor Points' },
          { key: 'flow' as const, icon: '\u2191', label: 'Energy Flow' },
          { key: 'god' as const, icon: '\u2295', label: 'God Mode' },
        ]).map(l => (
          <button
            key={l.key}
            onClick={() => toggleLayer(l.key)}
            style={{
              background: C.bgPanel, border: `1px solid ${layers[l.key] ? C.accent : C.border}`,
              color: layers[l.key] ? C.accent : C.muted, fontFamily: font.mono,
              fontSize: 9, letterSpacing: '.15em', textTransform: 'uppercase' as const,
              padding: '8px 14px', cursor: 'pointer', textAlign: 'left' as const,
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ marginRight: 6 }}>{l.icon}</span>{l.label}
          </button>
        ))}
      </div>

      {/* ── Bottom Timeline ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 60, background: C.bgPanel,
        borderTop: `1px solid ${C.border}`, zIndex: 10, display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 16, backdropFilter: 'blur(8px)',
      }}>
        <button
          onClick={() => setPlaying(p => !p)}
          style={{
            width: 32, height: 32, border: `1px solid ${C.border}`, background: 'transparent',
            color: C.accent, fontSize: 14, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {playing ? '\u23F8' : '\u25B6'}
        </button>
        <div
          style={{ flex: 1, height: 24, position: 'relative', cursor: 'pointer' }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            setCurrentMonth(Math.max(0, Math.min(MONTHS.length - 1, Math.round(pct * (MONTHS.length - 1)))));
          }}
        >
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: C.border, transform: 'translateY(-50%)' }} />
          {MONTHS.map((m, i) => {
            const pct = (i / (MONTHS.length - 1)) * 100;
            return (
              <React.Fragment key={i}>
                <div style={{ position: 'absolute', top: '50%', left: `${pct}%`, width: 1, height: 8, background: C.border, transform: 'translateY(-50%)' }} />
                {(i % 2 === 0 || i === MONTHS.length - 1) && (
                  <div style={{ position: 'absolute', top: 'calc(50% + 10px)', left: `${pct}%`, fontSize: 7, color: C.muted, letterSpacing: '.1em', transform: 'translateX(-50%)' }}>{m}</div>
                )}
              </React.Fragment>
            );
          })}
          <div style={{
            position: 'absolute', top: '50%', width: 10, height: 20, background: C.accent,
            transform: 'translate(-50%, -50%)', transition: 'left .3s ease',
            left: `${(currentMonth / (MONTHS.length - 1)) * 100}%`,
          }} />
        </div>
        <div style={{ fontSize: 9, letterSpacing: '.15em', color: C.accent, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' }}>
          {MONTHS[currentMonth]}
        </div>
      </div>

      {/* ── Tooltip ── */}
      {tooltip && (
        <div
          style={{
            position: 'fixed', left: Math.min(tooltip.x, window.innerWidth - 220), top: tooltip.y,
            zIndex: 20, background: C.bgPanel, border: `1px solid ${C.accent}`,
            padding: '12px 16px', minWidth: 180, backdropFilter: 'blur(8px)',
          }}
          onClick={() => setTooltip(null)}
        >
          <div style={{ fontFamily: font.heading, fontSize: 10, fontWeight: 700, letterSpacing: '.15em', color: C.accent, textTransform: 'uppercase' as const, marginBottom: 6 }}>
            {tooltip.title}
          </div>
          {tooltip.rows.map(([label, val], i) => (
            <div key={i} style={{ fontSize: 9, margin: '3px 0', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ color: C.muted }}>{label}</span>
              <span>{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Demo;

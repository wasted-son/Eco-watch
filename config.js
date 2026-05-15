// ═══════════════════════════════════════════════════════
//  EcoAlert — Configuration
//  Fill in your keys here. All services are FREE, no card needed.
// ═══════════════════════════════════════════════════════

const CONFIG = {

  // ── BACKEND URL ─────────────────────────────────────
  // When running locally:   'http://localhost:3000'
  // After deploying:        'https://your-app.railway.app'
  API_BASE: window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : '', // same-origin when frontend & backend are served together

  // ── OPENWEATHERMAP ──────────────────────────────────
  // Free at https://openweathermap.org/api  (no card needed)
  OPENWEATHER_KEY: 'ce5673bc9ca3977c03a6c71931423f69',

  // ── MAP DEFAULTS ────────────────────────────────────
  // Default centre before GPS loads (Nairobi)
  DEFAULT_LAT: -1.286389,
  DEFAULT_LNG: 36.817223,
  DEFAULT_ZOOM: 14,

  // ── REPORT CATEGORIES ───────────────────────────────
  CATEGORIES: [
    { id: 'illegal_dump',    label: 'Illegal Dump',    emoji: '🗑️',  severity: 'critical' },
    { id: 'blocked_drain',   label: 'Blocked Drain',   emoji: '🚰',  severity: 'moderate' },
    { id: 'air_quality',     label: 'Air Quality',     emoji: '🌫️',  severity: 'critical', weather: true },
    { id: 'water_pollution', label: 'Water Pollution', emoji: '💧',  severity: 'critical' },
    { id: 'noise_pollution', label: 'Noise',           emoji: '🔊',  severity: 'moderate' },
    { id: 'deforestation',   label: 'Deforestation',   emoji: '🌳',  severity: 'critical' },
    { id: 'flooding',        label: 'Flooding',        emoji: '🌊',  severity: 'critical', weather: true },
    { id: 'road_hazard',     label: 'Road Hazard',     emoji: '⚠️',  severity: 'moderate' },
    { id: 'other',           label: 'Other Issue',     emoji: '📌',  severity: 'moderate' },
  ],

  // ── POLLING INTERVAL ────────────────────────────────
  // How often (ms) to re-fetch reports for live updates
  POLL_INTERVAL: 10000, // 10 seconds
};

// Freeze to prevent accidental mutation
Object.freeze(CONFIG);

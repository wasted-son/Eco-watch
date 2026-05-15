// ═══════════════════════════════════════════════════════
//  EcoAlert — Express Backend Server
//  Routes:
//    GET  /api/reports              → fetch all reports
//    POST /api/reports              → submit new report
//    PATCH /api/reports/:id/confirm → public confirmation
//    PATCH /api/reports/:id/resolve → admin resolve
//    POST /api/admin/login          → get admin token
//    GET  /api/weather              → proxy OWM weather
//    GET  /api/aqi                  → proxy OWM AQI
//    GET  /health                   → healthcheck
// ═══════════════════════════════════════════════════════

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const reportsRouter = require('./routes/reports');
const adminRouter   = require('./routes/admin');
const weatherRouter = require('./routes/weather');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS ────────────────────────────────────────────────
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN || 'http://localhost:5500',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (same-origin / mobile apps)
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      return cb(null, true);
    }
    cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── BODY PARSING ────────────────────────────────────────
// Allow up to 5MB for base64 photo uploads
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── RATE LIMITING ───────────────────────────────────────
const submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: { error: 'Too many reports submitted. Please wait 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── SERVE FRONTEND (optional — for single-server deploy) ─
// If you put frontend files in ../frontend, this serves them
app.use(express.static(path.join(__dirname, '../frontend')));

// ── ROUTES ──────────────────────────────────────────────
app.use('/api/reports', submitLimiter, reportsRouter);
app.use('/api/admin',   adminRouter);
app.use('/api',         weatherRouter);

// ── HEALTH CHECK ────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'EcoAlert API',
  });
});

// ── CATCH-ALL (SPA support) ──────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── ERROR HANDLER ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── START ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌍 EcoAlert API running on http://localhost:${PORT}`);
  console.log(`   Frontend served at: http://localhost:${PORT}`);
  console.log(`   Health check:       http://localhost:${PORT}/health\n`);
});

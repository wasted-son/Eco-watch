// ═══════════════════════════════════════════════════════
//  EcoAlert — Reports Router
//  GET  /api/reports              → list all reports
//  POST /api/reports              → create report
//  PATCH /api/reports/:id/confirm → public confirm
//  PATCH /api/reports/:id/resolve → admin resolve (auth)
// ═══════════════════════════════════════════════════════

const express  = require('express');
const router   = express.Router();
const supabase = require('../supabase');
const { verifyAdminToken } = require('../middleware/auth');
const fetch    = require('node-fetch');

// ── Allowed category IDs ────────────────────────────────
const VALID_CATEGORIES = [
  'illegal_dump', 'blocked_drain', 'air_quality', 'water_pollution',
  'noise_pollution', 'deforestation', 'flooding', 'road_hazard', 'other',
];

const VALID_SEVERITIES = ['critical', 'moderate', 'resolved'];

// ─────────────────────────────────────────────────────────
//  GET /api/reports
//  Returns all reports ordered by newest first
// ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500); // cap to keep it performant

    if (error) throw error;

    res.json(data || []);

  } catch (err) {
    console.error('[GET /reports]', err.message);
    res.status(500).json({ error: 'Failed to load reports' });
  }
});

// ─────────────────────────────────────────────────────────
//  POST /api/reports
//  Body: { category, severity, description, lat, lng,
//          photo_base64?, weather_category? }
// ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { category, severity, description, lat, lng, photo_base64, weather_category } = req.body;

    // ── Validation ──
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid lat/lng required' });
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: 'Coordinates out of range' });
    }

    const resolvedSeverity = VALID_SEVERITIES.includes(severity) ? severity : 'moderate';

    // ── Optional: store photo in Supabase Storage ──────
    let photo_url = null;
    if (photo_base64 && photo_base64.startsWith('data:image/')) {
      try {
        photo_url = await uploadPhoto(photo_base64);
      } catch (photoErr) {
        console.warn('[Photo upload skipped]', photoErr.message);
        // Non-fatal — report still saves without photo
      }
    }

    // ── Optional: fetch weather context for weather categories ──
    let weather_context = null;
    if (weather_category && process.env.OPENWEATHER_KEY) {
      try {
        weather_context = await getWeatherContext(lat, lng);
      } catch (wErr) {
        console.warn('[Weather context skipped]', wErr.message);
      }
    }

    // ── Insert into Supabase ────────────────────────────
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        category,
        severity: resolvedSeverity,
        description: description?.slice(0, 300) || 'No description.',
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        photo_url,
        weather_context,
        confirmations: 0,
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, report: data });

  } catch (err) {
    console.error('[POST /reports]', err.message);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// ─────────────────────────────────────────────────────────
//  PATCH /api/reports/:id/confirm
//  Public — anyone can confirm a report (+1 confirmation)
// ─────────────────────────────────────────────────────────
router.patch('/:id/confirm', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch current count
    const { data: current, error: fetchErr } = await supabase
      .from('reports')
      .select('confirmations')
      .eq('id', id)
      .single();

    if (fetchErr || !current) return res.status(404).json({ error: 'Report not found' });

    const { data, error } = await supabase
      .from('reports')
      .update({ confirmations: (current.confirmations || 0) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, report: data });

  } catch (err) {
    console.error('[PATCH /confirm]', err.message);
    res.status(500).json({ error: 'Confirmation failed' });
  }
});

// ─────────────────────────────────────────────────────────
//  PATCH /api/reports/:id/resolve
//  Admin only — marks report as resolved
// ─────────────────────────────────────────────────────────
router.patch('/:id/resolve', verifyAdminToken, async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('reports')
      .update({ severity: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Report not found' });

    res.json({ success: true, report: data });

  } catch (err) {
    console.error('[PATCH /resolve]', err.message);
    res.status(500).json({ error: 'Resolve failed' });
  }
});

// ─────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────

// Upload base64 photo to Supabase Storage
async function uploadPhoto(base64String) {
  const matches = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid base64');

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const ext = mimeType.split('/')[1] || 'jpg';
  const filename = `report_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase
    .storage
    .from('report-photos') // bucket name
    .upload(filename, buffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase
    .storage
    .from('report-photos')
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

// Get weather description string for context
async function getWeatherContext(lat, lng) {
  const key = process.env.OPENWEATHER_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${key}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OWM request failed');
  const data = await res.json();
  const desc = data.weather?.[0]?.description || '';
  const temp = data.main?.temp ? `${Math.round(data.main.temp)}°C` : '';
  return [desc, temp].filter(Boolean).join(', ');
}

module.exports = router;

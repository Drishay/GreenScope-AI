import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { searchLocation } from './geocode.js';
import { generateFakeAnalysis } from './fakeAnalyze.js';
import { createAnalysis, getAnalysisById, queryAnalyses, deleteAnalysis } from './store.js';
import { attachCurrentUser, registerAuthRoutes, requireAuth } from './auth.js';
import { checkDatabase } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean);

app.disable('x-powered-by');
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    const database = await checkDatabase();
    return res.json({ ok: true, database: database ? 'connected' : 'unavailable' });
  } catch {
    return res.status(503).json({ ok: false, database: 'unavailable' });
  }
});

// Identity routes need session lookup. Public v1 routes remain usable without a database connection.
app.use('/api/auth', attachCurrentUser);
app.use('/api/admin', attachCurrentUser);
registerAuthRoutes(app);

// 6.1 Public geocoding
app.post('/api/geocode', async (req, res) => {
  try {
    const query = String(req.body?.query || '').trim();
    if (!query || query.length < 2) return res.status(400).json({ error: 'Query too short' });
    const results = await searchLocation(query);
    return res.json({ results });
  } catch {
    return res.status(502).json({ error: 'Geocoding service unavailable' });
  }
});

// 6.2 Public advisory analysis. This endpoint still returns SYNTHETIC demo values.
app.post('/api/analyze', (req, res) => {
  try {
    const { location_name, lat, lng, area_hectares } = req.body || {};
    const name = String(location_name || '').trim();
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const areaNum = Number(area_hectares);

    if (!name || !Number.isFinite(latNum) || !Number.isFinite(lngNum) || !Number.isFinite(areaNum)) {
      return res.status(400).json({ error: 'Missing or invalid parameters' });
    }
    if (areaNum <= 0 || areaNum > 50000) return res.status(400).json({ error: 'Area out of supported range (0–50,000 ha)' });
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) return res.status(400).json({ error: 'Invalid coordinates' });

    const analysis = generateFakeAnalysis({ location_name: name, lat: latNum, lng: lngNum, area_hectares: areaNum });
    analysis.data_status = 'synthetic_demo';
    analysis.regulatory_use = false;
    return res.json({ analysis });
  } catch {
    return res.status(500).json({ error: 'Analysis failed' });
  }
});

// Legacy local JSON report endpoints are retained for v1 compatibility.
// They are demo-only, not case-management records, and will be migrated separately.
app.post('/api/analyses', attachCurrentUser, requireAuth, (req, res) => {
  try {
    const record = createAnalysis({ ...req.body, data_status: req.body?.data_status || 'synthetic_demo', regulatory_use: false }, req.auth.userId);
    return res.json(record);
  } catch {
    return res.status(500).json({ error: 'Could not save analysis' });
  }
});

app.post('/api/analyses/query', attachCurrentUser, requireAuth, (req, res) => {
  try {
    return res.json(queryAnalyses(req.body?.opts || {}, req.auth.userId));
  } catch {
    return res.status(500).json({ error: 'Could not query analyses' });
  }
});

app.get('/api/analyses/:id', attachCurrentUser, requireAuth, (req, res) => {
  const record = getAnalysisById(req.params.id, req.auth.userId);
  if (!record) return res.status(404).json({ error: 'Analysis not found' });
  return res.json(record);
});

app.delete('/api/analyses/:id', attachCurrentUser, requireAuth, (req, res) => {
  const success = deleteAnalysis(req.params.id, req.auth.userId);
  return res.json({ ok: success });
});

// Compatibility endpoint used by the existing navigation. No fixed development user.
app.get('/api/me', attachCurrentUser, requireAuth, (req, res) => {
  const firstRole = req.auth.user.roles[0]?.role || null;
  return res.json({
    id: req.auth.user.id,
    full_name: req.auth.user.full_name,
    email: req.auth.user.email,
    role: firstRole,
    roles: req.auth.user.roles,
    csrf_token: req.auth.csrfToken,
  });
});

app.use((err, req, res, _next) => {
  console.error('[GreenScope API]', req.id, err?.message || 'Unexpected error');
  if (res.headersSent) return;
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  if (err?.message === 'Origin not allowed by CORS') return res.status(403).json({ error: 'Origin not allowed' });
  return res.status(500).json({ error: 'Internal server error', request_id: req.id });
});

export default app;

// Vercel imports the Express app as a serverless function. Local development
// continues to start the standalone API server on port 3001.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[GreenScope API] Server running on http://localhost:${PORT}`);
  });
}

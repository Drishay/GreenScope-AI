import express from 'express';
import cors from 'cors';
import { searchLocation } from './geocode.js';
import { generateFakeAnalysis } from './fakeAnalyze.js';
import { createAnalysis, getAnalysisById, queryAnalyses, deleteAnalysis } from './store.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 6.1 Geocode
app.post('/api/geocode', async (req, res) => {
  try {
    const query = String(req.body?.query || '').trim();
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query too short' });
    }
    const results = await searchLocation(query);
    return res.json({ results });
  } catch (err) {
    return res.status(502).json({ error: err.message || 'Geocoding service unavailable' });
  }
});

// 6.2 Analyze (synthetic / local stub)
app.post('/api/analyze', (req, res) => {
  try {
    const { location_name, lat, lng, area_hectares } = req.body || {};
    const name = String(location_name || '').trim();
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const areaNum = parseFloat(area_hectares);

    if (!name || isNaN(latNum) || isNaN(lngNum) || isNaN(areaNum)) {
      return res.status(400).json({ error: 'Missing or invalid parameters' });
    }
    if (areaNum <= 0 || areaNum > 50000) {
      return res.status(400).json({ error: 'Area out of supported range (0–50,000 ha)' });
    }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const analysis = generateFakeAnalysis({
      location_name: name,
      lat: latNum,
      lng: lngNum,
      area_hectares: areaNum
    });

    return res.json({ analysis });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// 6.3 Analyses CRUD
app.post('/api/analyses', (req, res) => {
  try {
    const record = createAnalysis(req.body);
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/analyses/query', (req, res) => {
  try {
    const { opts } = req.body || {};
    const result = queryAnalyses(opts || {});
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/analyses/:id', (req, res) => {
  const record = getAnalysisById(req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  return res.json(record);
});

app.delete('/api/analyses/:id', (req, res) => {
  const success = deleteAnalysis(req.params.id);
  return res.json({ ok: success });
});

// 6.4 Auth Me (fixed dev user)
app.get('/api/me', (req, res) => {
  res.json({
    id: 'local-user',
    full_name: 'Local User',
    email: 'local@greenscope.dev',
    role: 'admin'
  });
});

app.listen(PORT, () => {
  console.log(`[GreenScope API] Server running on http://localhost:${PORT}`);
});

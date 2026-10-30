import { useCallback, useState } from 'react';
import { base44 } from '@/api/base44Client';
import MapPanel from '@/components/MapPanel';
import LocationSearch from '@/components/LocationSearch';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import { polygonAreaHectares, formatArea } from '@/lib/geoUtils';
import { PenLine, Undo2, Trash2, Satellite, Route as RoadIcon, Loader2, Leaf, AlertCircle, Check } from 'lucide-react';
import { getDemoUser, saveDemoAnalysis } from '@/lib/demoWorkspace';

export default function Analyze() {
const [location, setLocation] = useState(null);
const [vertices, setVertices] = useState([]);
const [drawMode, setDrawMode] = useState(false);
const [basemap, setBasemap] = useState('satellite');
const [analyzing, setAnalyzing] = useState(false);
const [result, setResult] = useState(null);
const [error, setError] = useState(null);
const [saving, setSaving] = useState(false);
const [saved, setSaved] = useState(false);
const [savedId, setSavedId] = useState(null);

const area = polygonAreaHectares(vertices);

const handleSelectLocation = useCallback((loc) => {
setLocation(loc);
setVertices([]);
setResult(null);
setSaved(false);
setSavedId(null);
setDrawMode(true);
}, []);

const addVertex = useCallback((v) => {
setVertices((prev) => [...prev, v]);
setResult(null);
setSaved(false);
setSavedId(null);
}, []);

const undoVertex = () => setVertices((prev) => prev.slice(0, -1));
const clearVertices = () => {
setVertices([]);
setResult(null);
setSaved(false);
};

const handleAnalyze = async () => {
if (vertices.length < 3 || !location) return;
setAnalyzing(true);
setError(null);
setResult(null);
try {
const res = await base44.functions.invoke('analyzeArea', {
location_name: location.name,
lat: location.lat,
lng: location.lng,
area_hectares: area,
});
if (res.data?.error) throw new Error(res.data.error);
const analysis = res.data?.analysis;
if (!analysis) throw new Error('No analysis returned.');
setResult(analysis);
setSaved(false);
setSavedId(null);
} catch (e) {
setError(e.message || 'Analysis failed.');
} finally {
setAnalyzing(false);
}
};

const handleSave = async () => {
if (!result) return;
setSaving(true);
try {
const payload = {
location_name: location.name,
lat: location.lat,
lng: location.lng,
area_hectares: area,
boundary: vertices,
vegetation_pct: result.vegetation_pct,
buildings_pct: result.buildings_pct,
roads_pct: result.roads_pct,
open_land_pct: result.open_land_pct,
water_pct: result.water_pct,
carbon_impact_score: result.carbon_impact_score,
carbon_absorption_tons_year: result.carbon_absorption_tons_year,
tree_canopy_estimate: result.tree_canopy_estimate,
sustainability_score: result.sustainability_score,
green_cover_rating: result.green_cover_rating,
summary: result.summary,
recommendations: result.recommendations,
land_use_breakdown: result.land_use_breakdown,
};
let record;
const demoUser = getDemoUser();
if (demoUser) {
  record = saveDemoAnalysis(payload, demoUser);
} else {
  try { await base44.auth.me(); }
  catch {
    window.open('/app/login', '_blank', 'noopener,noreferrer');
    setError('Login opened in a new tab. Sign in there, return to this analysis, and select Save report again.');
    return;
  }
  record = await base44.entities.Analysis.create(payload);
}
setSavedId(record.id);
setSaved(true);
} catch (e) {
setError('Could not save the report.');
} finally {
setSaving(false);
}
};

const canAnalyze = vertices.length >= 3 && location && !analyzing;

return (
<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
{/* Header */}
<div className="mb-8">
<p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Analysis workspace</p>
<h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
Analyze an area
</h1>
<p className="mt-2 max-w-2xl text-muted-foreground">
Search a location, draw its boundary on the satellite map, and run an AI land-cover and carbon assessment.
</p>
</div>

<div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
{/* Control panel */}
<div className="space-y-4">
{/* Search */}
<div className="rounded-2xl border border-border bg-card p-5">
<label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
1 · Find a location
</label>
<div className="mt-3">
<LocationSearch onSelect={handleSelectLocation} />
</div>
</div>

{/* Draw tools */}
<div className="rounded-2xl border border-border bg-card p-5">
<label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
2 · Draw the boundary
</label>
<p className="mt-2 text-xs text-muted-foreground">
{location ? 'Click on the map to drop vertices. At least 3 close the area.' : 'Search for a location first to begin drawing.'}
</p>
<div className="mt-3 flex flex-wrap gap-2">
<button
onClick={() => setDrawMode((v) => !v)}
disabled={!location}
className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
drawMode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/70'
}`}
>
<PenLine className="h-4 w-4" />
{drawMode ? 'Drawing' : 'Draw'}
</button>
<button onClick={undoVertex} disabled={vertices.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70 disabled:opacity-40">
<Undo2 className="h-4 w-4" /> Undo
</button>
<button onClick={clearVertices} disabled={vertices.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70 disabled:opacity-40">
<Trash2 className="h-4 w-4" /> Clear
</button>
</div>

<div className="mt-4 grid grid-cols-2 gap-3">
<div className="rounded-xl bg-muted/50 px-4 py-3">
<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Area</p>
<p className="mt-1 font-display text-lg font-semibold text-foreground">{formatArea(area)}</p>
</div>
<div className="rounded-xl bg-muted/50 px-4 py-3">
<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Vertices</p>
<p className="mt-1 font-display text-lg font-semibold text-foreground">{vertices.length}</p>
</div>
</div>

<div className="mt-3 flex gap-2">
<button
onClick={() => setBasemap('satellite')}
className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
basemap === 'satellite' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/70'
}`}
>
<Satellite className="h-3.5 w-3.5" /> Satellite
</button>
<button
onClick={() => setBasemap('street')}
className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
basemap === 'street' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/70'
}`}
>
<RoadIcon className="h-3.5 w-3.5" /> Street
</button>
</div>
</div>

{/* Analyze */}
<div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5">
<label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
3 · Run assessment
</label>
<p className="mt-2 text-xs text-muted-foreground">
{canAnalyze ? 'Ready to analyze.' : vertices.length < 3 ? 'Draw at least 3 vertices to define an area.' : 'Select a location first.'}
</p>
<button
onClick={handleAnalyze}
disabled={!canAnalyze}
className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
>
{analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Leaf className="h-4 w-4" />}
{analyzing ? 'Analyzing…' : 'Analyze area'}
</button>
</div>
</div>

{/* Map */}
<div className="relative">
<div className="h-[58vh] min-h-[420px] overflow-hidden rounded-3xl border border-border shadow-[0_20px_60px_-30px_rgba(26,32,29,0.35)]">
<MapPanel
center={location}
vertices={vertices}
onVertexClick={addVertex}
drawEnabled={drawMode}
basemap={basemap}
/>
</div>
{drawMode && location && (
<div className="pointer-events-none absolute left-4 top-4 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-foreground">
Click the map to add vertices
</div>
)}
</div>
</div>

{/* Error */}
{error && (
<div className="mt-6 flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
<AlertCircle className="h-5 w-5" />
{error}
</div>
)}

{/* Loading */}
{analyzing && (
<div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
{[...Array(4)].map((_, i) => (
<div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40" />
))}
<div className="lg:col-span-4 h-64 animate-pulse rounded-3xl border border-border bg-muted/40" />
</div>
)}

{/* Result */}
{result && location && (
<div className="mt-10 animate-fade-up">
<AnalysisDashboard
data={{ ...result, location_name: location.name, area_hectares: area, lat: location.lat, lng: location.lng }}
onSave={handleSave}
saving={saving}
saved={saved}
/>
{saved && savedId && (
<div className="mt-4 flex items-center gap-2 rounded-2xl border border-land-vegetation/30 bg-land-vegetation/10 px-5 py-3 text-sm text-land-vegetation">
<Check className="h-4 w-4" />
Report saved. <a href={`/analysis/${savedId}`} className="underline">View it</a>.
</div>
)}
</div>
)}
</div>
);
}

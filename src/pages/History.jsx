import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatArea, formatNumber, ratingTone } from '@/lib/geoUtils';
import { Loader2, Leaf, ArrowRight, MapPin, LockKeyhole } from 'lucide-react';
import { getDemoUser, getDemoAnalyses } from '@/lib/demoWorkspace';

export default function History() {
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [authenticated, setAuthenticated] = useState(false);

useEffect(() => {
let active = true;
(async () => {
try {
const demoUser = getDemoUser();
if (demoUser) {
  if (active) { setAuthenticated(true); setItems(getDemoAnalyses(demoUser)); }
} else {
  await base44.auth.me();
  const page = await base44.entities.Analysis.filter({}, { sort: '-created_date', limit: 50 });
  if (active) { setAuthenticated(true); setItems(page.items || []); }
}
} catch (e) {
// ignore
} finally {
if (active) setLoading(false);
}
})();
return () => { active = false; };
}, []);

return (
<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
<div>
<p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Your library</p>
<h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
Saved reports
</h1>
<p className="mt-2 text-muted-foreground">Revisit and compare your past environmental analyses.</p>
</div>
<Link to="/analyze" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90">
<Leaf className="h-4 w-4" /> New analysis
</Link>
</div>

{loading ? (
<div className="flex h-64 items-center justify-center">
<Loader2 className="h-7 w-7 animate-spin text-primary" />
</div>
) : !authenticated ? (
<div className="rounded-3xl border border-dashed border-border bg-card/50 p-16 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole className="h-7 w-7" /></span><p className="mt-5 font-display text-xl font-semibold text-foreground">Login required</p><p className="mt-2 text-sm text-muted-foreground">Sign in to view your private saved analysis reports.</p><button onClick={()=>window.open('/app/login','_blank','noopener,noreferrer')} className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Login to view history</button></div>
) : items.length === 0 ? (
<div className="rounded-3xl border border-dashed border-border bg-card/50 p-16 text-center">
<span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
<MapPin className="h-7 w-7" />
</span>
<p className="mt-5 font-display text-xl font-semibold text-foreground">No reports yet</p>
<p className="mt-2 text-sm text-muted-foreground">Run your first area analysis to see it saved here.</p>
<Link to="/analyze" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
Analyze an area <ArrowRight className="h-4 w-4" />
</Link>
</div>
) : (
<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
{items.map((it) => {
const tone = ratingTone(it.green_cover_rating);
return (
<Link
key={it.id}
to={`/analysis/${it.id}`}
className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-[0_14px_44px_-20px_rgba(31,27,22,0.28)]"
>
<div className="flex items-center justify-between">
<span className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${tone.bg} ${tone.text}`}>
<span className="h-2 w-2 rounded-full" style={{ background: tone.dot }} />
{it.green_cover_rating || '-'}
</span>
<span className="text-xs text-muted-foreground">
{new Date(it.created_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
</span>
</div>
<h3 className="mt-4 line-clamp-2 font-display text-lg font-semibold text-foreground">{it.location_name}</h3>
<p className="mt-1 text-xs text-muted-foreground">{formatArea(it.area_hectares)} analyzed</p>
<div className="mt-4 grid grid-cols-3 gap-2 text-center">
<div className="rounded-lg bg-muted/50 py-2">
<p className="font-display text-lg font-semibold text-land-vegetation">{formatNumber(it.vegetation_pct, 0)}%</p>
<p className="text-[10px] uppercase tracking-wide text-muted-foreground">Green</p>
</div>
<div className="rounded-lg bg-muted/50 py-2">
<p className="font-display text-lg font-semibold text-foreground">{formatNumber(it.sustainability_score, 0)}</p>
<p className="text-[10px] uppercase tracking-wide text-muted-foreground">Sustain</p>
</div>
<div className="rounded-lg bg-muted/50 py-2">
<p className="font-display text-lg font-semibold text-foreground">{formatNumber(it.carbon_absorption_tons_year, 0)}</p>
<p className="text-[10px] uppercase tracking-wide text-muted-foreground">t CO₂/yr</p>
</div>
</div>
<div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
Open report
<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
</div>
</Link>
);
})}
</div>
)}
</div>
);
}

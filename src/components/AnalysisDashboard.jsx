import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import LandCoverPie from './LandCoverPie';
import ScoreGauge from './ScoreGauge';
import StatCard from './StatCard';
import { CATEGORY_COLORS, formatNumber, formatArea, ratingTone } from '@/lib/geoUtils';
import { Sprout, Leaf, ArrowRight } from 'lucide-react';

export default function AnalysisDashboard({ data, onSave, saving, saved }) {
const breakdown = data.land_use_breakdown && data.land_use_breakdown.length
? data.land_use_breakdown
: [
{ category: 'Vegetation', pct: data.vegetation_pct, color: CATEGORY_COLORS.Vegetation },
{ category: 'Buildings', pct: data.buildings_pct, color: CATEGORY_COLORS.Buildings },
{ category: 'Roads', pct: data.roads_pct, color: CATEGORY_COLORS.Roads },
{ category: 'Open Land', pct: data.open_land_pct, color: CATEGORY_COLORS['Open Land'] },
{ category: 'Water', pct: data.water_pct, color: CATEGORY_COLORS.Water },
];

const tone = ratingTone(data.green_cover_rating);
const barData = breakdown.map((d) => ({
name: d.category,
pct: Math.max(0, Number(d.pct) || 0),
color: d.color || CATEGORY_COLORS[d.category] || '#8a8275',
}));

return (
<div className="space-y-6">
{/* Header */}
<div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
<div>
<div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
<Leaf className="h-3.5 w-3.5" />
Environmental Report
</div>
<h2 className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
{data.location_name}
</h2>
<p className="mt-1 text-sm text-muted-foreground">
{formatArea(data.area_hectares)} analyzed · {data.lat?.toFixed(4)}, {data.lng?.toFixed(4)}
</p>
</div>
<div className="flex items-center gap-3">
<div className={`flex items-center gap-2 rounded-full px-3.5 py-2 ${tone.bg}`}>
<span className="h-2 w-2 rounded-full" style={{ background: tone.dot }} />
<span className={`text-sm font-medium ${tone.text}`}>{data.green_cover_rating} green cover</span>
</div>
</div>
</div>

{/* Stat cards */}
<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
<StatCard type="vegetation" label="Vegetation cover" value={`${formatNumber(data.vegetation_pct, 1)}`} suffix="%" accent="#5f7d56" hint="Trees, shrubs, grass" />
<StatCard type="buildings" label="Built structures" value={`${formatNumber(data.buildings_pct, 1)}`} suffix="%" accent="#5a6168" hint="Buildings & rooftops" />
<StatCard type="absorption" label="CO₂ absorbed" value={formatNumber(data.carbon_absorption_tons_year, 1)} suffix="t/yr" accent="#4f8a93" hint="By local vegetation" />
<StatCard type="trees" label="Tree equivalents" value={formatNumber(data.tree_canopy_estimate)} accent="#6f8a64" hint="Mature-tree canopy" />
</div>

{/* Charts row */}
<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
<div className="rounded-3xl border border-border bg-card p-6">
<h3 className="font-display text-lg font-semibold text-foreground">Land-cover distribution</h3>
<p className="mt-0.5 text-xs text-muted-foreground">Indicative share of the analyzed area</p>
<div className="mt-5">
<LandCoverPie breakdown={breakdown} />
</div>
</div>

<div className="rounded-3xl border border-border bg-card p-6">
<h3 className="font-display text-lg font-semibold text-foreground">Sustainability profile</h3>
<p className="mt-0.5 text-xs text-muted-foreground">Composite environmental indicators</p>
<div className="mt-6 flex items-center justify-around gap-4">
<ScoreGauge score={data.sustainability_score} label="Sustainability" />
<ScoreGauge score={data.carbon_impact_score} label="Carbon impact" invert />
</div>
</div>

<div className="rounded-3xl border border-border bg-card p-6">
<h3 className="font-display text-lg font-semibold text-foreground">Cover comparison</h3>
<p className="mt-0.5 text-xs text-muted-foreground">Percentage by land-use class</p>
<div className="mt-5 h-56">
<ResponsiveContainer width="100%" height="100%">
<BarChart data={barData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
<XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={40} />
<YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
<Tooltip
cursor={{ fill: 'hsl(var(--muted))' }}
formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Cover']}
contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: '12px' }}
/>
<Bar dataKey="pct" radius={[6, 6, 0, 0]}>
{barData.map((entry, i) => (
<Cell key={i} fill={entry.color} />
))}
</Bar>
</BarChart>
</ResponsiveContainer>
</div>
</div>
</div>

{/* Summary + recommendations */}
<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
<div className="rounded-3xl border border-border bg-card p-6">
<h3 className="font-display text-lg font-semibold text-foreground">Assessment</h3>
<p className="mt-3 text-sm leading-relaxed text-foreground/80">{data.summary}</p>
<div className="mt-5 grid grid-cols-2 gap-3">
<div className="rounded-xl bg-muted/60 p-4">
<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Carbon impact</p>
<p className="mt-1 font-display text-xl font-semibold text-foreground">{formatNumber(data.carbon_impact_score, 0)}<span className="text-sm text-muted-foreground">/100</span></p>
</div>
<div className="rounded-xl bg-muted/60 p-4">
<p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Sustainability</p>
<p className="mt-1 font-display text-xl font-semibold text-foreground">{formatNumber(data.sustainability_score, 0)}<span className="text-sm text-muted-foreground">/100</span></p>
</div>
</div>
</div>

<div className="rounded-3xl border border-border bg-card p-6">
<h3 className="font-display text-lg font-semibold text-foreground">Recommendations</h3>
<ul className="mt-4 space-y-3">
{(data.recommendations || []).map((rec, i) => (
<li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/80">
<span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-land-vegetation/15 text-land-vegetation">
<Sprout className="h-3 w-3" />
</span>
<span>{rec}</span>
</li>
))}
{!data.recommendations?.length && <li className="text-sm text-muted-foreground">No recommendations returned.</li>}
</ul>
</div>
</div>

{/* Save action */}
{onSave && (
<div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-border bg-gradient-to-br from-land-vegetation/10 via-card to-card p-6 sm:flex-row">
<div>
<h3 className="font-display text-lg font-semibold text-foreground">Save this report</h3>
<p className="mt-0.5 text-sm text-muted-foreground">Keep this analysis in your history to revisit or compare later.</p>
</div>
<button
onClick={onSave}
disabled={saving || saved}
className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
>
{saved ? 'Saved to history' : saving ? 'Saving…' : 'Save report'}
{!saving && !saved && <ArrowRight className="h-4 w-4" />}
</button>
</div>
)}
</div>
);
}

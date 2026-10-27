import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CATEGORY_COLORS } from '@/lib/geoUtils';

export default function LandCoverPie({ breakdown }) {
const data = (breakdown || []).map((d) => ({
name: d.category,
value: Math.max(0, Number(d.pct) || 0),
color: d.color || CATEGORY_COLORS[d.category] || '#8a8275',
}));

if (!data.length) return null;

return (
<div className="flex flex-col items-center gap-5">
<div className="relative h-44 w-44">
<ResponsiveContainer width="100%" height="100%">
<PieChart>
<Pie
data={data}
dataKey="value"
nameKey="name"
innerRadius={56}
outerRadius={84}
paddingAngle={2}
stroke="hsl(var(--card))"
strokeWidth={2}
>
{data.map((entry, i) => (
<Cell key={i} fill={entry.color} />
))}
</Pie>
<Tooltip
formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
contentStyle={{
background: 'hsl(var(--card))',
border: '1px solid hsl(var(--border))',
borderRadius: '0.5rem',
fontSize: '12px',
}}
/>
</PieChart>
</ResponsiveContainer>
<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
<span className="font-display text-3xl font-semibold text-foreground">
{data.reduce((s, d) => s + d.value, 0).toFixed(0)}%
</span>
<span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Cover</span>
</div>
</div>
<ul className="grid w-full grid-cols-1 gap-2">
{data.map((d) => (
<li key={d.name} className="flex items-center justify-between text-sm">
<span className="flex items-center gap-2.5">
<span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
<span className="text-foreground/80">{d.name}</span>
</span>
<span className="font-medium tabular-nums text-foreground">{d.value.toFixed(1)}%</span>
</li>
))}
</ul>
</div>
);
}

import { Leaf, Building2, Route as Road, Map, Droplets, TreePine, CloudOff, Sprout } from 'lucide-react';
import { formatNumber } from '@/lib/geoUtils';

const ICONS = {
vegetation: Leaf,
buildings: Building2,
roads: Road,
open_land: Map,
water: Droplets,
trees: TreePine,
carbon_impact: CloudOff,
absorption: Sprout,
};

export default function StatCard({ type, label, value, suffix, accent = '#5f7d56', hint }) {
const Icon = ICONS[type] || Leaf;

return (
<div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-[0_8px_30px_-12px_rgba(31,27,22,0.18)]">
<div
className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.07] transition-opacity group-hover:opacity-[0.12]"
style={{ background: accent }}
/>
<div className="flex items-start justify-between">
<div
className="flex h-10 w-10 items-center justify-center rounded-xl"
style={{ background: `${accent}1a`, color: accent }}
>
<Icon className="h-5 w-5" strokeWidth={1.6} />
</div>
</div>
<div className="mt-4">
<div className="flex items-baseline gap-1">
<span className="font-display text-3xl font-semibold text-foreground tabular-nums">
{value}
</span>
{suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
</div>
<p className="mt-1 text-sm font-medium text-foreground/80">{label}</p>
{hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
</div>
</div>
);
}

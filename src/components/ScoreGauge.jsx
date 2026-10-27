import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { scoreTone } from '@/lib/geoUtils';

export default function ScoreGauge({ score = 0, label = 'Score', invert = false }) {
const value = Math.max(0, Math.min(100, Number(score) || 0));
const display = invert ? 100 - value : value;
const tone = scoreTone(display);
const data = [{ name: label, value, fill: tone.color }];

return (
<div className="flex flex-col items-center">
<div className="relative h-36 w-36">
<ResponsiveContainer width="100%" height="100%">
<RadialBarChart
innerRadius="74%"
outerRadius="100%"
data={data}
startAngle={90}
endAngle={-270}
>
<PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
<RadialBar
background={{ fill: 'hsl(var(--muted))' }}
dataKey="value"
cornerRadius={20}
angleAxisId={0}
/>
</RadialBarChart>
</ResponsiveContainer>
<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
<span className="font-display text-3xl font-semibold" style={{ color: tone.color }}>
{Math.round(display)}
</span>
<span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{tone.label}</span>
</div>
</div>
<span className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
</div>
);
}

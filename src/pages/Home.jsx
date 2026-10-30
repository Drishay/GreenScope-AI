import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { ScanLine, BarChart3, MapPin, ArrowRight, Globe2, Layers, Leaf } from 'lucide-react';

const HERO_IMG = 'https://media.base44.com/images/public/6ace50ef1a61b33024edc57e/9cb44d9f2_generated_image.png';

const features = [
{
icon: ScanLine,
title: 'Interactive area selection',
body: 'Search any location worldwide and draw a precise boundary on live satellite imagery to define exactly what gets assessed.',
featured: true,
},
{
icon: Layers,
title: 'AI land-cover classification',
body: 'Vegetation, buildings, roads, open land and water - identified and quantified as indicative cover percentages.',
},
{
icon: BarChart3,
title: 'Carbon & sustainability dashboard',
body: 'Green-cover statistics, estimated carbon impact, absorption potential and a composite sustainability score.',
},
{
icon: Globe2,
title: 'Built for planners',
body: 'Colleges, industries, developers and environmental organizations get a fast, shareable environmental read on any region.',
wide: true,
},
];

const steps = [
{ n: '01', title: 'Locate', body: 'Search for a campus, neighbourhood, site or city and fly to it on the map.' },
{ n: '02', title: 'Outline', body: 'Draw the boundary of the area you want assessed directly on the satellite view.' },
{ n: '03', title: 'Assess', body: 'Get an indicative land-cover, carbon and sustainability report in seconds.' },
];

export default function Home() {
return (
<div>
{/* Hero */}
<section className="relative overflow-hidden border-b border-border/60">
<div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
<div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
<div className="grid items-center gap-12 lg:grid-cols-2">
<div className="animate-fade-up">
<div className="flex items-center gap-3">
<span className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
Geospatial environmental intelligence
</span>
</div>
<h1 className="mt-6 font-display text-5xl font-semibold leading-[1.04] tracking-tight text-foreground text-balance sm:text-6xl lg:text-[4.25rem]">
See the green, the grey, and the carbon behind any place.
</h1>
<p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
GreenScope turns satellite imagery and a drawn boundary into a clear environmental report - land-cover distribution, carbon impact and sustainability, in seconds.
</p>
<div className="mt-9 flex flex-col gap-3 sm:flex-row">
<Link
to="/analyze"
className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
>
<MapPin className="h-4 w-4" />
Analyze an area
</Link>
<Link
to="/history"
className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-medium text-foreground transition-all hover:bg-secondary"
>
View past reports
</Link>
<Link
to="/report"
className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 px-7 py-3.5 text-sm font-medium text-primary transition-all hover:bg-primary/5"
>
Report an environmental concern
</Link>
</div>
</div>
<div className="relative animate-fade-in">
<div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-land-vegetation/25 via-primary/10 to-transparent blur-2xl" />
<div className="relative overflow-hidden rounded-[1.75rem] border border-border shadow-[0_30px_80px_-30px_rgba(26,32,29,0.4)]">
<Image src={HERO_IMG} alt="Aerial view of a varied landscape" className="aspect-[4/3] w-full" fittingType="fill" />
<div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl glass px-4 py-3">
<div className="flex items-center gap-2.5">
<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-land-vegetation/20 text-land-vegetation">
<Leaf className="h-4 w-4" />
</span>
<div>
<p className="text-xs font-medium text-foreground">Live classification</p>
<p className="text-[10px] text-muted-foreground">Vegetation · Built · Roads · Open · Water</p>
</div>
</div>
<span className="rounded-full bg-land-vegetation/15 px-2.5 py-1 text-[10px] font-medium text-land-vegetation">42% green</span>
</div>
</div>
</div>
</div>

{/* Stat row */}
<div className="mt-16 grid grid-cols-3 divide-x divide-border border-y border-border">
<div className="px-2 py-7 text-center sm:px-6">
<p className="font-display text-3xl font-semibold text-foreground sm:text-4xl">5</p>
<p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground sm:text-sm">land-cover classes</p>
</div>
<div className="px-2 py-7 text-center sm:px-6">
<p className="font-display text-3xl font-semibold text-foreground sm:text-4xl">∞</p>
<p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground sm:text-sm">locations worldwide</p>
</div>
<div className="px-2 py-7 text-center sm:px-6">
<p className="font-display text-3xl font-semibold text-foreground sm:text-4xl">~10s</p>
<p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground sm:text-sm">to a full report</p>
</div>
</div>
</div>
</section>

{/* Bento features */}
<section className="bg-background">
<div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
<div className="max-w-2xl">
<p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">What it does</p>
<h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
From a boundary on a map to an environmental read.
</h2>
</div>
<div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-6">
{features.map((f) => (
<div
key={f.title}
className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:shadow-[0_14px_44px_-20px_rgba(26,32,29,0.28)] ${
f.featured ? 'md:col-span-3 md:row-span-2' : f.wide ? 'md:col-span-6' : 'md:col-span-3'
}`}
>
{f.featured && (
<div className="bg-grid-fine pointer-events-none absolute inset-0 opacity-40" />
)}
<div className="relative">
<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
<f.icon className="h-5 w-5" strokeWidth={1.7} />
</span>
<h3 className={`mt-5 font-display font-semibold text-foreground ${f.featured ? 'text-2xl' : 'text-lg'}`}>{f.title}</h3>
<p className={`mt-2 leading-relaxed text-muted-foreground ${f.featured ? 'text-base max-w-sm' : 'text-sm'}`}>{f.body}</p>
{f.featured && (
<Link
to="/analyze"
className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
>
Try it now <ArrowRight className="h-4 w-4" />
</Link>
)}
</div>
</div>
))}
</div>
</div>
</section>

{/* How it works */}
<section className="border-t border-border/60 bg-card/30">
<div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
<div className="max-w-2xl">
<p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">How it works</p>
<h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
Three steps to an environmental report.
</h2>
</div>
<div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
{steps.map((s) => (
<div key={s.n} className="relative rounded-2xl border border-border bg-card p-7">
<span className="font-display text-5xl font-semibold text-primary/20">{s.n}</span>
<h3 className="mt-4 font-display text-xl font-semibold text-foreground">{s.title}</h3>
<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
</div>
))}
</div>
</div>
</section>

{/* CTA */}
<section className="border-t border-border/60">
<div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
<div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-land-vegetation/15 via-card to-primary/10 p-10 text-center sm:p-16">
<div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
<div className="relative">
<h2 className="font-display text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
Put a number on the environment of any place.
</h2>
<p className="mx-auto mt-4 max-w-xl text-muted-foreground">
Draw a boundary. Get green cover, land use and carbon indicators. Save and compare over time.
</p>
<Link
to="/analyze"
className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
>
Start an analysis <ArrowRight className="h-4 w-4" />
</Link>
</div>
</div>
</div>
</section>

{/* Public reporting and process transparency */}
<section className="border-t border-border/60 bg-card/30">
<div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
<div>
<p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Community reporting</p>
<h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">See something concerning? Report it for review.</h2>
<p className="mt-4 leading-relaxed text-muted-foreground">Anyone can submit a suspected environmental concern without creating an account. A report is reviewed by the relevant authority or triaged when the right authority is unclear. A report is not proof of a violation.</p>
<Link to="/report" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Submit a concern <ArrowRight className="h-4 w-4"/></Link>
<Link to="/report-status" className="ml-3 mt-6 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium">Track a report</Link>
</div>
<div className="rounded-2xl border border-border bg-card p-6">
<h3 className="font-display text-xl font-semibold text-foreground">What happens after a report?</h3>
<ol className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
<li><strong className="text-foreground">1. Submission:</strong> A reference is created so the report can be identified.</li>
<li><strong className="text-foreground">2. Triage and review:</strong> An authority reviews the information and may request more details or conduct checks.</li>
<li><strong className="text-foreground">3. Appropriate action:</strong> Any formal notice, deadline, inspection or enforcement step must be decided by the competent authority under applicable rules.</li>
<li><strong className="text-foreground">4. Updates:</strong> The reporter can use the reference to check permitted status updates. Secure contact verification will be required in the production system.</li>
</ol>
<p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">Current prototype: reporting and tracking use browser-local demo data. No real authority is notified, and environmental analysis values remain illustrative.</p>
</div>
</div>
</section>
</div>
);
}

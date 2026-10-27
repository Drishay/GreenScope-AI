import { Outlet } from 'react-router-dom';
import SiteNav from './SiteNav';

export default function AppLayout() {
return (
<div className="flex min-h-screen flex-col bg-background">
<SiteNav />
<main className="flex-1">
<Outlet />
</main>
<footer className="border-t border-border/60 bg-card/40">
<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
<p className="text-xs text-muted-foreground">
GreenScope AI · Indicative environmental assessments for planning purposes. Land-cover and carbon figures are model-based estimates, not field measurements.
</p>
</div>
</footer>
</div>
);
}

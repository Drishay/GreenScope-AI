import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import MapPanel from '@/components/MapPanel';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import { Loader2, ArrowLeft, Trash2, LockKeyhole } from 'lucide-react';
import { getDemoUser, getDemoAnalysis, deleteDemoAnalysis } from '@/lib/demoWorkspace';

export default function AnalysisDetail() {
const { id } = useParams();
const [record, setRecord] = useState(null);
const [loading, setLoading] = useState(true);
const [notFound, setNotFound] = useState(false);
const [deleting, setDeleting] = useState(false);
const [authenticated, setAuthenticated] = useState(false);

useEffect(() => {
let active = true;
(async () => {
try {
const demoUser = getDemoUser();
if (demoUser) {
  const r = getDemoAnalysis(id, demoUser);
  if (active) { setRecord(r); setAuthenticated(true); if (!r) setNotFound(true); }
} else {
  await base44.auth.me();
  const r = await base44.entities.Analysis.get(id);
  if (active) { setRecord(r); setAuthenticated(true); }
}
} catch (e) {
if (active) setNotFound(true);
} finally {
if (active) setLoading(false);
}
})();
return () => { active = false; };
}, [id]);

const handleDelete = async () => {
if (!record) return;
setDeleting(true);
try {
const demoUser = getDemoUser();
if (demoUser) deleteDemoAnalysis(record.id, demoUser);
else await base44.entities.Analysis.delete(record.id);
window.location.href = '/app/history';
} catch (e) {
setDeleting(false);
}
};

if (loading) {
return (
<div className="flex h-[60vh] items-center justify-center">
<Loader2 className="h-7 w-7 animate-spin text-primary" />
</div>
);
}

if (!authenticated && !loading) return <div className="mx-auto max-w-2xl px-4 py-24 text-center"><LockKeyhole className="mx-auto h-10 w-10 text-primary"/><p className="mt-4 font-display text-2xl font-semibold text-foreground">Login required</p><p className="mt-2 text-muted-foreground">Sign in to view saved analysis reports.</p><button onClick={()=>window.open('/app/login','_blank','noopener,noreferrer')} className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Login</button></div>;
if (notFound || !record) {
return (
<div className="mx-auto max-w-2xl px-4 py-24 text-center">
<p className="font-display text-2xl font-semibold text-foreground">Report not found</p>
<p className="mt-2 text-muted-foreground">It may have been deleted or doesn't belong to you.</p>
<Link to="/app/history" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
<ArrowLeft className="h-4 w-4" /> Back to history
</Link>
</div>
);
}

const center = { lat: record.lat, lng: record.lng };
const boundary = Array.isArray(record.boundary) ? record.boundary : [];

return (
<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
<div className="mb-6 flex items-center justify-between">
<Link to="/app/history" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
<ArrowLeft className="h-4 w-4" /> History
</Link>
<button
onClick={handleDelete}
disabled={deleting}
className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
>
<Trash2 className="h-4 w-4" /> Delete
</button>
</div>
<div className="mb-8 h-[40vh] min-h-[300px] overflow-hidden rounded-3xl border border-border">
<MapPanel center={center} vertices={boundary} drawEnabled={false} basemap="satellite" />
</div>
<AnalysisDashboard data={record} />
</div>
);
}

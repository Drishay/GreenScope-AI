import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, MapPin, Loader2 } from 'lucide-react';

export default function LocationSearch({ onSelect }) {
const [query, setQuery] = useState('');
const [searching, setSearching] = useState(false);
const [results, setResults] = useState([]);
const [showResults, setShowResults] = useState(false);
const [error, setError] = useState(null);

const handleSearch = async () => {
const q = query.trim();
if (q.length < 2) return;
setSearching(true);
setError(null);
try {
const res = await base44.functions.invoke('geocodeLocation', { query: q });
setResults(res.data?.results || []);
setShowResults(true);
} catch (e) {
setError('Search failed. Try again.');
} finally {
setSearching(false);
}
};

const select = (r) => {
onSelect({ lat: r.lat, lng: r.lng, name: r.display_name });
setShowResults(false);
setQuery(r.display_name.split(',')[0]);
};

return (
<div>
<div className="flex gap-2">
<div className="relative flex-1">
<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
<input
value={query}
onChange={(e) => setQuery(e.target.value)}
onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
placeholder="Campus, city, address…"
className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
/>
</div>
<button
onClick={handleSearch}
disabled={searching}
className="inline-flex items-center justify-center rounded-xl bg-secondary px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70 disabled:opacity-50"
>
{searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
</button>
</div>
{showResults && results.length > 0 && (
<ul className="mt-2 max-h-64 overflow-auto rounded-xl border border-border bg-background">
{results.map((r, i) => (
<li key={i}>
<button
onClick={() => select(r)}
className="flex w-full items-start gap-2.5 border-b border-border/60 px-3 py-2.5 text-left text-sm transition-colors last:border-0 hover:bg-muted/60"
>
<MapPin className="mt-0.5 h-4 w-4 flex-none text-primary" />
<span className="text-foreground/85">{r.display_name}</span>
</button>
</li>
))}
</ul>
)}
{showResults && results.length === 0 && !searching && (
<p className="mt-2 text-xs text-muted-foreground">No matches found. Try a more specific name.</p>
)}
{error && <p className="mt-2 text-xs text-destructive">{error}</p>}
</div>
);
}

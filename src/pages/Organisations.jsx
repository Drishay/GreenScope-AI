import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, Users } from 'lucide-react';
import { getDemoState } from '@/lib/demoWorkspace';

export default function Organisations() {
  const [params] = useSearchParams();
  const type = params.get('type') === 'institutions' ? 'institutions' : 'organisations';
  const state = useMemo(() => getDemoState(), []);
  const invitations = state.invitations || [];
  const names = type === 'institutions'
    ? [...new Set([...state.organisations, ...invitations.filter(i => i.role === 'institution').map(i => i.organisation)].filter(Boolean))]
    : [...new Set([...state.organisations, ...invitations.map(i => i.organisation)].filter(Boolean))];
  return <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
    <Link to="/app/workspace" className="inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="h-4 w-4"/>Back to dashboard</Link>
    <div className="mt-6 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">{type === 'institutions' ? <Building2 className="h-6 w-6"/> : <Users className="h-6 w-6"/>}</span><div><p className="text-sm text-muted-foreground">Super Admin directory</p><h1 className="font-display text-3xl font-semibold">{type === 'institutions' ? 'Institutions' : 'Organisations'}</h1></div></div>
    <p className="mt-3 text-sm text-muted-foreground">{names.length} {type === 'institutions' ? 'institutions' : 'organisations'} listed in this browser demo.</p>
    <div className="mt-6 space-y-3">{names.map(name => {
      const related = invitations.filter(i => i.organisation === name);
      return <article key={name} className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold">{name}</h2><p className="mt-1 text-sm text-muted-foreground">{related.length ? related.map(i => `${i.role} invitation: ${i.status}`).join(' - ') : 'No invitation recorded'}</p></article>;
    })}</div>
    <p className="mt-6 rounded-xl bg-muted/60 p-4 text-xs leading-5 text-muted-foreground">This is a local demo directory. It is not yet a shared organization registry and does not reflect other users or devices.</p>
  </main>;
}

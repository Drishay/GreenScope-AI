import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { getDemoState } from '@/lib/demoWorkspace';

export default function Invitation() {
  const { token } = useParams();
  const invitation = useMemo(() => (getDemoState().invitations || []).find(item => item.token === token), [token]);
  if (!invitation) return <main className="mx-auto max-w-xl px-4 py-20"><div className="rounded-3xl border border-border bg-card p-8 text-center"><AlertCircle className="mx-auto h-10 w-10 text-amber-500"/><h1 className="mt-4 font-display text-2xl font-semibold">Invitation not found</h1><p className="mt-2 text-sm text-muted-foreground">This demo invitation may have been created in another browser. Demo links currently use browser-local storage and are not shareable across devices.</p><Link to="/app/login" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Open login</Link></div></main>;
  return <main className="mx-auto max-w-xl px-4 py-20"><div className="rounded-3xl border border-border bg-card p-8 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-primary"/><p className="mt-4 text-xs font-semibold uppercase tracking-widest text-primary">GreenScope invitation</p><h1 className="mt-2 font-display text-3xl font-semibold">Welcome, {invitation.organisation}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">This invitation is for {invitation.role === 'institution' ? 'an institution workspace' : 'a government authority workspace'}. Contact: {invitation.name} ({invitation.email}).</p><p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">Prototype invitation only. This link does not yet create a verified account or grant access on another device.</p><Link to="/app/login" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Continue to login</Link></div></main>;
}

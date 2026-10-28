import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Activity, Building2, CheckCircle2, ClipboardList, FilePlus2, Filter, ShieldCheck, Users } from 'lucide-react';
import { getDemoState, getDemoUser, DEMO_USERS, addDemoInvitation, updateDemoCase, demoStatusLabel } from '@/lib/demoWorkspace';

const roles = { super_admin: 'Super Admin', authority: 'Government Authority', institution: 'Institution' };
const statuses = ['submitted', 'under_review', 'information_requested', 'notice_issued', 'response_received', 'follow_up', 'closed'];

export default function Workspace() {
  const [user] = useState(() => getDemoUser());
  const [revision, setRevision] = useState(0);
  const [filter, setFilter] = useState('all');
  const [invite, setInvite] = useState({ name: '', email: '', role: 'institution', organisation: '' });
  const [notice, setNotice] = useState('');
  const state = useMemo(() => getDemoState(), [revision]);
  if (!user) return <Navigate to="/login" replace />;
  const isAdmin = user.role === 'super_admin';
  const isAuthority = user.role === 'authority';
  const visibleCases = state.cases.filter((item) => {
    if (isAdmin) return true;
    if (isAuthority) return true; // demo scope only; production requires server-side authority scopes
    return item.organisation === user.organisation;
  }).filter((item) => filter === 'all' || item.status === filter);

  const changeCase = (item, patch, message) => { updateDemoCase(item.id, patch, message); setRevision((v) => v + 1); setNotice(`Updated ${item.id} in local demo storage.`); };
  const createInvite = (e) => {
    e.preventDefault();
    addDemoInvitation(invite);
    setInvite({ name: '', email: '', role: 'institution', organisation: '' });
    setRevision((v) => v + 1);
    setNotice('Demo invitation created locally. No email has been sent.');
  };
  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Demo workspace</p><h1 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">Welcome, {user.name}</h1><p className="mt-2 text-sm text-muted-foreground">{roles[user.role]} · {user.organisation}</p></div><Link to="/report-status" className="rounded-full border border-border px-4 py-2.5 text-sm font-medium">Public report tracker</Link></div>
    <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Demo mode:</strong> records use this browser's local storage. Role filters are for UI demonstration only—not security boundaries. Do not enter real personal, legal or confidential data.</div>
    {notice && <p role="status" className="mt-4 rounded-xl bg-primary/10 p-3 text-sm text-foreground">{notice}</p>}
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[{label:'Cases in workspace',value:visibleCases.length,icon:ClipboardList},{label:'Awaiting review',value:visibleCases.filter(c=>['submitted','under_review'].includes(c.status)).length,icon:Activity},{label:'Notice / response stage',value:visibleCases.filter(c=>['notice_issued','response_received','information_requested'].includes(c.status)).length,icon:ShieldCheck},{label:'Organisations',value:state.organisations.length,icon:Building2}].map((m)=><div key={m.label} className="rounded-2xl border border-border bg-card p-5"><m.icon className="h-5 w-5 text-primary"/><p className="mt-4 font-display text-3xl font-semibold text-foreground">{m.value}</p><p className="mt-1 text-sm text-muted-foreground">{m.label}</p></div>)}
    </div>
    {isAdmin && <section className="mt-7 rounded-2xl border border-border bg-card p-6"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/><h2 className="font-display text-xl font-semibold text-foreground">Organisation & user invitations</h2></div><p className="mt-2 text-sm text-muted-foreground">Create sample invitations for authority or institution staff. The real backend invitation and email flow will be connected after database setup.</p>
      <form onSubmit={createInvite} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><input required value={invite.name} onChange={e=>setInvite({...invite,name:e.target.value})} placeholder="Full name" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"/><input required type="email" value={invite.email} onChange={e=>setInvite({...invite,email:e.target.value})} placeholder="Email address" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"/><select value={invite.role} onChange={e=>setInvite({...invite,role:e.target.value})} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"><option value="authority">Government Authority</option><option value="institution">Institution</option><option value="super_admin">Super Admin</option></select><input required value={invite.organisation} onChange={e=>setInvite({...invite,organisation:e.target.value})} placeholder="Organisation" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"/><button className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground sm:col-span-2 lg:col-span-4"><FilePlus2 className="h-4 w-4"/> Create demo invitation</button></form>
      {state.invitations.length>0 && <div className="mt-5 space-y-2">{state.invitations.map(i=><div key={i.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-muted/60 p-3 text-sm"><span><strong>{i.name}</strong> · {i.email} · {roles[i.role] || i.role} · {i.organisation}</span><span className="text-muted-foreground">{i.status} · {i.id}</span></div>)}</div>}
    </section>}
    <section className="mt-7 rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-display text-xl font-semibold text-foreground">Environmental case queue</h2><p className="mt-1 text-sm text-muted-foreground">Review a report, update its stage, and record a transparent timeline entry.</p></div><label className="flex items-center gap-2 text-sm text-muted-foreground"><Filter className="h-4 w-4"/><select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2">{[{value:'all',label:'All statuses'},...statuses.map(s=>({value:s,label:demoStatusLabel(s)}))].map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label></div>
      <div className="mt-5 space-y-4">{visibleCases.map(item=><article key={item.id} className="rounded-2xl border border-border p-4 sm:p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-semibold text-primary">{item.id}</span><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{demoStatusLabel(item.status)}</span><span className="text-xs text-muted-foreground">{item.priority} priority</span></div><h3 className="mt-3 font-semibold text-foreground">{item.type}</h3><p className="mt-1 text-sm text-muted-foreground">{item.location}</p><p className="mt-3 max-w-3xl text-sm leading-6 text-foreground/80">{item.description}</p></div></div>
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end"><label className="flex-1 text-xs font-medium text-muted-foreground">Update status<select value={item.status} onChange={e=>changeCase(item,{status:e.target.value},`Status updated to ${demoStatusLabel(e.target.value)} by ${user.name} (demo).`)} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground">{statuses.map(s=><option key={s} value={s}>{demoStatusLabel(s)}</option>)}</select></label>{isAuthority && <button onClick={()=>changeCase(item,{status:'notice_issued'},'A demo notice-stage entry was recorded by an authority-role user; this is not an official notice.')} className="rounded-full border border-border px-4 py-2.5 text-sm font-medium">Mark notice stage (demo)</button>}{!isAdmin&&!isAuthority&&<p className="text-xs text-muted-foreground">Institution demo: production will limit responses to cases assigned to this institution.</p>}</div>
        {user.role==='institution'&&item.status!=='closed'&&<form onSubmit={e=>{e.preventDefault();const reply=new FormData(e.currentTarget).get('reply')?.toString().trim();if(!reply)return;updateDemoCase(item.id,{status:'response_received',institutionResponse:reply},'Institution response submitted in demo workspace.');setRevision(v=>v+1);setNotice('Demo response saved locally. No authority was notified.');}} className="mt-4 rounded-xl bg-muted/50 p-4"><label className="block text-sm font-medium" htmlFor={'reply-'+item.id}>Institution response / clarification</label><textarea id={'reply-'+item.id} name="reply" required minLength={10} maxLength={3000} defaultValue={item.institutionResponse||''} placeholder="Provide clarification, corrective action, or dispute the estimate with supporting context…" className="mt-2 min-h-24 w-full rounded-xl border border-input bg-background p-3 text-sm"/><button className="mt-3 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">Submit demo response</button></form>}
        {item.institutionResponse&&<p className="mt-3 rounded-xl border border-border p-3 text-sm"><strong>Institution response:</strong> {item.institutionResponse}</p>}
        <details className="mt-3"><summary className="cursor-pointer text-sm font-medium text-primary">View timeline</summary><ol className="mt-3 space-y-2">{(item.updates||[]).map((u,i)=><li key={i} className="flex gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 flex-none text-primary"/>{u}</li>)}</ol></details>
      </article>)}</div>
      {visibleCases.length===0 && <p className="py-10 text-center text-sm text-muted-foreground">No cases match this filter.</p>}
    </section>
    <p className="mt-6 text-xs leading-5 text-muted-foreground">This workspace demonstrates interface behavior only. Before production, enforce role and organisation scope on the server, persist cases in PostgreSQL, and connect official notice delivery to authorised workflows.</p>
  </div>;
}

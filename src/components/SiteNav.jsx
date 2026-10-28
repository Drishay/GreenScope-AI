import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LogOut, Menu, X, ClipboardCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { demoLogout, getDemoUser } from '@/lib/demoWorkspace';

function BrandMark() {
  return <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20c0-8 5.5-13.5 15-15 0 9.5-5.5 15-14 15" /><path d="M4 20c2.5-4.5 6-8 10-10.5" /></svg></span>;
}
export default function SiteNav() {
  const [user, setUser] = useState(() => getDemoUser());
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (getDemoUser()) return;
    base44.auth.me().then(setUser).catch(() => {});
  }, []);
  const handleLogout = async () => {
    if (user?.demo) { demoLogout(); setUser(null); window.location.assign('/'); return; }
    try { await base44.auth.logout(); } catch { window.location.assign('/login'); }
  };
  const links = [{to:'/',label:'Overview',end:true},{to:'/analyze',label:'Analyze'},{to:'/history',label:'History'}];
  return <header className="sticky top-0 z-40 border-b border-border/60 glass"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <Link to="/" className="flex items-center gap-2.5"><BrandMark/><span className="font-display text-lg font-semibold tracking-tight text-foreground">GreenScope</span></Link>
    <nav className="hidden items-center gap-1 md:flex">{links.map(l=><NavLink key={l.to} to={l.to} end={l.end} className={({isActive})=>`rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive?'bg-secondary text-foreground':'text-muted-foreground hover:text-foreground'}`}>{l.label}</NavLink>)}</nav>
    <div className="hidden items-center gap-2 md:flex"><Link to="/report" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium"><ClipboardCheck className="h-4 w-4"/>Report concern</Link>{user&&<Link to="/workspace" className="rounded-full bg-secondary px-4 py-2.5 text-sm font-medium">Workspace</Link>}<Link to="/analyze" className="rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">New analysis</Link>{!user&&<Link to="/login" className="rounded-full border border-border px-4 py-2 text-sm font-medium">Staff sign in</Link>}{user&&<div className="relative"><button onClick={()=>setMenuOpen(v=>!v)} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-sm font-medium">{(user.name||user.full_name||user.email||'?').charAt(0).toUpperCase()}</button>{menuOpen&&<div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-lg"><div className="border-b border-border px-4 py-3"><p className="truncate text-sm font-medium">{user.name||user.full_name||'User'}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div><button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-muted"><LogOut className="h-4 w-4"/>Sign out</button></div>}</div>}</div>
    <button onClick={()=>setOpen(v=>!v)} className="md:hidden">{open?<X className="h-6 w-6"/>:<Menu className="h-6 w-6"/>}</button></div>
    {open&&<div className="border-t border-border bg-card md:hidden"><div className="space-y-1 px-4 py-3">{links.map(l=><NavLink key={l.to} to={l.to} end={l.end} onClick={()=>setOpen(false)} className={({isActive})=>`block rounded-xl px-4 py-3 text-sm font-medium ${isActive?'bg-secondary text-foreground':'text-muted-foreground'}`}>{l.label}</NavLink>)}<Link to="/report" onClick={()=>setOpen(false)} className="mt-1 block rounded-xl px-4 py-3 text-sm font-medium">Report an environmental concern</Link><Link to="/report-status" onClick={()=>setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium">Track a report</Link>{user?<><Link to="/workspace" onClick={()=>setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium">Workspace</Link><button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm"><LogOut className="h-4 w-4"/>Sign out</button></>:<Link to="/login" onClick={()=>setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium text-primary">Staff sign in</Link>}</div></div>}
  </header>;
}

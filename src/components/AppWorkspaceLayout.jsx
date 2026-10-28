import { Link, NavLink, Outlet } from 'react-router-dom';
import { Leaf, LayoutDashboard, ClipboardList, LogOut, Globe } from 'lucide-react';
import { demoLogout, getDemoUser } from '@/lib/demoWorkspace';
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function AppWorkspaceLayout() {
  const [user, setUser] = useState(() => getDemoUser());
  useEffect(() => {
    if (!getDemoUser()) base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);
  const signOut = async () => {
    if (user?.demo) { demoLogout(); window.location.assign('/app/login'); return; }
    try { await base44.auth.logout(); } catch { window.location.assign('/app/login'); }
  };
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/app/workspace" className="flex items-center gap-2 font-display text-lg font-semibold"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Leaf className="h-5 w-5"/></span>GreenScope <span className="text-xs font-medium text-muted-foreground">App</span></Link>
        <nav className="flex items-center gap-2">
          <NavLink to="/app/workspace" className={({isActive})=>`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${isActive?'bg-secondary text-foreground':'text-muted-foreground'}`}><LayoutDashboard className="h-4 w-4"/>Dashboard</NavLink>
          {user?.role==='citizen'&&<NavLink to="/app/history" className={({isActive})=>`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${isActive?'bg-secondary text-foreground':'text-muted-foreground'}`}><ClipboardList className="h-4 w-4"/>Saved analyses</NavLink>}
          <a href="/" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground"><Globe className="h-4 w-4"/>Website</a>
          {user&&<button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm"><LogOut className="h-4 w-4"/>Sign out</button>}
        </nav>
      </div>
    </header>
    <main className="min-h-[calc(100vh-65px)]"><Outlet/></main>
  </div>;
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { DEMO_USERS, demoLogin } from '@/lib/demoWorkspace';

const roleLabels = { super_admin: 'Super Admin', authority: 'Authority', institution: 'Institution', citizen: 'Citizen' };

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      if (DEMO_USERS.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
        const user = demoLogin(email, password);
        navigate(user.role === 'citizen' ? '/workspace' : '/workspace', { replace: true });
        return;
      }
      await base44.auth.login(email, password);
      navigate('/', { replace: true }); window.location.reload();
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally { setLoading(false); }
  };
  return <main className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
    <section className="w-full max-w-3xl rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-9">
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.16em] text-primary">GreenScope AI</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Sign in to GreenScope</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Citizens can submit concerns and follow their own reports. Staff demo accounts show the administrative workflow. Demo data is stored in this browser and is not suitable for confidential information.</p>
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DEMO_USERS.map((user) => <button key={user.role} type="button" onClick={() => { setEmail(user.email); setPassword(user.password); setError(''); }} className="rounded-xl border border-border bg-background p-3 text-left transition hover:border-primary">
          <span className="block text-xs font-semibold text-primary">{roleLabels[user.role]}</span>
          <span className="mt-1 block break-all text-xs text-muted-foreground">{user.email}</span>
          <span className="mt-2 block text-xs font-medium">Use demo account</span>
        </button>)}
      </div>
      <div className="mb-6 rounded-xl bg-muted/60 p-4 text-xs leading-5 text-muted-foreground">
        <strong className="text-foreground">Demo credentials</strong>
        <p>Super Admin: admin@greenscope.demo / DemoAdmin123!</p>
        <p>Authority: authority@greenscope.demo / DemoAuthority123!</p>
        <p>Institution: institution@greenscope.demo / DemoInstitution123!</p>
        <p>Citizen: citizen@greenscope.demo / DemoCitizen123!</p>
        <p className="mt-2">These are public sample credentials for local demonstration only, not secure accounts.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2"><label htmlFor="email" className="text-sm font-medium text-foreground">Email address</label><input id="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="you@example.com" /></div>
        <div className="space-y-2"><label htmlFor="password" className="text-sm font-medium text-foreground">Password</label><input id="password" type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Enter your password" /></div>
        {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <Link to="/" className="mt-5 inline-flex text-sm font-medium text-primary hover:underline">Back to public site</Link>
    </section>
  </main>;
}

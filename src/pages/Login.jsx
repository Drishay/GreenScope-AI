import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { DEMO_USERS, demoLogin, demoRegisterCitizen, getDemoState } from '@/lib/demoWorkspace';

const roleLabels = { super_admin: 'Super Admin', authority: 'Authority', institution: 'Institution', citizen: 'Citizen' };

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      if (registering) {
        if (name.trim().length < 2) throw new Error('Enter your name to create a citizen account.');
        if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
        demoRegisterCitizen({ name, email, password });
        navigate('/workspace', { replace: true });
        return;
      }
      if ([...DEMO_USERS, ...(getDemoState().citizens || [])].some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
        demoLogin(email, password);
        navigate('/workspace', { replace: true });
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
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">{registering ? 'Create a citizen account' : 'Login to GreenScope'}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Citizens can submit concerns and follow reports linked to their account. Staff demo accounts show the administrative workflow. This prototype stores demo accounts and records in this browser only.</p>
      </div>
      {!registering && <>
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
          <p className="mt-2">Public sample credentials are for local demonstration only, not secure accounts.</p>
        </div>
      </>}
      <form onSubmit={handleSubmit} className="space-y-5">
        {registering&&<div className="space-y-2"><label htmlFor="name" className="text-sm font-medium text-foreground">Full name</label><input id="name" required maxLength={120} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Your name"/></div>}
        <div className="space-y-2"><label htmlFor="email" className="text-sm font-medium text-foreground">Email address</label><input id="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="you@example.com" /></div>
        <div className="space-y-2"><label htmlFor="password" className="text-sm font-medium text-foreground">Password</label><input id="password" type="password" autoComplete={registering?'new-password':'current-password'} required minLength={registering?8:1} maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder={registering?'At least 8 characters':'Enter your password'} /></div>
        {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">{loading ? 'Please wait...' : registering ? 'Create citizen account' : 'Login'}</button>
      </form>
      <button type="button" onClick={()=>{setRegistering(v=>!v);setError('');}} className="mt-5 text-sm font-medium text-primary hover:underline">{registering ? 'Already have an account? Login' : 'New citizen? Create an account'}</button>
      <div><Link to="/" className="mt-4 inline-flex text-sm font-medium text-muted-foreground hover:underline">Back to public site</Link></div>
    </section>
  </main>;
}

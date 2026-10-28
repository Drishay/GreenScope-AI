const KEY = 'greenscope.demo.workspace.v1';

export const DEMO_USERS = [
  { id: 'demo-admin', name: 'Demo Super Admin', email: 'admin@greenscope.demo', password: 'DemoAdmin123!', role: 'super_admin', organisation: 'GreenScope' },
  { id: 'demo-authority', name: 'Demo Authority Officer', email: 'authority@greenscope.demo', password: 'DemoAuthority123!', role: 'authority', organisation: 'UP Pollution Control Board' },
  { id: 'demo-institution', name: 'Demo Institution User', email: 'institution@greenscope.demo', password: 'DemoInstitution123!', role: 'institution', organisation: 'Demo Industrial Campus' },
];

const initialCases = [
  { id: 'GS-2026-1042', type: 'Vegetation change', location: 'Sector 62, Noida, Uttar Pradesh', organisation: 'Demo Industrial Campus', description: 'Illustrative change in green-cover estimate across the selected boundary.', status: 'under_review', priority: 'Medium', createdAt: '2026-10-12T09:00:00.000Z', reporter: 'Public visitor', reporterEmail: '', source: 'demo', updates: ['Report received for triage.'] },
  { id: 'GS-2026-1038', type: 'Possible air-pollution source', location: 'Ecotech area, Greater Noida, Uttar Pradesh', organisation: 'Demo Industrial Campus', description: 'A community member reports recurring visible smoke near an industrial site.', status: 'notice_issued', priority: 'High', createdAt: '2026-10-08T09:00:00.000Z', reporter: 'Community member', reporterEmail: 'reporter@example.com', source: 'demo', updates: ['Authority reviewed the report.', 'Demo notice issued for response; this is not a real legal notice.'] },
  { id: 'GS-2026-1021', type: 'Waste / scrap concern', location: 'Industrial Area, Noida, Uttar Pradesh', organisation: 'Demo Industrial Campus', description: 'Illustrative report of unmanaged scrap storage requiring review.', status: 'response_received', priority: 'Low', createdAt: '2026-09-28T09:00:00.000Z', reporter: 'Public visitor', reporterEmail: '', source: 'demo', updates: ['Institution response received in demo workspace.'] },
];

function readState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (parsed && Array.isArray(parsed.cases)) return parsed;
  } catch {}
  return { cases: initialCases, organisations: ['Demo Industrial Campus', 'Demo University'], invitations: [], currentUser: null };
}

function writeState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  return state;
}

export function getDemoState() { return readState(); }
export function getDemoUser() { return readState().currentUser; }

export function demoLogin(email, password) {
  const match = DEMO_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
  if (!match) throw new Error('Demo sign-in failed. Use one of the demo accounts shown below.');
  const user = { id: match.id, name: match.name, email: match.email, role: match.role, organisation: match.organisation, demo: true };
  const state = readState();
  state.currentUser = user;
  writeState(state);
  return user;
}

export function demoLogout() {
  const state = readState();
  state.currentUser = null;
  writeState(state);
}

export function submitPublicReport(report) {
  const state = readState();
  const id = `GS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const item = {
    id, type: report.type, location: report.location.trim(), organisation: 'Unassigned for triage',
    description: report.description.trim(), status: 'submitted', priority: 'Unassessed',
    createdAt: new Date().toISOString(), reporter: report.name.trim() || 'Anonymous reporter',
    reporterEmail: report.email.trim().toLowerCase(), source: 'public_report',
    updates: ['Report submitted. It has not been verified and is not a finding of violation.'],
  };
  state.cases.unshift(item);
  writeState(state);
  return item;
}

export function updateDemoCase(id, patch, updateText) {
  const state = readState();
  state.cases = state.cases.map((item) => item.id === id ? {
    ...item, ...patch, updates: updateText ? [...(item.updates || []), updateText] : (item.updates || []),
  } : item);
  writeState(state);
  return state.cases.find((item) => item.id === id);
}

export function addDemoInvitation(invitation) {
  const state = readState();
  state.invitations.unshift({ ...invitation, id: `INV-${Date.now().toString().slice(-6)}`, status: 'Pending', createdAt: new Date().toISOString() });
  if (invitation.organisation && !state.organisations.includes(invitation.organisation)) state.organisations.push(invitation.organisation);
  writeState(state);
  return state.invitations[0];
}

export function demoStatusLabel(status) {
  return ({
    submitted: 'Submitted', under_review: 'Under review', information_requested: 'Information requested',
    notice_issued: 'Notice issued (demo)', response_received: 'Response received',
    follow_up: 'Follow-up pending', closed: 'Closed',
  })[status] || status;
}

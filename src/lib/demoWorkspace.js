const KEY = 'greenscope.demo.workspace.v2';

export const DEMO_USERS = [
  { id: 'demo-admin', name: 'Demo Super Admin', email: 'admin@greenscope.demo', password: 'DemoAdmin123!', role: 'super_admin', organisation: 'GreenScope' },
  { id: 'demo-authority', name: 'Demo Authority Officer', email: 'authority@greenscope.demo', password: 'DemoAuthority123!', role: 'authority', organisation: 'UP Pollution Control Board' },
  { id: 'demo-institution', name: 'Demo Institution User', email: 'institution@greenscope.demo', password: 'DemoInstitution123!', role: 'institution', organisation: 'NIT Demo Campus' },
  { id: 'demo-citizen', name: 'Demo Citizen', email: 'citizen@greenscope.demo', password: 'DemoCitizen123!', role: 'citizen', organisation: 'Public' },
];

const initialCases = [
  {
    id: 'GS-2026-1042', type: 'Vegetation / tree-cover change',
    location: 'NIT Demo Campus, Greater Noida, Uttar Pradesh',
    organisation: 'NIT Demo Campus', assignedAuthority: 'UP Pollution Control Board',
    assignedToRole: 'institution', route: ['Super Admin', 'NIT Demo Campus'],
    description: 'Illustrative concern about low vegetation cover within a selected campus boundary. Site metrics require verification.',
    status: 'notice_issued', priority: 'Medium', createdAt: '2026-10-12T09:00:00.000Z',
    reporter: 'Demo Citizen', reporterEmail: 'citizen@greenscope.demo', source: 'demo',
    updates: ['Demo report received by Super Admin.', 'Super Admin routed the case directly to NIT Demo Campus.', 'Demo notice-stage entry recorded for institution response. This is not a real legal notice.'],
  },
  {
    id: 'GS-2026-1038', type: 'Possible air-pollution source',
    location: 'Ecotech area, Greater Noida, Uttar Pradesh',
    organisation: 'NIT Demo Campus', assignedAuthority: 'UP Pollution Control Board',
    assignedToRole: 'institution', route: ['Super Admin', 'UP Pollution Control Board', 'NIT Demo Campus'],
    description: 'Illustrative community report of recurring visible smoke near a site. The source and responsibility have not been verified.',
    status: 'notice_issued', priority: 'High', createdAt: '2026-10-08T09:00:00.000Z',
    reporter: 'Demo Citizen', reporterEmail: 'citizen@greenscope.demo', source: 'demo',
    updates: ['Demo report received by Super Admin.', 'Super Admin referred the case to UP Pollution Control Board for review.', 'Authority forwarded the case to NIT Demo Campus and recorded a demo notice stage. This is not a real legal notice.'],
  },
];

function readState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (parsed && Array.isArray(parsed.cases)) return parsed;
  } catch {}
  return { cases: initialCases, organisations: ['NIT Demo Campus', 'Demo Industrial Campus'], invitations: [], currentUser: null };
}
function writeState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  return state;
}
export function getDemoState() { return readState(); }
export function getDemoUser() { return readState().currentUser; }
export function demoRegisterCitizen({ name, email, password }) {
  const state = readState();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = [...DEMO_USERS, ...(state.citizens || [])].some((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) throw new Error('An account with this email already exists. Please sign in instead.');
  const citizen = { id: `citizen-${Date.now()}`, name: name.trim(), email: normalizedEmail, password, role: 'citizen', organisation: 'Public' };
  state.citizens = [...(state.citizens || []), citizen];
  state.currentUser = { id: citizen.id, name: citizen.name, email: citizen.email, role: citizen.role, organisation: citizen.organisation, demo: true };
  writeState(state);
  return state.currentUser;
}
export function demoLogin(email, password) {
  const state = readState();
  const match = [...DEMO_USERS, ...(state.citizens || [])].find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
  if (!match) throw new Error('Demo sign-in failed. Use one of the demo accounts shown below.');
  const user = { id: match.id, name: match.name, email: match.email, role: match.role, organisation: match.organisation, demo: true };
  state.currentUser = user; writeState(state); return user;
}
export function demoLogout() {
  const state = readState(); state.currentUser = null; writeState(state);
}
export function submitPublicReport(report) {
  const state = readState();
  const id = `GS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const currentUser = state.currentUser;
  const email = String(report.email || currentUser?.email || '').trim().toLowerCase();
  const name = String(report.name || currentUser?.name || '').trim();
  const item = {
    id, type: report.type, location: report.location.trim(), organisation: 'Unassigned for triage',
    assignedAuthority: '', assignedToRole: 'super_admin', route: ['Super Admin'],
    description: report.description.trim(), status: 'submitted', priority: 'Unassessed',
    createdAt: new Date().toISOString(), reporter: name || 'Anonymous reporter',
    reporterEmail: email, reporterId: currentUser?.role === 'citizen' ? currentUser.id : '',
    source: 'public_report',
    updates: ['Report submitted and added to the Super Admin triage queue. It has not been verified and is not a finding of violation.'],
  };
  state.cases.unshift(item); writeState(state); return item;
}
export function updateDemoCase(id, patch, updateText) {
  const state = readState();
  state.cases = state.cases.map((item) => item.id === id ? {
    ...item, ...patch, updates: updateText ? [...(item.updates || []), updateText] : (item.updates || []),
  } : item);
  writeState(state); return state.cases.find((item) => item.id === id);
}
export function addDemoInvitation(invitation) {
  const state = readState();
  state.invitations.unshift({ ...invitation, id: `INV-${Date.now().toString().slice(-6)}`, status: 'Pending', createdAt: new Date().toISOString() });
  if (invitation.organisation && !state.organisations.includes(invitation.organisation)) state.organisations.push(invitation.organisation);
  writeState(state); return state.invitations[0];
}
export function demoStatusLabel(status) {
  return ({
    submitted: 'Submitted', under_review: 'Under review', information_requested: 'Information requested',
    notice_issued: 'Notice stage (demo)', response_received: 'Response received',
    follow_up: 'Follow-up pending', closed: 'Closed',
  })[status] || status;
}

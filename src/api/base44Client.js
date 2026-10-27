// Local API shim. Session cookies are HTTP-only; the CSRF token is kept in memory only.
let csrfToken = null;

const json = async (resOrPromise) => {
  const res = await resOrPromise;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed with status ${res.status}`);
  if (data?.csrf_token) csrfToken = data.csrf_token;
  return data;
};

const request = (path, { method = 'GET', body, csrf = false } = {}) => fetch(path, {
  method,
  credentials: 'same-origin',
  headers: {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(csrf && csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
  },
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
}).then(json);

const post = (path, body) => request(path, { method: 'POST', body });

export const base44 = {
  functions: {
    invoke: async (name, payload) => {
      if (name === 'geocodeLocation') return { data: await post('/api/geocode', payload) };
      if (name === 'analyzeArea') return { data: await post('/api/analyze', payload) };
      throw new Error(`Unknown function: ${name}`);
    },
  },
  entities: {
    Analysis: {
      create: (data) => post('/api/analyses', data),
      get: (id) => request(`/api/analyses/${encodeURIComponent(id)}`),
      delete: (id) => request(`/api/analyses/${encodeURIComponent(id)}`, { method: 'DELETE' }),
      filter: (query, opts) => post('/api/analyses/query', { query, opts }),
    },
  },
  auth: {
    me: async () => {
      const user = await request('/api/me');
      return user;
    },
    login: async (email, password) => {
      const result = await post('/api/auth/login', { email, password });
      return result.user;
    },
    logout: async () => {
      await request('/api/auth/logout', { method: 'POST', body: {}, csrf: true });
      csrfToken = null;
      window.location.assign('/login');
    },
  },
};

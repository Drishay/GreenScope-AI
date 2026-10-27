// src/api/base44Client.js
const json = async (resOrPromise) => {
  const res = await resOrPromise;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }
  return data;
};

const post = (path, body) =>
  fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  }).then(json);

export const base44 = {
  functions: {
    // must resolve to { data }, because the frontend reads res.data.results / res.data.analysis
    invoke: async (name, payload) => {
      if (name === 'geocodeLocation') return { data: await post('/api/geocode', payload) };
      if (name === 'analyzeArea')     return { data: await post('/api/analyze', payload) };
      throw new Error(`Unknown function: ${name}`);
    },
  },
  entities: {
    Analysis: {
      create: (data) => post('/api/analyses', data),
      get:    (id)   => json(fetch(`/api/analyses/${id}`)),
      delete: (id)   => json(fetch(`/api/analyses/${id}`, { method: 'DELETE' })),
      // frontend calls filter({}, { sort, limit }) -> must resolve to { items }
      filter: (query, opts) => post('/api/analyses/query', { query, opts }),
    },
  },
  auth: {
    me:     () => json(fetch('/api/me')),
    logout: () => { window.location.reload(); },
  },
};

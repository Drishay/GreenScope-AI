import app from '../server/index.js';

// Vercel routes /api/* requests through this catch-all function.
// Keep the original /api/... path so Express matches its existing routes.
export default function handler(req, res) {
  if (!req.url || !req.url.startsWith('/api/')) {
    const segments = Array.isArray(req.query?.path)
      ? req.query.path
      : req.query?.path
        ? [req.query.path]
        : [];
    const suffix = segments.map((part) => encodeURIComponent(String(part))).join('/');
    req.url = `/api/${suffix}${req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`;
  }
  return app(req, res);
}

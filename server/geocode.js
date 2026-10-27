export async function searchLocation(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'GreenScopeAI-Local/1.0',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error('Geocoding service unavailable');
  }

  const data = await res.json();
  const list = Array.isArray(data) ? data : [];

  return list
    .map((r) => ({
      display_name: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
      type: r.type,
      class: r.class,
    }))
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
}

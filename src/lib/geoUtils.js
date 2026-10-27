// Geospatial helpers for GreenScope AI

// Spherical polygon area in hectares using an equirectangular projection.
// latlngs: array of [lat, lng] pairs. Returns 0 for fewer than 3 vertices.
export function polygonAreaHectares(latlngs) {
if (!latlngs || latlngs.length < 3) return 0;
const R = 6378137; // earth radius (m)
const pts = latlngs.map(([lat, lng]) => {
const latRad = (lat * Math.PI) / 180;
const x = ((lng * Math.PI) / 180) * R * Math.cos(latRad);
const y = latRad * R;
return [x, y];
});
let area = 0;
for (let i = 0; i < pts.length; i++) {
const [x1, y1] = pts[i];
const [x2, y2] = pts[(i + 1) % pts.length];
area += x1 * y2 - x2 * y1;
}
return Math.abs(area) / 2 / 10000; // m^2 -> hectares
}

export function formatNumber(n, digits = 0) {
if (n == null || isNaN(n)) return '—';
return Number(n).toLocaleString(undefined, {
maximumFractionDigits: digits,
minimumFractionDigits: 0,
});
}

export function formatArea(ha) {
if (ha == null || isNaN(ha)) return '—';
if (ha < 1) return `${(ha * 10000).toFixed(0)} m²`;
if (ha < 100) return `${ha.toFixed(2)} ha`;
return `${ha.toFixed(0)} ha`;
}

// Default chart colors per land-cover category
export const CATEGORY_COLORS = {
Vegetation: '#5f7d56',
Buildings: '#a86a3e',
Roads: '#3a3530',
'Open Land': '#cdbb93',
Water: '#4f8a93',
};

export function ratingTone(rating) {
switch (rating) {
case 'Excellent': return { bg: 'bg-land-vegetation/15', text: 'text-land-vegetation', dot: '#5f7d56' };
case 'Good': return { bg: 'bg-land-vegetation/10', text: 'text-land-vegetation', dot: '#6f8a64' };
case 'Moderate': return { bg: 'bg-amber-400/15', text: 'text-amber-700', dot: '#c8924a' };
case 'Low': return { bg: 'bg-orange-400/15', text: 'text-orange-700', dot: '#b56b3a' };
case 'Poor': return { bg: 'bg-red-400/15', text: 'text-red-700', dot: '#a64a3a' };
default: return { bg: 'bg-muted', text: 'text-muted-foreground', dot: '#8a8275' };
}
}

export function scoreTone(score) {
if (score >= 75) return { label: 'Strong', color: '#5f7d56' };
if (score >= 55) return { label: 'Moderate', color: '#c8924a' };
if (score >= 35) return { label: 'Limited', color: '#b56b3a' };
return { label: 'Critical', color: '#a64a3a' };
}

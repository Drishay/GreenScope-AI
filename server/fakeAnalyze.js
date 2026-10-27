function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RECOMMENDATIONS_POOL = [
  "Increase tree canopy along roads and open areas.",
  "Convert bare land to native ground cover.",
  "Introduce permeable surfaces to reduce runoff.",
  "Protect existing water bodies from encroachment.",
  "Prioritise rooftop solar on larger built structures.",
  "Add pollinator-friendly green strips.",
  "Establish rainwater harvesting across built surfaces.",
  "Create shaded walking corridors to mitigate heat island effects."
];

export function generateFakeAnalysis({ location_name, lat, lng, area_hectares }) {
  const seed = (Math.round(lat * 1000) * 100000 + Math.round(lng * 1000)) >>> 0;
  const rand = mulberry32(seed);

  // Draw 5 weights
  const wVeg = 0.2 + rand() * 0.6;
  const wBld = 0.1 + rand() * 0.4;
  const wRoad = 0.05 + rand() * 0.25;
  const wOpen = 0.05 + rand() * 0.35;
  const wWater = rand() * 0.2;

  const totalW = wVeg + wBld + wRoad + wOpen + wWater;

  let vegetation_pct = +((wVeg / totalW) * 100).toFixed(1);
  let buildings_pct = +((wBld / totalW) * 100).toFixed(1);
  let roads_pct = +((wRoad / totalW) * 100).toFixed(1);
  let open_land_pct = +((wOpen / totalW) * 100).toFixed(1);
  let water_pct = +(100 - (vegetation_pct + buildings_pct + roads_pct + open_land_pct)).toFixed(1);

  if (water_pct < 0) {
    open_land_pct = +(open_land_pct + water_pct).toFixed(1);
    water_pct = 0;
  }

  // rating
  let green_cover_rating = 'Poor';
  if (vegetation_pct >= 55) green_cover_rating = 'Excellent';
  else if (vegetation_pct >= 40) green_cover_rating = 'Good';
  else if (vegetation_pct >= 25) green_cover_rating = 'Moderate';
  else if (vegetation_pct >= 12) green_cover_rating = 'Low';

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const sustainability_score = clamp(
    Math.round(vegetation_pct * 1.2 - buildings_pct * 0.3 - roads_pct * 0.2 + water_pct * 0.1 + 5),
    0,
    100
  );

  const carbon_impact_score = clamp(
    Math.round(100 - vegetation_pct * 0.9 + buildings_pct * 0.4 + roads_pct * 0.3),
    0,
    100
  );

  const carbon_absorption_tons_year = +(area_hectares * (vegetation_pct / 100) * 6.5).toFixed(1);
  const tree_canopy_estimate = Math.round(area_hectares * (vegetation_pct / 100) * 120);

  const density = (buildings_pct + roads_pct) > 45 ? 'high' : (buildings_pct + roads_pct) > 25 ? 'moderate' : 'low';
  const summary = `${location_name} shows ${green_cover_rating.toLowerCase()} green cover, with vegetation and open land characterizing the surrounding terrain. Building and road density is ${density}, giving a composite sustainability score of ${sustainability_score}/100.`;

  // Pick 3-5 recommendations deterministically
  const shuffled = [...RECOMMENDATIONS_POOL].sort(() => rand() - 0.5);
  const recCount = 3 + Math.floor(rand() * 3); // 3 to 5
  const recommendations = shuffled.slice(0, recCount);

  const land_use_breakdown = [
    { category: 'Vegetation', pct: vegetation_pct, color: '#5f7d56' },
    { category: 'Buildings', pct: buildings_pct, color: '#a86a3e' },
    { category: 'Roads', pct: roads_pct, color: '#3a3530' },
    { category: 'Open Land', pct: open_land_pct, color: '#cdbb93' },
    { category: 'Water', pct: water_pct, color: '#4f8a93' },
  ];

  return {
    vegetation_pct,
    buildings_pct,
    roads_pct,
    open_land_pct,
    water_pct,
    carbon_impact_score,
    carbon_absorption_tons_year,
    tree_canopy_estimate,
    sustainability_score,
    green_cover_rating,
    summary,
    recommendations,
    land_use_breakdown,
  };
}

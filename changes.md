# Pending change: replace the hardcoded analyzer with a real LLM call

**Status:** the analyzer is currently a local stub (`server/fakeAnalyze.js`) that returns
synthetic, seeded numbers. No AI is called. This is intentional so the app runs offline.

## To make it real later
1. Add an LLM provider key to `.env` (`LLM_API_KEY`) and read it **server-side only** —
   never expose it to the browser.
2. Replace the body of `POST /api/analyze` (in `server/index.js`) so that, instead of calling
   `generateFakeAnalysis(...)`, it calls your LLM provider's API with the prompt + JSON schema
   below, then returns `{ analysis: <parsed JSON> }`.
   **No frontend changes are needed** — the response contract stays identical.
3. Use a model that supports web grounding so estimates reflect the real location
   (the original used a grounded Gemini model with `add_context_from_internet: true`).
4. Keep validation (0 < area <= 50000 ha, valid lat/lng) before the call.
5. Recommended: cache results by rounded lat/lng to control cost.

### Prompt to send
```
You are a geospatial environmental analyst. Analyze the land cover and environmental condition of the area near "<LOCATION_NAME>" (centered at latitude <LAT>, longitude <LNG>), covering approximately <AREA_HA> hectares.

Use your knowledge of this location's geography, urbanization, climate, and vegetation to produce an INDICATIVE land-cover distribution and environmental assessment. These are planning-grade estimates, not precise measurements.

Return JSON with these fields:
- vegetation_pct, buildings_pct, roads_pct, open_land_pct, water_pct: estimated % (0-100), summing to ~100
- carbon_impact_score: 0-100 (higher = greater carbon footprint / degradation)
- carbon_absorption_tons_year: estimated tonnes CO2 absorbed/yr by vegetation here
- tree_canopy_estimate: estimated number of mature-tree equivalents
- sustainability_score: 0-100 (higher = more sustainable)
- green_cover_rating: "Excellent" | "Good" | "Moderate" | "Low" | "Poor"
- summary: 2-3 sentence plain-language summary
- recommendations: 3-5 specific actionable sustainability recommendations
- land_use_breakdown: [{category, pct, color}] for "Vegetation", "Buildings", "Roads", "Open Land", "Water"

Be realistic and grounded in the actual characteristics of this location.
```

### JSON schema to enforce
```json
{
  "type": "object",
  "properties": {
    "vegetation_pct": { "type": "number" },
    "buildings_pct": { "type": "number" },
    "roads_pct": { "type": "number" },
    "open_land_pct": { "type": "number" },
    "water_pct": { "type": "number" },
    "carbon_impact_score": { "type": "number" },
    "carbon_absorption_tons_year": { "type": "number" },
    "tree_canopy_estimate": { "type": "number" },
    "sustainability_score": { "type": "number" },
    "green_cover_rating": { "type": "string" },
    "summary": { "type": "string" },
    "recommendations": { "type": "array", "items": { "type": "string" } },
    "land_use_breakdown": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "category": { "type": "string" },
          "pct": { "type": "number" },
          "color": { "type": "string" }
        }
      }
    }
  },
  "required": ["vegetation_pct","buildings_pct","roads_pct","open_land_pct","water_pct","carbon_impact_score","carbon_absorption_tons_year","tree_canopy_estimate","sustainability_score","green_cover_rating","summary","recommendations","land_use_breakdown"]
}
```

## Also deferred
- Persistence is a local JSON file. Swap for SQLite/Postgres if this becomes multi-user.
- Geocoding hits public Nominatim; add caching / a proper provider for production traffic.
- No auth/accounts by design in this local build.

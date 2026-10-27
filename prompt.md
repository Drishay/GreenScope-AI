# MASTER PROMPT — Rebuild a fully standalone, local version of "GreenScope AI"

You are a senior full-stack developer. I have a Base44-hosted React app called **GreenScope AI**
whose **frontend I have already copied locally**. Your job is to make it run **100% locally with
no Base44 dependency**, by (a) replacing the single platform integration seam, (b) writing a tiny
local backend, and (c) temporarily faking the AI analysis with synthetic numbers.

Read this entire brief before writing code. Follow every file path and contract exactly — the
existing frontend calls them and must not be broken.

---

## 1. What the app does

GreenScope AI is a geospatial environmental-analysis tool. The user:
1. Searches for any place on Earth (geocoding).
2. The map flies to it and they **draw a polygon boundary** by clicking points on a satellite map.
3. They click **Analyze area** and get an **indicative** environmental report: land-cover
   percentages (vegetation / buildings / roads / open land / water), a carbon-impact score,
   CO₂-absorption estimate, tree-canopy estimate, a sustainability score, a green-cover rating,
   a written summary, and 3–5 recommendations — all shown in a dashboard with charts/gauges.
4. They can **save** the report and browse saved reports in **History**, open one, or delete it.

There are 4 real screens: **Home** (landing), **Analyze** (the workspace), **History** (saved
reports), **AnalysisDetail** (one saved report).

> Honest note: the "analysis" never inspects satellite pixels. The original backend just sends the
> location name + coordinates + area to an LLM and asks for indicative estimates. That is the only
> piece we are faking for now (see §7).

---

## 2. What I already copied (the frontend — keep it, do not redesign it)

```
src/
  main.jsx
  App.jsx                     # router
  index.css                   # design tokens (DO NOT change values)
  api/base44Client.js         # <-- THE SEAM we will replace (see §5)
  lib/
    geoUtils.js               # polygon area, formatters, CATEGORY_COLORS, ratingTone, scoreTone
    utils.js                  # cn()
    AuthContext.jsx           # platform auth wrapper  (will be stubbed — §8)
    query-client.js
    app-params.js             # platform params          (will be deleted)
    PageNotFound.jsx
    authReturnTo.js           # auth helper               (will be deleted)
  components/
    AppLayout.jsx             # nav + footer + <Outlet/>
    SiteNav.jsx               # top nav, user avatar, sign-out
    MapPanel.jsx              # Leaflet map: tiles, polygon draw, vertices
    LocationSearch.jsx        # search box -> calls geocodeLocation
    AnalysisDashboard.jsx     # the report UI (charts/gauges/stat cards/save button)
    StatCard.jsx
    ScoreGauge.jsx
    LandCoverPie.jsx
    ScrollToTop.jsx
    ProtectedRoute.jsx        # auth gate               (will be deleted)
    UserNotRegisteredError.jsx#                          (will be deleted)
    AuthLayout.jsx            #                          (will be deleted)
    GoogleIcon.jsx            #                          (will be deleted)
    ui/*                      # shadcn/ui primitives (KEEP ALL, untouched)
  pages/
    Home.jsx
    Analyze.jsx
    History.jsx
    AnalysisDetail.jsx
    Login.jsx Register.jsx ForgotPassword.jsx ResetPassword.jsx OAuthConsent.jsx  (delete — §8)
index.html
tailwind.config.js
postcss.config.js
components.json
jsconfig.json
vite.config.js              # uses @base44/vite-plugin -> REPLACE (§9)
package.json
```

**Rules about the frontend:**
- **Do not change any styling, layout, copy, or design tokens.** `src/index.css` and
  `tailwind.config.js` define the whole ivory / deep-forest-green theme (Fraunces + Inter). Leave
  them alone.
- **Do not change component logic** except the specific edits named in §8 (auth removal) and §5
  (the seam). Every component already works; you are only changing what it talks to underneath.
- Keep every `@/components/ui/*` file exactly as copied.

---

## 3. The one integration seam

Everything the frontend needs from Base44 goes through **`src/api/base44Client.js`**, which
exports a single `base44` object. The app only ever uses these surface areas:

| Used in the frontend | Call | Expected return |
|---|---|---|
| `LocationSearch.jsx` | `base44.functions.invoke('geocodeLocation', { query })` | `{ data: { results: [...] } }` |
| `Analyze.jsx` | `base44.functions.invoke('analyzeArea', { location_name, lat, lng, area_hectares })` | `{ data: { analysis: {...} } }` or `{ data: { error } }` |
| `Analyze.jsx` | `base44.entities.Analysis.create(payload)` | the created record **including `id` and `created_date`** |
| `History.jsx` | `base44.entities.Analysis.filter({}, { sort:'-created_date', limit:50 })` | `{ items: [...] }` |
| `AnalysisDetail.jsx` | `base44.entities.Analysis.get(id)` | the record, or **throw** if not found |
| `AnalysisDetail.jsx` | `base44.entities.Analysis.delete(id)` | anything (awaited) |
| `SiteNav.jsx` | `base44.auth.me()` | `{ id, full_name, email }`, or throw |

So you rebuild **only this file** as a plain `fetch`-based shim. No other frontend file needs to
change for the data layer.

---

## 4. Target architecture

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  Vite dev server  :5173     │  /api  │  Express API  :3001          │
│  React frontend (as copied) │ ─────► │  • /api/geocode   (Nominatim)│
│  base44Client.js = shim ────┼────────┤  • /api/analyze   (FAKE now) │
└─────────────────────────────┘        │  • /api/analyses  (CRUD)     │
      Leaflet tiles ◄── direct HTTPS ──┤  • /api/me        (dev user) │
      (Esri / OpenStreetMap, no backend)│  store: data/analyses.json  │
                                        └──────────────────────────────┘
```

- Tiles load straight from Esri/OSM in the browser — **no backend involved**.
- Node 18+ (global `fetch` available). No database server: persist to a JSON file.

---

## 5. `src/api/base44Client.js` — the shim (REPLACE the file)

Keep the **same import name and shape**: `export const base44 = { functions, entities, auth }`.
Do **not** import `@base44/sdk` or `@/lib/app-params` anymore.

```js
// src/api/base44Client.js
const json = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok && data?.error) throw new Error(data.error);
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
```

> Note the `POST /api/analyses/query` hop only exists so `filter()` can pass its options.
> You may instead expose `GET /api/analyses?sort=…&limit=…` — either is fine, just keep the
> return shape `{ items }`.

---

## 6. Local backend spec

Create `server/` with **Express + cors** (both are tiny, no other deps).

```
server/
  index.js        # express app, mounts routes, serves on :3001
  store.js        # JSON-file persistence for analyses
  geocode.js      # Nominatim proxy
  fakeAnalyze.js  # synthetic analysis generator (§7)
data/analyses.json   # auto-created; an array of records
```

### 6.1 `POST /api/geocode`
- body: `{ query }`. Reject with `{ error }` + 400 if `query` is missing or `< 2` chars.
- Call Nominatim exactly as the original did:
  `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=<encoded>`
  with header `User-Agent: GreenScopeAI-Local/1.0` and a 10s timeout.
- Map results to `{ display_name, lat: Number(lat), lng: Number(lon), type, class }`,
  dropping any with non-finite lat/lng.
- Respond `{ results: [...] }`. On upstream failure respond 502 `{ error: 'Geocoding service unavailable' }`.

### 6.2 `POST /api/analyze`  — **HARDCODED FOR NOW**
- body: `{ location_name, lat, lng, area_hectares }`.
- Validate exactly as the original did: name non-empty, lat/lng/area are numbers, `0 < area <= 50000`,
  lat ∈ [-90,90], lng ∈ [-180,180]; else 400 `{ error }`.
- Respond `{ analysis: generateFakeAnalysis({ location_name, lat, lng, area_hectares }) }`.
- **This is the only place the real LLM will later plug in — see `changes.md`.**

### 6.3 `/api/analyses` CRUD (JSON-file store)
- `POST /api/analyses` → assign `id` (e.g. `crypto.randomUUID()`), set `created_date = new Date().toISOString()`,
  append, return the full record.
- `POST /api/analyses/query` → body `{ query, opts }`. Return the stored records, honoring
  `opts.sort` (`'-created_date'` = newest first) and `opts.limit` (default 50): `{ items: [...] }`.
- `GET /api/analyses/:id` → the record, or **404** (frontend treats a throw/404 as "not found").
- `DELETE /api/analyses/:id` → remove, return `{ ok: true }`.
- Single local user, so no ownership filtering needed.

### 6.4 `GET /api/me`
- Return a fixed dev user: `{ id: 'local-user', full_name: 'Local User', email: 'local@greenscope.dev', role: 'admin' }`.

---

## 7. The synthetic analyzer (`server/fakeAnalyze.js`) — exact contract

It must return **exactly** the shape `AnalysisDashboard` and the `Analysis` entity expect.
Use a **seeded PRNG** so the same location always yields the same numbers (nicer for testing than
pure `Math.random()`): seed from `Math.round(lat*1000)*100000 + Math.round(lng*1000)` with a
`mulberry32` generator.

Return an object with these keys (types in comments):

```js
{
  vegetation_pct: Number,            // 0–100
  buildings_pct: Number,
  roads_pct: Number,
  open_land_pct: Number,
  water_pct: Number,                 // the five should sum to ~100
  carbon_impact_score: Number,       // 0–100  (higher = worse)
  carbon_absorption_tons_year: Number,
  tree_canopy_estimate: Number,      // integer
  sustainability_score: Number,      // 0–100
  green_cover_rating: String,        // one of: 'Excellent' | 'Good' | 'Moderate' | 'Low' | 'Poor'
  summary: String,                   // 2–3 sentences, mentions location_name
  recommendations: String[],         // 3–5 actionable strings
  land_use_breakdown: [              // 5 entries, for the pie/bar charts
    { category: 'Vegetation', pct: Number, color: '#5f7d56' },
    { category: 'Buildings',  pct: Number, color: '#a86a3e' },
    { category: 'Roads',      pct: Number, color: '#3a3530' },
    { category: 'Open Land',  pct: Number, color: '#cdbb93' },
    { category: 'Water',      pct: Number, color: '#4f8a93' }
  ]
}
```

Suggested generation logic (adjust freely, keep it plausible & in-range):
- Draw 5 seeded weights, normalize so the five percentages sum to 100 (1 decimal).
- `green_cover_rating`: vegetation_pct ≥55 → Excellent, ≥40 → Good, ≥25 → Moderate, ≥12 → Low, else Poor.
- `sustainability_score = clamp(round(vegetation_pct*1.2 - buildings_pct*0.3 - roads_pct*0.2 + water_pct*0.1 + 5), 0, 100)`.
- `carbon_impact_score = clamp(round(100 - vegetation_pct*0.9 + buildings_pct*0.4 + roads_pct*0.3), 0, 100)`.
- `carbon_absorption_tons_year = +(area_hectares * (vegetation_pct/100) * 6.5).toFixed(1)`.
- `tree_canopy_estimate = round(area_hectares * (vegetation_pct/100) * 120)`.
- `summary`: template, e.g. `"<name> shows <rating> green cover, with vegetation and open land
  dominating the area. Building and road density is <low/moderate/high>, giving a sustainability
  score of <n>/100."`
- `recommendations`: seed-pick 3–5 from a pool such as
  "Increase tree canopy along roads and open areas.", "Convert bare land to native ground cover.",
  "Introduce permeable surfaces to reduce runoff.", "Protect existing water bodies from encroachment.",
  "Prioritise rooftop solar on larger built structures.", "Add pollinator-friendly green strips."

**Do not import or call any LLM here.** Numbers are synthetic.

---

## 8. Remove login entirely

1. **Delete** these files:
   `src/pages/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `OAuthConsent.jsx`,
   `src/components/ProtectedRoute.jsx`, `UserNotRegisteredError.jsx`, `AuthLayout.jsx`, `GoogleIcon.jsx`,
   `src/lib/AuthContext.jsx`, `src/lib/authReturnTo.js`, `src/lib/app-params.js`.
2. **Rewrite `src/App.jsx`** so it renders the app with **no auth gate**:

```jsx
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import ScrollToTop from "./components/ScrollToTop";
import AppLayout from "@/components/AppLayout";
import Home from "@/pages/Home";
import Analyze from "@/pages/Analyze";
import History from "@/pages/History";
import AnalysisDetail from "@/pages/AnalysisDetail";

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/history" element={<History />} />
            <Route path="/analysis/:id" element={<AnalysisDetail />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
```
3. `SiteNav.jsx` calls `base44.auth.me()` and shows the avatar — **leave it unchanged**; the shim
   returns the dev user, so it works. (If you prefer no user chrome at all, replace the avatar block
   with a static badge — optional.)

---

## 9. Dependencies, scripts, config

**Remove** (Base44-only): `@base44/sdk`, `@base44/vite-plugin`.
**Keep** everything the frontend actually uses: `react`, `react-dom`, `react-router-dom`,
`react-leaflet`, `leaflet`, `recharts`, `lucide-react`, `@tanstack/react-query`, `tailwindcss`,
`postcss`, `autoprefixer`, `tailwindcss-animate`, `class-variance-authority`, `clsx`,
`tailwind-merge`, all `@radix-ui/*` used by `components/ui`, `framer-motion`, `date-fns`, `moment`,
`lodash`, `react-hook-form`, `react-markdown`, `sonner`, `cmdk`, `vaul`, `embla-carousel-react`,
`input-otp`, `react-day-picker`, `react-resizable-panels`.
**Add**: `express`, `cors`, `concurrently`, `@vitejs/plugin-react` (if not present).

**`vite.config.js`** — replace the Base44 plugin with a plain React + alias + API proxy config:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' },
  },
});
```

**`package.json` scripts:**

```json
{
  "scripts": {
    "dev": "concurrently -k \"npm:dev:api\" \"npm:dev:web\"",
    "dev:api": "node server/index.js",
    "dev:web": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**`index.html`** — keep as copied (it already loads the Fraunces + Inter Google Fonts and the
`#root` + `/src/main.jsx`). Nothing to change.

**Also create `.env.example`:**
```
# Not used yet — the analyzer is currently a local stub (see changes.md)
LLM_PROVIDER=
LLM_API_KEY=
```
Add `.env` and `data/` to `.gitignore`.

---

## 10. Create `changes.md` (repo root) with EXACTLY this content

```markdown
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
```

---

## 11. Acceptance criteria — verify all of these, then report

```
npm install
npm run dev        # must start both the API (:3001) and web (:5173)
```

Then manually confirm:
1. `http://localhost:5173/` — **Home** renders fully (hero, feature grid, steps, CTA). **No login prompt.**
2. Navigate to **Analyze**. Type `Noida Stadium`, click **Search** → a list of matches appears.
3. Click a result → the map **flies to it** and a marker drops; the Draw button becomes active.
4. **Click several points on the map** (including near the center marker) → vertices appear, the
   polygon/preview line draws, **Area** and **Vertices** counts update, Analyze enables at ≥3 points.
5. Click **Analyze area** → a loading state, then the **dashboard** renders: 4 stat cards, the
   land-cover doughnut, two score gauges, the bar chart, the summary, and recommendations.
   (Values are synthetic.)
6. Click **Save report** → success message with a working "View it" link.
7. Open **History** → the saved report appears as a card with correct metrics and date.
8. Open the report → **AnalysisDetail** shows the map with the saved boundary + the full dashboard.
9. **Delete** it → returns to History and it's gone.
10. Every route is reachable without logging in; **no console errors**; refresh persists saved reports.
11. Responsive: usable at 375px and ≥1280px widths.

Fix anything that fails before declaring done. Report the exact commands you ran and the results.

---

## 12. Constraints
- Do not redesign UI, change copy, or touch `src/index.css` / `tailwind.config.js` tokens.
- Do not add features beyond this brief (no accounts, no uploads, no extra pages).
- Keep the app fully offline-capable except for live map tiles and the Nominatim geocode call.
- All keys go in `.env`, server-side only — nothing secret in the browser.
- Keep the two function names and payload/response shapes identical so the copied frontend works untouched.

## 13. Delete / Rewrite / Keep — what is Base44-only and unnecessary locally

The copied repo is a Base44 app: a lot of it is platform glue (auth, editor plugins, platform
config) that has no purpose in a standalone local build. Classify every file as **DELETE**,
**REWRITE**, or **KEEP** exactly as below. Do not delete anything under "KEEP".

### 13.1 DELETE outright (pure Base44 auth / platform glue)

```
src/pages/Login.jsx
src/pages/Register.jsx
src/pages/ForgotPassword.jsx
src/pages/ResetPassword.jsx
src/pages/OAuthConsent.jsx
src/components/ProtectedRoute.jsx
src/components/UserNotRegisteredError.jsx
src/components/AuthLayout.jsx
src/components/GoogleIcon.jsx
src/lib/AuthContext.jsx
src/lib/authReturnTo.js
src/lib/app-params.js
src/utils/index.ts            # createPageUrl() — a Base44 helper, imported nowhere in this app
base44/                        # config.jsonc, entities/Analysis.jsonc, entities/User.jsonc
                               # (Base44 backend definitions — reference only; your local store replaces them)
AGENTS.md
CLAUDE.md                      # Base44's own agent/editor instruction files
.npmrc                         # Base44 npm policy (min-release-age-exclude=@base44/*)
README.md                      # platform README — replace with your own
```

After deleting, grep to be sure nothing still imports them:
`grep -rn "AuthContext\|app-params\|authReturnTo\|ProtectedRoute\|UserNotRegisteredError\|AuthLayout\|GoogleIcon\|OAuthConsent\|@/utils" src`
→ expect **zero** results.

### 13.2 REWRITE (keep the file, change its content)

- **`src/App.jsx`** — remove the auth gate and all auth imports; render routes directly
  (see §8 for the exact target file).
- **`src/api/base44Client.js`** — replace with the local `fetch` shim (§5).
- **`src/lib/PageNotFound.jsx`** — it currently calls `base44.auth.me()` and shows an "Admin Note";
  rewrite it as a **plain 404** with no auth and no Base44 wording:

```jsx
import { useLocation } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="font-display text-7xl font-light text-muted-foreground">404</h1>
        <h2 className="text-2xl font-medium">Page Not Found</h2>
        <p className="text-muted-foreground">
          The page "{pageName}" could not be found in this application.
        </p>
        <a href__="/" className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
          Go Home
        </a>
      </div>
    </div>
  );
}
```

- **`vite.config.js`** — remove `@base44/vite-plugin` (its `hmrNotifier`, `navigationNotifier`,
  `analyticsTracker`, `visualEditAgent` are Base44 editor features) → plain React + alias + proxy (§9).
- **`package.json`** — change `"name": "base44-app"` to something like `"greenscope-ai"`; add the
  `express`/`cors`/`concurrently` deps and the `dev` scripts (§9).
- **`.gitignore`** — remove the Base44-specific lines; add `data/` and `.env`:
  ```
  base44/.app.jsonc      # DELETE this line
  .wrangler              # DELETE this line (no Cloudflare build here)
  data/                  # ADD
  ```
- **`index.html`** — delete the line `<link rel="manifest" href__="/manifest.json" />`
  (there is no `public/` folder, so it just 404s). Keep the favicon, fonts, `#root`, and the
  `/src/main.jsx` script exactly as they are.

### 13.3 ADJUST (small, optional-but-recommended)

- **`src/pages/Home.jsx`** → the hero image is Base44-hosted:
  `const HERO_IMG = 'https://media.base44.com/images/public/.../generated_image.png';`
  That URL still loads publicly, but for a truly standalone app replace it with a local asset in
  `public/` (or an Unsplash URL). Nothing else on Home references Base44.
- **`src/components/ui/image.jsx`** + `image-helpers.js` + `use-responsive-image.jsx` — this is
  Base44's image-resizing wrapper. **Keep it.** It only special-cases `media.base44.com` /
  `static.wixstatic.com` and passes every other host through unchanged, so it is safe and needs no edit.

### 13.4 KEEP — do NOT delete or modify (the real app)

```
src/main.jsx
src/index.css                       # all design tokens (ivory / forest-green, Fraunces + Inter)
src/lib/utils.js                     # cn()
src/lib/query-client.js
src/components/AppLayout.jsx
src/components/SiteNav.jsx           # calls base44.auth.me() -> satisfied by the shim's dev user
src/components/ScrollToTop.jsx
src/components/MapPanel.jsx
src/components/LocationSearch.jsx
src/components/AnalysisDashboard.jsx
src/components/StatCard.jsx
src/components/ScoreGauge.jsx
src/components/LandCoverPie.jsx
src/components/ui/**                 # ALL shadcn/ui primitives — untouched
src/pages/Home.jsx
src/pages/Analyze.jsx
src/pages/History.jsx
src/pages/AnalysisDetail.jsx
index.html
tailwind.config.js
postcss.config.js
components.json
jsconfig.json
eslint.config.js
```

### 13.5 Why each DELETE is safe
- The five `pages/Login|Register|ForgotPassword|ResetPassword|OAuthConsent` and the four auth
  components exist only to talk to Base44's hosted login — with no accounts in this build they are
  dead weight, and removing them is what lets §8 delete the auth gate with no dangling imports.
- `app-params.js`, `AuthContext.jsx`, `authReturnTo.js` are the platform's auth/param plumbing —
  only the deleted auth files and the old `base44Client.js` imported them.
- `src/utils/index.ts` (`createPageUrl`) is a Base44 routing helper this app never calls — its only
  occurrence is its own definition.
- `base44/` holds the platform's entity schemas — **keep `Analysis.jsonc` open as a field reference**
  when building the local JSON store (§7 lists the same fields), then delete the folder.
- `AGENTS.md` / `CLAUDE.md` / `.npmrc` / `README.md` are Base44's repo conventions, not app code.

### 13.6 Final check after cleanup
`npm run build` must succeed and `npm run dev` must boot both servers with **no "unresolved import"
errors** — any such error means a DELETE list was applied incompletely or a REWRITE was skipped.

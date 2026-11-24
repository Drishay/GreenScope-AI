# GreenScope AI

A geospatial environmental assessment platform with a React frontend, Node/Express application API, and an optional Python satellite-analysis service.

## Local application

1. Install Node.js dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and configure the existing database/session values.
3. Start the web app and Node API:
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - Node API: http://localhost:3001

## Real satellite analysis (first integration)

The analysis endpoint now requires a drawn GeoJSON polygon and forwards it to the Python service. It does not silently fall back to synthetic analysis.

1. Register a Google Cloud project for Earth Engine and create a service-account key.
2. Configure `EE_PROJECT`, `EE_SERVICE_ACCOUNT`, `EE_SERVICE_ACCOUNT_KEY_JSON`, and `SATELLITE_SERVICE_TOKEN` in the Python service environment.
3. Configure `SATELLITE_SERVICE_URL` and the same `SATELLITE_SERVICE_TOKEN` in the Node API environment.
4. Start the Python service:
   ```bash
   cd satellite_service
   python -m venv .venv
   # Windows: .venv\\Scripts\\activate
   # macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

See [satellite_service/README.md](satellite_service/README.md) for the full setup.

## Current satellite-analysis scope

- Sentinel-2 SR Harmonized imagery, with cloud/shadow masking and acquisition date.
- Google Dynamic World 10 m ML land-cover predictions.
- Vegetation, combined built-up, open/bare land and water area shares.
- Original and classified image previews.
- Roads are not separately classified in this iteration; Dynamic World combines roads and buildings in its built-up class.
- Carbon emissions, absorption, tree equivalents and composite sustainability scores are intentionally not generated until defensible factors and operational data are integrated.

All results are indicative decision-support information, not a certified environmental audit.

# GreenScope satellite analysis service

This FastAPI service retrieves Sentinel-2 imagery and runs land-cover analysis using Google Dynamic World through Google Earth Engine.

## 1. Install

Python 3.10+ is recommended.

```bash
cd satellite_service
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Configure Earth Engine

Register a Google Cloud project for Earth Engine and create a service account with Earth Engine access. Set these environment variables in the service environment:

- `EE_PROJECT`: Google Cloud project ID registered for Earth Engine.
- `EE_SERVICE_ACCOUNT`: service-account email.
- `EE_PRIVATE_KEY`: service-account private key PEM. Keep this secret; never add it to Git or frontend variables.

For local development, set them in your shell or a private `.env` file loaded by your deployment platform.

## 3. Run

```bash
uvicorn main:app --reload --port 8000
```

Health check: `http://localhost:8000/health`

## 4. Connect the Node API

Set `SATELLITE_SERVICE_URL=http://localhost:8000` in the Node API environment. The React app continues to call the existing `POST /api/analyze` endpoint; Node forwards the validated GeoJSON polygon to this service.

## Data and interpretation

- Sentinel-2 SR Harmonized supplies the visual satellite image. The response includes the selected scene acquisition date.
- Google Dynamic World supplies 10 m ML land-cover labels. The current implementation aggregates trees, grass, flooded vegetation, crops and shrub/scrub into vegetation; built into built-up; bare and snow/ice into open land; and water separately.
- Dynamic World does not distinguish roads from buildings. The built-up result must not be presented as building-only. A later OSM overlay can provide a separate road network estimate.
- Carbon impact, carbon absorption, tree counts and composite sustainability scores are intentionally returned as null. These require separately validated methods and/or verified operational data.
- Outputs are indicative decision-support estimates, not certified environmental measurements.

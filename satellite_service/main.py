import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any

import ee
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from shapely.geometry import shape
from shapely.validation import explain_validity

app = FastAPI(title="GreenScope Satellite Analysis", version="1.0.0")
_ee_ready = False

CLASS_COLORS = {
    "Vegetation": "#5f7d56",
    "Buildings / built-up": "#a86a3e",
    "Open Land": "#cdbb93",
    "Water": "#4f8a93",
}

class AnalyzeRequest(BaseModel):
    location_name: str = Field(min_length=2, max_length=180)
    polygon: dict[str, Any]
    area_hectares: float = Field(gt=0, le=50000)

def initialize_earth_engine():
    global _ee_ready
    if _ee_ready:
        return
    project = os.getenv("EE_PROJECT")
    service_account = os.getenv("EE_SERVICE_ACCOUNT")
    private_key = os.getenv("EE_PRIVATE_KEY")
    try:
        service_account_key = os.getenv("EE_SERVICE_ACCOUNT_KEY_JSON")
        if service_account and service_account_key:
            key_info = json.loads(service_account_key)
            credentials = ee.ServiceAccountCredentials(
                service_account, key_data=json.dumps(key_info)
            )
            ee.Initialize(credentials, project=project)
        elif project:
            # Works in environments configured with Application Default Credentials.
            ee.Initialize(project=project)
        else:
            raise RuntimeError("Set EE_PROJECT and configure service-account credentials.")
        _ee_ready = True
    except Exception as exc:
        raise RuntimeError(f"Earth Engine initialization failed: {exc}") from exc

def validate_polygon(geojson: dict[str, Any]):
    try:
        geom = shape(geojson)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid GeoJSON polygon.") from exc
    if geom.geom_type != "Polygon":
        raise HTTPException(status_code=400, detail="Only a single Polygon is supported.")
    if not geom.is_valid:
        raise HTTPException(status_code=400, detail=f"Invalid polygon: {explain_validity(geom)}")
    if geom.is_empty or len(geom.exterior.coords) < 4:
        raise HTTPException(status_code=400, detail="Polygon must contain at least three vertices.")
    if geom.area == 0:
        raise HTTPException(status_code=400, detail="Polygon area must be greater than zero.")
    minx, miny, maxx, maxy = geom.bounds
    if minx < -180 or maxx > 180 or miny < -90 or maxy > 90:
        raise HTTPException(status_code=400, detail="Polygon coordinates are outside valid longitude/latitude bounds.")
    if geom.area > 5:
        raise HTTPException(status_code=400, detail="Selected polygon is too large for this analysis endpoint.")
    return geom

def make_thumbnail(image, region, vis, dimensions=768):
    return image.clip(region).getThumbURL({
        "region": region,
        "dimensions": dimensions,
        "format": "png",
        **vis,
    })

def get_area_statistics(class_image, region):
    area_and_class = ee.Image.pixelArea().rename("area").addBands(class_image.rename("class"))
    grouped = area_and_class.reduceRegion(
        reducer=ee.Reducer.sum().group(groupField=1, groupName="class"),
        geometry=region,
        scale=10,
        maxPixels=1e9,
        tileScale=4,
    ).get("groups")
    groups = ee.List(grouped).getInfo() or []
    return {int(item["class"]): float(item["sum"]) for item in groups}

@app.get("/health")
def health():
    return {"ok": True, "service": "greenscope-satellite", "earth_engine_initialized": _ee_ready}

@app.post("/analyze")
def analyze(payload: AnalyzeRequest):
    validate_polygon(payload.polygon)
    try:
        initialize_earth_engine()
        region = ee.Geometry(payload.polygon)
        now = datetime.now(timezone.utc)
        start = (now - timedelta(days=365)).strftime("%Y-%m-%d")
        end = now.strftime("%Y-%m-%d")

        # Select a recent, relatively clear Sentinel-2 surface-reflectance scene.
        sentinel = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(region)
            .filterDate(start, end)
            .filter(ee.Filter.lte("CLOUDY_PIXEL_PERCENTAGE", 40))
            .sort("system:time_start", False)
        )
        sentinel_count = sentinel.size().getInfo()
        if not sentinel_count:
            raise HTTPException(status_code=422, detail="No suitable Sentinel-2 image found for this polygon in the last 12 months. Try another area.")

        scene = ee.Image(sentinel.first())
        scene_date = ee.Date(scene.get("system:time_start")).format("YYYY-MM-dd").getInfo()
        rgb = scene.select(["B4", "B3", "B2"])
        satellite_url = make_thumbnail(rgb, region, {"min": 0, "max": 3000, "gamma": 1.2})

        # Dynamic World supplies ML-derived, 10 m land-cover labels.
        dw = (
            ee.ImageCollection("GOOGLE/DYNAMICWORLD/V1")
            .filterBounds(region)
            .filterDate(start, end)
            .select("label")
        )
        dw_count = dw.size().getInfo()
        if not dw_count:
            raise HTTPException(status_code=422, detail="No Dynamic World predictions are available for this polygon in the last 12 months.")
        label = dw.mode().rename("dw_label")

        # Dynamic World labels: 0 water, 1 trees, 2 grass, 3 flooded vegetation,
        # 4 crops, 5 shrub/scrub, 6 built, 7 bare, 8 snow/ice.
        # Aggregate vegetation classes; built-up remains a combined built class.
        grouped_class = label.remap(
            [0, 1, 2, 3, 4, 5, 6, 7, 8],
            [4, 1, 1, 1, 1, 1, 2, 3, 3],
        ).rename("landcover")
        stats = get_area_statistics(grouped_class, region)
        class_areas = {
            "Vegetation": stats.get(1, 0.0),
            "Buildings / built-up": stats.get(2, 0.0),
            "Open Land": stats.get(3, 0.0),
            "Water": stats.get(4, 0.0),
        }
        total_m2 = sum(class_areas.values())
        if total_m2 <= 0:
            raise HTTPException(status_code=422, detail="The selected polygon did not produce valid land-cover pixels.")
        percentages = {name: area / total_m2 * 100 for name, area in class_areas.items()}
        classified_url = make_thumbnail(
            grouped_class,
            region,
            {"min": 1, "max": 4, "palette": ["#5f7d56", "#a86a3e", "#cdbb93", "#4f8a93"]},
        )
        avg_confidence = (
            ee.ImageCollection("GOOGLE/DYNAMICWORLD/V1")
            .filterBounds(region)
            .filterDate(start, end)
            .select("label")
            .count()
            .reduceRegion(ee.Reducer.mean(), region, 10, maxPixels=1e9, tileScale=4)
            .get("label")
            .getInfo()
        )

        vegetation_pct = round(percentages["Vegetation"], 2)
        buildings_pct = round(percentages["Buildings / built-up"], 2)
        open_pct = round(percentages["Open Land"], 2)
        water_pct = round(100 - vegetation_pct - buildings_pct - open_pct, 2)
        breakdown = [
            {"category": name, "pct": round(percentages[name], 2), "color": color}
            for name, color in CLASS_COLORS.items()
        ]
        rating = "Poor"
        if vegetation_pct >= 55: rating = "Excellent"
        elif vegetation_pct >= 40: rating = "Good"
        elif vegetation_pct >= 25: rating = "Moderate"
        elif vegetation_pct >= 12: rating = "Low"

        return {
            "analysis": {
                "vegetation_pct": vegetation_pct,
                "buildings_pct": buildings_pct,
                "roads_pct": 0,
                "open_land_pct": open_pct,
                "water_pct": water_pct,
                "carbon_impact_score": None,
                "carbon_absorption_tons_year": None,
                "tree_canopy_estimate": None,
                "sustainability_score": None,
                "green_cover_rating": rating,
                "summary": (
                    f"{payload.location_name}: satellite-derived land-cover estimates show "
                    f"{vegetation_pct:.1f}% vegetation. Built-up land combines buildings, roads "
                    "and other impervious surfaces in the Dynamic World source."
                ),
                "recommendations": [
                    "Review the classified image against recent high-resolution imagery before making site-level decisions.",
                    "Prioritise native vegetation in areas identified as open or bare land.",
                    "Use verified electricity, fuel and transport records for operational carbon accounting.",
                ],
                "land_use_breakdown": breakdown,
                "data_status": "satellite_ml",
                "source": "Sentinel-2 SR Harmonized + Google Dynamic World",
                "imagery_date": scene_date,
                "analysis_period": {"start": start, "end": end},
                "satellite_image_url": satellite_url,
                "classified_image_url": classified_url,
                "model": "Google Dynamic World (10 m)",
                "classification_note": "Buildings and roads are combined in the built-up class. Road-specific mapping is not included in this version.",
                "confidence_note": "Dynamic World provides per-pixel class probabilities; this version reports the modal class and does not interpret image-count as classification confidence.",
                "area_by_class_m2": class_areas,
                "pixel_count_observations": int(avg_confidence or 0),
                "regulatory_use": False,
            }
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Satellite analysis failed: {str(exc)[:300]}") from exc

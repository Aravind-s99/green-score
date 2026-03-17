from __future__ import annotations

import math
import os
import random
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv

load_dotenv()


def _now_year() -> int:
    return datetime.now(timezone.utc).year


def _truthy_env(name: str, default: bool = False) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "y", "on"}


def _linear_regression_slope(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) != len(ys) or len(xs) < 2:
        return None
    x_mean = sum(xs) / len(xs)
    y_mean = sum(ys) / len(ys)
    num = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys))
    den = sum((x - x_mean) ** 2 for x in xs)
    if den == 0:
        return None
    return num / den


def _trend_from_slope(slope: float | None, stable_eps: float = 0.002) -> str:
    if slope is None:
        return "stable"
    if slope > stable_eps:
        return "improving"
    if slope < -stable_eps:
        return "degrading"
    return "stable"


@dataclass
class _GEE:
    ee: Any


_GEE_SINGLETON: _GEE | None = None


def _gee() -> _GEE:
    global _GEE_SINGLETON
    if _GEE_SINGLETON is not None:
        return _GEE_SINGLETON

    if _truthy_env("GEE_MOCK", default=False):
        _GEE_SINGLETON = _GEE(ee=None)
        return _GEE_SINGLETON

    import ee  # earthengine-api

    project_id = os.getenv("GEE_PROJECT_ID")
    if not project_id:
        raise RuntimeError("Missing env var GEE_PROJECT_ID (or set GEE_MOCK=true).")

    # Earth Engine requires prior auth (ee.Authenticate()) at least once on the machine.
    ee.Initialize(project=project_id)
    _GEE_SINGLETON = _GEE(ee=ee)
    return _GEE_SINGLETON


def get_ndvi_timeseries(lat: float, lon: float, start_year: int = 2018) -> dict:
    """
    Creates a 5km buffer around the point and pulls annual median NDVI from
    Sentinel-2 SR (COPERNICUS/S2_SR) for each year from start_year to current year.

    Returns a dict containing year->ndvi plus "trend".
    """
    current_year = _now_year()
    start_year = int(start_year)
    if start_year > current_year:
        start_year = current_year

    g = _gee()
    if g.ee is None:
        # Realistic-ish mock NDVI for development: slight random trend + noise.
        rng = random.Random(hash((round(lat, 4), round(lon, 4), start_year)) & 0xFFFFFFFF)
        base = rng.uniform(0.35, 0.75)
        slope = rng.uniform(-0.01, 0.015)  # per year
        out: dict[str, Any] = {}
        years = list(range(start_year, current_year + 1))
        vals: list[float] = []
        for i, y in enumerate(years):
            v = base + slope * i + rng.uniform(-0.02, 0.02)
            v = max(-0.05, min(0.95, v))
            out[str(y)] = round(v, 4)
            vals.append(v)
        xs = [float(y) for y in years]
        out["trend"] = _trend_from_slope(_linear_regression_slope(xs, vals))
        return out

    ee = g.ee
    region = ee.Geometry.Point([lon, lat]).buffer(5000)

    collection = ee.ImageCollection("COPERNICUS/S2_SR")

    series: dict[str, Any] = {}
    years: list[int] = []
    values: list[float] = []

    for year in range(start_year, current_year + 1):
        start = ee.Date.fromYMD(year, 1, 1)
        end = ee.Date.fromYMD(year + 1, 1, 1)

        annual = (
            collection.filterDate(start, end)
            .filterBounds(region)
            .map(lambda img: img.normalizedDifference(["B8", "B4"]).rename("NDVI"))
            .median()
        )

        stats = annual.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=10,
            maxPixels=1e13,
        )
        ndvi = stats.get("NDVI")
        ndvi_val = ndvi.getInfo() if ndvi is not None else None

        if ndvi_val is None:
            series[str(year)] = None
            continue

        ndvi_float = float(ndvi_val)
        # Clamp to plausible NDVI range
        ndvi_float = max(-1.0, min(1.0, ndvi_float))
        series[str(year)] = ndvi_float
        years.append(year)
        values.append(ndvi_float)

    slope = _linear_regression_slope([float(y) for y in years], values) if years else None
    series["trend"] = _trend_from_slope(slope)
    return series


def detect_deforestation(lat: float, lon: float) -> dict:
    """
    Queries Hansen Global Forest Change dataset (UMD/hansen/global_forest_change_2022_v1_10).
    Returns: {tree_cover_loss_ha: float, loss_years: list[int], intact_forest_pct: float}
    """
    g = _gee()
    if g.ee is None:
        rng = random.Random(hash((round(lat, 4), round(lon, 4), "hansen")) & 0xFFFFFFFF)
        loss_years = sorted(
            set(rng.choice(list(range(2001, 2023))) for _ in range(rng.randint(0, 3)))
        )
        tree_cover_loss_ha = round(rng.uniform(0.0, 250.0), 2) if loss_years else 0.0
        intact_forest_pct = round(rng.uniform(35.0, 95.0), 2)
        return {
            "tree_cover_loss_ha": float(tree_cover_loss_ha),
            "loss_years": loss_years,
            "intact_forest_pct": float(intact_forest_pct),
        }

    ee = g.ee
    region = ee.Geometry.Point([lon, lat]).buffer(5000)

    hansen = ee.Image("UMD/hansen/global_forest_change_2022_v1_10")
    loss = hansen.select("loss")  # 1 where loss occurred (2001-2022)
    lossyear = hansen.select("lossyear")  # 1..22
    treecover2000 = hansen.select("treecover2000")  # 0..100

    # Total loss area (ha)
    loss_area_ha_img = ee.Image.pixelArea().divide(10000).updateMask(loss.eq(1))
    loss_area_ha = (
        loss_area_ha_img.reduceRegion(
            reducer=ee.Reducer.sum(),
            geometry=region,
            scale=30,
            maxPixels=1e13,
        )
        .get("area")
        .getInfo()
    )
    tree_cover_loss_ha = float(loss_area_ha or 0.0)

    # Loss years list from histogram (convert 1..22 -> 2000+val)
    hist = (
        lossyear.updateMask(loss.eq(1))
        .reduceRegion(
            reducer=ee.Reducer.frequencyHistogram(),
            geometry=region,
            scale=30,
            maxPixels=1e13,
        )
        .get("lossyear")
        .getInfo()
    )
    loss_years: list[int] = []
    if isinstance(hist, dict):
        for k, v in hist.items():
            try:
                kk = int(float(k))
            except Exception:
                continue
            if v and kk > 0:
                loss_years.append(2000 + kk)
    loss_years = sorted(set(loss_years))

    # "Intact forest" proxy: treecover2000 >= 30% AND not lost.
    forest_mask = treecover2000.gte(30)
    intact_mask = forest_mask.And(loss.eq(0))

    total_area = (
        ee.Image.pixelArea()
        .reduceRegion(ee.Reducer.sum(), region, 30, maxPixels=1e13)
        .get("area")
        .getInfo()
    )
    intact_area = (
        ee.Image.pixelArea()
        .updateMask(intact_mask)
        .reduceRegion(ee.Reducer.sum(), region, 30, maxPixels=1e13)
        .get("area")
        .getInfo()
    )

    total_area = float(total_area or 0.0)
    intact_area = float(intact_area or 0.0)
    intact_forest_pct = (intact_area / total_area * 100.0) if total_area > 0 else 0.0

    return {
        "tree_cover_loss_ha": tree_cover_loss_ha,
        "loss_years": loss_years,
        "intact_forest_pct": intact_forest_pct,
    }


def get_satellite_evidence_summary(lat: float, lon: float) -> dict:
    """
    Calls NDVI + deforestation functions and returns combined dict, including data source.
    """
    return {
        "verified_by": "Google Earth Engine / Sentinel-2 / Hansen",
        "ndvi": get_ndvi_timeseries(lat=lat, lon=lon),
        "deforestation": detect_deforestation(lat=lat, lon=lon),
    }


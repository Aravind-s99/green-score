from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ai.scorer import GreenScorer
from ai.satellite import get_satellite_evidence_summary
from scraper.verra import VerraScraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


router = APIRouter(prefix="/api")


class ScoreRequest(BaseModel):
    project_id: str = Field(..., min_length=1)
    registry: Literal["verra"] = "verra"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _parse_dt(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        v = value.strip()
        if v.endswith("Z"):
            v = v[:-1] + "+00:00"
        try:
            dt = datetime.fromisoformat(v)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            return None
    return None


def _supabase_client():
    """Returns a Supabase client, or None if credentials are not configured."""
    import os

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        return None

    try:
        from supabase import create_client  # type: ignore
        return create_client(url, key)
    except Exception:
        return None


def _run_scoring_pipeline(project_id: str, registry: str) -> dict:
    if registry != "verra":
        raise HTTPException(status_code=400, detail=f'Registry "{registry}" not implemented yet.')

    # 1) Scraper
    try:
        scraper = VerraScraper()
        verra_detail = scraper.get_project_detail(project_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Scraping failed (verra): {e}")

    coords = verra_detail.get("coordinates") if isinstance(verra_detail, dict) else None
    lat = coords.get("lat") if isinstance(coords, dict) else None
    lon = coords.get("lon") if isinstance(coords, dict) else None
    coords_missing = not isinstance(lat, (int, float)) or not isinstance(lon, (int, float))
    if coords_missing:
        # Fall back to a central-Africa reference point so satellite still runs.
        # The scorer will flag this as missing_coordinates in risk_flags.
        lat, lon = 0.0, 20.0

    # 2) Satellite
    try:
        sat = get_satellite_evidence_summary(float(lat), float(lon))
    except Exception as e:
        logger.warning(f"Satellite step failed: {e}")
        sat = {
            'ndvi_trend': 'unknown',
            'ndvi': {},
            'deforestation': {
                'intact_forest_pct': 0,
                'tree_cover_loss_ha': 0,
                'loss_years': [],
            },
            'verified_by': 'Unavailable'
        }

    # 3) Scorer
    try:
        scorer = GreenScorer(load_summarizer_on_init=False)
        score = scorer.calculate_green_score({"verra": verra_detail, "satellite": sat})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed (transformers): {e}")

    return score


def _save_score_to_supabase(*, project_id: str, registry: str, score: dict) -> None:
    sb = _supabase_client()
    if sb is None:
        return  # Supabase not configured — skip caching silently
    created_at = _utcnow().isoformat()
    payload = {
        "project_id": project_id,
        "registry": registry,
        "score_json": score,
        "created_at": created_at,
    }
    try:
        sb.table("project_scores").insert(payload).execute()
    except Exception:
        pass  # Cache write failure is non-fatal


def _get_cached_score(*, project_id: str, registry: str) -> dict | None:
    sb = _supabase_client()
    if sb is None:
        return None  # Supabase not configured — always compute fresh
    try:
        res = (
            sb.table("project_scores")
            .select("score_json,created_at")
            .eq("project_id", project_id)
            .eq("registry", registry)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
    except Exception:
        return None  # Cache read failure is non-fatal

    data = getattr(res, "data", None)
    if not data:
        return None

    row = data[0]
    created_at = _parse_dt(row.get("created_at"))
    if not created_at:
        return None

    if _utcnow() - created_at > timedelta(days=7):
        return None

    score_json = row.get("score_json")
    return score_json if isinstance(score_json, dict) else None


@router.post("/score")
def post_score(body: ScoreRequest):
    score = _run_scoring_pipeline(body.project_id, body.registry)
    _save_score_to_supabase(project_id=body.project_id, registry=body.registry, score=score)
    return score


@router.get("/score/{project_id}")
def get_score(project_id: str, registry: Literal["verra"] = "verra"):
    cached = _get_cached_score(project_id=project_id, registry=registry)
    if cached is not None:
        return cached

    score = _run_scoring_pipeline(project_id, registry)
    _save_score_to_supabase(project_id=project_id, registry=registry, score=score)
    return score


@router.get("/search")
def search_projects(q: str):
    try:
        verra = VerraScraper()
        results = verra.search_projects(q)
        return results
    except Exception as e:
        logging.warning(f"Verra search failed: {e}")
        raise HTTPException(status_code=502, detail=f"Search failed: {e}")


@router.get("/projects/featured")
def featured_projects():
    return {
        "registry": "verra",
        "project_ids": ["1360", "902", "1478", "844", "2366", "1748"],
    }


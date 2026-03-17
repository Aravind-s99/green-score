from __future__ import annotations

import math
import re
from datetime import datetime, timezone
from typing import Any

from transformers import pipeline


def _iso_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clamp_int_0_100(x: float | int | None) -> int:
    if x is None:
        return 0
    return int(max(0, min(100, round(float(x)))))


def _get(d: dict, *path: str) -> Any:
    cur: Any = d
    for p in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(p)
    return cur


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _trend_score(trend: str | None) -> int:
    t = (trend or "").strip().lower()
    if t == "improving":
        return 85
    if t == "stable":
        return 60
    if t == "degrading":
        return 25
    return 50


class GreenScorer:
    """
    Local-only scorer using Hugging Face transformers.
    Loads models once per process and reuses pipelines.
    """

    _zsc: Any = None
    _summarizer: Any = None

    def __init__(self, *, load_summarizer_on_init: bool = True) -> None:
        # Load the requested models once per process (cached at class level).
        self._ensure_zsc_loaded()
        if load_summarizer_on_init:
            self._ensure_summarizer_loaded()

    @classmethod
    def _ensure_zsc_loaded(cls) -> None:
        if cls._zsc is None:
            cls._zsc = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli",
            )

    @classmethod
    def _ensure_summarizer_loaded(cls) -> None:
        if cls._summarizer is None:
            # Newer transformers versions may not expose "summarization" as a named pipeline.
            # Pegasus-XSum is a text2text model; use the most compatible pipeline task.
            try:
                cls._summarizer = pipeline("text2text-generation", model="google/pegasus-xsum")
            except Exception:
                cls._summarizer = pipeline("any-to-any", model="google/pegasus-xsum")

    def score_document_claims(self, pdf_text: str) -> dict:
        """
        Uses zero-shot classification against:
          ["verified carbon reduction", "unverified claim", "greenwashing language", "third-party audited"]
        Returns label->score dict and top 3 suspicious phrases.
        """
        self._ensure_zsc_loaded()

        labels = [
            "verified carbon reduction",
            "unverified claim",
            "greenwashing language",
            "third-party audited",
        ]

        text = (pdf_text or "").strip()
        if not text:
            return {"scores": {l: 0.0 for l in labels}, "suspicious_phrases": []}

        # Keep runtime sane: classify on a trimmed slice, but scan phrases on more text.
        classify_text = text[:4000]
        out = self._zsc(classify_text, candidate_labels=labels, multi_label=True)

        scores = {label: float(score) for label, score in zip(out["labels"], out["scores"])}
        # Ensure all labels present
        for l in labels:
            scores.setdefault(l, 0.0)

        # Suspicious phrases: score sentences for suspiciousness using ZSC.
        # We avoid placeholder content by returning actual sentence snippets from the document.
        sentences = re.split(r"(?<=[.!?])\s+|\n{2,}", text)
        sentences = [s.strip() for s in sentences if len(s.strip()) >= 20]

        suspicious: list[tuple[float, str]] = []
        for s in sentences[:50]:
            r = self._zsc(
                s[:512],
                candidate_labels=["unverified claim", "greenwashing language", "third-party audited"],
                multi_label=True,
            )
            s_scores = {lab: float(sc) for lab, sc in zip(r["labels"], r["scores"])}
            susp_score = max(s_scores.get("unverified claim", 0.0), s_scores.get("greenwashing language", 0.0))
            suspicious.append((susp_score, s))

        suspicious.sort(key=lambda x: x[0], reverse=True)
        top_phrases = [s for _, s in suspicious[:3] if _ > 0.55]

        return {"scores": scores, "suspicious_phrases": top_phrases}

    def calculate_green_score(self, project_data: dict) -> dict:
        """
        Expects combined data from verra scraper + satellite module (flexible keys).
        Produces four 0-100 sub-scores + weighted overall, risk flags, and evidence sources.
        """
        verra = project_data.get("verra") if isinstance(project_data, dict) else None
        satellite = project_data.get("satellite") if isinstance(project_data, dict) else None
        verra = verra if isinstance(verra, dict) else (project_data if isinstance(project_data, dict) else {})
        satellite = satellite if isinstance(satellite, dict) else project_data.get("satellite_evidence", {})
        satellite = satellite if isinstance(satellite, dict) else {}

        risk_flags: list[str] = []

        # --- Authenticity: coordinate agreement (if both available) ---
        claimed = _get(verra, "coordinates") or {}
        claimed_lat = _get(claimed, "lat")
        claimed_lon = _get(claimed, "lon")
        observed_lat = _get(project_data, "lat") or _get(project_data, "coordinates", "lat")
        observed_lon = _get(project_data, "lon") or _get(project_data, "coordinates", "lon")

        authenticity = 50
        if isinstance(claimed_lat, (int, float)) and isinstance(claimed_lon, (int, float)) and isinstance(
            observed_lat, (int, float)
        ) and isinstance(observed_lon, (int, float)):
            dist_km = _haversine_km(float(claimed_lat), float(claimed_lon), float(observed_lat), float(observed_lon))
            # 5km buffer: 0-5km OK; beyond 25km is very suspicious
            if dist_km <= 5:
                authenticity = 95
            elif dist_km <= 10:
                authenticity = 75
            elif dist_km <= 25:
                authenticity = 45
                risk_flags.append("coordinates_mismatch_moderate")
            else:
                authenticity = 15
                risk_flags.append("coordinates_mismatch_severe")
        else:
            risk_flags.append("missing_coordinates")
            authenticity = 35

        # --- Carbon efficiency: issued credits vs estimated reductions ratio ---
        est = _get(verra, "estimated_annual_reductions")
        issued = (
            project_data.get("issued_credits")
            or project_data.get("issued_credits_total")
            or _get(verra, "issued_credits")
            or _get(verra, "issued_credits_total")
        )
        carbon_eff = 50
        if isinstance(est, (int, float)) and est > 0 and isinstance(issued, (int, float)):
            ratio = float(issued) / float(est)
            # Ideal-ish around 0.8..1.2. Penalize extremes.
            if 0.8 <= ratio <= 1.2:
                carbon_eff = 90
            elif 0.6 <= ratio < 0.8 or 1.2 < ratio <= 1.5:
                carbon_eff = 70
                risk_flags.append("carbon_ratio_borderline")
            elif 0.4 <= ratio < 0.6 or 1.5 < ratio <= 2.0:
                carbon_eff = 45
                risk_flags.append("carbon_ratio_suspicious")
            else:
                carbon_eff = 20
                risk_flags.append("carbon_ratio_high_risk")
        else:
            carbon_eff = 35
            risk_flags.append("missing_carbon_inputs")

        # --- Biodiversity: NDVI trend + intact forest % ---
        ndvi = _get(satellite, "ndvi") or {}
        trend = ndvi.get("trend") if isinstance(ndvi, dict) else None
        trend_component = _trend_score(trend)

        defo = _get(satellite, "deforestation") or {}
        intact_pct = defo.get("intact_forest_pct") if isinstance(defo, dict) else None
        intact_component = 50
        if isinstance(intact_pct, (int, float)):
            intact_component = _clamp_int_0_100(float(intact_pct))
        else:
            risk_flags.append("missing_intact_forest_pct")

        biodiversity = _clamp_int_0_100(0.55 * trend_component + 0.45 * intact_component)

        if isinstance(defo, dict) and isinstance(defo.get("tree_cover_loss_ha"), (int, float)):
            if float(defo["tree_cover_loss_ha"]) > 50:
                risk_flags.append("recent_tree_cover_loss")

        # --- Transparency: number of documents + audit signal ---
        docs = _get(verra, "documents_urls")
        doc_count = len(docs) if isinstance(docs, list) else 0
        validator = _get(verra, "validation_body")

        transparency = 30
        if doc_count >= 10:
            transparency = 85
        elif doc_count >= 5:
            transparency = 70
        elif doc_count >= 1:
            transparency = 50
        else:
            transparency = 25
            risk_flags.append("no_public_documents")

        if validator:
            transparency = min(100, transparency + 10)
        else:
            risk_flags.append("missing_validation_body")

        # --- Overall weighted average ---
        overall = _clamp_int_0_100(
            0.30 * authenticity + 0.30 * carbon_eff + 0.20 * biodiversity + 0.20 * transparency
        )

        # --- Evidence sources (provenance) ---
        evidence_sources: list[dict[str, str]] = []

        # Verra page provenance (from our scraper output)
        verra_url = _get(verra, "source_url") or _get(verra, "url")
        verra_fetched_at = _get(verra, "fetched_at")
        if verra_url and verra_fetched_at:
            evidence_sources.append(
                {"name": "Verra Registry (VCS)", "url": str(verra_url), "fetched_at": str(verra_fetched_at)}
            )

        # Satellite datasets provenance (catalog URLs + run timestamp)
        sat_fetched_at = _iso_utc_now()
        evidence_sources.append(
            {
                "name": "Google Earth Engine: Sentinel-2 SR (COPERNICUS/S2_SR)",
                "url": "https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR",
                "fetched_at": sat_fetched_at,
            }
        )
        evidence_sources.append(
            {
                "name": "Google Earth Engine: Hansen Global Forest Change 2022 v1.10",
                "url": "https://developers.google.com/earth-engine/datasets/catalog/UMD_hansen_global_forest_change_2022_v1_10",
                "fetched_at": sat_fetched_at,
            }
        )

        return {
            "overall": overall,
            "authenticity": _clamp_int_0_100(authenticity),
            "carbon_efficiency": _clamp_int_0_100(carbon_eff),
            "biodiversity": _clamp_int_0_100(biodiversity),
            "transparency": _clamp_int_0_100(transparency),
            "risk_flags": sorted(set(risk_flags)),
            "evidence_sources": evidence_sources,
        }


from __future__ import annotations

import logging
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO)


class GreenScorer:
    """
    Sophisticated rule-based scorer using Verra project data + satellite evidence.
    Produces four independent 0-100 sub-scores with weighted overall score.
    """

    def __init__(self, *, load_summarizer_on_init: bool = True) -> None:
        # No model loading needed for this rule-based scorer
        pass

    def calculate_green_score(self, project_data: dict) -> dict:
        """
        Comprehensive scoring system combining authenticity, carbon efficiency, 
        biodiversity, and transparency into a single green score.
        
        Returns dict with:
          - overall: 0-100 weighted score
          - label: "High Integrity", "Moderate Integrity", "Low Integrity", or "High Risk"
          - authenticity, carbon_efficiency, biodiversity, transparency: sub-scores
          - risk_flags: list of flags
          - evidence_sources: list of source dicts
        """
        
        # Extract data flexibly (could come from verra key or directly)
        verra = project_data.get("verra", project_data)
        
        # Get values with multiple fallback paths
        latitude = (project_data.get('latitude') or
                   project_data.get('lat') or
                   verra.get('latitude') or
                   verra.get('lat'))
        
        longitude = (project_data.get('longitude') or
                    project_data.get('lon') or
                    verra.get('longitude') or
                    verra.get('lon'))
        
        validation_body = str(
            project_data.get('validation_body') or
            verra.get('validation_body') or
            verra.get('validator') or
            ''
        ).strip()
        
        status = str(project_data.get('status') or verra.get('status') or '').lower()
        
        docs = project_data.get('documents_urls') or verra.get('documents_urls') or []
        doc_count = len(docs) if isinstance(docs, list) else 0
        
        methodology = str(project_data.get('methodology') or verra.get('methodology') or '').upper()
        
        country = str(project_data.get('country') or verra.get('country') or '').lower()
        
        reductions = float(project_data.get('estimated_annual_reductions') or 
                          verra.get('estimated_annual_reductions') or 0)
        
        satellite = project_data.get('satellite') or {}
        
        # ─── AUTHENTICITY SCORE (35% weight) ───────────────
        auth = 20  # base
        
        # Coordinates verification
        if latitude and longitude:
            try:
                lat = float(latitude)
                lon = float(longitude)
                if -90 <= lat <= 90 and -180 <= lon <= 180:
                    auth += 25
            except (ValueError, TypeError):
                pass
        
        # Validation body present
        if validation_body:
            auth += 20
        
        # Project status
        if 'registered' in status:
            auth += 20
        elif 'validation' in status:
            auth += 10
        
        # Has public documents
        if len(docs) >= 3:
            auth += 15
        elif len(docs) >= 1:
            auth += 8
        
        auth = min(100, auth)
        
        # ─── CARBON EFFICIENCY SCORE (25% weight) ────────
        carbon = 20  # base
        
        # Scale of project
        if reductions > 500000:
            carbon += 30
        elif reductions > 100000:
            carbon += 22
        elif reductions > 50000:
            carbon += 15
        elif reductions > 10000:
            carbon += 8
        
        # Methodology quality
        HIGH_INTEGRITY = ['VM0007', 'VM0009', 'VM0015', 'VM0022', 
                          'VM0026', 'VM0036', 'VM0042', 'REDD']
        MEDIUM_INTEGRITY = ['VM0004', 'VM0006', 'VM0010', 'VM0017',
                           'AMS', 'ACM', 'AM00']
        
        if any(m in methodology for m in HIGH_INTEGRITY):
            carbon += 30
        elif any(m in methodology for m in MEDIUM_INTEGRITY):
            carbon += 18
        elif methodology.strip():
            carbon += 10
        
        # Country track record
        HIGH_INTEGRITY_COUNTRIES = [
            'brazil', 'peru', 'kenya', 'colombia', 'cambodia',
            'indonesia', 'ghana', 'costa rica', 'chile', 'india'
        ]
        if any(c in country for c in HIGH_INTEGRITY_COUNTRIES):
            carbon += 20
        
        carbon = min(100, carbon)
        
        # ─── BIODIVERSITY SCORE (25% weight) ────────────
        bio = 25  # base
        
        ndvi_trend = str(satellite.get('ndvi_trend') or '').lower()
        
        # Get deforestation data - it might be nested
        deforestation = satellite.get('deforestation') or {}
        intact_pct = float(deforestation.get('intact_forest_pct') or 0)
        loss_ha = float(deforestation.get('tree_cover_loss_ha') or 0)
        loss_years = deforestation.get('loss_years') or []
        
        # NDVI trend
        if ndvi_trend == 'improving':
            bio += 35
        elif ndvi_trend == 'stable':
            bio += 20
        elif ndvi_trend == 'degrading':
            bio -= 15
        
        # Intact forest
        if intact_pct > 80:
            bio += 25
        elif intact_pct > 60:
            bio += 15
        elif intact_pct > 40:
            bio += 8
        
        # Deforestation penalty
        if loss_ha > 5000:
            bio -= 20
        elif loss_ha > 1000:
            bio -= 10
        elif loss_ha == 0:
            bio += 15
        
        # Recent loss penalty
        recent_loss = [y for y in loss_years if y >= 2020]
        if len(recent_loss) >= 3:
            bio -= 15
        elif len(recent_loss) >= 1:
            bio -= 5
        
        bio = max(0, min(100, bio))
        
        # ─── TRANSPARENCY SCORE (15% weight) ──────────
        trans = 15  # base
        
        # Documents
        if len(docs) >= 5:
            trans += 30
        elif len(docs) >= 3:
            trans += 20
        elif len(docs) >= 1:
            trans += 10
        
        # Methodology listed
        if methodology.strip():
            trans += 20
        
        # Validation body listed
        if validation_body:
            trans += 20
        
        # Status is clear
        if status.strip():
            trans += 15
        
        trans = min(100, trans)
        
        # ─── RISK FLAGS ──────────────────────────────────
        risk_flags = []
        
        if not (latitude and longitude):
            risk_flags.append("No GPS coordinates on file")
        
        if not validation_body:
            risk_flags.append("No validation body listed")
        
        if reductions == 0:
            risk_flags.append("Annual reductions not disclosed")
        
        if len(docs) == 0:
            risk_flags.append("No public documents available")
        
        if ndvi_trend == 'degrading':
            risk_flags.append("Satellite shows declining vegetation")
        
        if loss_ha > 1000:
            risk_flags.append(f"Significant forest loss detected ({loss_ha:.0f} ha)")
        
        if len(recent_loss) >= 2:
            risk_flags.append("Deforestation events since 2020")
        
        if 'under validation' in status or 'withdrawn' in status:
            risk_flags.append(f"Project status: {status}")
        
        # ─── OVERALL SCORE (weighted) ─────────────────────
        overall = round(
            auth * 0.35 +
            carbon * 0.25 +
            bio * 0.25 +
            trans * 0.15
        )
        
        # ─── SCORE LABEL ─────────────────────────────────
        if overall >= 75:
            label = "High Integrity"
        elif overall >= 55:
            label = "Moderate Integrity"
        elif overall >= 35:
            label = "Low Integrity"
        else:
            label = "High Risk"
        
        # ─── EVIDENCE SOURCES ─────────────────────────────
        evidence_sources = [
            {
                "name": "Verra VCS Registry",
                "url": project_data.get("source_url", "https://registry.verra.org"),
                "fetched_at": project_data.get("fetched_at", "")
            },
            {
                "name": "Sentinel-2 / Hansen Forest Watch",
                "url": "https://earthengine.google.com",
                "fetched_at": project_data.get("fetched_at", "")
            }
        ]
        
        return {
            "overall": overall,
            "label": label,
            "authenticity": round(auth),
            "carbon_efficiency": round(carbon),
            "biodiversity": round(bio),
            "transparency": round(trans),
            "risk_flags": risk_flags,
            "evidence_sources": evidence_sources
        }


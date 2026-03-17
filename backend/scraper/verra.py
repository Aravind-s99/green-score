from __future__ import annotations

import json
import os
import re
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


def _iso_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clean(s: str | None) -> str | None:
    if s is None:
        return None
    out = re.sub(r"\s+", " ", s).strip()
    return out or None


def _as_float(s: str | None) -> float | None:
    if not s:
        return None
    m = re.search(r"(-?\d+(?:\.\d+)?)", s.replace(",", ""))
    return float(m.group(1)) if m else None


def _in_range(x: float | None, lo: float, hi: float) -> float | None:
    if x is None:
        return None
    return x if lo <= x <= hi else None


def _as_number(s: str | None) -> float | None:
    if not s:
        return None
    m = re.search(r"(\d+(?:,\d{3})*(?:\.\d+)?)", s)
    if not m:
        return None
    return float(m.group(1).replace(",", ""))


def _absolutize(base: str, href: str) -> str:
    return urljoin(base, href)


def _is_probably_pdf_url(url: str) -> bool:
    p = urlparse(url)
    return p.path.lower().endswith(".pdf") or "pdf" in p.path.lower()


def _is_probably_document_url(url: str) -> bool:
    p = urlparse(url)
    path = p.path.lower()
    return (
        _is_probably_pdf_url(url)
        or "document" in path
        or "download" in path
        or "projectdoc" in path
        or "viewfile" in path
    )


@dataclass
class VerraScraper:
    base_url: str = "https://registry.verra.org"
    delay_seconds: float = 1.0
    timeout_seconds: float = 30.0
    user_agent: str = "green-score/0.1 (requests; +https://registry.verra.org)"

    def __post_init__(self) -> None:
        self._session = requests.Session()
        self._session.headers.update(
            {
                "User-Agent": self.user_agent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }
        )

    def _sleep(self) -> None:
        time.sleep(self.delay_seconds)

    def _get(self, url: str) -> requests.Response:
        self._sleep()
        resp = self._session.get(url, timeout=self.timeout_seconds)
        resp.raise_for_status()
        return resp

    def _get_rendered_html(self, url: str) -> str:
        """
        Render a JS-heavy page with Playwright and return HTML.
        Keeps the same politeness delay semantics as requests.
        """
        self._sleep()
        # Import lazily so basic usage doesn't require Playwright at import time.
        from playwright.sync_api import sync_playwright  # type: ignore

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                context = browser.new_context(
                    user_agent=self.user_agent,
                    viewport={"width": 1365, "height": 900},
                )
                page = context.new_page()
                page.goto(url, wait_until="networkidle", timeout=int(self.timeout_seconds * 1000))
                html = page.content()
                context.close()
                return html
            finally:
                browser.close()

    def search_projects(self, query: str) -> list[dict]:
        """
        Calls the Verra JSON API directly.
        POST https://registry.verra.org/uiapi/resource/resource/search
        Returns list of {project_id, name, country, status, methodology, url}.
        """
        api_url = f"{self.base_url}/uiapi/resource/resource/search"
        q = (query or "").strip()

        payload: dict[str, Any] = {
            "program": "VCS",
            "maxResults": 20,
        }
        if q:
            payload["resourceName"] = q

        headers = {
            "User-Agent": self.user_agent,
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        self._sleep()
        resp = self._session.post(api_url, json=payload, headers=headers, timeout=self.timeout_seconds)
        resp.raise_for_status()

        data = resp.json()
        items: list[Any] = data.get("value", []) if isinstance(data, dict) else []

        results: list[dict[str, Any]] = []
        seen: set[str] = set()
        for item in items[:20]:
            project_id = str(item.get("resourceIdentifier") or "").strip()
            if not project_id or project_id in seen:
                continue
            seen.add(project_id)
            detail_url = f"{self.base_url}/app/projectDetail/VCS/{project_id}"
            methodology = item.get("protocols") or item.get("protocolCategories")
            results.append({
                "project_id": project_id,
                "name": _clean(item.get("resourceName")),
                "country": _clean(item.get("country")),
                "status": _clean(item.get("resourceStatus")),
                "methodology": _clean(methodology),
                "url": detail_url,
            })

        return results

    def get_project_detail(self, project_id: str) -> dict:
        """
        Fetches https://registry.verra.org/app/projectDetail/VCS/{project_id}
        Extracts: name, coordinates (lat/lon), methodology, estimated_annual_reductions,
        validation_body, documents_urls[]
        Adds: source_url, fetched_at
        """
        source_url = f"{self.base_url}/app/projectDetail/VCS/{project_id}"

        def parse_detail(html: str) -> dict:
            soup = BeautifulSoup(html, "html.parser")
            page_text = soup.get_text("\n", strip=True)

            def find_value_by_label(label_patterns: list[str]) -> str | None:
                # Try structured approach: find label-like elements then read neighbors.
                for pat in label_patterns:
                    label_el = soup.find(string=re.compile(pat, re.I))
                    if not label_el:
                        continue
                    el = label_el.parent
                    # Common patterns: <td>Label</td><td>Value</td>
                    if el and el.name in {"td", "th"}:
                        nxt = el.find_next_sibling("td")
                        if nxt:
                            return _clean(nxt.get_text(" ", strip=True))
                    # Or: Label: Value in same container
                    container = el.parent if el else None
                    if container:
                        txt = _clean(container.get_text(" ", strip=True))
                        if txt:
                            m = re.search(rf"(?:{pat})\s*:?\s*(.+)$", txt, re.I)
                            if m:
                                return _clean(m.group(1))
                # Fallback: regex on full page text
                for pat in label_patterns:
                    m = re.search(rf"{pat}\s*:?\s*(.+)", page_text, re.I)
                    if m:
                        # take first line-ish
                        return _clean(m.group(1).split("\n")[0])
                return None

            # Name: prefer explicit label; headings are unreliable on this site.
            name = find_value_by_label([r"Project\s*Name"])
            if not name:
                for sel in ["h1", "h2", "h3"]:
                    for h in soup.select(sel):
                        txt = _clean(h.get_text(" ", strip=True))
                        if not txt:
                            continue
                        if re.search(r"date\s+updated|project\s+details", txt, re.I):
                            continue
                        name = txt
                        break
                    if name:
                        break

            methodology = find_value_by_label([r"Methodolog(?:y|ies)", r"Methodology"])

            # Coordinates: only accept explicit labels to avoid false positives.
            lat = _in_range(_as_float(find_value_by_label([r"Latitude"])), -90, 90)
            lon = _in_range(_as_float(find_value_by_label([r"Longitude", r"Longitud"])), -180, 180)

            estimated_annual_reductions = _as_number(
                find_value_by_label(
                    [
                        r"Estimated\s+Annual\s+Emission\s+Reductions",
                        r"Estimated\s+Annual\s+Reductions",
                        r"Annual\s+Emission\s+Reductions",
                    ]
                )
            )

            validation_body = find_value_by_label(
                [
                    r"Validation\s*(?:/|and)?\s*Verification\s+Body",
                    r"Validation\s+Body",
                    r"VCS\s+Project\s+Validator",
                ]
            )

            # Documents: collect links that look like documents
            doc_urls: list[str] = []
            for a in soup.select("a[href]"):
                href = a.get("href")
                if not href:
                    continue
                abs_url = _absolutize(source_url, href)
                if _is_probably_document_url(abs_url):
                    doc_urls.append(abs_url)

            # Also sometimes document links are behind buttons; keep unique
            documents_urls = sorted(set(doc_urls))

            return {
                "project_id": str(project_id),
                "name": name,
                "coordinates": {"lat": lat, "lon": lon},
                "methodology": methodology,
                "estimated_annual_reductions": estimated_annual_reductions,
                "validation_body": validation_body,
                "documents_urls": documents_urls,
                "source_url": source_url,
                "fetched_at": _iso_utc_now(),
            }

        # Attempt 1: plain requests (fast)
        resp = self._get(source_url)
        parsed = parse_detail(resp.text)

        # If the page is JS-rendered, the static HTML often contains no useful fields.
        if (
            parsed.get("name") is None
            and parsed.get("methodology") is None
            and parsed.get("documents_urls") == []
        ):
            rendered_html = self._get_rendered_html(source_url)
            parsed = parse_detail(rendered_html)

        return parsed

    def download_pdfs(self, document_urls: list[str], save_dir: str) -> list[str]:
        """
        Downloads each PDF to save_dir, returns list of local file paths.
        """
        out_dir = Path(save_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        saved: list[str] = []
        for url in document_urls:
            self._sleep()
            resp = self._session.get(url, timeout=self.timeout_seconds, stream=True)
            resp.raise_for_status()

            filename = None
            cd = resp.headers.get("content-disposition") or resp.headers.get("Content-Disposition")
            if cd:
                m = re.search(r'filename\\*?=(?:UTF-8\'\')?"?([^\";]+)"?', cd, re.I)
                if m:
                    filename = m.group(1).strip()

            if not filename:
                path = urlparse(url).path
                base = os.path.basename(path) or "document.pdf"
                filename = base if base.lower().endswith(".pdf") else f"{base}.pdf"

            target = out_dir / filename
            # Avoid overwriting by adding suffix if needed
            if target.exists():
                stem = target.stem
                suffix = target.suffix
                i = 2
                while True:
                    candidate = out_dir / f"{stem}-{i}{suffix}"
                    if not candidate.exists():
                        target = candidate
                        break
                    i += 1

            with open(target, "wb") as f:
                for chunk in resp.iter_content(chunk_size=1024 * 128):
                    if chunk:
                        f.write(chunk)

            saved.append(str(target))

        return saved


if __name__ == "__main__":
    scraper = VerraScraper()
    result = scraper.get_project_detail("1234")
    print(json.dumps(result, indent=2, ensure_ascii=False))


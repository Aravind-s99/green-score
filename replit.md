# Carbon Credit Green Score App

## Overview
A web application that analyzes and scores carbon credit projects from the Verra registry for credibility, environmental impact, and transparency.

## Architecture

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **Port**: 5000 (dev server)
- **Location**: `frontend/`

### Backend
- **Framework**: FastAPI + Uvicorn
- **Port**: 8000
- **Location**: `backend/`
- **AI/ML**: HuggingFace Transformers (zero-shot classification with facebook/bart-large-mnli)
- **Satellite Data**: Google Earth Engine API (with mock mode via `GEE_MOCK=true`)
- **Database**: Supabase (for caching scores)
- **Web Scraping**: BeautifulSoup + Playwright (for Verra registry)

## Key Features
- Score carbon projects from the Verra (VCS) registry
- Satellite imagery analysis via Google Earth Engine (NDVI, deforestation detection)
- AI-powered document credibility scoring
- Score caching via Supabase (7-day cache)
- Search for projects by name/ID

## API Routes
- `GET /health` - Health check
- `POST /api/score` - Score a project (triggers full pipeline)
- `GET /api/score/{project_id}` - Get/compute project score (with cache)
- `GET /api/search?q=&registry=verra` - Search projects
- `GET /api/projects/featured` - Get featured project IDs

## Environment Variables
Required in `backend/.env`:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase service key
- `GEE_PROJECT_ID` - Google Earth Engine project ID
- `GEE_MOCK=true` - Use mock satellite data (for development without GEE auth)

## Workflows
- **Start application**: `cd frontend && npm run dev` (port 5000, webview)
- **Backend API**: `cd backend && GEE_MOCK=true uvicorn api.main:app --host localhost --port 8000 --reload` (port 8000, console)

## Scoring Methodology
- **Authenticity** (30%): Coordinate verification vs satellite data
- **Carbon Efficiency** (30%): Issued credits vs estimated reductions ratio
- **Biodiversity** (20%): NDVI trend + intact forest percentage
- **Transparency** (20%): Document count + validation body presence

## Development Notes
- PyTorch CPU version (`torch==2.5.1+cpu`) required for transformer models
- GEE_MOCK=true uses deterministic random data for satellite analysis (no auth needed)
- Frontend proxies `/api/*` to `http://127.0.0.1:8000` via Vite proxy config

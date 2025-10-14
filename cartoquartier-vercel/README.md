CartoQuartier — Vercel-ready demo
================================

This package contains a Vite + React demo centered on PRU Les Aubiers (Bordeaux).
It displays a sample hierarchy: sectors → subsectors → building → locals (hall, bike room, technical, association).

How to deploy to Vercel (quick):
1. Create a Vercel account (https://vercel.com).
2. Import this repository (drag & drop the ZIP).
3. Build settings: Vercel will run `npm install` and `npm run build` inside the repo root.
   The vercel.json included is configured to serve the frontend/dist output.

Demo modes:
- DEMO: localStorage persistence (default). Editing saved to browser localStorage.
- SUPABASE: prepared to be wired to Supabase — you'll need to add a serverless /api/save that forwards updates to Supabase.

Files:
- frontend/: Vite app (run `npm install` then `npm run build` if running locally)
- vercel.json: deployment configuration for Vercel
- public/data/sectors.geojson: sample GeoJSON centered on Les Aubiers

Notes:
- The app is intentionally minimal to stay lightweight and editable.
- To enable server-side persistence (Supabase), I can provide instructions and the serverless function.


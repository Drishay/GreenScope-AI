# GreenScope AI (Standalone Local Edition)

A 100% local, standalone geospatial environmental-analysis tool.

## Features
- **Geocoding Search:** Search any location worldwide using OpenStreetMap / Nominatim.
- **Interactive Boundary Drawing:** Draw polygon boundaries directly onto satellite imagery with real-time area calculation.
- **Environmental Dashboard:** Land-cover percentages, carbon impact, tree canopy equivalent, and sustainability scoring.
- **Local Persistence:** Save, browse, and delete environmental reports stored in a local JSON database (`data/analyses.json`).
- **Completely Offline-Ready (except for public map tiles and geocoding).**

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start both the backend API and frontend:**
   ```bash
   npm run dev
   ```
   This runs:
   - Backend API: `http://localhost:3001`
   - Frontend Vite: `http://localhost:5173`

3. **Build for production:**
   ```bash
   npm run build
   ```

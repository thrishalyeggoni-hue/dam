# DamBreak 3D — Real-Time Hydrodynamic Dam Breach & Flood Risk Simulator

An advanced, physics-grounded decision-support and emergency evacuation simulator for high-consequence dam failure events. Powered by a **2D Shallow Water Equations (Saint-Venant) finite-volume solver (ANUGA)** coupled to a dual-view **2D Leaflet GIS Map** and **3D Three.js WebGL Terrain Engine**.

---

## ⚡ Quick Start

### 1. Install & Run
```bash
# Clone or navigate to the directory
cd /Users/thrishalyeggoni/sih/dam

# Install dependencies
npm install

# Start both ANUGA Python backend and Vite frontend
npm run dev
```

### 2. Access the Application
- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **ANUGA Solver API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📖 Complete Documentation

The full project architecture, scientific equations, API reference, and module specifications are documented in:

👉 **[PROJECT_DOCUMENTATION.md](file:///Users/thrishalyeggoni/sih/dam/PROJECT_DOCUMENTATION.md)**

### Highlights:
- **Scientific Foundation**: 2D Saint-Venant Shallow Water Equations, Froehlich breach formation equations, HR Wallingford Hazard Index ($HI = d \cdot v$), Manning's roughness.
- **Dynamic Impact Pipeline**: Real-time sampling of depth, velocity, and hazard tier at every mapped feature (`SAFE`, `AT_RISK`, `FLOODED`, `SEVERE/EVACUATE`) synchronized forward and backward with the timeline.
- **Geospatial & 3D Dual Engine**: High-performance Leaflet 2D GIS overlays + Three.js WebGL procedural water displacement and 3D symbol pins.
- **Emergency Decision Support**: Real-time outflow hydrographs, NDMA executive directives, evacuation corridor freeboard clearance ($Z_{\text{corridor}} - WSE_{\text{peak}}$), and multi-scenario comparison.
- **Indian Dams Registry**: Pre-calibrated models for Nagarjuna Sagar, Idukki, Tehri, Sardar Sarovar, Mullaperiyar, Hirakud, Bhakra, and Koyna.

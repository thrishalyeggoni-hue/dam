"""
anuga_solver.py — ANUGA 2D Shallow Water Equation solver

Runs a real 2D hydrodynamic simulation of a dam-break scenario using the
ANUGA Python package (https://github.com/GeoscienceAustralia/anuga_core).

ANUGA solves the 2D Shallow Water Equations (Saint-Venant):
    ∂h/∂t + ∂(hu)/∂x + ∂(hv)/∂y = 0                (mass continuity)
    ∂(hu)/∂t + ∂(hu²+½gh²)/∂x + ∂(huv)/∂y = -gh∂z/∂x - τₓ/ρ  (x-momentum)
    ∂(hv)/∂t + ∂(huv)/∂x + ∂(hv²+½gh²)/∂y = -gh∂z/∂y - τᵧ/ρ  (y-momentum)

where:
    h  = water depth (m)
    u  = depth-averaged velocity in x direction (m/s)
    v  = depth-averaged velocity in y direction (m/s)
    z  = bed elevation (m)
    τ  = bed friction (Manning's equation)
    ρ  = water density (kg/m³)

References
----------
Nielsen et al. (2005):
    "ANUGA: A new method for modelling tsunami inundation"
    Modsim 2005, Melbourne, Australia.

Roberts et al. (2015):
    "ANUGA: A shallow-water flow solver for environmental modelling"
    OpenSource Geosciences Journal.
"""

import os
import time
import math
import logging
import tempfile
from typing import Optional, Callable

import numpy as np

logger = logging.getLogger(__name__)

# ─── ANUGA import guard ───────────────────────────────────────────────── #
try:
    import anuga
    HAS_ANUGA = True
except ImportError:
    HAS_ANUGA = False
    logger.warning("ANUGA not available — solver will not run")


# ─── Constants ────────────────────────────────────────────────────────── #
WET_DEPTH_THRESHOLD = 0.05   # m — cells shallower than this are "dry"
GRAVITY              = 9.81  # m/s²


def run_anuga_simulation(
    dem_info: dict,
    breach_params: dict,
    output_dir: str,
    progress_callback: Optional[Callable[[str, int], None]] = None,
    yield_step_s: float = 60.0,     # Save output every N simulation-seconds
    final_time_s: float = 10800.0,  # Simulate 3 hours (10800 s)
    mesh_resolution_m2: Optional[float] = None,
) -> dict:
    """
    Run ANUGA 2D SWE simulation.

    Parameters
    ----------
    dem_info : dict
        Output from dem_processor.load_and_reproject_dem().
    breach_params : dict
        Breach and reservoir parameters (see models.py BreachParameters).
    output_dir : str
        Directory to write ANUGA sww output.
    progress_callback : callable(stage: str, percent: int) | None
        Called with (stage_label, pct) as simulation progresses.
    yield_step_s : float
        Interval (s) at which to save outputs. Default 60 s (1-min frames).
    final_time_s : float
        Total simulation duration (s). Default 10800 (3 hours).
    mesh_resolution_m2 : float | None
        Target mesh triangle area (m²). If None, derived from DEM resolution.

    Returns
    -------
    dict with keys:
        frames       : list[dict] — one dict per saved timestep
        mass_balance : dict       — initial/final volumes and error%
        diagnostics  : dict       — mesh info, timing, etc.
        sww_path     : str        — path to ANUGA .sww file
    """
    if not HAS_ANUGA:
        raise RuntimeError(
            "ANUGA is not installed. Run: pip install anuga"
        )

    _cb = progress_callback or (lambda s, p: None)
    _cb("Preparing computational domain", 5)

    os.makedirs(output_dir, exist_ok=True)

    # ------------------------------------------------------------------ #
    # 1. Build ANUGA domain from DEM grid
    # ------------------------------------------------------------------ #
    elev          = dem_info["elevation"]          # 2D ndarray (rows×cols)
    x_centres     = dem_info["x_centres"]          # 1D (cols,)
    y_centres     = dem_info["y_centres"]          # 1D (rows,) top→bottom
    rows, cols    = elev.shape
    resolution_m  = dem_info["resolution_m"]
    x_min         = dem_info["x_min"]
    x_max         = dem_info["x_max"]
    y_min         = dem_info["y_min"]
    y_max         = dem_info["y_max"]

    # Determine mesh resolution (triangle area target)
    if mesh_resolution_m2 is None:
        # 4 triangles per grid cell is a good default
        mesh_resolution_m2 = (resolution_m ** 2) * 4.0
    logger.info(f"Mesh target triangle area: {mesh_resolution_m2:.0f} m²")

    # ------------------------------------------------------------------ #
    # 2. Build elevation function for ANUGA (bilinear interpolation from grid)
    # ------------------------------------------------------------------ #
    from scipy.interpolate import RegularGridInterpolator

    # y_centres is top→bottom; for scipy we need ascending
    y_asc = y_centres[::-1]
    elev_asc = elev[::-1, :]   # flip rows

    elev_interp = RegularGridInterpolator(
        (y_asc, x_centres),
        elev_asc,
        method="linear",
        bounds_error=False,
        fill_value=None,  # extrapolate
    )

    def elevation_function(x_arr, y_arr):
        pts = np.column_stack([y_arr, x_arr])
        return elev_interp(pts)

    # ------------------------------------------------------------------ #
    # 3. Create rectangular domain with triangular mesh
    # ------------------------------------------------------------------ #
    _cb("Building triangular mesh", 15)

    # Set SWW output destination cleanly using ANUGA domain.set_datadir & set_name
    abs_output_dir = os.path.abspath(output_dir)
    os.makedirs(abs_output_dir, exist_ok=True)
    sww_basename = "simulation"
    sww_full_path = os.path.join(abs_output_dir, sww_basename + ".sww")
    sww_name = os.path.join(abs_output_dir, sww_basename)

    domain = anuga.rectangular_cross_domain(
        m=cols,   # number of cells in x
        n=rows,   # number of cells in y
        len1=x_max - x_min,
        len2=y_max - y_min,
        origin=(x_min, y_min),
        verbose=False,
    )

    domain.set_datadir(abs_output_dir)
    domain.set_name(sww_basename)
    domain.set_store(True)

    # Set Manning friction:
    #   n = 0.030 in main channel (river bed)
    #   n = 0.055 on floodplain / rough terrain
    # (Uniform value for now; spatially-variable n requires land-cover data)
    MANNING_CHANNEL    = float(breach_params.get("manning_n", 0.035))
    MANNING_FLOODPLAIN = MANNING_CHANNEL * 1.5
    domain.set_quantity("friction", MANNING_CHANNEL)
    logger.info(f"Manning n = {MANNING_CHANNEL} (channel)")

    # ------------------------------------------------------------------ #
    # 4. Dam location and bed elevation with concrete dam barrier
    # ------------------------------------------------------------------ #
    dam_x_frac = breach_params.get("dam_x_fraction", 0.22)
    dam_x_m    = x_min + dam_x_frac * (x_max - x_min)
    dam_crest_elev = float(breach_params.get("dam_crest_elevation_m", 179.83))

    def elevation_with_dam(x_arr, y_arr):
        """Bed elevation with physical dam crest ridge to prevent premature reservoir spilling."""
        z = elevation_function(x_arr, y_arr)
        is_dam_line = np.abs(x_arr - dam_x_m) <= (resolution_m * 1.5)
        return np.where(is_dam_line, np.maximum(z, dam_crest_elev), z)

    _cb("Assigning DEM elevation with concrete dam barrier to mesh", 20)
    domain.set_quantity("elevation", elevation_with_dam, location="vertices")
    domain.set_quantity("elevation", elevation_with_dam, location="centroids")

    # ------------------------------------------------------------------ #
    # 5. Initial reservoir and downstream dry conditions
    # ------------------------------------------------------------------ #
    res_level_m = float(breach_params["reservoir_water_level_m"])

    _cb("Initializing reservoir and downstream dry conditions", 25)
    # Set stage equal to bed elevation everywhere first -> exact zero depth downstream
    domain.set_quantity("stage", domain.get_quantity("elevation"))

    # Set reservoir water surface elevation strictly upstream of dam barrier
    stage_q = domain.get_quantity("stage")
    v_stage = stage_q.vertex_values
    nodes = domain.nodes
    tris = domain.triangles
    node_x = nodes[tris, 0]

    upstream_cutoff = dam_x_m - resolution_m * 2.0
    res_node_mask = (node_x < upstream_cutoff) & (v_stage < res_level_m)
    v_stage[res_node_mask] = res_level_m
    stage_q.centroid_values[:] = np.mean(v_stage, axis=1)

    # ------------------------------------------------------------------ #
    # 6. Boundary conditions
    # ------------------------------------------------------------------ #
    # Reflective (wall) boundaries on all sides except eastern outflow
    # Eastern boundary: transmissive (flood can leave the domain)
    Br = anuga.Reflective_boundary(domain)
    Bt = anuga.Transmissive_boundary(domain)

    domain.set_boundary({
        "left":   Br,
        "right":  Bt,
        "top":    Br,
        "bottom": Br,
    })

    # ------------------------------------------------------------------ #
    # 7. Breach inflow — time-varying Q(t) injected at dam toe
    # ------------------------------------------------------------------ #
    from .breach_physics import compute_breach_discharge

    # Dam toe location (just downstream of dam)
    breach_x = dam_x_m + resolution_m * 2
    breach_y_frac = breach_params.get("breach_y_fraction", 0.5)
    breach_y = y_min + breach_y_frac * (y_max - y_min)

    # Breach region: small polygon around breach point
    breach_half_width = max(resolution_m * 2,
                             float(breach_params["breach_width_m"]) / 2)
    breach_polygon = [
        [breach_x - resolution_m,     breach_y - breach_half_width],
        [breach_x + resolution_m * 3, breach_y - breach_half_width],
        [breach_x + resolution_m * 3, breach_y + breach_half_width],
        [breach_x - resolution_m,     breach_y + breach_half_width],
    ]

    def breach_inflow_rate(t: float) -> float:
        """Time-varying breach discharge Q(t) in m³/s"""
        return compute_breach_discharge(t, breach_params)

    logger.info(f"Breach inflow region: x={breach_x:.0f} m, y={breach_y:.0f} m, "
                f"half-width={breach_half_width:.0f} m")

    _cb("Configuring breach inflow boundary", 30)

    inflow_op = anuga.Inflow(
        domain,
        rate=breach_inflow_rate,
        center=(breach_x, breach_y),
        radius=breach_half_width,
    )

    # ------------------------------------------------------------------ #
    # 8. Pre-simulation diagnostics
    # ------------------------------------------------------------------ #
    mesh_elems   = len(domain.triangles)
    t_start      = time.time()

    # Compute initial reservoir volume (water above bed in upstream cells)
    stage_init   = domain.get_quantity("stage").get_values(location="centroids")
    elev_cents   = domain.get_quantity("elevation").get_values(location="centroids")
    x_cents      = domain.get_centroid_coordinates()[:, 0]
    depth_init   = np.maximum(0, stage_init - elev_cents)
    cell_areas   = domain.get_areas()
    upstream_mask = x_cents < dam_x_m
    V_initial    = float(np.sum(depth_init[upstream_mask] * cell_areas[upstream_mask]))

    logger.info(f"Initial reservoir volume: {V_initial / 1e6:.2f} MCM")
    logger.info(f"Mesh elements: {mesh_elems:,}")
    logger.info(f"Simulation: {final_time_s/3600:.1f} h, yield every {yield_step_s} s "
                f"→ {int(final_time_s/yield_step_s)+1} frames")

    # ------------------------------------------------------------------ #
    # 9. Cumulative grids for max-depth, max-velocity, arrival-time
    # ------------------------------------------------------------------ #
    # We'll interpolate centroids back to the regular DEM grid for output
    from scipy.interpolate import griddata

    n_centroids = len(domain.triangles)
    max_depth_centroid  = np.zeros(n_centroids, dtype=np.float32)
    max_vel_centroid    = np.zeros(n_centroids, dtype=np.float32)
    arrival_time_centroid = np.full(n_centroids, -1.0, dtype=np.float32)

    frames = []
    cumulative_outflow_m3 = 0.0

    _cb("Running ANUGA SWE solver", 35)

    # ------------------------------------------------------------------ #
    # 10. ANUGA evolve loop
    # ------------------------------------------------------------------ #
    prev_t = 0.0
    frame_idx = 0

    for t in domain.evolve(yieldstep=yield_step_s, finaltime=final_time_s):
        elapsed_wall = time.time() - t_start
        pct = 35 + int((t / final_time_s) * 50)
        _cb(f"Solving SWE  T={t:.0f}s  (wall {elapsed_wall:.0f}s)", min(pct, 84))

        # ── Extract centroid quantities ─────────────────────────────── #
        stage_c  = domain.get_quantity("stage").get_values(location="centroids")
        elev_c   = domain.get_quantity("elevation").get_values(location="centroids")
        xmom_c   = domain.get_quantity("xmomentum").get_values(location="centroids")
        ymom_c   = domain.get_quantity("ymomentum").get_values(location="centroids")
        cents_xy = domain.get_centroid_coordinates()

        # ── Derived quantities ──────────────────────────────────────── #
        # h = stage - elevation  (clamped to 0)
        depth_c = np.maximum(0.0, stage_c - elev_c).astype(np.float32)

        # Safe velocity: avoid division by zero at dry cells
        h_safe = np.where(depth_c > WET_DEPTH_THRESHOLD, depth_c, np.inf)
        u_c = (xmom_c / h_safe).astype(np.float32)
        v_c = (ymom_c / h_safe).astype(np.float32)
        # Zero out velocities at dry cells
        u_c = np.where(depth_c > WET_DEPTH_THRESHOLD, u_c, 0.0)
        v_c = np.where(depth_c > WET_DEPTH_THRESHOLD, v_c, 0.0)
        vel_mag_c = np.sqrt(u_c ** 2 + v_c ** 2).astype(np.float32)

        # Validation: depth must not be negative
        assert np.all(depth_c >= 0), "SOLVER ERROR: negative depth detected"
        # Validation: velocities must not be NaN
        assert not np.any(np.isnan(u_c)), "SOLVER ERROR: NaN in u velocity"
        assert not np.any(np.isnan(v_c)), "SOLVER ERROR: NaN in v velocity"

        # ── Update running maxima & arrival times ───────────────────── #
        max_depth_centroid  = np.maximum(max_depth_centroid,  depth_c)
        max_vel_centroid    = np.maximum(max_vel_centroid,    vel_mag_c)
        wet_cells           = depth_c > WET_DEPTH_THRESHOLD
        first_wet           = wet_cells & (arrival_time_centroid < 0)
        arrival_time_centroid[first_wet] = float(t)

        # ── Current frame statistics (downstream floodplain focus) ─── #
        wet_mask        = depth_c > WET_DEPTH_THRESHOLD
        downstream_mask = cents_xy[:, 0] >= (dam_x_m - resolution_m)
        downstream_wet  = wet_mask & downstream_mask
        downstream_n_wet = int(np.sum(downstream_wet))
        downstream_m2   = float(np.sum(cell_areas[downstream_wet]))
        downstream_km2  = downstream_m2 / 1e6

        total_n_wet     = int(np.sum(wet_mask))
        n_dry           = n_centroids - downstream_n_wet

        downstream_max_d = float(np.max(depth_c[downstream_mask])) if downstream_n_wet > 0 else 0.0
        downstream_max_v = float(np.max(vel_mag_c[downstream_mask])) if downstream_n_wet > 0 else 0.0

        # Current breach discharge
        Q_t = breach_inflow_rate(t)

        # Cumulative outflow volume (trapezoidal integration)
        dt = t - prev_t
        cumulative_outflow_m3 += Q_t * dt
        prev_t = t

        # ── Interpolate to regular DEM grid (DOWNSTREAM only) ──────────── #
        # Only interpolate flood cells (x >= dam_x_m) to avoid reservoir
        # depths (80-120m) contaminating the downstream flood depth grid.
        ds_mask      = cents_xy[:, 0] >= (dam_x_m - resolution_m)
        grid_depths, grid_u, grid_v = _interpolate_to_grid(
            cents_xy[ds_mask], depth_c[ds_mask], u_c[ds_mask], v_c[ds_mask], dem_info
        )

        # ── Flood extent as GeoJSON with real cell physics ──────────── #
        geojson_extent = _compute_flood_geojson(
            cents_xy, cell_areas, downstream_wet,
            depth_c, vel_mag_c, arrival_time_centroid,
            elev_c, stage_c, dem_info
        )

        # ── Build frame dict ─────────────────────────────────────────── #
        hours = int(t // 3600)
        mins  = int((t % 3600) // 60)
        frame = {
            "frame_index":                  frame_idx,
            "time_seconds":                 int(t),
            "time_formatted":               f"T+{hours:02d}:{mins:02d}",
            "discharge_m3s":                round(Q_t, 1),
            "max_depth_m":                  round(downstream_max_d, 2),
            "max_velocity_ms":              round(downstream_max_v, 2),
            "flooded_area_sqkm":            round(downstream_km2, 3),
            "total_flooded_area_sqkm":      round(float(np.sum(cell_areas[wet_mask])) / 1e6, 3),
            "wet_cell_count":               downstream_n_wet,
            "dry_cell_count":               n_dry,
            "grid_depths":                  grid_depths.tolist(),
            "grid_velocities":              _pack_velocities(grid_u, grid_v),
            "flood_geojson":                geojson_extent,
        }
        frames.append(frame)
        frame_idx += 1

        logger.debug(f"Frame {frame_idx}: t={t:.0f}s  ds_wet={downstream_n_wet}  "
                     f"Q={Q_t:.0f}m³/s  ds_max_h={downstream_max_d:.2f}m  "
                     f"ds_area={downstream_km2:.2f}km²")

    # ------------------------------------------------------------------ #
    # 11. Post-processing: max-depth, max-velocity, arrival-time grids
    # ------------------------------------------------------------------ #
    _cb("Computing maximum envelopes and arrival times", 85)

    cents_xy_fin = domain.get_centroid_coordinates()
    stage_fin    = domain.get_quantity("stage").get_values(location="centroids")
    elev_fin     = domain.get_quantity("elevation").get_values(location="centroids")

    # ── Filter to DOWNSTREAM centroids only (exclude reservoir) ────────── #
    # The reservoir fills upstream cells with depths of 80–120 m which are
    # NOT flood depths and should not contaminate the hydraulic output grids.
    ds_mask_fin = cents_xy_fin[:, 0] >= (dam_x_m - resolution_m)
    ds_cents    = cents_xy_fin[ds_mask_fin]

    def _ds_grid(values):
        """Interpolate only downstream centroids to the full DEM grid."""
        return _interpolate_centroid_to_grid(ds_cents, values[ds_mask_fin], dem_info)

    def _ds_grid_fill(values, fill):
        return _interpolate_centroid_to_grid(ds_cents, values[ds_mask_fin], dem_info, fill=fill)

    max_depth_grid   = _ds_grid(max_depth_centroid)
    max_vel_grid     = _ds_grid(max_vel_centroid)
    arrival_grid     = _ds_grid_fill(arrival_time_centroid, -1.0)
    arrival_grid_min = np.where(arrival_grid > 0, arrival_grid / 60.0, -1.0)

    # ── Mass balance check ───────────────────────────────────────────── #
    depth_fin        = np.maximum(0, stage_fin - elev_fin)
    V_final_domain   = float(np.sum(depth_fin * cell_areas))
    V_total_input    = cumulative_outflow_m3
    mass_error_pct   = abs(V_initial + V_total_input - V_final_domain) / max(V_initial, 1) * 100
    if mass_error_pct > 5.0:
        logger.warning(f"Mass balance error {mass_error_pct:.2f}% exceeds 5% threshold. "
                       "Check mesh resolution and boundary conditions.")

    t_end = time.time()

    # ── Compute arrival time in minutes on regular grid ─────────────── #
    # arrival_grid_min already computed above

    # ── Downstream max depth and velocity locations for diagnostics ─── #
    max_depth_info = {}
    max_vel_info = {}
    try:
        from pyproj import Transformer
        tr_wgs = Transformer.from_crs(f"EPSG:{dem_info['epsg']}", "EPSG:4326", always_xy=True)
        ds_indices = np.where((cents_xy_fin[:, 0] >= dam_x_m) & (max_depth_centroid > 0))[0]
        if len(ds_indices) == 0:
            ds_indices = np.arange(len(max_depth_centroid))

        if len(ds_indices) > 0:
            top_d_idx = int(ds_indices[np.argmax(max_depth_centroid[ds_indices])])
            mx_x, mx_y = cents_xy_fin[top_d_idx]
            lon_d, lat_d = tr_wgs.transform(mx_x, mx_y)
            max_depth_info = {
                "cell_id": int(top_d_idx),
                "utm_x": round(float(mx_x), 1),
                "utm_y": round(float(mx_y), 1),
                "longitude": round(float(lon_d), 6),
                "latitude": round(float(lat_d), 6),
                "elevation_m": round(float(elev_fin[top_d_idx]), 2),
                "stage_m": round(float(stage_fin[top_d_idx]), 2),
                "max_depth_m": round(float(max_depth_centroid[top_d_idx]), 2),
            }

            top_v_idx = int(ds_indices[np.argmax(max_vel_centroid[ds_indices])])
            vx_x, vx_y = cents_xy_fin[top_v_idx]
            lon_v, lat_v = tr_wgs.transform(vx_x, vx_y)
            max_vel_info = {
                "cell_id": int(top_v_idx),
                "utm_x": round(float(vx_x), 1),
                "utm_y": round(float(vx_y), 1),
                "longitude": round(float(lon_v), 6),
                "latitude": round(float(lat_v), 6),
                "max_velocity_ms": round(float(max_vel_centroid[top_v_idx]), 2),
            }
    except Exception as e:
        logger.warning(f"Could not compute max depth/vel location: {e}")

    diagnostics = {
        "solver":                "ANUGA",
        "scientific":            True,
        "mesh_element_count":    mesh_elems,
        "mesh_min_area_m2":      round(float(np.min(cell_areas)), 2) if len(cell_areas) > 0 else 0,
        "mesh_max_area_m2":      round(float(np.max(cell_areas)), 2) if len(cell_areas) > 0 else 0,
        "mesh_mean_area_m2":     round(float(np.mean(cell_areas)), 2) if len(cell_areas) > 0 else 0,
        "dem_id":                dem_info.get("dem_id", "nagarjuna-sagar-utm32644"),
        "crs":                   f"EPSG:{dem_info['epsg']} (Projected UTM metres)",
        "dem_min_elevation_m":   round(dem_info["min_elev_m"], 1),
        "dem_max_elevation_m":   round(dem_info["max_elev_m"], 1),
        "dem_is_synthetic":      dem_info["is_synthetic"],
        "grid_resolution_m":     round(dem_info["resolution_m"], 1),
        "grid_rows":             dem_info["rows"],
        "grid_cols":             dem_info["cols"],
        "yield_step_s":          yield_step_s,
        "final_time_s":          final_time_s,
        "wall_time_s":           round(t_end - t_start, 1),
        "frame_count":           len(frames),
        "wet_threshold_m":       WET_DEPTH_THRESHOLD,
        "manning_n":             MANNING_CHANNEL,
        "max_depth_location":    max_depth_info,
        "max_velocity_location": max_vel_info,
        "initial_reservoir_volume_m3":  round(V_initial, 0),
        "final_domain_volume_m3":       round(V_final_domain, 0),
        "cumulative_breach_volume_m3":  round(V_total_input, 0),
        "mass_balance_error_percent":   round(mass_error_pct, 2),
        "sww_path":              sww_name + ".sww",
    }

    return {
        "frames":          frames,
        "max_depth_grid":  max_depth_grid.tolist(),
        "max_vel_grid":    max_vel_grid.tolist(),
        "arrival_grid_min": arrival_grid_min.tolist(),
        "mass_balance":    {
            "V_initial_m3":    round(V_initial, 0),
            "V_final_m3":      round(V_final_domain, 0),
            "V_total_input_m3": round(V_total_input, 0),
            "error_pct":       round(mass_error_pct, 2),
        },
        "diagnostics":     diagnostics,
        "sww_path":        sww_name + ".sww",
    }


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def _interpolate_to_grid(
    cents_xy: np.ndarray,
    depth_c: np.ndarray,
    u_c: np.ndarray,
    v_c: np.ndarray,
    dem_info: dict,
) -> tuple:
    """
    Interpolate ANUGA centroid data to the regular DEM output grid.
    Returns (grid_depths, grid_u, grid_v) as 2D float32 arrays.
    """
    from scipy.interpolate import griddata

    rows   = dem_info["rows"]
    cols   = dem_info["cols"]
    x_cen  = dem_info["x_centres"]
    y_cen  = dem_info["y_centres"]  # top→bottom

    xi, yi = np.meshgrid(x_cen, y_cen)
    pts    = cents_xy  # (N, 2) with (x, y)

    grid_d = griddata(pts, depth_c, (xi, yi), method="linear", fill_value=0.0)
    grid_u = griddata(pts, u_c,     (xi, yi), method="linear", fill_value=0.0)
    grid_v = griddata(pts, v_c,     (xi, yi), method="linear", fill_value=0.0)

    # Enforce non-negative depth
    grid_d = np.maximum(0.0, grid_d).astype(np.float32)
    grid_u = grid_u.astype(np.float32)
    grid_v = grid_v.astype(np.float32)

    return grid_d, grid_u, grid_v


def _interpolate_centroid_to_grid(
    cents_xy: np.ndarray,
    values_c: np.ndarray,
    dem_info: dict,
    fill: float = 0.0,
) -> np.ndarray:
    from scipy.interpolate import griddata
    rows   = dem_info["rows"]
    cols   = dem_info["cols"]
    x_cen  = dem_info["x_centres"]
    y_cen  = dem_info["y_centres"]
    xi, yi = np.meshgrid(x_cen, y_cen)
    result = griddata(cents_xy, values_c, (xi, yi), method="linear", fill_value=fill)
    return result.astype(np.float32)


def _pack_velocities(
    grid_u: np.ndarray,
    grid_v: np.ndarray,
) -> list:
    """
    Pack u,v grids into the list-of-lists-of-pairs format the frontend expects:
    grid_velocities[row][col] = [u, v]
    Values rounded to 2 decimal places to reduce payload size.
    """
    rows, cols = grid_u.shape
    result = []
    for r in range(rows):
        row_vals = []
        for c in range(cols):
            u = round(float(grid_u[r, c]), 2)
            v = round(float(grid_v[r, c]), 2)
            row_vals.append([u, v])
        result.append(row_vals)
    return result


def _compute_flood_geojson(
    cents_xy: np.ndarray,
    cell_areas: np.ndarray,
    wet_mask: np.ndarray,
    depth_c: np.ndarray,
    vel_mag_c: np.ndarray,
    arrival_time_c: np.ndarray,
    elev_c: np.ndarray,
    stage_c: np.ndarray,
    dem_info: dict,
) -> dict:
    """
    Build a GeoJSON FeatureCollection of wet-cell polygons with real hydrodynamic values.

    Each wet cell centroid is converted to a small polygon (using DEM resolution)
    in WGS84 coordinates. Every polygon contains real solver properties:
    depth_m, velocity_ms, hazard_index, arrival_time_min, elevation_m, stage_m.
    """
    try:
        from pyproj import Transformer
        epsg   = dem_info["epsg"]
        res_m  = dem_info["resolution_m"]
        half   = res_m / 2.0

        tr_wgs = Transformer.from_crs(f"EPSG:{epsg}", "EPSG:4326", always_xy=True)

        wet_idx = np.where(wet_mask)[0]
        n_wet   = len(wet_idx)

        # Sub-sample for extremely large floods to keep GeoJSON network transfer responsive
        MAX_POLYS = 4000
        if n_wet > MAX_POLYS:
            step = max(1, n_wet // MAX_POLYS)
            wet_idx = wet_idx[::step]

        features = []
        for idx in wet_idx:
            cx, cy = cents_xy[idx]
            d = float(depth_c[idx])
            v = float(vel_mag_c[idx])
            h_idx = round(d * v, 3)
            arr_s = float(arrival_time_c[idx])
            arr_min = round(arr_s / 60.0, 1) if arr_s >= 0 else -1.0
            el = round(float(elev_c[idx]), 1)
            stg = round(float(stage_c[idx]), 1)

            # Four corners of cell (UTM)
            corners_utm = [
                (cx - half, cy - half),
                (cx + half, cy - half),
                (cx + half, cy + half),
                (cx - half, cy + half),
                (cx - half, cy - half),  # close ring
            ]
            xs = [c[0] for c in corners_utm]
            ys = [c[1] for c in corners_utm]
            lons, lats = tr_wgs.transform(xs, ys)
            coords = [[round(lo, 6), round(la, 6)] for lo, la in zip(lons, lats)]

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coords],
                },
                "properties": {
                    "cell_id": int(idx),
                    "depth_m": round(d, 2),
                    "velocity_ms": round(v, 2),
                    "hazard_index": h_idx,
                    "arrival_time_min": arr_min,
                    "elevation_m": el,
                    "stage_m": stg,
                    "utm_x": round(float(cx), 1),
                    "utm_y": round(float(cy), 1),
                },
            })

        return {
            "type": "FeatureCollection",
            "features": features,
        }
    except Exception as exc:
        logger.warning(f"GeoJSON generation failed: {exc}")
        return {"type": "FeatureCollection", "features": []}

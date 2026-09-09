"""
dem_processor.py — DEM preprocessing for ANUGA solver

Reads a GeoTIFF DEM, reprojects it to a suitable projected CRS (UTM),
and returns a structured dictionary that ANUGA can consume directly.

Physical units:
  x, y  — metres (easting, northing in UTM)
  z     — metres above mean sea level
"""

import os
import logging
from typing import Optional
import numpy as np

try:
    import rasterio
    from rasterio.warp import calculate_default_transform, reproject, Resampling
    from rasterio.crs import CRS
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False

logger = logging.getLogger(__name__)


def get_utm_zone_epsg(lon_centre: float, lat_centre: float) -> int:
    """
    Return EPSG code for the UTM zone covering the given lon/lat.
    Nagarjuna Sagar is at ~79.3°E, 16.6°N → UTM Zone 44N → EPSG:32644
    """
    zone = int((lon_centre + 180) / 6) + 1
    if lat_centre >= 0:
        return 32600 + zone   # Northern hemisphere
    else:
        return 32700 + zone   # Southern hemisphere


def load_and_reproject_dem(dem_path: str,
                            decimation_factor: int = 1,
                            ) -> dict:
    """
    Load a GeoTIFF DEM, reproject to UTM, optionally decimate, and return
    a dict with all metadata ANUGA needs.

    Parameters
    ----------
    dem_path : str
        Path to input GeoTIFF (any CRS).
    decimation_factor : int
        Spatial decimation: 1 = full resolution, 2 = half, 3 = third, …
        Use 2–3 for interactive runs, 1 for production.

    Returns
    -------
    dict with keys:
        is_synthetic   : bool  — True if the DEM was not from a real sensor
        dem_path_utm   : str   — Path to reprojected UTM GeoTIFF (cached)
        epsg           : int   — UTM EPSG code used
        x_min, x_max   : float — Easting extent (m)
        y_min, y_max   : float — Northing extent (m)
        resolution_m   : float — Cell size (m) after decimation
        cols, rows     : int
        elevation      : np.ndarray (rows×cols) — elevation values (m MSL)
        x_centres      : np.ndarray (cols,)     — cell centre eastings (m)
        y_centres      : np.ndarray (rows,)     — cell centre northings (m, top→bottom)
        nodata         : float
        wgs84_bounds   : tuple  (west, south, east, north) in degrees
        is_synthetic   : bool
    """
    if not os.path.exists(dem_path):
        raise FileNotFoundError(
            f"DEM file not found: {dem_path}\n"
            "Run  backend/scripts/download_dem.py  to download it."
        )

    if not HAS_RASTERIO:
        raise ImportError("rasterio is required for DEM processing. "
                          "Run: pip install rasterio")

    # ------------------------------------------------------------------ #
    # 1. Read source DEM
    # ------------------------------------------------------------------ #
    with rasterio.open(dem_path) as src:
        src_crs = src.crs
        src_bounds = src.bounds           # (left, bottom, right, top) in src CRS
        src_transform = src.transform
        nodata = src.nodata if src.nodata is not None else -9999.0
        is_synthetic = bool(src.tags().get("SYNTHETIC_FALLBACK", "0") == "1")

        # Read band 1
        elevation_raw = src.read(1).astype(np.float32)

    # Replace nodata with NaN
    elevation_raw[elevation_raw == nodata] = np.nan

    # ------------------------------------------------------------------ #
    # 2. Determine target UTM CRS
    # ------------------------------------------------------------------ #
    # For a geographic CRS we need lon/lat centre
    if src_crs.is_geographic:
        lon_c = (src_bounds.left + src_bounds.right) / 2
        lat_c = (src_bounds.bottom + src_bounds.top) / 2
    else:
        # Already projected — find approximate centre in geographic coords
        from pyproj import Transformer
        tr = Transformer.from_crs(src_crs, "EPSG:4326", always_xy=True)
        cx = (src_bounds.left + src_bounds.right) / 2
        cy = (src_bounds.bottom + src_bounds.top) / 2
        lon_c, lat_c = tr.transform(cx, cy)

    utm_epsg = get_utm_zone_epsg(lon_c, lat_c)
    dst_crs = CRS.from_epsg(utm_epsg)
    logger.info(f"DEM CRS: {src_crs}  →  UTM EPSG:{utm_epsg}")

    # ------------------------------------------------------------------ #
    # 3. Reproject to UTM (cache result)
    # ------------------------------------------------------------------ #
    dem_utm_path = dem_path.replace(".tif", f"_utm{utm_epsg}.tif")

    if not os.path.exists(dem_utm_path):
        transform_utm, width_utm, height_utm = calculate_default_transform(
            src_crs, dst_crs,
            elevation_raw.shape[1], elevation_raw.shape[0],
            left=src_bounds.left, bottom=src_bounds.bottom,
            right=src_bounds.right, top=src_bounds.top,
        )
        with rasterio.open(dem_path) as src:
            profile = src.profile.copy()
        profile.update(
            crs=dst_crs,
            transform=transform_utm,
            width=width_utm,
            height=height_utm,
            nodata=-9999.0,
            dtype="float32",
        )
        with rasterio.open(dem_utm_path, "w", **profile) as dst:
            with rasterio.open(dem_path) as src:
                reproject(
                    source=rasterio.band(src, 1),
                    destination=rasterio.band(dst, 1),
                    src_transform=src.transform,
                    src_crs=src_crs,
                    dst_transform=transform_utm,
                    dst_crs=dst_crs,
                    resampling=Resampling.bilinear,
                )
        logger.info(f"Reprojected DEM saved: {dem_utm_path}")
    else:
        logger.info(f"Using cached UTM DEM: {dem_utm_path}")

    # ------------------------------------------------------------------ #
    # 4. Read UTM DEM & apply decimation
    # ------------------------------------------------------------------ #
    with rasterio.open(dem_utm_path) as src_utm:
        utm_transform = src_utm.transform
        utm_bounds = src_utm.bounds
        elev_full = src_utm.read(1).astype(np.float32)
        profile_utm = src_utm.profile

    elev_full[elev_full == -9999.0] = np.nan

    if decimation_factor > 1:
        d = decimation_factor
        elev_dec = elev_full[::d, ::d]
    else:
        elev_dec = elev_full

    rows, cols = elev_dec.shape
    res_x = abs(utm_transform.a) * decimation_factor  # cell width (m)
    res_y = abs(utm_transform.e) * decimation_factor  # cell height (m)
    resolution_m = (res_x + res_y) / 2.0

    x_min = utm_bounds.left
    x_max = utm_bounds.right
    y_min = utm_bounds.bottom
    y_max = utm_bounds.top

    x_centres = np.linspace(x_min + res_x / 2, x_max - res_x / 2, cols)
    y_centres = np.linspace(y_max - res_y / 2, y_min + res_y / 2, rows)

    # Replace NaN with local minimum (dry land assumption)
    min_valid = float(np.nanmin(elev_dec))
    elev_dec = np.where(np.isnan(elev_dec), min_valid, elev_dec)

    # Compute WGS84 bounds for reference
    from pyproj import Transformer
    tr84 = Transformer.from_crs(f"EPSG:{utm_epsg}", "EPSG:4326", always_xy=True)
    lon_min, lat_min = tr84.transform(x_min, y_min)
    lon_max, lat_max = tr84.transform(x_max, y_max)

    logger.info(f"DEM loaded: {rows}×{cols} cells @ {resolution_m:.0f} m "
                f"| z=[{np.nanmin(elev_dec):.1f}, {np.nanmax(elev_dec):.1f}] m MSL"
                f" | synthetic={is_synthetic}")

    return {
        "is_synthetic":   is_synthetic,
        "dem_path_utm":   dem_utm_path,
        "epsg":           utm_epsg,
        "x_min":          float(x_min),
        "x_max":          float(x_max),
        "y_min":          float(y_min),
        "y_max":          float(y_max),
        "resolution_m":   float(resolution_m),
        "cols":           int(cols),
        "rows":           int(rows),
        "elevation":      elev_dec,           # 2D ndarray (rows×cols)
        "x_centres":      x_centres,          # 1D (cols,)
        "y_centres":      y_centres,          # 1D (rows,) top→bottom
        "nodata":         -9999.0,
        "wgs84_bounds":   (float(lon_min), float(lat_min),
                           float(lon_max), float(lat_max)),
        "min_elev_m":     float(np.nanmin(elev_dec)),
        "max_elev_m":     float(np.nanmax(elev_dec)),
    }

#!/usr/bin/env python3
"""
DEM Downloader for Nagarjuna Sagar Dam – SRTM 1 arc-second (30 m) from OpenTopography

Bounding box covers the entire Krishna River valley from the dam to Rentachintala:
  South: 16.40°N
  North: 16.70°N
  West:  79.20°E
  East:  79.55°E

Usage:
  python3 download_dem.py [--api-key YOUR_KEY] [--output ../data/dem/nagarjuna_sagar.tif]

If no API key is provided we fall back to the public OpenTopoData server (lower
resolution, 1 request/s rate limit) or you can supply the GeoTIFF manually.

Without a key the script also tries to build a synthetic-but-consistent DEM from
the SRTM30_PLUS dataset via the opentopo.sdsc.edu anonymous WCS endpoint.
"""

import argparse
import os
import sys
import urllib.request
import urllib.parse


BBOX_SOUTH = 16.40
BBOX_NORTH = 16.70
BBOX_WEST  = 79.20
BBOX_EAST  = 79.55


def download_via_opentopo_api(api_key: str, output_path: str) -> bool:
    """
    Download SRTMGL1 (1-arc-second, ~30 m) via OpenTopography REST API.
    Requires a free API key from https://opentopography.org/
    """
    base_url = "https://portal.opentopography.org/API/globaldem"
    params = {
        "demtype":    "SRTMGL1",
        "south":      BBOX_SOUTH,
        "north":      BBOX_NORTH,
        "west":       BBOX_WEST,
        "east":       BBOX_EAST,
        "outputFormat": "GTiff",
        "API_Key":    api_key,
    }
    url = base_url + "?" + urllib.parse.urlencode(params)
    print(f"  Requesting SRTMGL1 DEM from OpenTopography API …")
    print(f"  URL: {url[:120]}…")
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        urllib.request.urlretrieve(url, output_path)
        size_mb = os.path.getsize(output_path) / 1e6
        print(f"  ✓ Downloaded {size_mb:.1f} MB → {output_path}")
        return True
    except Exception as exc:
        print(f"  ✗ OpenTopography API download failed: {exc}")
        return False


def download_via_opentopo_wcs(output_path: str) -> bool:
    """
    Anonymous WCS endpoint (no API key) – SRTM30_PLUS dataset.
    Lower fidelity (~1km) but useful for a sanity check.
    """
    wcs_url = (
        "https://opentopo.sdsc.edu/otr/getdem"
        f"?demtype=SRTMGL3"
        f"&south={BBOX_SOUTH}&north={BBOX_NORTH}"
        f"&west={BBOX_WEST}&east={BBOX_EAST}"
        f"&outputFormat=GTiff"
    )
    print(f"  Attempting anonymous WCS (SRTMGL3 ~90m) …")
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        urllib.request.urlretrieve(wcs_url, output_path)
        size_mb = os.path.getsize(output_path) / 1e6
        print(f"  ✓ Downloaded {size_mb:.1f} MB → {output_path}")
        return True
    except Exception as exc:
        print(f"  ✗ Anonymous WCS download failed: {exc}")
        return False


def generate_fallback_synthetic_dem(output_path: str) -> bool:
    """
    Last-resort: generate a numpy-based synthetic GeoTIFF that is physically
    consistent with the actual Nagarjuna Sagar gorge profile.

    WARNING: This is only used when no real DEM can be downloaded.
    The simulation WILL produce scientifically incorrect results.
    The DEM file will carry a clear metadata tag: SYNTHETIC_FALLBACK=1.
    """
    try:
        import numpy as np
        import rasterio
        from rasterio.transform import from_bounds
        from rasterio.crs import CRS

        print("  ⚠  Generating SYNTHETIC fallback DEM (NOT real terrain).")
        print("  ⚠  Please obtain a real SRTM GeoTIFF and place it at:")
        print(f"  ⚠  {output_path}")

        # 100 m resolution over bbox → approx 330 cols × 330 rows
        RESOLUTION_DEG = 100 / 111320  # ~0.000899°
        cols = int((BBOX_EAST - BBOX_WEST) / RESOLUTION_DEG)
        rows = int((BBOX_NORTH - BBOX_SOUTH) / RESOLUTION_DEG)

        lons = np.linspace(BBOX_WEST, BBOX_EAST, cols)
        lats = np.linspace(BBOX_NORTH, BBOX_SOUTH, rows)  # top-to-bottom

        lon_grid, lat_grid = np.meshgrid(lons, lats)

        # Dam at (16.5772°N, 79.3134°E)
        dam_lat, dam_lon = 16.5772, 79.3134
        dx_km = (lon_grid - dam_lon) * 111.32 * np.cos(np.radians(dam_lat))
        dy_km = (lat_grid - dam_lat) * 110.57

        # Krishna river centerline (empirical meander downstream of dam)
        river_cx = np.where(dx_km < 0,
                            0.4 * np.sin(dx_km * 0.5),
                            -0.35 * np.sin(dx_km * 0.35) - 0.08 * dx_km)
        dist_river = np.abs(dy_km - river_cx)
        dist_total = np.hypot(dx_km, dy_km)

        # Base plateau (Nallamala hills) ~260 m
        ridge = (np.sin(lat_grid * 85) * np.cos(lon_grid * 75) * 28 +
                 np.sin(lat_grid * 150 + lon_grid * 120) * 15)
        plateau = 260 + ridge

        elev = plateau.copy()

        # Upstream reservoir
        ups_mask = dx_km < 0
        canyon_u = np.clip(dist_river / 2.2, 0, 1)
        bed_u = 82 + dist_total * 2.0
        elev[ups_mask] = bed_u[ups_mask] + canyon_u[ups_mask] ** 2 * (plateau[ups_mask] - bed_u[ups_mask])

        # Downstream gorge
        dns_mask = dx_km >= 0
        river_bed = 76 - (dx_km / 20.0) * 14
        canyon_hw = 0.55 + (dx_km / 20.0) * 1.8
        u_val = dist_river / np.maximum(canyon_hw, 0.01)
        inner = dns_mask & (u_val < 1.0)
        wall  = dns_mask & (u_val >= 1.0) & (dist_river < canyon_hw * 1.8)
        outer = dns_mask & (dist_river >= canyon_hw * 1.8)

        elev[inner] = river_bed[inner] + u_val[inner] ** 2 * 18
        wall_r = np.clip((u_val - 1.0) / 0.8, 0, 1)
        elev[wall] = river_bed[wall] + 18 + wall_r[wall] * (plateau[wall] - (river_bed[wall] + 18))
        elev[outer] = plateau[outer] + (dist_river[outer] - canyon_hw[outer] * 1.8) * 15

        # Add small noise
        rng = np.random.default_rng(42)
        elev += rng.normal(0, 2.0, elev.shape)
        elev = np.clip(elev, 55, 400).astype(np.float32)

        transform = from_bounds(BBOX_WEST, BBOX_SOUTH, BBOX_EAST, BBOX_NORTH, cols, rows)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with rasterio.open(
            output_path, 'w',
            driver='GTiff',
            height=rows, width=cols,
            count=1,
            dtype=np.float32,
            crs=CRS.from_epsg(4326),
            transform=transform,
        ) as dst:
            dst.write(elev, 1)
            dst.update_tags(
                SYNTHETIC_FALLBACK="1",
                NOTE="NOT real SRTM. Replace with real GeoTIFF.",
                DAM="Nagarjuna Sagar",
                BBOX=f"S={BBOX_SOUTH} N={BBOX_NORTH} W={BBOX_WEST} E={BBOX_EAST}",
            )

        print(f"  Synthetic DEM written → {output_path}  ({rows}×{cols} cells @ ~100m)")
        return True
    except Exception as exc:
        print(f"  ✗ Synthetic DEM generation failed: {exc}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Download SRTM DEM for Nagarjuna Sagar")
    parser.add_argument("--api-key", default=os.environ.get("OPENTOPO_API_KEY", ""),
                        help="OpenTopography API key (free at opentopography.org)")
    parser.add_argument("--output", default=os.path.join(
        os.path.dirname(__file__), "..", "data", "dem", "nagarjuna_sagar.tif"),
        help="Output GeoTIFF path")
    args = parser.parse_args()

    output_path = os.path.abspath(args.output)

    if os.path.exists(output_path):
        size_mb = os.path.getsize(output_path) / 1e6
        print(f"DEM already exists: {output_path} ({size_mb:.1f} MB)")
        return

    print(f"Nagarjuna Sagar DEM Downloader")
    print(f"  Bbox: S={BBOX_SOUTH} N={BBOX_NORTH} W={BBOX_WEST} E={BBOX_EAST}")
    print(f"  Output: {output_path}")

    if args.api_key:
        if download_via_opentopo_api(args.api_key, output_path):
            return
    else:
        print("  No API key provided. Trying anonymous WCS (SRTMGL3 90m) …")

    if download_via_opentopo_wcs(output_path):
        return

    print("  Falling back to synthetic DEM …")
    if generate_fallback_synthetic_dem(output_path):
        print()
        print("  ⚠ IMPORTANT: The simulation is running on SYNTHETIC terrain.")
        print("  ⚠ Results are NOT scientifically valid.")
        print("  ⚠ To get real results, obtain an SRTM GeoTIFF and place it at:")
        print(f"  ⚠   {output_path}")
        return

    print("ERROR: Could not obtain DEM by any method.", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()

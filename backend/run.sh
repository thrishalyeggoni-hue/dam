#!/usr/bin/env bash
# run.sh — Start the ANUGA FastAPI backend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activate virtualenv
VENV_DIR="$SCRIPT_DIR/venv"
if [ ! -d "$VENV_DIR" ]; then
  echo "ERROR: virtualenv not found at $VENV_DIR"
  echo "Run:  python3 -m venv backend/venv && source backend/venv/bin/activate && pip install -r backend/requirements.txt"
  exit 1
fi

source "$VENV_DIR/bin/activate"

# Download DEM if not present
DEM_PATH="$SCRIPT_DIR/data/dem/nagarjuna_sagar.tif"
if [ ! -f "$DEM_PATH" ]; then
  echo "DEM not found. Downloading/generating..."
  python3 "$SCRIPT_DIR/scripts/download_dem.py" --output "$DEM_PATH"
fi

# Start FastAPI server
echo "Starting ANUGA Hydrodynamic Backend on http://localhost:8000"
echo "Docs: http://localhost:8000/docs"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level info

"""Pydantic models for the FastAPI backend — mirror the TypeScript types/index.ts"""

from typing import Optional, List, Literal
from pydantic import BaseModel, Field


class BreachParameters(BaseModel):
    reservoir_water_level_m:    float = Field(179.8,  description="Water surface elevation (m MSL)")
    initial_water_depth_m:      float = Field(105.0,  description="Full water column depth (m)")
    dam_crest_elevation_m:      float = Field(179.83, description="Dam crest elevation (m MSL)")
    dam_toe_elevation_m:        float = Field(74.0,   description="Toe elevation (m MSL)")
    breach_width_m:             float = Field(60.0,   description="Final breach width (m)", ge=1)
    breach_height_m:            float = Field(55.0,   description="Breach vertical depth (m)", ge=1)
    breach_formation_time_min:  float = Field(45.0,   description="Formation duration (min)", ge=1)
    breach_location:            Literal["center", "left_abutment", "right_abutment"] = "center"
    failure_type:               Literal["complete", "major", "partial", "piping", "custom"] = "major"
    manning_n:                  float = Field(0.035,  description="Manning roughness coefficient")
    # Grid position fractions (0–1); derived from breach_location by default
    breach_y_fraction:          Optional[float] = None
    dam_x_fraction:             float = Field(0.22,   description="Dam position as fraction of domain width")


class SimulationRequest(BaseModel):
    dam_id:     str            = "nagarjuna-sagar"
    parameters: BreachParameters = Field(default_factory=BreachParameters)
    is_demo:    bool           = False
    yield_step_s:  float = Field(60.0,   description="Output interval (s)")
    final_time_s:  float = Field(10800.0, description="Total simulation duration (s)")
    decimation:    int   = Field(2,      description="DEM decimation factor (1=full, 2=half-res)")


class SimulationStatusResponse(BaseModel):
    simulation_id:    str
    status:           Literal["QUEUED", "PREPROCESSING", "MESHING", "SIMULATING",
                               "POSTPROCESSING", "COMPLETED", "FAILED"]
    progress_percent: int
    current_stage:    str
    is_demo:          bool = False
    error:            Optional[str] = None


class SimulationFrame(BaseModel):
    frame_index:       int
    time_seconds:      int
    time_formatted:    str
    discharge_m3s:     float
    max_depth_m:       float
    max_velocity_ms:   float
    flooded_area_sqkm: float
    wet_cell_count:    int
    dry_cell_count:    int
    grid_depths:       List[List[float]]
    grid_velocities:   List[List[List[float]]]  # [row][col] = [u, v]
    flood_geojson:     dict


class DiagnosticsResponse(BaseModel):
    mesh_element_count:           int
    dem_min_elevation_m:          float
    dem_max_elevation_m:          float
    dem_is_synthetic:             bool
    grid_resolution_m:            float
    grid_rows:                    int
    grid_cols:                    int
    yield_step_s:                 float
    final_time_s:                 float
    wall_time_s:                  float
    frame_count:                  int
    wet_threshold_m:              float
    manning_n:                    float
    initial_reservoir_volume_m3:  float
    final_domain_volume_m3:       float
    cumulative_breach_volume_m3:  float
    mass_balance_error_percent:   float
    sww_path:                     str

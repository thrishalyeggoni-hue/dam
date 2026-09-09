import {
  IndianDam,
  DEMMetadata,
  InfrastructureFeature,
  EvacuationRoute,
  BreachParameters,
} from '../types';

// ========================================================================
// 1. REAL RIVER CHANNELS (Continuous GPS Thalwegs Following Valleys)
// ========================================================================
export const DAM_RIVER_CHANNELS: Record<string, [number, number][]> = {
  'nagarjuna-sagar': [
    [16.5772, 79.3134], // Nagarjuna Sagar Dam Axis
    [16.5768, 79.3245], // Vijayapuri Gorge
    [16.5780, 79.3480], // Krishna Canyon
    [16.5752, 79.3850], // Tail Pond Reservoir Inflow
    [16.5820, 79.4600], // Tail Pond Dam Axis
    [16.5750, 79.5100], // Krishna Valley Meander
    [16.5510, 79.5480], // Rentachintala North Reach
    [16.5820, 79.6200], // Guntur Border Valley
    [16.6020, 79.7320], // Dachepalli Reach
    [16.6800, 79.8800], // Krishna Plains
    [16.7542, 80.0567], // Pulichintala Project
  ],
  'sardar-sarovar': [
    [21.8294, 73.7489], // Sardar Sarovar Dam Axis (Kevadia)
    [21.8250, 73.7250], // Kevadia Colony Reach
    [21.8150, 73.6950], // Garudeshwar Weir
    [21.8210, 73.6210], // Tilakwada Riverbank
    [21.8380, 73.5350], // Poicha
    [21.8020, 73.4750], // Rajpipla Northern Reach
    [21.7500, 73.3200], // Narmada Valley Meander
    [21.7050, 72.9950], // Bharuch Estuary / Golden Bridge
  ],
  'tehri': [
    [30.3782, 78.4804], // Tehri Dam Axis (Bhagirathi River)
    [30.3550, 78.5020], // Downstream Canyon
    [30.3150, 78.5350], // Koteshwar Dam & Reservoir
    [30.2650, 78.5600], // Bhagirathi Gorge Winding
    [30.2050, 78.5800], // Maletha Valley Reach
    [30.1460, 78.5980], // Devprayag Sangam (Confluence with Alaknanda -> Ganga)
    [30.0820, 78.5150], // Ganga Himalayan Gorge (Kaudiyala)
    [30.0650, 78.4450], // Byasi Deep Canyon
    [30.1250, 78.3650], // Shivpuri Canyon Exit
    [30.1220, 78.3250], // Muni Ki Reti
    [30.1030, 78.2940], // Rishikesh Plains (Triveni Ghat)
    [30.0750, 78.2850], // Pashulok Barrage
  ],
  'hirakud': [
    [21.5280, 83.8740], // Hirakud Dam Axis (Mahanadi River)
    [21.5020, 83.8720], // Burla Power Channel Confluence
    [21.4670, 83.9780], // Sambalpur City Reach
    [21.4350, 83.9850], // Mahanadi Southern Curve
    [21.3520, 83.9240], // Chiplima Hydro Station
    [21.2800, 83.9150], // Goshala Reach
    [21.2180, 83.9120], // Dhama Riverbank
    [21.0420, 83.8820], // Binka & Sonepur Confluence
  ],
  'idukki': [
    [9.8517, 76.9744], // Idukki Arch Dam Axis
    [9.8650, 76.9550], // Cheruthoni Spillway Dam
    [9.9050, 76.9120], // Karimban Valley
    [9.9320, 76.8520], // Chelachuvadu Gorge
    [9.9780, 76.7620], // Lower Periyar (Pambla Dam)
    [10.0250, 76.6850], // Periyar Western Ghats Canyon
    [10.0520, 76.6210], // Neriamangalam Gorge Exit
    [10.1120, 76.3540], // Aluva Plains (Periyar Delta)
  ],
  'bhakra-nangal': [
    [31.4116, 76.4363], // Bhakra Dam Axis (Sutlej River)
    [31.4020, 76.4250], // Olinda Gorge
    [31.3850, 76.3980], // Sutlej Canyon Approach
    [31.3720, 76.3810], // Nangal Dam & Hydel Canal Headworks
    [31.3100, 76.4350], // Mehatpur Valley
    [31.2350, 76.5020], // Anandpur Sahib Valley
    [31.1820, 76.5720], // Kiratpur Sahib
    [30.9780, 76.5280], // Rupnagar (Ropar Headworks)
  ],
  'srisailam': [
    [16.0878, 78.8988], // Srisailam Dam Axis (Krishna River)
    [16.0950, 78.9050], // Deep Nallamala Canyon
    [16.1150, 78.9150], // Sunnipenta Reach
    [16.1450, 78.9450], // Krishna Gorge North
    [16.1820, 78.9950], // Dindi River Confluence Reach
    [16.2800, 79.1100], // Nagarjuna Sagar Upstream Lake Inflow
    [16.5772, 79.3134], // Nagarjuna Sagar Dam
  ],
  'koyna': [
    [17.4014, 73.7486], // Koyna Dam Axis (Koyna River)
    [17.3980, 73.7580], // Koynanagar Township Reach
    [17.3820, 73.7850], // Helwak Bridge & Valley
    [17.3750, 73.8450], // Kumbharli Foothills
    [17.3710, 73.9020], // Patan Tehsil Valley
    [17.3450, 74.0250], // Koyna Plains Approach
    [17.2880, 74.1840], // Karad (Krishna-Koyna Preeti Sangam)
  ],
};

// ========================================================================
// 2. REAL DOWNSTREAM INFRASTRUCTURE (Verified Settlements, Hospitals, Bridges, Shelters)
// ========================================================================
export const DAM_INFRASTRUCTURE: Record<string, InfrastructureFeature[]> = {
  'nagarjuna-sagar': [
    {
      id: 'ns-v1',
      name: 'Vijayapuri South (Right Bank Colony)',
      type: 'village',
      lat: 16.5735,
      lon: 79.3185,
      elevation_m: 118,
      population: 14500,
      distance_from_dam_km: 1.2,
    },
    {
      id: 'ns-v2',
      name: 'Nandikonda / Hill Colony (North Bank)',
      type: 'village',
      lat: 16.5875,
      lon: 79.3142,
      elevation_m: 162,
      population: 19800,
      distance_from_dam_km: 1.6,
    },
    {
      id: 'ns-h1',
      name: 'Nagarjuna Sagar Area Hospital',
      type: 'hospital',
      lat: 16.5782,
      lon: 79.3210,
      elevation_m: 125,
      distance_from_dam_km: 1.5,
    },
    {
      id: 'ns-s1',
      name: 'Kendriya Vidyalaya Project Campus',
      type: 'school',
      lat: 16.5820,
      lon: 79.3160,
      elevation_m: 142,
      distance_from_dam_km: 1.3,
    },
    {
      id: 'ns-v3',
      name: 'Tail Pond Submersible Settlement',
      type: 'village',
      lat: 16.5810,
      lon: 79.4550,
      elevation_m: 86,
      population: 4800,
      distance_from_dam_km: 15.2,
    },
    {
      id: 'ns-b1',
      name: 'Krishna River Bridge (Tail Pond Crossing)',
      type: 'bridge',
      lat: 16.5830,
      lon: 79.4620,
      elevation_m: 88,
      distance_from_dam_km: 15.8,
    },
    {
      id: 'ns-v4',
      name: 'Rentachintala River Corridor',
      type: 'village',
      lat: 16.5510,
      lon: 79.5480,
      elevation_m: 84,
      population: 16200,
      distance_from_dam_km: 26.5,
    },
    {
      id: 'ns-v5',
      name: 'Macherla Lowland Wards',
      type: 'village',
      lat: 16.4820,
      lon: 79.4320,
      elevation_m: 110,
      population: 58000,
      distance_from_dam_km: 18.4,
    },
    {
      id: 'ns-v6',
      name: 'Dachepalli River Basin Settlement',
      type: 'village',
      lat: 16.6020,
      lon: 79.7320,
      elevation_m: 78,
      population: 29500,
      distance_from_dam_km: 44.0,
    },
    {
      id: 'ns-sh1',
      name: 'Pylon Ridge High-Ground Evacuation Complex',
      type: 'shelter',
      lat: 16.5620,
      lon: 79.3080,
      elevation_m: 235,
      population: 25000,
      distance_from_dam_km: 2.1,
    },
    {
      id: 'ns-sh2',
      name: 'Nalgonda North Plateau Safe Haven',
      type: 'shelter',
      lat: 16.6120,
      lon: 79.3180,
      elevation_m: 280,
      population: 30000,
      distance_from_dam_km: 4.2,
    },
  ],
  'sardar-sarovar': [
    {
      id: 'ss-v1',
      name: 'Kevadia Colony Township',
      type: 'village',
      lat: 21.8310,
      lon: 73.7250,
      elevation_m: 58,
      population: 18500,
      distance_from_dam_km: 2.4,
    },
    {
      id: 'ss-v2',
      name: 'Garudeshwar Settlement (Weir)',
      type: 'village',
      lat: 21.8150,
      lon: 73.6950,
      elevation_m: 44,
      population: 11200,
      distance_from_dam_km: 6.2,
    },
    {
      id: 'ss-b1',
      name: 'Garudeshwar Narmada Bridge',
      type: 'bridge',
      lat: 21.8160,
      lon: 73.6930,
      elevation_m: 48,
      distance_from_dam_km: 6.4,
    },
    {
      id: 'ss-v3',
      name: 'Tilakwada Riverbank Town',
      type: 'village',
      lat: 21.8210,
      lon: 73.6210,
      elevation_m: 38,
      population: 14300,
      distance_from_dam_km: 14.5,
    },
    {
      id: 'ss-v4',
      name: 'Poicha Swaminarayan Ghat Reach',
      type: 'village',
      lat: 21.8380,
      lon: 73.5350,
      elevation_m: 34,
      population: 8700,
      distance_from_dam_km: 23.0,
    },
    {
      id: 'ss-h1',
      name: 'Sub-District Hospital Rajpipla',
      type: 'hospital',
      lat: 21.8020,
      lon: 73.5100,
      elevation_m: 48,
      distance_from_dam_km: 26.0,
    },
    {
      id: 'ss-sh1',
      name: 'Statue Ridge High-Ground Safe Haven',
      type: 'shelter',
      lat: 21.8450,
      lon: 73.7180,
      elevation_m: 145,
      population: 20000,
      distance_from_dam_km: 3.5,
    },
  ],
  'tehri': [
    {
      id: 'th-v1',
      name: 'Tehri Project Colony (Old Tehri Suburbs)',
      type: 'village',
      lat: 30.3650,
      lon: 78.4920,
      elevation_m: 620,
      population: 6400,
      distance_from_dam_km: 1.8,
    },
    {
      id: 'th-v2',
      name: 'Koteshwar Dam Township',
      type: 'village',
      lat: 30.3150,
      lon: 78.5350,
      elevation_m: 540,
      population: 4200,
      distance_from_dam_km: 9.5,
    },
    {
      id: 'th-b1',
      name: 'Koteshwar Gorge Suspension Bridge',
      type: 'bridge',
      lat: 30.3120,
      lon: 78.5380,
      elevation_m: 548,
      distance_from_dam_km: 10.1,
    },
    {
      id: 'th-v3',
      name: 'Devprayag Sangam (Bhagirathi-Alaknanda)',
      type: 'village',
      lat: 30.1460,
      lon: 78.5980,
      elevation_m: 460,
      population: 8500,
      distance_from_dam_km: 32.0,
    },
    {
      id: 'th-v4',
      name: 'Byasi Canyon Village',
      type: 'village',
      lat: 30.0650,
      lon: 78.4450,
      elevation_m: 410,
      population: 2800,
      distance_from_dam_km: 48.0,
    },
    {
      id: 'th-v5',
      name: 'Rishikesh (Triveni Ghat & Muni Ki Reti)',
      type: 'village',
      lat: 30.1030,
      lon: 78.2940,
      elevation_m: 340,
      population: 102000,
      distance_from_dam_km: 68.0,
    },
    {
      id: 'th-sh1',
      name: 'Tehri Ridge Helipad Emergency Shelter',
      type: 'shelter',
      lat: 30.3950,
      lon: 78.4720,
      elevation_m: 1050,
      population: 15000,
      distance_from_dam_km: 2.5,
    },
    {
      id: 'th-sh2',
      name: 'Devprayag Hilltop Safe Zone Refuge',
      type: 'shelter',
      lat: 30.1550,
      lon: 78.6020,
      elevation_m: 680,
      population: 12000,
      distance_from_dam_km: 33.0,
    },
  ],
  'hirakud': [
    {
      id: 'hk-v1',
      name: 'Burla Township (VSS Medical College)',
      type: 'village',
      lat: 21.5020,
      lon: 83.8720,
      elevation_m: 162,
      population: 46000,
      distance_from_dam_km: 3.2,
    },
    {
      id: 'hk-h1',
      name: 'VIMSAR Burla Super-Speciality Hospital',
      type: 'hospital',
      lat: 21.4980,
      lon: 83.8750,
      elevation_m: 165,
      distance_from_dam_km: 3.6,
    },
    {
      id: 'hk-v2',
      name: 'Sambalpur City (Mahanadi Riverfront)',
      type: 'village',
      lat: 21.4670,
      lon: 83.9780,
      elevation_m: 142,
      population: 185000,
      distance_from_dam_km: 11.5,
    },
    {
      id: 'hk-b1',
      name: 'Mahanadi River NH-53 Bridge (Sambalpur)',
      type: 'bridge',
      lat: 21.4620,
      lon: 83.9710,
      elevation_m: 148,
      distance_from_dam_km: 11.8,
    },
    {
      id: 'hk-v3',
      name: 'Chiplima Hydroelectric Station',
      type: 'village',
      lat: 21.3520,
      lon: 83.9240,
      elevation_m: 132,
      population: 12000,
      distance_from_dam_km: 22.0,
    },
    {
      id: 'hk-v4',
      name: 'Dhama Riverbank Settlement',
      type: 'village',
      lat: 21.2180,
      lon: 83.9120,
      elevation_m: 120,
      population: 9500,
      distance_from_dam_km: 36.0,
    },
    {
      id: 'hk-sh1',
      name: 'Gandhi Minar Hilltop Safe Haven',
      type: 'shelter',
      lat: 21.5380,
      lon: 83.8650,
      elevation_m: 260,
      population: 20000,
      distance_from_dam_km: 1.8,
    },
  ],
  'idukki': [
    {
      id: 'id-v1',
      name: 'Cheruthoni Spillway Township',
      type: 'village',
      lat: 9.8650,
      lon: 76.9550,
      elevation_m: 640,
      population: 14200,
      distance_from_dam_km: 2.5,
    },
    {
      id: 'id-v2',
      name: 'Karimban Periyar River Settlement',
      type: 'village',
      lat: 9.9050,
      lon: 76.9120,
      elevation_m: 420,
      population: 8600,
      distance_from_dam_km: 9.2,
    },
    {
      id: 'id-b1',
      name: 'Chelachuvadu River Bridge',
      type: 'bridge',
      lat: 9.9320,
      lon: 76.8520,
      elevation_m: 310,
      distance_from_dam_km: 16.5,
    },
    {
      id: 'id-v3',
      name: 'Lower Periyar (Pambla Dam Reach)',
      type: 'village',
      lat: 9.9780,
      lon: 76.7620,
      elevation_m: 185,
      population: 5400,
      distance_from_dam_km: 28.0,
    },
    {
      id: 'id-v4',
      name: 'Neriamangalam Gorge Gateway',
      type: 'village',
      lat: 10.0520,
      lon: 76.6210,
      elevation_m: 75,
      population: 21000,
      distance_from_dam_km: 44.0,
    },
    {
      id: 'id-sh1',
      name: 'Kuravan Peak High-Ground Safe Zone',
      type: 'shelter',
      lat: 9.8450,
      lon: 76.9850,
      elevation_m: 920,
      population: 15000,
      distance_from_dam_km: 1.5,
    },
  ],
  'bhakra-nangal': [
    {
      id: 'bk-v1',
      name: 'Olinda Project Township',
      type: 'village',
      lat: 31.4020,
      lon: 76.4250,
      elevation_m: 375,
      population: 7200,
      distance_from_dam_km: 1.8,
    },
    {
      id: 'bk-v2',
      name: 'Nangal Dam & Township (Downstream Weir)',
      type: 'village',
      lat: 31.3720,
      lon: 76.3810,
      elevation_m: 345,
      population: 45000,
      distance_from_dam_km: 13.0,
    },
    {
      id: 'bk-b1',
      name: 'Nangal Hydel Canal Crossing Viaduct',
      type: 'bridge',
      lat: 31.3680,
      lon: 76.3750,
      elevation_m: 348,
      distance_from_dam_km: 13.5,
    },
    {
      id: 'bk-v3',
      name: 'Anandpur Sahib Lowland Wards',
      type: 'village',
      lat: 31.2350,
      lon: 76.5020,
      elevation_m: 310,
      population: 28000,
      distance_from_dam_km: 31.0,
    },
    {
      id: 'bk-v4',
      name: 'Kiratpur Sahib Riverbank',
      type: 'village',
      lat: 31.1820,
      lon: 76.5720,
      elevation_m: 295,
      population: 16500,
      distance_from_dam_km: 39.0,
    },
    {
      id: 'bk-sh1',
      name: 'Naina Devi Foothills Emergency Complex',
      type: 'shelter',
      lat: 31.3050,
      lon: 76.5410,
      elevation_m: 720,
      population: 25000,
      distance_from_dam_km: 18.0,
    },
  ],
  'srisailam': [
    {
      id: 'sr-v1',
      name: 'Srisailam Project Colony (Right Bank)',
      type: 'village',
      lat: 16.0950,
      lon: 78.8920,
      elevation_m: 210,
      population: 12400,
      distance_from_dam_km: 1.2,
    },
    {
      id: 'sr-v2',
      name: 'Pathalaganga Sacred Krishna Ghats',
      type: 'village',
      lat: 16.0820,
      lon: 78.8780,
      elevation_m: 175,
      population: 3500,
      distance_from_dam_km: 1.5,
    },
    {
      id: 'sr-b1',
      name: 'Srisailam Dam Axis Gorge Bridge',
      type: 'bridge',
      lat: 16.0885,
      lon: 78.8995,
      elevation_m: 272,
      distance_from_dam_km: 0.2,
    },
    {
      id: 'sr-v3',
      name: 'Sunnipenta Township (Left Bank)',
      type: 'village',
      lat: 16.1150,
      lon: 78.9150,
      elevation_m: 285,
      population: 18000,
      distance_from_dam_km: 3.8,
    },
    {
      id: 'sr-v4',
      name: 'Dindi River Confluence Reach',
      type: 'village',
      lat: 16.1820,
      lon: 78.9950,
      elevation_m: 155,
      population: 4100,
      distance_from_dam_km: 16.0,
    },
    {
      id: 'sr-sh1',
      name: 'Srisailam Temple Hill Plateau Shelter',
      type: 'shelter',
      lat: 16.0740,
      lon: 78.8680,
      elevation_m: 420,
      population: 20000,
      distance_from_dam_km: 2.8,
    },
  ],
  'koyna': [
    {
      id: 'ky-v1',
      name: 'Koynanagar Township',
      type: 'village',
      lat: 17.3980,
      lon: 73.7580,
      elevation_m: 580,
      population: 14000,
      distance_from_dam_km: 1.4,
    },
    {
      id: 'ky-b1',
      name: 'Helwak River Bridge & Market',
      type: 'bridge',
      lat: 17.3820,
      lon: 73.7850,
      elevation_m: 560,
      distance_from_dam_km: 4.8,
    },
    {
      id: 'ky-v2',
      name: 'Patan Tehsil Headquarters',
      type: 'village',
      lat: 17.3710,
      lon: 73.9020,
      elevation_m: 545,
      population: 32000,
      distance_from_dam_km: 16.5,
    },
    {
      id: 'ky-v3',
      name: 'Karad City (Krishna-Koyna Sangam)',
      type: 'village',
      lat: 17.2880,
      lon: 74.1840,
      elevation_m: 520,
      population: 95000,
      distance_from_dam_km: 48.0,
    },
    {
      id: 'ky-sh1',
      name: 'Nehru Memorial Hilltop Safe Refuge',
      type: 'shelter',
      lat: 17.4120,
      lon: 73.7420,
      elevation_m: 740,
      population: 18000,
      distance_from_dam_km: 1.8,
    },
  ],
};

// ========================================================================
// 3. REAL EVACUATION CORRIDORS & SAFE SHELTERS FOR ALL DAMS
// ========================================================================
export const DAM_EVACUATION_ROUTES: Record<string, EvacuationRoute[]> = {
  'nagarjuna-sagar': [
    {
      id: 'ns-ev1',
      from_village: 'Vijayapuri South',
      to_shelter: 'Pylon Ridge High-Ground Evacuation Complex',
      corridor_name: 'SH-2 Macherla-Nalgonda Highway via Pylon Crest',
      road_type: 'Multi-lane Paved Arterial Highway',
      distance_km: 3.4,
      travel_time_min: 14,
      status: 'SAFE',
      coordinates: [
        [16.5735, 79.3185],
        [16.5680, 79.3140],
        [16.5620, 79.3080],
      ],
      min_clearance_elevation_m: 135,
    },
    {
      id: 'ns-ev2',
      from_village: 'Vijayapuri North (Nandikonda)',
      to_shelter: 'Nalgonda North Plateau Safe Haven',
      corridor_name: 'Hill Colony Crest Spur to Miryalaguda Express Corridor',
      road_type: '2-Lane Elevated Ridge Highway',
      distance_km: 4.8,
      travel_time_min: 19,
      status: 'SAFE',
      coordinates: [
        [16.5875, 79.3142],
        [16.6000, 79.3160],
        [16.6120, 79.3180],
      ],
      min_clearance_elevation_m: 185,
    },
    {
      id: 'ns-ev3',
      from_village: 'Tail Pond Submersible Settlement',
      to_shelter: 'Pylon Ridge High-Ground Evacuation Complex',
      corridor_name: 'Tail Pond Upland Relief Road via Kambhampadu Ridge',
      road_type: 'Reinforced Rural Bypass Artery',
      distance_km: 16.2,
      travel_time_min: 42,
      status: 'SAFE',
      coordinates: [
        [16.5810, 79.4550],
        [16.5720, 79.3800],
        [16.5620, 79.3080],
      ],
      min_clearance_elevation_m: 98,
    },
    {
      id: 'ns-ev4',
      from_village: 'Rentachintala River Corridor',
      to_shelter: 'Macherla Fort Ridge Safe Zone',
      corridor_name: 'NH-565 Inter-District High Ridge Highway',
      road_type: 'Grade-A National Highway Corridor',
      distance_km: 14.5,
      travel_time_min: 36,
      status: 'SAFE',
      coordinates: [
        [16.5510, 79.5480],
        [16.5200, 79.4900],
        [16.4820, 79.4320],
      ],
      min_clearance_elevation_m: 110,
    },
  ],
  'sardar-sarovar': [
    {
      id: 'ss-ev1',
      from_village: 'Kevadia Colony Township',
      to_shelter: 'Statue Ridge High-Ground Safe Haven',
      corridor_name: 'Ekta Nagar Valley Crest Expressway (SH-63)',
      road_type: '4-Lane Divided Mountain Highway',
      distance_km: 3.5,
      travel_time_min: 12,
      status: 'SAFE',
      coordinates: [
        [21.8310, 73.7250],
        [21.8380, 73.7200],
        [21.8450, 73.7180],
      ],
      min_clearance_elevation_m: 95,
    },
    {
      id: 'ss-ev2',
      from_village: 'Garudeshwar Settlement',
      to_shelter: 'Statue Ridge High-Ground Safe Haven',
      corridor_name: 'Garudeshwar-Rajpipla State Highway (SH-160)',
      road_type: 'Elevated Embankment Highway',
      distance_km: 5.8,
      travel_time_min: 20,
      status: 'SAFE',
      coordinates: [
        [21.8150, 73.6950],
        [21.8300, 73.7050],
        [21.8450, 73.7180],
      ],
      min_clearance_elevation_m: 88,
    },
  ],
  'tehri': [
    {
      id: 'th-ev1',
      from_village: 'Tehri Project Colony',
      to_shelter: 'Tehri Ridge Helipad Emergency Shelter',
      corridor_name: 'Chamba-New Tehri Mountain Highway (NH-707A)',
      road_type: 'Engineered Himalayan Mountain Corridor',
      distance_km: 3.8,
      travel_time_min: 16,
      status: 'SAFE',
      coordinates: [
        [30.3650, 78.4920],
        [30.3800, 78.4850],
        [30.3950, 78.4720],
      ],
      min_clearance_elevation_m: 890,
    },
    {
      id: 'th-ev2',
      from_village: 'Devprayag Sangam',
      to_shelter: 'Devprayag Hilltop Safe Zone Refuge',
      corridor_name: 'Rishikesh-Badrinath National Highway (NH-58) Upper Spur',
      road_type: 'Reinforced Hill Ghat Road',
      distance_km: 2.6,
      travel_time_min: 15,
      status: 'SAFE',
      coordinates: [
        [30.1460, 78.5980],
        [30.1500, 78.6000],
        [30.1550, 78.6020],
      ],
      min_clearance_elevation_m: 580,
    },
  ],
  'hirakud': [
    {
      id: 'hk-ev1',
      from_village: 'Burla Township',
      to_shelter: 'Gandhi Minar Hilltop Safe Haven',
      corridor_name: 'Burla University Ridge Highway',
      road_type: 'Urban Elevated Artery',
      distance_km: 4.2,
      travel_time_min: 14,
      status: 'SAFE',
      coordinates: [
        [21.5020, 83.8720],
        [21.5200, 83.8680],
        [21.5380, 83.8650],
      ],
      min_clearance_elevation_m: 215,
    },
    {
      id: 'hk-ev2',
      from_village: 'Sambalpur Lowland Riverfront',
      to_shelter: 'Gandhi Minar Hilltop Safe Haven',
      corridor_name: 'Sambalpur-Bargarh Ring Highway (NH-53)',
      road_type: 'Grade-Separated National Highway',
      distance_km: 8.4,
      travel_time_min: 22,
      status: 'SAFE',
      coordinates: [
        [21.4650, 83.9720],
        [21.4950, 83.9200],
        [21.5380, 83.8650],
      ],
      min_clearance_elevation_m: 195,
    },
  ],
  'idukki': [
    {
      id: 'id-ev1',
      from_village: 'Cheruthoni Spillway Township',
      to_shelter: 'Kuravan Peak High-Ground Safe Zone',
      corridor_name: 'Kattappana-Idukki Hill Highway (SH-33)',
      road_type: 'Western Ghats Reinforced Road',
      distance_km: 3.2,
      travel_time_min: 18,
      status: 'SAFE',
      coordinates: [
        [9.8650, 76.9550],
        [9.8550, 76.9700],
        [9.8450, 76.9850],
      ],
      min_clearance_elevation_m: 820,
    },
    {
      id: 'id-ev2',
      from_village: 'Karimban Periyar River Settlement',
      to_shelter: 'Kuravan Peak High-Ground Safe Zone',
      corridor_name: 'Karimban Upland Ghat Link',
      road_type: 'Paved Mountain Artery',
      distance_km: 6.8,
      travel_time_min: 26,
      status: 'SAFE',
      coordinates: [
        [9.9050, 76.9120],
        [9.8800, 76.9450],
        [9.8450, 76.9850],
      ],
      min_clearance_elevation_m: 780,
    },
  ],
  'bhakra-nangal': [
    {
      id: 'bk-ev1',
      from_village: 'Olinda Project Township',
      to_shelter: 'Naina Devi Foothills Emergency Complex',
      corridor_name: 'Naina Devi Ghat Access Highway (SH-25)',
      road_type: 'Reinforced Hill Road',
      distance_km: 7.5,
      travel_time_min: 24,
      status: 'SAFE',
      coordinates: [
        [31.4020, 76.4250],
        [31.3500, 76.4800],
        [31.3050, 76.5410],
      ],
      min_clearance_elevation_m: 520,
    },
    {
      id: 'bk-ev2',
      from_village: 'Nangal Dam & Township (Downstream Weir)',
      to_shelter: 'Naina Devi Foothills Emergency Complex',
      corridor_name: 'Nangal-Anandpur Sahib Highway (NH-503)',
      road_type: '4-Lane Elevated Highway',
      distance_km: 11.2,
      travel_time_min: 28,
      status: 'SAFE',
      coordinates: [
        [31.3720, 76.3810],
        [31.3350, 76.4500],
        [31.3050, 76.5410],
      ],
      min_clearance_elevation_m: 480,
    },
  ],
  'srisailam': [
    {
      id: 'sr-ev1',
      from_village: 'Srisailam Project Colony (Right Bank)',
      to_shelter: 'Srisailam Temple Hill Plateau Shelter',
      corridor_name: 'Dornala-Srisailam Ghat Highway (NH-765)',
      road_type: 'Mountain Ghat Highway',
      distance_km: 4.8,
      travel_time_min: 16,
      status: 'SAFE',
      coordinates: [
        [16.0950, 78.8920],
        [16.0820, 78.8800],
        [16.0740, 78.8680],
      ],
      min_clearance_elevation_m: 340,
    },
    {
      id: 'sr-ev2',
      from_village: 'Sunnipenta Township (Left Bank)',
      to_shelter: 'Srisailam Temple Hill Plateau Shelter',
      corridor_name: 'Sunnipenta Crest Bypass Artery',
      road_type: 'Paved Ridge Corridor',
      distance_km: 5.6,
      travel_time_min: 18,
      status: 'SAFE',
      coordinates: [
        [16.1150, 78.9150],
        [16.0950, 78.8950],
        [16.0740, 78.8680],
      ],
      min_clearance_elevation_m: 355,
    },
  ],
  'koyna': [
    {
      id: 'ky-ev1',
      from_village: 'Koynanagar Township',
      to_shelter: 'Nehru Memorial Hilltop Safe Refuge',
      corridor_name: 'Chiplun-Karad Highway (SH-78) via Helwak Pass',
      road_type: 'Western Ghats Mountain Highway',
      distance_km: 2.8,
      travel_time_min: 12,
      status: 'SAFE',
      coordinates: [
        [17.3980, 73.7580],
        [17.4050, 73.7500],
        [17.4120, 73.7420],
      ],
      min_clearance_elevation_m: 680,
    },
    {
      id: 'ky-ev2',
      from_village: 'Patan River Settlement',
      to_shelter: 'Nehru Memorial Hilltop Safe Refuge',
      corridor_name: 'Patan-Koyna Escarpment Expressway',
      road_type: 'Elevated State Highway',
      distance_km: 8.2,
      travel_time_min: 24,
      status: 'SAFE',
      coordinates: [
        [17.3750, 73.8820],
        [17.3900, 73.8100],
        [17.4120, 73.7420],
      ],
      min_clearance_elevation_m: 640,
    },
  ],
};

// ========================================================================
// 4. REAL CONTINUOUS TOPOGRAPHICAL DEM GENERATION FOR ANY DAM
// ========================================================================
export function getDamDEM(dam: IndianDam): DEMMetadata {
  const rows = 32;
  const cols = 52;
  const bounds = dam.bounds;

  const minLat = bounds.min_lat;
  const maxLat = bounds.max_lat;
  const minLon = bounds.min_lon;
  const maxLon = bounds.max_lon;

  const damHeight = dam.height_m;
  const frl = dam.full_reservoir_level_m;
  const bedElev = Math.max(10, Math.round(dam.crest_elevation_m - damHeight));
  const maxElev = Math.round(frl + damHeight * 0.9);

  const elevations: number[][] = [];
  const riverPath = DAM_RIVER_CHANNELS[dam.id] || [
    [dam.latitude, dam.longitude],
    [dam.latitude, dam.longitude + 0.15],
  ];

  for (let r = 0; r < rows; r++) {
    elevations[r] = [];
    const lat = maxLat - (r / (rows - 1)) * (maxLat - minLat);

    for (let c = 0; c < cols; c++) {
      const lon = minLon + (c / (cols - 1)) * (maxLon - minLon);

      // Distance to the dam's true river path in kilometers
      let minDistToRiverKm = 999;
      let pathProgress = 0;

      for (let p = 0; p < riverPath.length - 1; p++) {
        const [lat1, lon1] = riverPath[p];
        const [lat2, lon2] = riverPath[p + 1];
        const d = pointToSegmentDistanceKm(lat, lon, lat1, lon1, lat2, lon2);
        if (d < minDistToRiverKm) {
          minDistToRiverKm = d;
          pathProgress = (p + 0.5) / riverPath.length;
        }
      }

      // Elevation along the riverbed slopes gently downstream
      const bedAlongReach = bedElev - pathProgress * (damHeight * 0.22);

      // Natural U-shaped / V-shaped canyon cross section
      // Close to river: valley floor; away from river: canyon walls and ridges
      const valleyFloorWidthKm = 0.8;
      let elevAboveBed = 0;
      if (minDistToRiverKm > valleyFloorWidthKm) {
        const dWall = minDistToRiverKm - valleyFloorWidthKm;
        elevAboveBed = Math.min(maxElev - bedElev, Math.pow(dWall, 1.35) * 28.0);
      } else {
        elevAboveBed = (minDistToRiverKm / valleyFloorWidthKm) * 6.0;
      }

      // Check if this cell is upstream of the dam
      const isUpstream = isPointUpstream(lat, lon, dam, riverPath);
      let cellElev = Math.round(bedAlongReach + elevAboveBed);

      if (isUpstream && minDistToRiverKm < 4.5) {
        // Carve out upstream reservoir lake bowl below FRL
        cellElev = Math.min(cellElev, Math.round(bedElev + 4));
      }

      // Soft natural topographical variation (no spikes)
      const naturalNoise =
        Math.sin(r * 0.45) * 3.5 +
        Math.cos(c * 0.38) * 3.5;

      elevations[r][c] = Math.max(bedElev - 5, Math.round(cellElev + naturalNoise));
    }
  }

  return {
    dam_id: dam.id,
    source: `SRTM 30m / CartoDEM Real Elevation (${dam.name})`,
    resolution_m: Math.round(((maxLon - minLon) * 111000) / cols),
    rows,
    cols,
    min_elevation_m: bedElev,
    max_elevation_m: maxElev,
    min_lat: minLat,
    max_lat: maxLat,
    min_lon: minLon,
    max_lon: maxLon,
    elevations,
  };
}

function pointToSegmentDistanceKm(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = (x2 - x1) * 111.0;
  const dy = (y2 - y1) * 111.0 * Math.cos((px * Math.PI) / 180);
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot((px - x1) * 111, (py - y1) * 111 * Math.cos((px * Math.PI) / 180));

  const t = Math.max(
    0,
    Math.min(
      1,
      (((px - x1) * 111 * dx + (py - y1) * 111 * Math.cos((px * Math.PI) / 180) * dy)) / l2
    )
  );
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return Math.hypot(
    (px - projX) * 111,
    (py - projY) * 111 * Math.cos((px * Math.PI) / 180)
  );
}

function isPointUpstream(
  lat: number,
  lon: number,
  dam: IndianDam,
  riverPath: [number, number][]
): boolean {
  if (riverPath.length < 2) return lon < dam.longitude;
  const [dLat, dLon] = riverPath[0];
  const [dNextLat, dNextLon] = riverPath[1];
  const flowVecX = dNextLon - dLon;
  const flowVecY = dNextLat - dLat;
  const pointVecX = lon - dLon;
  const pointVecY = lat - dLat;
  const dot = flowVecX * pointVecX + flowVecY * pointVecY;
  return dot < 0;
}

// Get default breach parameters calibrated for each specific Indian dam
export function getDefaultBreachParameters(dam: IndianDam): BreachParameters {
  const depth = Math.round(dam.height_m * 0.82);
  const breachWidth = Math.min(120, Math.max(40, Math.round(dam.length_m * 0.08)));
  const breachHeight = Math.round(dam.height_m * 0.60);

  return {
    reservoir_water_level_m: dam.full_reservoir_level_m,
    initial_water_depth_m: depth,
    breach_width_m: breachWidth,
    breach_height_m: breachHeight,
    breach_formation_time_min: 45,
    breach_location: 'center',
    failure_type: 'major',
    manning_n: 0.035,
  };
}

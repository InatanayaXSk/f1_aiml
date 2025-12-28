# Catalogue of the 25 Features

| Category | Feature | Description |
|----------|---------|-------------|
| Driver Form | `avg_pos_last5` | Mean finishing position over the previous five classified races. |
| Driver Form | `points_last5` | Cumulative championship points scored in the last five races. |
| Driver Form | `dnf_count_last5` | Count of retirements across the last five appearances. |
| Qualifying | `grid_position` | Starting grid slot after penalties. |
| Qualifying | `grid_vs_race_delta` | Finishing position minus grid slot (negative implies positions gained). |
| Track | `track_type_index` | Ordinal encoding of circuit archetype (0 low grip → 4 high speed). |
| Track | `corners` | Number of notable corners used as circuit complexity proxy. |
| Track | `straight_fraction` | Fraction of lap distance spent on straights. |
| Track | `overtaking_difficulty` | Ordinal scale (1 easy → 5 hard) based on historical passes. |
| Conditions | `rain_probability` | Normalised share of rainfall observed during the race. |
| Conditions | `track_temperature` | Average track temperature in Celsius. |
| Conditions | `wind_speed` | Mean wind speed in kilometres per hour. |
| Strategy | `pit_stops_count` | Number of pit stops logged for the race. |
| Strategy | `tire_compound_change_count` | Count of tyre compound changes. |
| Strategy | `fuel_efficiency_rating` | Composite metric balancing stops and average lap time. |
| Regulations | `power_ratio` | Electric power share baseline (15 percent). |
| Regulations | `aero_coeff` | Downforce multiplier (1.0 under current rules). |
| Regulations | `weight_ratio` | Relative car weight (1.0 baseline). |
| Regulations | `tire_grip_ratio` | Tyre grip factor (1.0 baseline). |
| Regulations | `fuel_flow_ratio` | Fuel flow allowance (1.0 baseline). |
| Derived | `team_consistency_score` | Stability metric inversely proportional to recent variance. |
| Derived | `driver_aggressiveness_index` | Positions gained per pit stop proxy. |
| Baseline | `season_year` | Season identifier (2022–2025). |
| Baseline | `round_number` | Championship round number. |
| Baseline | `season_phase` | Encodes early (1), mid (2), late (3) season context. |

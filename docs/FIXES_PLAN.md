# F1 2026 Simulator - Comprehensive Fixes Plan

## Overview
This document outlines all identified issues and their proposed fixes for the F1 2026 Regulation Impact Simulator.

## Quick Summary

| # | Issue | Priority | Status | Key File(s) |
|---|-------|----------|--------|-------------|
| 1 | Driver retirement/transfer handling | HIGH | TODO | `src/data_loader.py`, `src/driver_status.py` (NEW) |
| 2 | Regulation impact values not visible | HIGH | TODO | `frontend/src/utils/dataAdapter.ts` (line 191 - **CRITICAL**) |
| 3 | Script flags system | MEDIUM | TODO | `main.py`, `run_scripts.py` (NEW) |
| 4 | Top predicted performer fix | MEDIUM | TODO | `frontend/src/pages/Home.tsx` |
| 5 | Podium probability race name display | LOW | TODO | `frontend/src/components/PodiumProbability.tsx` |
| 6 | Circuit analyzer 0% trend hiding | MEDIUM | TODO | `frontend/src/pages/CircuitAnalyzer.tsx` |

### Critical Findings
- **Issue #2**: `factorImpacts: {}` is hardcoded as empty object in `dataAdapter.ts` line 191 - this is why team regulation impacts don't show
- **Issue #1**: No driver status filtering - retired drivers appear in visualizations
- **Issue #6**: Zero-impact tracks show trend badges when they shouldn't

---

## 1. Driver Retirement & Franchise Transfer Handling

### Issue
- Drivers who have retired or are not on the current F1 grid should not appear in visualizations
- Need to fetch current driver-team mappings from web
- Need to identify retired drivers and filter them out

### Proposed Solution

#### 1.1 Create Driver Status Service
**File**: `src/driver_status.py` (NEW)
- Fetch current F1 driver lineup from web (Wikipedia/F1 official API)
- Maintain mapping of driver → team → status (active/retired/transferred)
- Cache results to avoid repeated API calls
- Handle edge cases (mid-season transfers, reserve drivers)

#### 1.2 Update Data Loader
**File**: `src/data_loader.py`
- Add function `filter_active_drivers()` that:
  - Loads driver status from `driver_status.py`
  - Filters out retired drivers from race data
  - Updates team assignments for transferred drivers
- Integrate into `load_f1_data()` function

#### 1.3 Update JSON Exporter
**File**: `src/json_exporter.py`
- Filter drivers in all export functions:
  - `export_driving_styles()` - exclude retired drivers
  - `export_uncertainty_analysis()` - exclude retired drivers
  - All other functions that list drivers

#### 1.4 Update Frontend Components
**Files**: 
- `frontend/src/components/PodiumProbability.tsx`
- `frontend/src/components/DriverPositionDistribution.tsx`
- `frontend/src/pages/Home.tsx`
- Any component displaying driver lists

- Filter out drivers with `status: "retired"` or not in current grid
- Add visual indicator for transferred drivers (show new team)

#### 1.5 Web Scraping/API Integration
- Use Wikipedia F1 current season page
- Or use Ergast API (http://ergast.com/mrd/) for current driver lineup
- Fallback to manual JSON file if API unavailable

**Implementation Priority**: HIGH

---

## 2. Regulation Impact of Teams - Frontend Display Fix

### Issue
- Regulation impact values for teams are not properly visible in frontend
- Values may be missing, zero, or incorrectly formatted

### Proposed Solution

#### 2.1 Fix Factor Impacts Calculation
**File**: `frontend/src/utils/dataAdapter.ts` (line 191)
- **CRITICAL ISSUE**: `factorImpacts: {}` is hardcoded as empty object
- Need to calculate actual impact values from Monte Carlo results
- Calculate per-team impact for each regulation factor:
  ```typescript
  factorImpacts: {
    'power_ratio': calculatePowerImpact(teamStats),
    'aero_coeff': calculateAeroImpact(teamStats),
    'weight_ratio': calculateWeightImpact(teamStats),
    // ... etc
  }
  ```

#### 2.2 Verify Backend Data Generation
**File**: `generate_dashboard_api.py`
- Ensure backend JSON includes team-level factor impacts
- If not available, calculate in frontend from driver-level data
- Verify regulation impact values are non-zero where expected
- Add validation to ensure all teams have impact data

#### 2.3 Fix Team Comparison Page
**File**: `frontend/src/pages/TeamComparison.tsx`
- Check `heatmapData` generation logic (lines 22-37)
- Currently accesses `team.factorImpacts[regulation.id]` which is empty `{}`
- **Root cause**: Data adapter doesn't populate `factorImpacts`
- Fix: Either populate in data adapter OR calculate on-the-fly in component
- Add fallback for missing values (display "N/A" or 0)
- Verify data adapter is correctly mapping backend data

#### 2.4 Fix Team Profile Component
**File**: `frontend/src/components/TeamProfile.tsx`
- Display regulation impact values clearly
- Show percentage changes, not just absolute values
- Add tooltips explaining what each impact means

#### 2.5 Update Data Adapter
**File**: `frontend/src/utils/dataAdapter.ts`
- Verify `factorImpacts` mapping from backend JSON
- Ensure all regulation factors are included
- Handle missing/null values gracefully

#### 2.6 Add Debugging/Validation
- Add console logging to verify data flow
- Create validation function to check data completeness
- Display warning if impact values are all zero

**Implementation Priority**: HIGH

---

## 3. Flags for Running Different Scripts

### Issue
- Need command-line flags to run different scripts/modules
- Currently scripts may require manual editing or multiple commands

### Proposed Solution

#### 3.1 Enhance Main Pipeline
**File**: `main.py`
- Add argparse for command-line flags:
  ```python
  --mode: 'full' | 'simulation-only' | 'export-only' | 'visualization-only'
  --skip-baseline: Skip baseline Monte Carlo
  --skip-calibrated: Skip calibrated Monte Carlo
  --parallel: Enable/disable parallel processing
  --workers: Number of parallel workers
  --output-format: 'json' | 'html' | 'both'
  ```

#### 3.2 Create Script Runner
**File**: `run_scripts.py` (NEW)
- Unified entry point for all scripts:
  ```bash
  python run_scripts.py --extract-data
  python run_scripts.py --generate-json
  python run_scripts.py --generate-dashboard
  python run_scripts.py --benchmark
  python run_scripts.py --all  # Run everything
  ```

#### 3.3 Update Individual Scripts
**Files**: 
- `generate_json_outputs.py` - add flags for specific exports
- `generate_dashboard_api.py` - add flags for data sources
- `extract_data_mega.py` - add flags for specific tracks

#### 3.4 Create Configuration File
**File**: `scripts_config.yaml` (NEW)
- Define script dependencies
- Set default flags
- Allow override via command-line

**Implementation Priority**: MEDIUM

---

## 4. Top Predicted Performer Fix

### Issue
- Top predicted performer calculation may be incorrect
- Display logic in Home.tsx may have bugs

### Proposed Solution

#### 4.1 Fix Calculation Logic
**File**: `frontend/src/pages/Home.tsx` (lines 30, 100-117)
- Current: `teams?.sort((a, b) => b.predicted2026 - a.predicted2026)[0]`
- Issue: May be sorting by wrong field or missing data
- Fix: 
  - Verify `predicted2026` field exists and has valid values
  - Consider using `baseline2025` vs `predicted2026` delta instead
  - Handle case where no teams have predictions

#### 4.2 Verify Backend Data
**File**: `frontend/src/api/client.ts`
- Check `getTeamPerformance()` function
- Ensure `predicted2026` and `baseline2025` are correctly calculated
- Verify data is sorted/ranked properly

#### 4.3 Add Validation
- Check if `topTeam` is null/undefined before rendering
- Display fallback message if no data available
- Add error boundary for missing team data

#### 4.4 Consider Alternative Metrics
- Instead of just `predicted2026`, use:
  - Improvement percentage: `(predicted2026 - baseline2025) / baseline2025 * 100`
  - Or weighted score considering multiple factors

**Implementation Priority**: MEDIUM

---

## 5. Podium Probability Analysis - Display Fix

### Issue
- Race selector shows both race name and key (e.g., "Bahrain Grand Prix (2025_R01)")
- Should only show race name
- Current format: `${data.event_name} (${key.replace('_', ' ')})`

### Proposed Solution

#### 5.1 Fix Race Options Display
**File**: `frontend/src/components/PodiumProbability.tsx` (lines 78-84)
- Current:
  ```typescript
  label: `${data.event_name} (${key.replace('_', ' ')})`
  ```
- Fix:
  ```typescript
  label: data.event_name || key.replace('_', ' ')
  ```
- Or better: Extract just the race name, ignore the key

#### 5.2 Clean Event Names
- Remove year prefixes if present
- Standardize format (e.g., "Bahrain Grand Prix" not "2025 Bahrain Grand Prix")
- Handle edge cases where `event_name` is missing

#### 5.3 Update Backend Data
**File**: `src/json_exporter.py` or data generation
- Ensure `event_name` field is clean and consistent
- Remove redundant information

**Implementation Priority**: LOW (cosmetic but important for UX)

---

## 6. Circuit Analyzer - Hide 0% Trends

### Issue
- Trends showing 0% impact are displayed in Circuit Analyzer
- Should filter out or hide tracks with 0% impact delta

### Proposed Solution

#### 6.1 Filter Zero Impact Tracks
**File**: `frontend/src/pages/CircuitAnalyzer.tsx` (lines 36, 47-65)
- Current: Shows all tracks regardless of `impactDelta`
- Fix: Filter out tracks where `Math.abs(impactDelta) < 0.01` (essentially 0%)
- Or: Hide the trend indicator badge when `impactDelta === 0`

#### 6.2 Update Display Logic
- Line 47-65: Only show trend badge if `impactDelta !== 0`
- Add conditional rendering:
  ```typescript
  {Math.abs(impactDelta) > 0.01 && (
    <div className="trend-badge">...</div>
  )}
  ```

#### 6.3 Update Track Selection
- Optionally filter track dropdown to exclude 0% impact tracks
- Or add toggle: "Show all tracks" vs "Show tracks with impact"

#### 6.4 Backend Consideration
- Verify why some tracks have 0% impact
- May indicate data issue or legitimate zero impact
- Add logging to identify zero-impact tracks

**Implementation Priority**: MEDIUM

---

## Implementation Order

### Phase 1: Critical Fixes (Week 1)
1. ✅ Driver retirement & transfer handling (#1)
2. ✅ Regulation impact display fix (#2)
3. ✅ Circuit analyzer 0% trend fix (#6)

### Phase 2: Important Fixes (Week 2)
4. ✅ Top predicted performer fix (#4)
5. ✅ Podium probability display fix (#5)

### Phase 3: Enhancements (Week 3)
6. ✅ Script flags system (#3)

---

## Testing Checklist

### For Each Fix:
- [ ] Unit tests for backend changes
- [ ] Integration tests for data flow
- [ ] Frontend visual testing
- [ ] Edge case handling (missing data, null values)
- [ ] Performance impact assessment
- [ ] Documentation updates

### Specific Tests:
- [ ] Driver filtering: Verify retired drivers don't appear
- [ ] Team impacts: Verify all teams show regulation impacts
- [ ] Script flags: Test all flag combinations
- [ ] Top performer: Verify correct team is displayed
- [ ] Podium probability: Verify clean race names
- [ ] Circuit analyzer: Verify 0% trends are hidden

---

## Files to Create/Modify

### New Files:
1. `src/driver_status.py` - Driver status service
2. `run_scripts.py` - Unified script runner
3. `scripts_config.yaml` - Script configuration
4. `tests/test_driver_status.py` - Driver status tests

### Modified Files:
1. `src/data_loader.py` - Add driver filtering
2. `src/json_exporter.py` - Filter retired drivers
3. `generate_dashboard_api.py` - Fix team impact calculation (if needed)
4. `main.py` - Add command-line flags
5. `frontend/src/pages/Home.tsx` - Fix top performer
6. `frontend/src/pages/TeamComparison.tsx` - Fix regulation impacts display
7. `frontend/src/pages/CircuitAnalyzer.tsx` - Hide 0% trends
8. `frontend/src/components/PodiumProbability.tsx` - Clean race names
9. `frontend/src/utils/dataAdapter.ts` - **CRITICAL**: Calculate factorImpacts (currently empty `{}`)
10. `frontend/src/api/client.ts` - Verify team data and factor impacts

---

## Notes

- All changes should be backward compatible where possible
- Add feature flags for new functionality
- Update README.md with new script usage
- Consider creating migration guide for existing users
- Document API changes if any

---

## Questions to Resolve

1. **Driver Data Source**: Which is more reliable - Wikipedia scraping or Ergast API?
2. **Zero Impact Tracks**: Are these legitimate (e.g., Monaco with minimal boost benefit) or data issues?
3. **Script Flags**: Should flags be in main.py or separate run_scripts.py?
4. **Team Impact Calculation**: What's the current formula? Need to verify it's correct.

---

**Last Updated**: 2025-01-XX
**Status**: Planning Phase
**Next Steps**: Review plan, prioritize, begin Phase 1 implementation

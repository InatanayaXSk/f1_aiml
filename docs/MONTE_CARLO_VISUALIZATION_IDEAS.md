# 🎨 Monte Carlo Results Visualization Strategy

## Overview
You have **monte_carlo_results.json** with 92 races × 20 drivers × 2 scenarios (current + 2026) = **3,680 data points** with:
- Mean position
- Standard deviation (field spread)
- Percentiles (5th, 95th)
- Top 3/Top 5 probabilities
- Min/Max positions

## ✅ Currently Implemented

### 1. **Sector Hover Cards** (TrackVisualizer)
- ✅ Sector time delta (-0.7s)
- ✅ Position spread (±1.2)
- ✅ 2026 Impact level (High/Medium/Low)
- ✅ Full lap delta

### 2. **Bottom Stats Panel** (TrackVisualizer)
- ✅ Track type, corners, straight fraction
- ✅ Overtaking difficulty (1-5)
- ✅ 2026 Overtaking change (+20%)

### 3. **Presentation Page** (PresentationSummary)
- ✅ 6 Key regulation features
- ✅ Overall stats (92 races, 31 drivers)
- ✅ Circuit impact summary

---

## 🚀 NEW Visualization Ideas

### **Component 1: Driver Position Distribution Chart**
**Location:** New page `/driver-analysis` or add to Regulation Explorer

**What It Shows:**
- Box plot for each driver showing:
  - Current position range (5th-95th percentile)
  - 2026 position range (5th-95th percentile)
  - Mean position shift

**Visual:**
```
Max Verstappen    |████|-------|████|  (-0.02)
Lewis Hamilton    |████|-------|████|  (+0.01)
Charles Leclerc   |████|-------|████|  (-0.01)
...
```

**Implementation:**
```tsx
import { BoxPlot } from '../components/BoxPlot';

const driverData = Object.keys(monteCarloResults['2025_R01'].current).map(driver => ({
  name: driver,
  currentRange: {
    min: monteCarloResults['2025_R01'].current[driver].percentile_5,
    max: monteCarloResults['2025_R01'].current[driver].percentile_95,
    mean: monteCarloResults['2025_R01'].current[driver].mean
  },
  futureRange: {
    min: monteCarloResults['2025_R01']['2026'][driver].percentile_5,
    max: monteCarloResults['2025_R01']['2026'][driver].percentile_95,
    mean: monteCarloResults['2025_R01']['2026'][driver].mean
  }
}));

<BoxPlot data={driverData} />
```

---

### **Component 2: Podium Probability Heatmap**
**Location:** Add to Team Comparison page

**What It Shows:**
- Grid: Drivers × Tracks
- Color intensity = Top 3 probability change (2026 - current)
- Darker green = higher podium chance in 2026
- Darker red = lower podium chance in 2026

**Visual:**
```
              Monaco  Monza  Silverstone  Spa   ...
Verstappen     +2%    +5%      +3%       +4%
Leclerc        +1%    +3%      +2%       +3%
Hamilton       -1%    +2%      +1%       +2%
...
```

**Implementation:**
```tsx
import { Heatmap } from '../components/Heatmap';

const podiumData = drivers.map(driver => 
  tracks.map(track => {
    const current = monteCarloResults[track].current[driver].top3_probability;
    const future = monteCarloResults[track]['2026'][driver].top3_probability;
    return (future - current) * 100; // Convert to percentage
  })
);

<Heatmap data={podiumData} rows={drivers} cols={tracks} />
```

---

### **Component 3: Consistency Tracker**
**Location:** New tab "Driver Consistency"

**What It Shows:**
- Line chart showing std_dev over all 92 races
- Lower std_dev = more consistent driver
- Compare current vs 2026 consistency

**Visual:**
```
Standard Deviation (positions)
2.0 |
1.5 |     /\      /\
1.0 |    /  \    /  \
0.5 | __/    \__/    \___
    |____________________
      R1  R5  R10  R15  R20
      Current ----  2026 ----
```

**Implementation:**
```tsx
import { LineChart } from '../components/LineChart';

const consistencyData = Object.keys(monteCarloResults).map(raceKey => ({
  race: raceKey,
  verstappenCurrent: monteCarloResults[raceKey].current['Max Verstappen'].std,
  verstappen2026: monteCarloResults[raceKey]['2026']['Max Verstappen'].std
}));

<LineChart data={consistencyData} />
```

---

### **Component 4: Regulation Impact by Track Type**
**Location:** Add to Circuit Analyzer dropdown

**What It Shows:**
- Grouped bar chart by track type:
  - Street circuits (Monaco, Singapore, etc.)
  - High-speed (Monza, Spa, etc.)
  - Technical (Hungary, Spain, etc.)
- Average position change for each type

**Visual:**
```
Position Change by Track Type
0.2 |       ███
0.1 |  ███  ███  ███
0.0 |__███__███__███__
   | Street High Tech
```

**Implementation:**
```tsx
const trackTypeData = {
  'Street': averageChange(streetTracks),
  'High-Speed': averageChange(highSpeedTracks),
  'Technical': averageChange(technicalTracks)
};

<BarChart data={trackTypeData} />
```

---

### **Component 5: Interactive Race Picker**
**Location:** Add to TrackVisualizer

**What It Shows:**
- Dropdown to select any of 92 races
- Show top 10 drivers for that race with confidence intervals
- Click driver to see their full distribution

**Visual:**
```
Select Race: [2025_R16 - Italian GP ▼]

Position Distribution (Monza):
1. Max Verstappen    3.39 ±0.97  [2.1 - 4.8]
2. Charles Leclerc   1.59 ±0.40  [1.0 - 2.2]
3. Carlos Sainz      1.76 ±0.18  [1.5 - 2.0]
...
```

**Implementation:**
```tsx
const [selectedRace, setSelectedRace] = useState('2025_R16');

<select onChange={(e) => setSelectedRace(e.target.value)}>
  {Object.keys(monteCarloResults).map(key => (
    <option key={key} value={key}>{monteCarloResults[key].event_name}</option>
  ))}
</select>

{Object.entries(monteCarloResults[selectedRace].current)
  .sort((a, b) => a[1].mean - b[1].mean)
  .map(([driver, stats]) => (
    <div>
      <span>{driver}</span>
      <span>{stats.mean.toFixed(2)} ±{stats.std.toFixed(2)}</span>
      <span>[{stats.percentile_5.toFixed(1)} - {stats.percentile_95.toFixed(1)}]</span>
    </div>
  ))}
```

---

### **Component 6: Top Movers Table**
**Location:** Add to Presentation page

**What It Shows:**
- Top 10 drivers with biggest position improvement in 2026
- Top 10 drivers with biggest position decline in 2026
- Across all 92 races

**Visual:**
```
🔼 Top Improvers (2026)        🔽 Top Decliners (2026)
1. Pierre Gasly    +0.15       1. Max Verstappen  -0.023
2. Fernando Alonso +0.12       2. Oscar Piastri   -0.020
3. Lando Norris    +0.08       3. Carlos Sainz    -0.018
```

**Implementation:**
```tsx
const allDriverChanges = drivers.map(driver => {
  const totalChange = Object.keys(monteCarloResults).reduce((sum, raceKey) => {
    const current = monteCarloResults[raceKey].current[driver]?.mean || 0;
    const future = monteCarloResults[raceKey]['2026'][driver]?.mean || 0;
    return sum + (future - current);
  }, 0) / 92; // Average across all races
  
  return { driver, change: totalChange };
});

const topImprovers = allDriverChanges.sort((a, b) => b.change - a.change).slice(0, 10);
const topDecliners = allDriverChanges.sort((a, b) => a.change - b.change).slice(0, 10);
```

---

### **Component 7: Uncertainty Visualization**
**Location:** New page `/uncertainty-analysis`

**What It Shows:**
- Violin plot showing probability distribution for each position
- Wider plot = more uncertainty
- Shows which positions are "contested" vs "locked in"

**Visual:**
```
Position
 P1  |  ◆        (Max, Charles locked in P1-2)
 P2  |  ◆
 P3  | ◆◆◆       (P3-5 highly contested)
 P4  | ◆◆◆
 P5  | ◆◆◆
 P6  |  ◆        (Midfield stable)
```

**Implementation:**
```tsx
import { ViolinPlot } from '../components/ViolinPlot';

const positionData = [1, 2, 3, 4, 5].map(position => ({
  position,
  drivers: drivers.filter(d => 
    Math.floor(monteCarloResults['2025_R16'].current[d].mean) === position
  ).map(d => monteCarloResults['2025_R16'].current[d].std)
}));

<ViolinPlot data={positionData} />
```

---

## 📊 Summary: Implementation Priority

### **Must Have** (5 mins each):
1. ✅ Sector hover with Monte Carlo data (DONE)
2. ✅ Overtaking moved to bottom (DONE)
3. **Top Movers Table** (Component 6) - Easy to implement

### **Should Have** (15 mins each):
4. **Interactive Race Picker** (Component 5) - High impact, clear value
5. **Podium Probability Heatmap** (Component 2) - Visually impressive

### **Nice to Have** (30+ mins):
6. **Driver Position Distribution** (Component 1) - Requires BoxPlot component
7. **Consistency Tracker** (Component 3) - Requires multi-series LineChart
8. **Regulation Impact by Track Type** (Component 4) - Need track categorization
9. **Uncertainty Visualization** (Component 7) - Requires ViolinPlot component

---

## 🎯 Recommendation for Tomorrow's Presentation

### Quick Wins (15 minutes total):
1. ✅ Keep existing sector hover enhancements
2. **Add Component 6 (Top Movers Table)** to Presentation page
3. **Add Component 5 (Race Picker)** to Circuit Analyzer

### Talking Points:
- "We ran 2,000 Monte Carlo simulations for EACH of the 92 races"
- "This sector shows a -0.7s improvement in 2026, which is HIGH impact"
- "Position spread of ±1.2 means drivers are tightly packed here"
- "Click any track to see its specific Monte Carlo results"

---

## 💾 File Structure for New Components

```
frontend/src/
  components/
    BoxPlot.tsx          # For Component 1
    ViolinPlot.tsx       # For Component 7
    TopMoversTable.tsx   # For Component 6 ✅ Priority
    RacePicker.tsx       # For Component 5 ✅ Priority
  pages/
    DriverAnalysis.tsx   # For Components 1, 3
    UncertaintyAnalysis.tsx  # For Component 7
  utils/
    monteCarloUtils.ts   # Helper functions for data processing
```

---

## 🔧 Helper Functions

```typescript
// monteCarloUtils.ts

export function calculateAveragePositionChange(
  monteCarloResults: any,
  driverName: string
): number {
  const races = Object.keys(monteCarloResults);
  const totalChange = races.reduce((sum, raceKey) => {
    const current = monteCarloResults[raceKey].current[driverName]?.mean || 0;
    const future = monteCarloResults[raceKey]['2026'][driverName]?.mean || 0;
    return sum + (future - current);
  }, 0);
  return totalChange / races.length;
}

export function getTopImprovers(monteCarloResults: any, count: number = 10) {
  const drivers = Object.keys(monteCarloResults[Object.keys(monteCarloResults)[0]].current);
  const changes = drivers.map(driver => ({
    driver,
    change: calculateAveragePositionChange(monteCarloResults, driver)
  }));
  return changes.sort((a, b) => b.change - a.change).slice(0, count);
}

export function getTopDecliners(monteCarloResults: any, count: number = 10) {
  const drivers = Object.keys(monteCarloResults[Object.keys(monteCarloResults)[0]].current);
  const changes = drivers.map(driver => ({
    driver,
    change: calculateAveragePositionChange(monteCarloResults, driver)
  }));
  return changes.sort((a, b) => a.change - b.change).slice(0, count);
}

export function getPodiumProbabilityChange(
  monteCarloResults: any,
  driverName: string,
  raceKey: string
): number {
  const current = monteCarloResults[raceKey].current[driverName]?.top3_probability || 0;
  const future = monteCarloResults[raceKey]['2026'][driverName]?.top3_probability || 0;
  return (future - current) * 100; // Percentage points
}
```

---

## 📝 Quick Implementation: Top Movers Table

Add this to [PresentationSummary.tsx](frontend/src/pages/PresentationSummary.tsx):

```tsx
import { useEffect, useState } from 'react';
import monteCarloData from '../../../outputs/monte_carlo_results.json';

// Add this function
function getTopMovers() {
  const drivers = Object.keys(monteCarloData[Object.keys(monteCarloData)[0]].current);
  const changes = drivers.map(driver => {
    const totalChange = Object.keys(monteCarloData).reduce((sum, raceKey) => {
      const current = monteCarloData[raceKey].current[driver]?.mean || 0;
      const future = monteCarloData[raceKey]['2026'][driver]?.mean || 0;
      return sum + (future - current);
    }, 0) / Object.keys(monteCarloData).length;
    
    return { driver, change: totalChange };
  });
  
  return {
    improvers: changes.sort((a, b) => b.change - a.change).slice(0, 5),
    decliners: changes.sort((a, b) => a.change - b.change).slice(0, 5)
  };
}

// Add this component BEFORE "Key Findings" section
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
    📊 Top Position Movers (Across 92 Races)
  </h2>
  <div className="grid md:grid-cols-2 gap-8">
    <div>
      <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
        <span>🔼</span> Top Improvers in 2026
      </h3>
      <div className="space-y-3">
        {getTopMovers().improvers.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
            <span className="font-medium text-gray-800 dark:text-gray-200">{idx + 1}. {item.driver}</span>
            <span className="text-green-600 dark:text-green-400 font-bold">+{item.change.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
    <div>
      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
        <span>🔽</span> Top Decliners in 2026
      </h3>
      <div className="space-y-3">
        {getTopMovers().decliners.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
            <span className="font-medium text-gray-800 dark:text-gray-200">{idx + 1}. {item.driver}</span>
            <span className="text-red-600 dark:text-red-400 font-bold">{item.change.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
```

---

## 🎤 Demo Script for Tomorrow

1. **Home Dashboard** (30s)
   - "This is our F1 2026 regulation impact simulator"

2. **🎯 Presentation Tab** (2 mins) - MAIN FOCUS
   - "We analyzed 92 races with 2,000 Monte Carlo simulations each"
   - "These are the 6 key regulation changes—notice ERS power triples from 15% to 50%"
   - "Position changes are minimal because regulations affect all teams equally"
   - "BUT look at high-speed tracks—Monza gains +0.15 positions!"

3. **Circuit Analyzer** (1 min)
   - "Hover over any sector—see the time delta from Monte Carlo?"
   - "This sector is HIGH impact: -0.7 seconds faster in 2026"
   - "Notice overtaking increased by 20% at bottom"

4. **Team Comparison** (30s)
   - "Here's the heatmap showing team-by-team impact"

5. **Regulation Explorer** (1 min)
   - "Technical deep-dive into all multipliers and formulas"

**Total: 5 minutes**

---

Good luck with your presentation! 🏁🏆

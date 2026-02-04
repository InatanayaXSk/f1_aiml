# 🏎️ F1 2026 Regulation Impact Simulator - PRESENTATION GUIDE

## 📋 **Quick Setup for Demo (5 minutes)**

### Prerequisites
- Node.js 18+ installed
- Python 3.9+ installed
- All JSON files in `outputs/json/` and `outputs/monte_carlo_results.json`

### 1️⃣ **Start the Frontend**

```bash
cd frontend
npm install
npm run dev
```

The app will be available at: **http://localhost:5173**

---

## 🎯 **KEY FEATURES TO DEMONSTRATE**

### **Top 6 Regulation Features (The Core of Your Analysis)**

| Feature | Description | 2026 Change |
|---------|-------------|-------------|
| **ERS Power Split** | Electric power ratio | 15% → 50% (+233%) |
| **Active Aerodynamics** | Movable aero elements | +5% efficiency |
| **Chassis Weight** | Minimum weight | 798kg → 768kg (-3.8%) |
| **Fuel Flow Limit** | Max fuel flow rate | -25% reduction |
| **Tire Specification** | New 18-inch tires | -6% grip |
| **Driver Form** | Recent performance | Tracked over last 5 races |

---

## 📊 **Data Flow Overview**

```
FastF1 API (2022-2025 data)
    ↓
data/processed/f1_2022_2025.csv
    ↓
Feature Engineering (25 features)
    ↓
XGBoost Model Training
    ↓
Monte Carlo Simulation (2000 iterations/race)
    ↓
outputs/monte_carlo_results.json
    ↓
Frontend Visualization
```

---

## 🎨 **Pages to Show in Presentation**

### 1. **Home Dashboard** (`/`)
- Overall statistics
- Total races analyzed (92)
- Total drivers (31)
- Average confidence (85%)

### 2. **Presentation Summary** (`/presentation`)
- **NEW PAGE** - Shows all 6 key features
- Driver impact table
- Circuit impact summary
- Key findings & methodology

### 3. **Circuit Analyzer** (`/circuits`)
- Track-by-track comparisons
- Monaco vs Monza differences
- DRS zone impacts

### 4. **Team Comparison** (`/teams`)
- Team performance heatmap
- Current vs 2026 predictions

### 5. **Regulation Explorer** (`/regulations`)
- Detailed breakdown of each regulation factor
- Impact scores by track type

---

## 🚀 **Quick Demo Script (5 minutes)**

### **Opening (30 seconds)**
> "We built an ML-powered simulator to predict how 2026 F1 regulations will impact driver performance across different circuit types."

### **Show the Data (1 minute)**
1. Open Home Dashboard
2. Point out: "92 races analyzed, 31 drivers, 4 seasons of data"
3. Show model accuracy: "MAE of 0.8 positions means we predict within 1 position"

### **Explain the 6 Key Features (2 minutes)**
1. Navigate to Presentation Summary page
2. Show the regulation feature cards
3. Highlight: 
   - **ERS Power**: "Biggest change - electric power triples from 15% to 50%"
   - **Active Aero**: "Like DRS but automatic and optimized"
   - **Weight**: "30kg lighter cars = faster acceleration"

### **Show Results (1 minute)**
1. Show driver impact table
2. Point out: "Most changes are minimal (-0.02 positions average)"
3. Show circuit impacts: "High-speed tracks like Monza benefit most (+0.15)"

### **Technical Depth (30 seconds)**
1. Scroll to methodology section
2. Mention: "Monte Carlo with 2000 simulations per race"
3. Show: "XGBoost model with 25 features, trained on FastF1 telemetry"

---

## 🔧 **If Something Breaks During Demo**

### **Frontend won't start:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### **Data not loading:**
- Check that `outputs/monte_carlo_results.json` exists
- Check that `track_data_*.json` files are in root directory
- Frontend falls back to mock data automatically

### **Track data missing:**
```bash
cd s_frontend
python pathGen.py --all --year 2024
```

---

## 📈 **Key Talking Points**

### **Why This Matters:**
- 2026 regulations are the biggest change in F1 since 2014
- Teams need to understand which tracks favor their car philosophy
- Our model helps predict where overtaking will be easier/harder

### **Technical Highlights:**
- 25 engineered features (from 8 raw data columns)
- Time-series cross-validation for reliable predictions
- Monte Carlo accounts for uncertainty (weather, strategy, driver form)

### **Results Summary:**
- Average impact: -0.023 positions (very small!)
- High-speed tracks: +0.15 positions (ERS power helps)
- Street circuits: -0.02 positions (weight reduction matters less)
- Most drivers affected equally (regulation change is fair)

---

## 🎯 **Questions You Might Get**

**Q: Why is the average change so small?**
> "The regulations affect all teams equally, so relative positions stay similar. The bigger impacts are on lap times and race strategy."

**Q: How accurate is this?**
> "Our model has MAE of 0.8 positions on test data, and we validate with 5-fold time-series cross-validation. We're 85% confident in predictions."

**Q: What about Monaco (hardcoded overtaking difficulty)?**
> "We fixed that! Now it's calculated from: straight fraction, corner count, track type, and DRS zones."

**Q: Can you add more features?**
> "Yes! We focused on 6 key features for clarity, but the model uses 25 total. We can show feature importance if needed."

---

## 📁 **File Locations**

### **Critical Files:**
- `outputs/monte_carlo_results.json` - Main simulation output
- `frontend/src/utils/dataAdapter.ts` - Bridges Python → TypeScript
- `frontend/src/pages/PresentationSummary.tsx` - Your main demo page
- `s_frontend/pathGen.py` - Track data generator (fixed overtaking_difficulty)

### **If You Need to Regenerate Data:**

```bash
# 1. Run the notebook
jupyter notebook notebooks/combined_pipeline.ipynb

# 2. Generate track data
cd s_frontend
python pathGen.py --all --year 2024

# 3. Copy to frontend
cp ../track_data_*.json ../frontend/public/
```

---

## ✅ **Pre-Presentation Checklist**

- [ ] Run `npm run dev` and verify frontend loads
- [ ] Check that all 6 regulation features display correctly
- [ ] Verify track data loads (check Monaco, Monza, Spa)
- [ ] Test navigation between all pages
- [ ] Have backup: HTML files in `outputs/` folder
- [ ] Screenshot key visualizations (in case of network issues)
- [ ] Practice demo script (5 minutes max)

---

## 🎉 **Good Luck!**

Remember:
1. **Keep it simple** - Focus on the 6 key features
2. **Show, don't tell** - Let the visualizations speak
3. **Be confident** - You have real data, real model, real results
4. **Have fun** - This is a cool project!

---

**Contact for Questions:**
- Frontend: Check `frontend/README.md`
- Backend/ML: Check `notebooks/combined_pipeline.ipynb`
- Track Data: Check `s_frontend/pathGen.py`

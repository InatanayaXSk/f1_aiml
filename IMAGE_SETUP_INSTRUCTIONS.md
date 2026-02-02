# Image Setup Instructions for Research Paper

## Required Images for LaTeX Compilation

The research paper (`research_paper.tex`) references two key figures that need to be generated as PNG files from your HTML visualizations.

### 1. Top 15 Most Important Features (Figure 1)
**File location:** `outputs/top_15_features.png`  
**Source:** `outputs/top_15_most_important_features.html`

**To create this image:**
1. Open `outputs/top_15_most_important_features.html` in your browser
2. Take a screenshot of the bar chart showing feature importance
3. Save as `outputs/top_15_features.png`
4. Recommended resolution: 1200x800 pixels minimum

**Chart shows:**
- Horizontal bar chart with features on Y-axis
- Importance values (0.0 to 0.35) on X-axis
- Top features: grid_position (0.32), driver_aggressiveness_index (0.24), grid_vs_race_delta (0.19)

---

### 2. Regulation Factor Impact by Track Type (Figure 2)
**File location:** `outputs/regulation_factor_impact.png`  
**Source:** `outputs/2026_regulations_factor_impact.html`

**To create this image:**
1. Open `outputs/2026_regulations_factor_impact.html` in your browser
2. Take a screenshot of the grouped bar chart
3. Save as `outputs/regulation_factor_impact.png`
4. Recommended resolution: 1400x900 pixels minimum

**Chart shows:**
- Grouped bar chart with track types on X-axis (high-speed, street, high-downforce, mixed)
- Expected benefit (0-1) on Y-axis
- Five regulation factors as grouped bars:
  - Power Ratio (ERS) - green
  - Active Aero - orange
  - Weight Reduction - blue
  - Tire Changes - pink
  - Fuel Efficiency - lime

---

## Alternative: Automated Screenshot Generation

If you have Python with Selenium/Playwright, you can automate screenshot capture:

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

def capture_html_screenshot(html_path, output_path):
    options = Options()
    options.headless = True
    driver = webdriver.Chrome(options=options)
    
    driver.get(f'file:///{html_path}')
    time.sleep(2)  # Wait for chart to render
    
    driver.save_screenshot(output_path)
    driver.quit()

# Capture both images
capture_html_screenshot(
    'e:/5thsem/AIML/f1-2026-simulator/outputs/top_15_most_important_features.html',
    'e:/5thsem/AIML/f1-2026-simulator/outputs/top_15_features.png'
)

capture_html_screenshot(
    'e:/5thsem/AIML/f1-2026-simulator/outputs/2026_regulations_factor_impact.html',
    'e:/5thsem/AIML/f1-2026-simulator/outputs/regulation_factor_impact.png'
)
```

---

## Compiling the LaTeX Paper

Once images are in place:

```bash
cd e:/5thsem/AIML/f1-2026-simulator
pdflatex research_paper.tex
bibtex research_paper
pdflatex research_paper.tex
pdflatex research_paper.tex
```

Or use your LaTeX IDE (TeXworks, Overleaf, VS Code LaTeX Workshop).

---

## Verifying Image References

The paper references these images at:
- **Figure 1 (Line ~275):** Top 15 features importance
- **Figure 2 (Line ~368):** Regulation factor impact by track type

Both figures are properly labeled with `\ref{fig:feature_importance}` and `\ref{fig:regulation_impact}` throughout the text.

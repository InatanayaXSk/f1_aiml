# 2. Problem Definition

## 2.1 Problem Statement

The introduction of new technical regulations in Formula 1 often leads to significant shifts in the competitive order, creating a "zero-sum" game where teams must adapt or fall behind. The 2026 regulations, as modeled in our `regulation_transform.py` logic, introduce several radical changes that create a high-dimensional problem space for predictive analysis:
*   **Power Unit Shift**: A massive increase in electrical power contribution, moving from a 15% electric share to a 50-50 split between the Internal Combustion Engine (ICE) and the Energy Recovery System (ERS). Our simulator applies a **3.33x multiplier** to current electrical power ratios to model this shift. This creates a problem of "energy clipping" where cars may run out of electrical deployment on long straights.
*   **Active Aerodynamics**: The introduction of "X-mode" (low drag for straights) and "Z-mode" (high downforce for corners) via movable front and rear wings. We simulate this as a **30% reduction in drag coefficients** (0.70x multiplier). Predicting the zones where these modes provide the most benefit is a primary concern for performance modeling.
*   **Chassis and Mass**: A 30kg reduction in car weight (down to 768kg, modeled as a **0.962x multiplier**) and a reduction in wheelbase and width, which impacts car agility and mechanical grip.
*   **Sustainability and Efficiency**: The shift to 100% sustainable fuels and modified fuel flow limits necessitates a higher emphasis on thermal efficiency, which we track through specialized features like the `fuel_efficiency_rating`.

The core problem is the **inherent uncertainty and non-linear complexity in predicting how these combined changes will impact race finishing positions**. Traditional linear modeling fails to capture the stochastic nature of racing, where weather volatility (modeled with a 10% sigma) and driver form (5% sigma) can amplify or negate technical advantages. There is a critical need for a simulator that can model these interactions across diverse track archetypes—from the tight, low-speed street circuit of Monaco to the high-speed "Temple of Speed" at Monza.

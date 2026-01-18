# Frontend Directory Summary

The `frontend` directory contains the React-based visual dashboard for the F1 2026 Regulation Impact Simulator. It is built with Vite, TypeScript, and TailwindCSS to provide a high-performance, interactive user experience.

## Architecture & Frameworks
*   **Core**: React 18+ with TypeScript for Type-safe component development.
*   **Build Tool**: Vite for rapid development and optimized production bundles.
*   **Styling**: TailwindCSS for a modern "Glassmorphism" aesthetic.
*   **Data Fetching**: `@tanstack/react-query` for efficient state management and caching of simulation results.

## Key Directory Structure

### 1. `src/pages/`
*   **Home.tsx**: Overview of the 2026 regulation changes and project abstract.
*   **RegulationExplorer.tsx**: Interactive breakdown of the technical multipliers (Aero, Power, Weight).
*   **CircuitAnalyzer.tsx**: Deep-dive into specific tracks with SVG maps and performance deltas.
*   **TeamComparison.tsx**: Radar charts and heatmaps comparing team-level impacts.

### 2. `src/components/`
*   **TrackVisualizer.tsx**: The most complex component, rendering SVG track paths with interactive sector analysis.
*   **Heatmap.tsx & BarChart.tsx**: Reusable Plotly/D3-based wrappers for simulation results.
*   **MetricCard.tsx**: High-level statistical summaries (Mean Position, Std Dev, Probabilities).

## Connection to Backend
The frontend is strictly decoupled from the heavy Python computation. It consumes static JSON artifacts stored in `frontend/src/data` and `outputs/`, ensuring that the user experience is fluid regardless of the simulation's complexity.

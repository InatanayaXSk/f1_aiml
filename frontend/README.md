# F1 2026 Regulation Impact Simulation Dashboard

A comprehensive React-based dashboard for analyzing and visualizing the impact of 2026 Formula 1 regulations on teams, drivers, and circuits.

## Features

### 📊 Home Dashboard
- Summary KPIs with key metrics
- Recent simulation results
- Quick links to specialized analysis views
- Top performing team predictions

### ⚙️ Regulation Explorer
- Interactive bar charts showing regulation impact factors
- Category-based filtering (Power, Aero, Weight, Tire, Fuel)
- Detailed drill-down panels for each regulation
- Comprehensive regulation breakdown cards

### 🏁 Circuit Analyzer
- Track-by-track comparison with side-by-side views
- Interactive circuit visualizations with hover tooltips
- Monte Carlo-derived track features:
  - Sector difficulty ratings
  - Tire degradation metrics
  - Risk factors and overtaking opportunities
  - Power sensitivity and downforce levels
- Statistical confidence intervals (95% CI)

### 🏎️ Team Comparison
- Performance heatmap showing team vs regulation factor impacts
- Sortable team statistics table
- Team profile cards with driver lineups
- Baseline 2025 vs Predicted 2026 comparisons

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query (React Query v5)
- **Visualizations**: D3.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Project Structure

```
src/
├── api/
│   └── client.ts              # API client and local data loader
├── components/
│   ├── BarChart.tsx           # D3 bar chart visualization
│   ├── ErrorMessage.tsx       # Error state component
│   ├── Heatmap.tsx            # D3 heatmap visualization
│   ├── Layout.tsx             # Main layout with header/footer
│   ├── Loading.tsx            # Loading state component
│   ├── MetricCard.tsx         # KPI metric display card
│   ├── NavTabs.tsx            # Main navigation tabs
│   ├── TeamProfile.tsx        # Team profile card
│   └── TrackSVG.tsx           # Circuit visualization with tooltips
├── utils/
│   └── dataAdapter.ts         # Adapters for simulation outputs
├── hooks/
│   ├── useRegulations.ts      # Regulation data hook
│   ├── useSimulations.ts      # Simulation data hook
│   ├── useTeams.ts            # Team performance hook
│   └── useTracks.ts           # Track data hooks
├── pages/
│   ├── CircuitAnalyzer.tsx    # Circuit comparison page
│   ├── Home.tsx               # Dashboard home page
│   ├── RegulationExplorer.tsx # Regulation analysis page
│   └── TeamComparison.tsx     # Team comparison page
├── store/
│   ├── useFilterStore.ts      # Global filter state
│   └── useThemeStore.ts       # Theme (light/dark) state
├── types/
│   └── index.ts               # TypeScript type definitions
├── App.tsx                    # Main app component with routing
├── index.css                  # Global styles
└── main.tsx                   # App entry point
```

## Setup and Installation

### Prerequisites
- Node.js 18+ and npm

### Installation Steps

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env` file in the root directory:
```bash
# Leave empty to use mock data for development
VITE_API_BASE_URL=

# Or set your backend API URL
# VITE_API_BASE_URL=http://localhost:8000
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Backend Integration

The dashboard is designed to connect to backend endpoints that provide:

### Expected API Endpoints

1. **GET `/api/tracks`** - List of F1 circuits with features
2. **GET `/api/tracks/:id`** - Individual track details
3. **GET `/api/tracks/:id/svg`** - Track SVG visualization
4. **GET `/api/regulations`** - Regulation factors and impacts
5. **GET `/api/teams/performance`** - Team performance metrics
6. **GET `/api/simulations`** - Monte Carlo simulation results
   - Query params: `season`, `trackId`
7. **GET `/api/circuits/comparison`** - Circuit comparison data
   - Query params: `season`

### API Response Structure

The API client expects JSON responses matching these TypeScript interfaces:

```typescript
interface Track {
  id: string;
  name: string;
  country: string;
  length: number;
  laps: number;
  features: TrackFeatures;
}

interface RegulationFactor {
  id: string;
  name: string;
  impact: number;
  category: 'power' | 'aero' | 'weight' | 'tire' | 'fuel';
  description: string;
}

interface TeamPerformance {
  teamId: string;
  teamName: string;
  constructor: string;
  baseline2025: number;
  predicted2026: number;
  drivers: Driver[];
  factorImpacts: Record<string, number>;
}

// See src/types/index.ts for complete type definitions
```

## Features & Interactions

### Theme Toggle
- Light/dark mode toggle in header
- Persisted in localStorage
- Applies to all components and visualizations

### Responsive Design
- Mobile-first approach
- Breakpoints: mobile (< 768px), tablet (768px-1024px), desktop (> 1024px)
- Optimized layouts for all screen sizes

### Accessibility
- Keyboard navigation support
- ARIA labels for screen readers
- Focus indicators on interactive elements
- Semantic HTML structure

### Visualizations

#### Bar Chart
- Interactive bars with click events
- Color-coded by category
- Animated transitions
- Hover tooltips with detailed values

#### Heatmap
- Color intensity mapping
- Cell-level interactions
- Numeric value overlays
- Responsive grid layout

#### Track SVG
- Hover tooltips with feature details
- Monte Carlo-derived metrics display
- Fallback placeholder for missing data

## Data Flow

1. **React Query** manages all server state with automatic caching
2. **Zustand** stores handle global UI state (theme, filters)
3. **API Client** provides unified interface with mock fallback
4. **Custom Hooks** abstract data fetching logic
5. **Components** consume data via hooks

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## Performance Optimizations

- React Query caching (5-minute stale time)
- Lazy loading for heavy visualizations
- Optimized re-renders with proper memoization
- Code splitting via dynamic imports
- Tailwind CSS purging for minimal CSS bundle

## Contributing

When adding new features:
1. Follow existing component patterns
2. Add TypeScript types in `src/types/index.ts`
3. Create reusable hooks in `src/hooks/`
4. Update mock data if needed
5. Ensure accessibility standards
6. Test across breakpoints

## License

MIT

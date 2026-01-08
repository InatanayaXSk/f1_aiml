# Quick Setup Guide

## Getting Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend (Optional)
Edit `.env` file:
```bash
# For development with mock data (default)
VITE_API_BASE_URL=

# For connecting to your backend
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Run the Dashboard
```bash
npm run dev
```

The dashboard will open at `http://localhost:5173`

## What You'll See

The dashboard starts with mock data showing:
- 5 F1 circuits (Bahrain, Monaco, Monza, Silverstone, Spa)
- 6 regulation factors (Active Aero, Power Unit, Weight, Fuel, Tires, Energy Recovery)
- 5 teams with performance predictions
- 2 sample race simulations

## Connecting Your Backend

The dashboard expects these endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/tracks` | List all circuits |
| `GET /api/tracks/:id` | Get single circuit |
| `GET /api/tracks/:id/svg` | Get circuit SVG |
| `GET /api/regulations` | Get regulation factors |
| `GET /api/teams/performance` | Get team performance data |
| `GET /api/simulations` | Get simulation results |
| `GET /api/circuits/comparison?season=2026` | Get circuit comparisons |

### Example Response Format

**GET /api/tracks**
```json
[
  {
    "id": "monaco",
    "name": "Circuit de Monaco",
    "country": "Monaco",
    "length": 3.337,
    "laps": 78,
    "features": {
      "sector1Difficulty": 9.5,
      "sector2Difficulty": 9.2,
      "sector3Difficulty": 9.8,
      "degradation": 5.5,
      "riskFactor": 9.5,
      "overtakingOpportunities": 2.0,
      "downforceLevel": "high",
      "powerSensitivity": 3.5
    }
  }
]
```

See `src/types/index.ts` for complete type definitions.

## Testing the Dashboard

### Without Backend (Mock Data)
1. Leave `VITE_API_BASE_URL` empty in `.env`
2. Run `npm run dev`
3. Explore all 4 tabs with sample data

### With Your Backend
1. Set `VITE_API_BASE_URL=http://your-backend-url` in `.env`
2. Ensure your backend is running
3. Run `npm run dev`
4. Dashboard will fetch live data from your endpoints

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder, ready to deploy.

## Troubleshooting

### Dashboard shows "Failed to load data"
- Check if `VITE_API_BASE_URL` is set correctly
- Verify your backend is running and accessible
- Check browser console for API errors
- Dashboard will fallback to mock data if API fails

### Build errors
```bash
# Type check
npm run typecheck

# Lint
npm run lint
```

### Port already in use
```bash
# Vite will automatically try next available port
# Or specify a different port:
npm run dev -- --port 3000
```

## Next Steps

1. **Customize Mock Data**: Edit `src/data/mockData.ts` to match your use case
2. **Add More Charts**: Create new D3 visualizations in `src/components/`
3. **Extend Types**: Add fields to interfaces in `src/types/index.ts`
4. **Backend Integration**: Wire up your actual API endpoints
5. **Styling**: Customize Tailwind config in `tailwind.config.js`

## Support

For issues or questions:
1. Check the main README.md for detailed documentation
2. Review TypeScript types in `src/types/index.ts`
3. Inspect mock data structure in `src/data/mockData.ts`
4. Check browser console for errors

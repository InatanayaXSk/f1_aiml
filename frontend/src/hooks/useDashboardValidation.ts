import { useQuery } from '@tanstack/react-query';

interface DashboardData {
  metadata: {
    generated_at: string;
    model_version: string;
    data_range: {
      start_season: number;
      end_season: number;
      total_races: number;
    };
    monte_carlo_config: {
      n_simulations: number;
      driver_form_sigma: number;
      weather_sigma: number;
      strategy_delta: number;
      random_seed: number;
    };
  };
  step1_base_model: {
    overall_metrics: {
      mae: number;
      rmse: number;
      spearman_correlation: number;
      total_predictions: number;
      total_races: number;
    };
    per_race_mae: Array<{
      race_id: string;
      race_mae: number;
    }>;
    temporal_trends: {
      by_season: Array<{
        season: number;
        mae: number;
        num_races: number;
      }>;
    };
  };
  step2_monte_carlo: {
    overall_coverage: {
      coverage_rate: number;
      target_coverage: number;
      calibration_status: string;
      total_predictions: number;
      covered_count: number;
      uncovered_count: number;
    };
    per_race_coverage: Array<{
      race_id: string;
      coverage_rate: number;
    }>;
    interval_width_analysis: {
      mean_width: number;
      median_width: number;
    };
    calibration_variants: Array<{
      variant_name: string;
      driver_form_sigma: number;
      coverage_rate: number;
      mean_interval_width: number;
    }>;
  };
}

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch('/dashboard_api.json');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
  }
  
  return response.json();
}

export function useDashboardValidation() {
  return useQuery({
    queryKey: ['dashboardValidation'],
    queryFn: fetchDashboardData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

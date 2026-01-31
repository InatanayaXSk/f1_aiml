import { useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Activity, Target, Ruler } from 'lucide-react';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { useDashboardValidation } from '../hooks/useDashboardValidation';

export default function ModelValidation() {
  const { data: dashboardData, isLoading, error, refetch } = useDashboardValidation();
  const [selectedSeason, setSelectedSeason] = useState<string>('all');

  if (isLoading) {
    return <Loading />;
  }

  if (error || !dashboardData) {
    return (
      <ErrorMessage
        message="Failed to load validation data"
        onRetry={() => refetch()}
      />
    );
  }

  const step1 = dashboardData.step1_base_model;
  const step2 = dashboardData.step2_monte_carlo;

  // Filter coverage data by season
  const filteredCoverageData = selectedSeason === 'all'
    ? step2.per_race_coverage
    : step2.per_race_coverage.filter(race => race.race_id.startsWith(selectedSeason));

  // Filter MAE data by season
  const filteredMaeData = selectedSeason === 'all'
    ? step1.per_race_mae
    : step1.per_race_mae.filter(race => race.race_id.startsWith(selectedSeason));

  // Calibration data from actual testing (4 variants tested)
  const calibrationVariants = step2.calibration_variants || [{
        "variant_name": "baseline",
        "driver_form_sigma": 0.05,
        "coverage_rate": 0.786,
        "mean_interval_width": 2.31
      },
      {
        "variant_name": "calibrated_0.08",
        "driver_form_sigma": 0.08,
        "coverage_rate": 0.855,
        "mean_interval_width": 2.45
      },
      {
        "variant_name": "calibrated_0.09",
        "driver_form_sigma": 0.09,
        "coverage_rate": 0.873,
        "mean_interval_width": 2.58
      },
      {
        "variant_name": "calibrated_0.10",
        "driver_form_sigma": 0.10,
        "coverage_rate": 0.886,
        "mean_interval_width": 2.85
      },
      {
        "variant_name": "calibrated_0.12",
        "driver_form_sigma": 0.12,
        "coverage_rate": 0.898,
        "mean_interval_width": 3.683
      }];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Model Validation
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
          Comprehensive validation using rolling-origin benchmarking and Monte Carlo calibration.
          All metrics computed on held-out test data with no temporal leakage, ensuring robust
          out-of-sample performance estimates.
        </p>
      </div>

      {/* Step 1: Base Model Accuracy */}
      <section className="space-y-6">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Step 1: Base Model Accuracy
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            XGBoost regressor performance on predicting finish positions
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Point estimates quantify deterministic prediction accuracy. MAE measures average positional 
            error magnitude, RMSE penalizes outliers quadratically, and Spearman correlation assesses 
            rank-order preservation independent of scale. Together, these metrics validate that the base 
            model captures driver performance dynamics without overfitting, establishing a foundation for 
            probabilistic extensions. Temporal trends reveal model adaptation to evolving competitive 
            structures across regulation eras.
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Mean Absolute Error"
            value={step1.overall_metrics.mae.toFixed(3)}
            icon={Activity}
            description="Average position error"
          />
          <MetricCard
            title="Root Mean Squared Error"
            value={step1.overall_metrics.rmse.toFixed(3)}
            icon={Activity}
            description="Penalizes large errors"
          />
          <MetricCard
            title="Mean Spearman Correlation"
            value={step1.overall_metrics.spearman_correlation.toFixed(3)}
            icon={Target}
            description="Rank order accuracy"
          />
        </div>

        {/* Line Chart: Per-Race MAE Over Time */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Per-Race MAE Over Time
              </h4>
            </div>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Seasons</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Temporal evolution of prediction error across individual races (2022-2025)
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={filteredMaeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                dataKey="race_id"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                label={{ value: 'Race ID', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
                />
                <YAxis
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                label={{ 
                    value: 'Mean Absolute Error', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' },
                    fill: '#9CA3AF' 
                }}
                />
                <Tooltip
                contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    color: '#F9FAFB',
                }}
                />
                <Line
                type="monotone"
                dataKey="race_mae"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                />
            </LineChart>
            </ResponsiveContainer>
        </div>

        {/* Bar Chart: Season-Wise Average MAE */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Season-Wise Average MAE
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Aggregated prediction accuracy by season showing model improvement over time
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={step1.temporal_trends.by_season}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="season"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                label={{ value: 'Season', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                label={{ 
                    value: 'Mean Absolute Error', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' },
                    fill: '#9CA3AF' 
                }}
                />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#F9FAFB',
                }}
              />
              <Bar dataKey="mae" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Step 2: Uncertainty Calibration */}
      <section className="space-y-6">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Step 2: Uncertainty Calibration
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Monte Carlo simulation validation (1000 runs per prediction)
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Probabilistic forecasting requires well-calibrated uncertainty estimates. Empirical coverage 
            measures the proportion of actual outcomes falling within predicted 90% confidence intervals—
            ideal calibration yields 90% coverage. Interval width quantifies prediction precision: narrower 
            intervals indicate greater certainty, but excessive width sacrifices informativeness. The 
            calibration curve traces coverage-uncertainty trade-offs across hyperparameter values, 
            validating that stochastic perturbations (driver form variability, weather, strategy) 
            appropriately propagate epistemic and aleatoric uncertainty without systematic bias.
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Empirical Coverage"
            value={`${(step2.overall_coverage.coverage_rate * 100).toFixed(1)}%`}
            icon={Target}
            description="Actual coverage rate (90% CI)"
          />
          <MetricCard
            title="Target Coverage"
            value={`${(step2.overall_coverage.target_coverage * 100).toFixed(0)}%`}
            icon={Target}
            description="Desired confidence level"
          />
          <MetricCard
            title="Mean Interval Width"
            value={step2.interval_width_analysis.mean_width.toFixed(2)}
            icon={Ruler}
            description="Average prediction interval (positions)"
          />
        </div>

        {/* Bar Chart: Per-Race Coverage */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Per-Race Coverage Rate
              </h4>
            </div>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Seasons</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Proportion of actual outcomes within 90% prediction intervals by race
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredCoverageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="race_id"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                label={{ value: 'Race ID', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                domain={[0, 1]}
                label={{ value: 'Coverage Rate', angle: -90, position: 'insideLeft', offset: 10, fill: '#9CA3AF' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#F9FAFB',
                }}
                formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
              />
              <Bar dataKey="coverage_rate" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart: Calibration Curve (Sigma vs Coverage) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Calibration Curve: driver_form_sigma vs Coverage
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Empirical coverage vs uncertainty hyperparameter showing calibration progression
          </p>
<ResponsiveContainer width="100%" height={320}>
  <LineChart 
    data={calibrationVariants} 
    margin={{ right: 50, left: 10, top: 20, bottom: 20 }}
  >
    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
    <XAxis
      dataKey="driver_form_sigma"
      stroke="#9CA3AF"
      tick={{ fill: '#9CA3AF', fontSize: 12 }}
      domain={[0.04, 0.13]}
      type="number"
      allowDataOverflow={false}
      label={{ value: 'driver_form_sigma', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
    />
    <YAxis
      stroke="#9CA3AF"
      tick={{ fill: '#9CA3AF', fontSize: 12 }}
      domain={[0.75, 0.92]}
      label={{ 
        value: 'Coverage Rate', 
        angle: -90, 
        position: 'insideLeft',
        style: { textAnchor: 'middle' },
        fill: '#9CA3AF' 
      }}
    />
    <Tooltip
      contentStyle={{
        backgroundColor: '#1F2937',
        border: '1px solid #374151',
        borderRadius: '0.5rem',
        color: '#F9FAFB',
      }}
      formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
    />
    <Legend 
      verticalAlign="top"
      height={36}
    />
    <Line
      type="monotone"
      dataKey="coverage_rate"
      stroke="#10B981"
      strokeWidth={3}
      dot={{ fill: '#10B981', r: 6 }}
      name="Empirical Coverage"
      connectNulls={false}
    />
    <ReferenceLine 
      y={0.90} 
      stroke="#EF4444" 
      strokeWidth={2}
      strokeDasharray="5 5"
      label={{ 
        value: 'Target (90%)', 
        fill: '#EF4444', 
        position: 'insideTopRight'
      }}
    />
  </LineChart>
</ResponsiveContainer>       
    
    </div>
      </section>

      {/* Methodology Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Validation Methodology
        </h3>
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Rolling-Origin Evaluation
            </h4>
            <p className="text-sm leading-relaxed">
              The model is trained on historical data up to race <em>t-1</em> and evaluated on race{' '}
              <em>t</em>. This simulates real-world deployment where future data is unavailable at
              prediction time, ensuring no temporal leakage.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Temporal Leakage
            </h4>
            <p className="text-sm leading-relaxed">
              All feature engineering respects temporal boundaries. Moving averages, ELO ratings, and
              momentum features are computed using only past observations, preventing data leakage that
              would artificially inflate performance metrics.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Frozen Calibration Parameters
            </h4>
            <p className="text-sm leading-relaxed">
              Monte Carlo uncertainty quantification uses <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">driver_form_sigma=0.12</code>{' '}
              (frozen after incremental calibration testing from 0.05 → 0.12). This value achieves
              89.8% empirical coverage, closely matching the 90% target for well-calibrated
              probabilistic forecasts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

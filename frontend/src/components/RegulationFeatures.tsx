import { Activity, Zap, Weight, Fuel, Disc, TrendingUp } from 'lucide-react';
import { KEY_REGULATION_FEATURES } from '../utils/dataAdapter';

const FEATURE_ICONS = {
  power_ratio: Zap,
  aero_coeff: Activity,
  weight_ratio: Weight,
  fuel_flow_ratio: Fuel,
  tire_grip_ratio: Disc,
  avg_pos_last5: TrendingUp,
};

interface FeatureCardProps {
  feature: typeof KEY_REGULATION_FEATURES[0];
}

function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = FEATURE_ICONS[feature.id as keyof typeof FEATURE_ICONS] || Activity;
  const percentChange = ((feature.multiplier - 1) * 100).toFixed(1);
  const isPositive = feature.multiplier > 1;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${changeColor}`} />
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${changeColor}`}>
            {isPositive ? '+' : ''}{percentChange}%
          </span>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {feature.name}
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {feature.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Baseline: {feature.baseline.toFixed(2)}</span>
        <span>→</span>
        <span className="font-semibold">2026: {feature.target2026.toFixed(2)}</span>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Multiplier:</span>
          <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
            {feature.multiplier.toFixed(2)}x
          </span>
        </div>
      </div>
    </div>
  );
}

export function RegulationFeatures() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          2026 Regulation Key Features
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          These 6 features drive the Monte Carlo simulation predictions for 2026 regulation impacts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {KEY_REGULATION_FEATURES.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          How These Features Work
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <strong>ERS Power Split</strong>: The biggest change - electric power increases from 15% to 50% of total power output
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <strong>Active Aero</strong>: Movable aerodynamic elements adjust in real-time for optimal efficiency
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <strong>Weight Reduction</strong>: 30kg lighter cars improve acceleration and cornering performance
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <strong>Fuel Flow</strong>: Reduced flow rate pushes teams toward maximum efficiency strategies
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <strong>Tire Spec</strong>: New low-profile tires slightly reduce mechanical grip
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

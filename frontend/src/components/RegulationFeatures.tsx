import { Activity, Zap, Weight, Fuel, Disc, TrendingUp } from 'lucide-react';
import { KEY_REGULATION_FEATURES } from '../utils/dataAdapter';

const FEATURE_ICONS = {
  power_ratio: Zap,
  boost_mode: Activity,
  weight_ratio: Weight,
  tire_grip_ratio: Disc,
  fuel_flow_ratio: Fuel,
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
          2026 FIA Regulation Changes
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Five key technical modifications that form the basis of our Monte Carlo simulation analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {KEY_REGULATION_FEATURES.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          2026 Regulation Technical Details
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            <span>
              <strong>Hybrid Power Enhancement (3.33× multiplier)</strong>: Electric power contribution increases from 15% to 50% of total power output, fundamentally altering power unit architecture and energy deployment strategies
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            <span>
              <strong>Active Aerodynamics & Boost (1.25× multiplier)</strong>: Driver-activated boost systems provide additional power for overtaking maneuvers, replacing the fixed DRS zones with flexible energy deployment
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            <span>
              <strong>Chassis Weight Reduction (0.962× multiplier)</strong>: Minimum chassis weight decreases from 798 kg to 768 kg, improving power-to-weight ratio and potentially enhancing cornering performance
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">4.</span>
            <span>
              <strong>Tire Grip Reduction (0.94× multiplier)</strong>: New tire compounds with reduced contact patch area decrease mechanical grip, placing greater emphasis on aerodynamic efficiency
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">5.</span>
            <span>
              <strong>Sustainable Fuel Limitation (0.75× multiplier)</strong>: Sustainable fuel mandates with reduced flow rates emphasize energy efficiency over peak power delivery
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

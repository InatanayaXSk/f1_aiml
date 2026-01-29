import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, MapPin, Users, Presentation } from 'lucide-react';

const tabs = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/presentation', label: '🎯 Presentation', icon: Presentation },
  { path: '/regulations', label: 'Regulation Explorer', icon: Settings },
  { path: '/circuits', label: 'Circuit Analyzer', icon: MapPin },
  { path: '/teams', label: 'Team Comparison', icon: Users },
];

export const NavTabs = () => {
  const location = useLocation();

  return (
    <nav
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center gap-2 py-4 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

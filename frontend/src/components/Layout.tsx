import { ReactNode } from 'react';
import { NavTabs } from './NavTabs';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  F1 2026 Regulation Impact
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Simulation Dashboard
                </p>
              </div>
            </div>
          </div>
        </header>

        <NavTabs />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              F1 2026 Regulation Impact Simulation Dashboard
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

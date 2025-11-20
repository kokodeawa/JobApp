import React from 'react';

type ActiveTab = 'dashboard' | 'history' | 'expenses' | 'calculators';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navButtonClasses = (tabName: ActiveTab) =>
    `flex-1 flex flex-col items-center justify-center p-2 transition-colors text-sm ${
      activeTab === tabName
        ? 'text-blue-500'
        : 'text-gray-500 dark:text-neutral-400 active:text-blue-500'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-700 flex justify-around items-center z-20">
      <button onClick={() => onTabChange('dashboard')} className={navButtonClasses('dashboard')}>
        <i className="fa-solid fa-table-columns text-xl mb-1"></i>
        <span>Dashboard</span>
      </button>
       <button onClick={() => onTabChange('expenses')} className={navButtonClasses('expenses')}>
        <i className="fa-solid fa-calendar-days text-xl mb-1"></i>
        <span>Gastos</span>
      </button>
       <button onClick={() => onTabChange('calculators')} className={navButtonClasses('calculators')}>
        <i className="fa-solid fa-calculator text-xl mb-1"></i>
        <span>Calcular</span>
      </button>
      <button onClick={() => onTabChange('history')} className={navButtonClasses('history')}>
        <i className="fa-solid fa-clock-rotate-left text-xl mb-1"></i>
        <span>Historial</span>
      </button>
    </nav>
  );
};
import React from 'react';

type ActiveTab = 'dashboard' | 'history' | 'expenses' | 'calculators';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onMenuClick }) => {
  const navButtonClasses = (tabName: ActiveTab) => 
    `px-4 py-2 rounded-lg font-semibold transition-colors text-sm md:text-base ${
      activeTab === tabName 
        ? 'bg-blue-500 text-white shadow-md' 
        : 'bg-transparent text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
    }`;

  return (
    <header className="bg-white dark:bg-neutral-900 sticky top-0 z-30 shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        {/* Left Side */}
        <div className="flex items-center space-x-2">
           <button 
            onClick={onMenuClick} 
            className="p-2 rounded-full text-gray-800 dark:text-neutral-200 active:bg-gray-200 dark:active:bg-neutral-700 transition-colors"
            aria-label="Abrir menú"
           >
             <i className="fa-solid fa-bars text-xl"></i>
           </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-neutral-100 hidden sm:block">Organizador Financiero Pro</h1>
        </div>
        
        {/* Right Side */}
        <div className="flex items-center space-x-2">
          <nav className="hidden md:flex items-center space-x-1 md:space-x-2 bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button onClick={() => onTabChange('dashboard')} className={navButtonClasses('dashboard')}>
              <i className="fa-solid fa-table-columns mr-2 hidden md:inline"></i>Dashboard
            </button>
            <button onClick={() => onTabChange('expenses')} className={navButtonClasses('expenses')}>
              <i className="fa-solid fa-calendar-days mr-2 hidden md:inline"></i>Gastos Diarios
            </button>
            <button onClick={() => onTabChange('calculators')} className={navButtonClasses('calculators')}>
              <i className="fa-solid fa-calculator mr-2 hidden md:inline"></i>Calculadoras
            </button>
            <button onClick={() => onTabChange('history')} className={navButtonClasses('history')}>
              <i className="fa-solid fa-clock-rotate-left mr-2 hidden md:inline"></i>Historial
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
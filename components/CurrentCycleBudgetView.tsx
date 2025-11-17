
import React, { useMemo } from 'react';
import { BudgetRecord, Category } from '../types';
import { SummaryCard } from './SummaryCard';

interface CurrentCycleBudgetViewProps {
  isOpen: boolean;
  onClose: () => void;
  budget: BudgetRecord | null;
}

export const CurrentCycleBudgetView: React.FC<CurrentCycleBudgetViewProps> = ({ isOpen, onClose, budget }) => {
  const { totalSpent, balance, categoriesWithData } = useMemo(() => {
    if (!budget) {
      return { totalSpent: 0, balance: 0, categoriesWithData: [] };
    }
    const spentCategories = budget.categories.filter(c => c.id !== 'savings');
    const totalSpent = spentCategories.reduce((sum, cat) => sum + cat.amount, 0);
    const balance = budget.totalIncome - totalSpent;
    
    const categoriesWithData = budget.categories
      .filter(c => c.amount > 0)
      .map(c => ({
        ...c,
        percentage: budget.totalIncome > 0 ? (c.amount / budget.totalIncome) * 100 : 0
      }));

    return { totalSpent, balance, categoriesWithData };
  }, [budget]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-neutral-800 rounded-2xl shadow-xl p-6 w-full max-w-2xl m-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {budget ? (
          <>
            <div className="flex justify-between items-center mb-4 flex-shrink-0 border-b border-neutral-700 pb-4">
              <h2 className="text-2xl font-bold text-neutral-100">Presupuesto del Ciclo Actual</h2>
              <button onClick={onClose} className="p-2 rounded-full active:bg-neutral-700" aria-label="Cerrar vista de presupuesto">
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>
            <div className="overflow-y-auto flex-grow pr-2 -mr-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SummaryCard title="Ingreso del Ciclo" value={`$${budget.totalIncome.toFixed(2)}`} icon="fa-solid fa-dollar-sign" color="text-green-500" bgColor="bg-green-900/50 text-green-400" />
                  <SummaryCard title="Total Gastado" value={`$${totalSpent.toFixed(2)}`} icon="fa-solid fa-coins" color="text-amber-500" bgColor="bg-amber-900/50 text-amber-400" />
                  <SummaryCard title="Balance Actual" value={`$${balance.toFixed(2)}`} icon="fa-solid fa-wallet" color="text-blue-500" bgColor="bg-blue-900/50 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-200 mb-3">Desglose de Gastos</h3>
                <div className="space-y-3">
                  {categoriesWithData.length > 0 ? categoriesWithData.map(cat => (
                    <div key={cat.id} className="bg-neutral-700/50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-3">
                          <i className={`${cat.icon} fa-fw`} style={{ color: cat.color }}></i>
                          <span className="font-semibold text-neutral-200">{cat.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-neutral-100">${cat.amount.toFixed(2)}</p>
                          <p className="text-xs text-neutral-400">{cat.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                       <div className="w-full bg-neutral-600 rounded-full h-1.5 mt-1">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${cat.percentage}%`, backgroundColor: cat.color, transition: 'width 0.5s' }}
                          ></div>
                        </div>
                    </div>
                  )) : (
                     <p className="text-center text-neutral-500 py-4">No hay gastos registrados en este ciclo.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex-shrink-0 border-t border-neutral-700 pt-4 text-center">
                <p className="text-xs text-neutral-500">Este es un presupuesto en tiempo real. Se guardará en tu historial cuando el ciclo finalice.</p>
            </div>
          </>
        ) : (
           <div className="text-center p-8">
                <i className="fa-solid fa-circle-info text-4xl text-blue-500 mb-4"></i>
                <h2 className="text-2xl font-bold mb-2 text-neutral-100">Sin Presupuesto Activo</h2>
                <p className="text-neutral-300 mb-6">
                    Para ver un presupuesto en tiempo real, primero debes configurar un ciclo de pago en la pestaña de "Gastos".
                </p>
                <button 
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-lg bg-blue-600 active:bg-blue-700 text-white font-bold transition-colors"
                >
                    Entendido
                </button>
           </div>
        )}
      </div>
       <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

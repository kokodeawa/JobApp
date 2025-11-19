import React, { useMemo } from 'react';
import { BudgetRecord, PayCycleFrequency } from '../types';

interface HistoryPanelProps {
  budgets: BudgetRecord[];
  activeBudgetId: string | null;
  onOpenDeleteModal: (budget: BudgetRecord) => void;
  onCreateNew: () => void;
  onEditBudget: (budget: BudgetRecord) => void;
}

const pluralFrequencyLabels: Record<PayCycleFrequency, string> = {
    semanal: 'Semanales',
    quincenal: 'Quincenales',
    mensual: 'Mensuales',
    anual: 'Anuales'
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ budgets, activeBudgetId, onOpenDeleteModal, onCreateNew, onEditBudget }) => {
    const groupedBudgets = useMemo(() => {
        const groups = budgets.reduce((acc, budget) => {
            const freq = budget.frequency || 'mensual';
            if (!acc[freq]) {
                acc[freq] = [];
            }
            acc[freq].push(budget);
            return acc;
        }, {} as Record<PayCycleFrequency, BudgetRecord[]>);

        for (const freq in groups) {
            groups[freq as PayCycleFrequency].sort((a, b) => new Date(b.dateSaved).getTime() - new Date(a.dateSaved).getTime());
        }
        return groups;
    }, [budgets]);
    
    const frequencies: PayCycleFrequency[] = ['semanal', 'quincenal', 'mensual', 'anual'];

    return (
        <div className="bg-neutral-800 p-6 rounded-3xl shadow-lg space-y-6 self-start">
            <h2 className="text-2xl font-bold text-neutral-100 border-b pb-4 border-neutral-700">
                Mis Presupuestos
            </h2>
            <button 
                onClick={onCreateNew}
                className="w-full bg-blue-600 active:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
                <i className="fa-solid fa-plus mr-2"></i>
                Crear Nuevo
            </button>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {budgets.length === 0 ? (
                     <p className="text-sm text-neutral-400 p-3 bg-neutral-700/50 rounded-lg text-center">No hay presupuestos guardados.</p>
                ) : (
                    frequencies.map(freq => (
                        groupedBudgets[freq] && groupedBudgets[freq].length > 0 && (
                            <div key={freq}>
                                <h3 className="text-sm font-semibold text-neutral-400 capitalize mb-2 sticky top-0 bg-neutral-800 py-1">
                                    {pluralFrequencyLabels[freq]}
                                </h3>
                                <div className="space-y-3">
                                    {groupedBudgets[freq].map(budget => (
                                    <div 
                                        key={budget.id}
                                        className={`p-3 rounded-xl transition-all duration-200 border-2 ${activeBudgetId === budget.id ? 'bg-blue-900/50 border-blue-500' : 'bg-neutral-700 border-transparent'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                             <div>
                                                <p className={`font-bold ${activeBudgetId === budget.id ? 'text-blue-300' : 'text-neutral-200'}`}>{budget.name}</p>
                                                <p className={`text-xs ${activeBudgetId === budget.id ? 'text-blue-400' : 'text-neutral-400'}`}>
                                                    {new Date(budget.dateSaved).toLocaleDateString('es-ES')}
                                                </p>
                                             </div>
                                             <div className="flex items-center space-x-1 flex-shrink-0">
                                                 <button
                                                    onClick={(e) => { e.stopPropagation(); onEditBudget(budget); }}
                                                    className={`text-sm p-2 h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${activeBudgetId === budget.id ? 'text-blue-400 active:bg-blue-500/20' : 'text-neutral-400/70 active:text-blue-400 active:bg-blue-500/10'}`}
                                                    aria-label={`Editar ${budget.name}`}
                                                 >
                                                    <i className="fa-solid fa-pencil"></i>
                                                 </button>
                                                 <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenDeleteModal(budget);
                                                    }}
                                                    className={`text-sm p-2 h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${activeBudgetId === budget.id ? 'text-red-500 active:bg-red-500/20' : 'text-red-500/70 active:text-red-500 active:bg-red-500/10'}`}
                                                    aria-label={`Eliminar ${budget.name}`}
                                                 >
                                                    <i className="fa-solid fa-trash-can"></i>
                                                 </button>
                                             </div>
                                        </div>
                                    </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))
                )}
            </div>
        </div>
    );
};
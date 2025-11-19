import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BudgetRecord, Category, PayCycleFrequency } from '../types';
import { IncomeInput } from './IncomeInput';
import { CategoryInput } from './CategoryInput';
import { FrequencySelector } from './FrequencySelector';
import { INITIAL_CATEGORIES } from '../constants';

interface BudgetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newBudget: Omit<BudgetRecord, 'id'>) => void;
  onUpdate: (updatedBudget: BudgetRecord) => void;
  budget: BudgetRecord | null; // Null for creation
}

const frequencyLabels: Record<PayCycleFrequency, string> = {
    semanal: 'Semanal',
    quincenal: 'Quincenal',
    mensual: 'Mensual',
    anual: 'Anual'
};

const toISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const BudgetEditorModal: React.FC<BudgetEditorModalProps> = ({ isOpen, onClose, onSave, onUpdate, budget }) => {
  const [name, setName] = useState('');
  const [totalIncome, setTotalIncome] = useState(1500);
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(JSON.stringify(INITIAL_CATEGORIES)));
  const [frequency, setFrequency] = useState<PayCycleFrequency>('mensual');
  const [date, setDate] = useState('');

  const isCreateMode = budget === null;

  const categoriesForDeps = useMemo(() => {
      return JSON.stringify(categories.filter(c => c.id !== 'savings'));
  }, [categories]);

  // Auto-calculate savings
  useEffect(() => {
    if (!isOpen) return;
    const allocatedWithoutSavings = categories
        .filter(cat => cat.id !== 'savings')
        .reduce((sum, cat) => sum + cat.amount, 0);
    
    const remaining = totalIncome - allocatedWithoutSavings;
    const savingsAmount = Math.max(0, remaining);

    setCategories(prevCategories =>
        prevCategories.map(cat =>
            cat.id === 'savings' ? { ...cat, amount: savingsAmount } : cat
        )
    );
  }, [totalIncome, categoriesForDeps, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (isCreateMode) {
        const today = new Date();
        setName(`Presupuesto ${today.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`);
        setTotalIncome(1500);
        setCategories(JSON.parse(JSON.stringify(INITIAL_CATEGORIES)));
        setFrequency('mensual');
        setDate(toISODateString(today));
      } else if (budget) {
        setName(budget.name);
        setTotalIncome(budget.totalIncome);
        setCategories(JSON.parse(JSON.stringify(budget.categories))); // Deep copy
        setFrequency(budget.frequency || 'mensual');
        // When editing, parse the stored date string to correctly display the local date
        const budgetDate = new Date(budget.dateSaved);
        setDate(toISODateString(budgetDate));
      }
    }
  }, [isOpen, budget, isCreateMode]);

  const handleAmountChange = useCallback((id: string, newAmount: number) => {
    setCategories(prevCategories =>
      prevCategories.map(cat =>
        cat.id === id ? { ...cat, amount: newAmount } : cat
      )
    );
  }, []);

  const handleAction = () => {
    if (name.trim() === '') {
      alert("El nombre no puede estar vacío.");
      return;
    }
    if (totalIncome <= 0) {
        alert("Por favor, introduce un ingreso válido.");
        return;
    }
    
    // To correctly save the chosen date regardless of timezone,
    // parse it as local midnight and convert to a full ISO string.
    const dateObj = new Date(date + 'T00:00:00');
    const dateToSave = dateObj.toISOString();

    if (isCreateMode) {
        onSave({ name: name.trim(), totalIncome, categories, frequency, dateSaved: dateToSave });
    } else if (budget) {
        onUpdate({
            ...budget,
            name: name.trim(),
            totalIncome,
            categories,
            frequency,
            dateSaved: dateToSave,
        });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-start z-50 transition-opacity duration-300 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-neutral-800 rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-2xl my-8 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 text-neutral-100 flex-shrink-0 border-b border-neutral-700 pb-4">
            {isCreateMode ? 'Crear Presupuesto Rápido' : 'Editar Presupuesto'}
        </h2>
        <div className="overflow-y-auto space-y-6 pr-2 -mr-2 flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Nombre</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-neutral-700 text-white rounded-lg" autoFocus />
            </div>
            <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Fecha</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 bg-neutral-700 text-white rounded-lg" />
            </div>
          </div>
          <FrequencySelector selected={frequency} onChange={setFrequency} />
          <IncomeInput value={totalIncome} onChange={setTotalIncome} label={`Ingreso ${frequencyLabels[frequency]} Total`} />
          <div className="space-y-4">
            {categories.map(category => (
              <CategoryInput key={category.id} category={category} onAmountChange={handleAmountChange} totalIncome={totalIncome} disabled={category.id === 'savings'} />
            ))}
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-4 flex-shrink-0 border-t border-neutral-700 pt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-neutral-600 text-neutral-200 font-semibold">Cancelar</button>
          <button onClick={handleAction} className="px-6 py-2 rounded-lg bg-blue-600 active:bg-blue-700 text-white font-bold">{isCreateMode ? 'Guardar' : 'Actualizar'}</button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};
import React, { useState, useEffect, useMemo } from 'react';
import { FutureExpense, FutureExpenseFrequency, Category } from '../types';
import { CustomSelect } from './CustomSelect';

interface FutureExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: FutureExpense | null;
  setFutureExpenses: React.Dispatch<React.SetStateAction<FutureExpense[]>>;
  categories: Category[];
}

const toISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const FutureExpenseModal: React.FC<FutureExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  setFutureExpenses,
  categories,
}) => {
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [startDate, setStartDate] = useState(toISODateString(new Date()));
  const [frequency, setFrequency] = useState<FutureExpenseFrequency>('una-vez');
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setNote(expense.note);
        setAmount(expense.amount.toString());
        setCategoryId(expense.categoryId);
        setStartDate(expense.startDate);
        setFrequency(expense.frequency);
        setEndDate(expense.endDate || null);
      } else {
        // Reset form for new expense
        setNote('');
        setAmount('');
        setCategoryId(categories[0]?.id || '');
        setStartDate(toISODateString(new Date()));
        setFrequency('una-vez');
        setEndDate(null);
      }
    }
  }, [isOpen, expense, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!note.trim() || isNaN(amountNum) || amountNum <= 0) {
      alert('Por favor, completa todos los campos con valores válidos.');
      return;
    }

    if (expense) {
      // Update existing expense
      setFutureExpenses(prev =>
        prev.map(exp =>
          exp.id === expense.id
            ? { ...exp, note, amount: amountNum, categoryId, startDate, frequency, endDate }
            : exp
        )
      );
    } else {
      // Add new expense
      const newExpense: FutureExpense = {
        id: Date.now().toString(),
        note: note.trim(),
        amount: amountNum,
        categoryId,
        startDate,
        frequency,
        endDate,
      };
      setFutureExpenses(prev => [...prev, newExpense]);
    }
    onClose();
  };

  const categoryOptions = useMemo(() => categories.map(cat => ({
    value: cat.id,
    label: cat.name,
  })), [categories]);

  const frequencyOptions = [
    { value: 'una-vez', label: 'Una vez' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'quincenal', label: 'Quincenal' },
    { value: 'mensual', label: 'Mensual' },
    { value: 'anual', label: 'Anual' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-neutral-800 rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-neutral-100">{expense ? 'Editar' : 'Añadir'} Gasto Planificado</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Nota (ej. Renta, Netflix)" className="w-full p-2 bg-neutral-700 text-white border border-neutral-600 rounded-lg" required />
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Importe" className="w-full p-2 bg-neutral-700 text-white border border-neutral-600 rounded-lg" min="0.01" step="0.01" required />
           <CustomSelect
              options={categoryOptions}
              value={categoryId}
              onChange={setCategoryId}
              className="[&>button]:p-2 [&>button]:text-base [&>button]:font-normal"
            />
          <div>
            <CustomSelect
                label="Frecuencia"
                options={frequencyOptions}
                value={frequency}
                onChange={(val) => setFrequency(val as FutureExpenseFrequency)}
                className="[&>button]:p-2 [&>button]:text-base [&>button]:font-normal"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-400">Fecha de inicio</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-neutral-700 text-white border border-neutral-600 rounded-lg" required />
          </div>
          {frequency !== 'una-vez' && (
            <div>
              <label className="text-sm text-neutral-400">Fecha de fin (opcional)</label>
              <input type="date" value={endDate || ''} onChange={e => setEndDate(e.target.value || null)} className="w-full p-2 bg-neutral-700 text-white border border-neutral-600 rounded-lg" />
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-neutral-600 text-neutral-200 active:bg-neutral-500 font-semibold">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 active:bg-blue-700 text-white font-bold">{expense ? 'Actualizar' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
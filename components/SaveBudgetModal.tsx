

import React, { useState, useEffect } from 'react';

interface SaveBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, date: string) => void;
}

export const SaveBudgetModal: React.FC<SaveBudgetModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      setName(`Presupuesto ${today.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`);
      setDate(today.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (name.trim() && date) {
      onSave(name.trim(), date);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-neutral-800 rounded-2xl shadow-xl p-8 w-full max-w-md m-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-neutral-100">Guardar Nuevo Presupuesto</h2>
        <p className="text-neutral-300 mb-6">Dale un nombre y una fecha a tu presupuesto para guardarlo en tu historial.</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="budgetName" className="block text-sm font-medium text-neutral-300 mb-2">
              Nombre del Presupuesto
            </label>
            <input
              type="text"
              id="budgetName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 bg-neutral-700 text-white border-2 border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="budgetDate" className="block text-sm font-medium text-neutral-300 mb-2">
              Fecha
            </label>
            <input
              type="date"
              id="budgetDate"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 bg-neutral-700 text-white border-2 border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-600 text-neutral-200 active:bg-neutral-500 font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-blue-600 active:bg-blue-700 text-white font-bold transition-colors"
          >
            Listo
          </button>
        </div>
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

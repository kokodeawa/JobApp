import React from 'react';

interface ForceCreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cycleStartDate: Date | null;
  cycleEndDate: Date | null;
}

export const ForceCreateBudgetModal: React.FC<ForceCreateBudgetModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  cycleStartDate,
  cycleEndDate
}) => {
  if (!isOpen || !cycleStartDate || !cycleEndDate) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const formattedStartDate = cycleStartDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedEndDate = cycleEndDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-neutral-800 rounded-2xl shadow-xl p-8 w-full max-w-lg m-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-900/50 mb-4">
                <i className="fa-solid fa-triangle-exclamation text-2xl text-yellow-400"></i>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-neutral-100">Creación de Presupuesto Parcial</h2>
        </div>

        <p className="text-neutral-300 mb-6 text-center">
            Estás a punto de crear un presupuesto para el ciclo actual, que aún no ha terminado. Se incluirán todos los gastos diarios registrados <strong className="text-red-400">Y</strong> los gastos futuros planificados entre el <strong>{formattedStartDate}</strong> y el <strong>{formattedEndDate}</strong>.
        </p>

        <div className="bg-neutral-700 p-4 rounded-lg text-sm text-neutral-300 mb-6">
            <p><i className="fa-solid fa-circle-info mr-2 text-blue-400"></i>Una vez guardado, este presupuesto aparecerá en tu historial y podrás editarlo o eliminarlo en cualquier momento, como cualquier otro presupuesto.</p>
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-neutral-600 text-neutral-200 hover:bg-neutral-500 font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-500/20"
            autoFocus
          >
            Guardar Presupuesto
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
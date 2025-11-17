
import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  budgetName: string;
  budgetDate: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  budgetName,
  budgetDate
}) => {
  if (!isOpen) return null;

  const handleConfirmClick = () => {
    onConfirm();
    onClose();
  };

  const formattedDate = new Date(budgetDate).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-neutral-800 rounded-2xl shadow-xl p-8 w-full max-w-md m-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 mb-4">
            <i className="fa-solid fa-triangle-exclamation text-2xl text-red-400"></i>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-neutral-100">Confirmar Eliminación</h2>
        <p className="text-neutral-300 mb-6">
          ¿Estás seguro de que quieres eliminar permanentemente el presupuesto
          <strong className="text-neutral-100"> "{budgetName}"</strong> guardado el
          <strong className="text-neutral-100"> {formattedDate}</strong>?
          <br/>
          Esta acción no se puede deshacer.
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-neutral-600 text-neutral-200 active:bg-neutral-500 font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmClick}
            className="px-8 py-2.5 rounded-lg bg-red-600 active:bg-red-700 text-white font-bold transition-colors shadow-lg shadow-red-500/20"
            autoFocus
          >
            Eliminar
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

import React from 'react';
import { AVATARS } from '../assets/avatars';
import { Avatar } from './Avatar';

interface ProfileCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarId: string;
  onSelectAvatar: (avatarId: string) => void;
}

export const ProfileCustomizationModal: React.FC<ProfileCustomizationModalProps> = ({ 
  isOpen, 
  onClose, 
  currentAvatarId, 
  onSelectAvatar 
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-6 w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-neutral-100 text-center border-b border-gray-200 dark:border-neutral-700 pb-4">
          Elige tu Avatar
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 overflow-y-auto p-2 flex-grow">
          {AVATARS.map((_, index) => {
            const avatarId = String(index);
            const isSelected = currentAvatarId === avatarId;
            return (
              <button
                key={index}
                onClick={() => onSelectAvatar(avatarId)}
                className={`aspect-square rounded-full transition-all duration-200 flex items-center justify-center ${isSelected ? 'ring-4 ring-blue-500 scale-105' : 'ring-2 ring-transparent hover:ring-gray-300 dark:hover:ring-neutral-600'}`}
                aria-label={`Seleccionar avatar ${index + 1}`}
              >
                <Avatar avatarId={avatarId} className="w-full h-full rounded-full" />
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end border-t border-gray-200 dark:border-neutral-700 pt-4">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 dark:bg-neutral-600 dark:text-neutral-200 font-semibold">
            Cerrar
          </button>
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
import React from 'react';
import { AVATARS } from '../assets/avatars';
import { Avatar } from './Avatar';

interface ProfileCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarId: string;
  onSelectAvatar: (avatarId: string) => void;
  currentBackground: string;
  onSelectBackground: (background: string) => void;
}

const BackgroundOption: React.FC<{
  label: string;
  isSelected: boolean;
  bgUrl?: string;
  onClick: () => void;
  children?: React.ReactNode;
}> = ({ label, isSelected, bgUrl, onClick, children }) => (
    <div className="text-center">
        <button
            onClick={onClick}
            className={`aspect-video w-full rounded-lg transition-all duration-200 flex items-center justify-center bg-cover bg-center ${isSelected ? 'ring-4 ring-blue-500' : 'ring-2 ring-gray-300 dark:ring-neutral-600 hover:ring-blue-400'}`}
            style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : {}}
            aria-label={`Seleccionar fondo ${label}`}
        >
            {!bgUrl && children}
        </button>
        <p className="text-xs mt-1 font-semibold text-gray-700 dark:text-neutral-300">{label}</p>
    </div>
);


export const ProfileCustomizationModal: React.FC<ProfileCustomizationModalProps> = ({ 
  isOpen, 
  onClose, 
  currentAvatarId, 
  onSelectAvatar,
  currentBackground,
  onSelectBackground,
}) => {
  if (!isOpen) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onSelectBackground(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const backgrounds = [
    { id: 'default', label: 'Por Defecto', content: <i className="fa-solid fa-ban text-2xl text-gray-400 dark:text-neutral-500"></i> },
    { id: 'bg1', label: 'Fondo 1', url: 'https://images.unsplash.com/photo-1554147090-e1221a04a025?w=400&auto=format&fit=crop' },
    { id: 'bg2', label: 'Fondo 2', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&auto=format&fit=crop' },
    { id: 'bg3', label: 'Fondo 3', url: 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=400&auto=format&fit=crop' },
    { id: 'bg4', label: 'Fondo 4', url: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&auto=format&fit=crop' },
    { id: 'bg5', label: 'Fondo 5', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&auto=format&fit=crop' },
    { id: 'bg6', label: 'Fondo 6', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&auto=format&fit=crop' },
    { id: 'bg7', label: 'Fondo 7', url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&auto=format&fit=crop' },
    { id: 'bg8', label: 'Fondo 8', url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=400&auto=format&fit=crop' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-6 w-full max-w-2xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-neutral-100 text-center border-b border-gray-200 dark:border-neutral-700 pb-4">
          Personalizar Perfil
        </h2>
        <div className="overflow-y-auto p-2 flex-grow">
            <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-neutral-200 text-center">
                Elige tu Avatar
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-4">
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

            <h3 className="text-xl font-bold mt-8 mb-4 pt-4 border-t border-gray-200 dark:border-neutral-700 text-gray-800 dark:text-neutral-200 text-center">
                Elige tu Fondo
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {backgrounds.map(bg => (
                <BackgroundOption
                  key={bg.id}
                  label={bg.label}
                  isSelected={currentBackground === bg.id}
                  bgUrl={bg.url}
                  onClick={() => onSelectBackground(bg.id)}
                >
                  {bg.content}
                </BackgroundOption>
              ))}
              <div className="text-center">
                <label htmlFor="custom-bg-upload" className={`aspect-video w-full rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer ${currentBackground.startsWith('data:') ? 'ring-4 ring-blue-500' : 'ring-2 ring-gray-300 dark:ring-neutral-600 hover:ring-blue-400'}`}>
                    <div className="text-center">
                        <i className="fa-solid fa-upload text-2xl text-gray-400 dark:text-neutral-500"></i>
                    </div>
                    <input type="file" id="custom-bg-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                <p className="text-xs mt-1 font-semibold text-gray-700 dark:text-neutral-300">Personalizado</p>
              </div>
            </div>
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
import React, { useState } from 'react';
import { LogoutConfirmationModal } from './LogoutConfirmationModal';
import { Avatar } from './Avatar';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
  onLogout: () => void;
  avatarId: string;
  onOpenProfileEditor: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, currentUser, onLogout, avatarId, onOpenProfileEditor, theme, onToggleTheme }) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Side Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-neutral-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-title"
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 id="menu-title" className="text-xl font-bold text-gray-900 dark:text-neutral-100">Menú</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-700 dark:text-neutral-300 active:bg-gray-200 dark:active:bg-neutral-700"
              aria-label="Cerrar menú"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>

          {/* User Profile Section */}
          <div className="mb-4">
            <button onClick={onOpenProfileEditor} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 w-full text-left transition-colors">
              <Avatar avatarId={avatarId} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-neutral-200">{currentUser}</p>
                <p className="text-sm text-gray-500 dark:text-neutral-400">Editar Perfil</p>
              </div>
            </button>
          </div>
          
          <div className="flex-grow"></div>

          {/* Options Section */}
          <div className="mb-2">
              <button 
                onClick={() => setIsOptionsOpen(!isOptionsOpen)} 
                className="w-full text-left p-3 rounded-lg flex justify-between items-center active:bg-gray-200 dark:active:bg-neutral-700 text-gray-800 dark:text-neutral-200 font-semibold transition-colors"
                aria-expanded={isOptionsOpen}
              >
                <span>
                  <i className="fa-solid fa-cog mr-3"></i>
                  Opciones
                </span>
                <i className={`fa-solid fa-chevron-down text-sm transition-transform duration-200 ${isOptionsOpen ? 'rotate-180' : ''}`}></i>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOptionsOpen ? 'max-h-60 mt-2' : 'max-h-0'}`}>
                <div className="bg-gray-100 dark:bg-neutral-700/50 p-4 rounded-lg space-y-3 text-sm">
                  <div className="flex items-center text-gray-700 dark:text-neutral-300">
                    <i className="fa-solid fa-language fa-fw mr-3 text-gray-500 dark:text-neutral-400"></i>
                    <span>Idioma: Español (ES)</span>
                  </div>
                   <button onClick={onToggleTheme} className="flex items-center text-gray-700 dark:text-neutral-300 w-full text-left">
                    <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} fa-fw mr-3 text-gray-500 dark:text-neutral-400`}></i>
                    <span>Cambiar Tema</span>
                  </button>
                  <div className="flex items-center text-gray-700 dark:text-neutral-300 pt-3 border-t border-gray-200 dark:border-neutral-600 mt-3">
                    <i className="fa-solid fa-code fa-fw mr-3 text-blue-500 dark:text-blue-400"></i>
                    <span>Creado por Anghello Sanchez</span>
                  </div>
                </div>
              </div>
            </div>

          {/* Footer/Logout */}
          <div className="flex-shrink-0 pt-4 border-t border-gray-200 dark:border-neutral-700">
            <button onClick={handleLogoutClick} className="w-full text-left p-3 rounded-lg active:bg-red-500/10 text-red-500 dark:text-red-400 font-semibold transition-colors">
              <i className="fa-solid fa-right-from-bracket mr-3"></i>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={onLogout}
      />
    </>
  );
};
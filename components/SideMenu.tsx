import React from 'react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {

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
        className={`fixed top-0 left-0 h-full w-72 bg-neutral-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-title"
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 id="menu-title" className="text-xl font-bold text-neutral-100">Menú</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full active:bg-neutral-700"
              aria-label="Cerrar menú"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>

          {/* User Profile Section */}
          <div className="mb-4">
            <div className="flex items-center space-x-4">
              <img
                src="https://via.placeholder.com/48" // Placeholder, replace with actual user image
                alt="Foto de perfil"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-semibold text-neutral-200">Usuario de Google</p>
                <p className="text-sm text-neutral-400">usuario@gmail.com</p>
              </div>
            </div>
          </div>
          
          <div className="flex-grow"></div>

          {/* Footer/Logout */}
          <div className="mt-auto flex-shrink-0 pt-4 border-t border-neutral-700">
            <button className="w-full text-left p-3 rounded-lg active:bg-red-500/10 text-red-400 font-semibold transition-colors">
              <i className="fa-solid fa-right-from-bracket mr-3"></i>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
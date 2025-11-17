
import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, label, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(option => option.value === value);
  const selectRef = useRef<HTMLDivElement>(null);

  const handleOptionClick = (newValue: string) => {
    onChange(newValue);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {label && <label className="text-sm font-bold text-neutral-300 mb-1 block">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-neutral-700 text-white border-2 border-neutral-600 rounded-lg text-lg font-semibold text-left flex justify-between items-center"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedOption ? selectedOption.label : 'Seleccionar...'}</span>
        <i className={`fa-solid fa-chevron-down text-sm text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden animate-fade-in-fast"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed bottom-0 left-0 w-full bg-neutral-800 rounded-t-2xl shadow-lg z-50 p-4 animate-slide-up
                       md:absolute md:top-full md:mt-2 md:bottom-auto md:w-full md:rounded-lg md:animate-fade-in-sm"
            role="listbox"
          >
            <div className="flex justify-between items-center mb-4 md:hidden">
              <h3 className="text-lg font-bold text-neutral-200">{label || 'Seleccionar opción'}</h3>
              <button type="button" onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-neutral-400">
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>
            <ul className="space-y-1 max-h-60 overflow-y-auto">
              {options.map(option => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleOptionClick(option.value)}
                    className={`w-full text-left p-3 rounded-lg text-base transition-colors ${
                      value === option.value
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-neutral-200 active:bg-neutral-700'
                    }`}
                    role="option"
                    aria-selected={value === option.value}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }

        @keyframes fade-in-sm {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-sm { animation: fade-in-sm 0.2s ease-out forwards; }

        @keyframes fade-in-fast {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-fast { animation: fade-in-fast 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

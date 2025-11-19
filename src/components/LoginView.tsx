import React, { useState, useEffect } from 'react';
import { Users, User } from '../types';
import { Avatar } from './Avatar';

interface LoginViewProps {
  onLogin: (username: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [lastUsername, setLastUsername] = useState<string | null>(null);
  const [view, setView] = useState<'welcome' | 'login' | 'register' | 'recover'>('login');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [recoveredAccounts, setRecoveredAccounts] = useState<{ user: string; pass: string }[] | null>(null);
  const [users, setUsers] = useState<Users>({});

  useEffect(() => {
    try {
      const storedUsers = getUsers();
      setUsers(storedUsers);
      const storedLastUser = window.localStorage.getItem('financial-organizer-lastUser');
      if (storedLastUser && storedUsers[storedLastUser]) {
        setLastUsername(storedLastUser);
        setView('welcome');
      }
    } catch (e) {
      console.warn("Could not access localStorage", e);
    }
  }, []);

  const getUsers = (): Users => {
    try {
      const usersData = window.localStorage.getItem('financial-organizer-users');
      return usersData ? JSON.parse(usersData) : {};
    } catch {
      return {};
    }
  };

  const saveUsers = (usersToSave: Users) => {
    window.localStorage.setItem('financial-organizer-users', JSON.stringify(usersToSave));
    setUsers(usersToSave);
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setError('');
  };

  const handleWelcomeLogin = () => {
    if (lastUsername) {
        onLogin(lastUsername);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('El usuario y la contraseña no pueden estar vacíos.');
      return;
    }
    const currentUsers = getUsers();
    const userData = currentUsers[username];
    
    if (!userData) {
      setError('Usuario o contraseña incorrectos.');
      return;
    }

    // Handle migration from old string-based password to new User object
    if (typeof userData === 'string') {
        if (userData === password) {
            const migratedUser: User = { password: userData, avatarId: '0' };
            const updatedUsers = { ...currentUsers, [username]: migratedUser };
            saveUsers(updatedUsers);
            onLogin(username);
        } else {
            setError('Usuario o contraseña incorrectos.');
        }
    } else { // New User object format
        if (userData.password === password) {
            onLogin(username);
        } else {
            setError('Usuario o contraseña incorrectos.');
        }
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('El usuario y la contraseña no pueden estar vacíos.');
      return;
    }
    const currentUsers = getUsers();
    if (currentUsers[username]) {
      setError('Este nombre de usuario ya existe.');
    } else {
      const newUser: User = { password, avatarId: '0' };
      const newUsers = { ...currentUsers, [username]: newUser };
      saveUsers(newUsers);
      onLogin(username);
    }
  };

  const handleShowAllAccounts = () => {
    setError('');
    const currentUsers = getUsers();
    const accountsArray = Object.entries(currentUsers).map(([user, data]) => ({ 
        user, 
        pass: typeof data === 'string' ? data : data.password 
    }));
    setRecoveredAccounts(accountsArray);
    setView('recover');
  };
  
  const switchToLogin = () => {
    resetForm();
    setView('login');
  };
  
  const switchToRegister = () => {
    resetForm();
    setView('register');
  };

  const renderWelcomeView = () => {
    const user = users[lastUsername!] as User;
    const avatarId = user?.avatarId || '0';
    return (
        <>
        <div className="text-center mb-6">
            <Avatar avatarId={avatarId} className="w-16 h-16 rounded-full bg-gray-200 dark:bg-neutral-700 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">¡Hola de nuevo, {lastUsername}!</h2>
        </div>
        <div className="space-y-6">
            <button
            onClick={handleWelcomeLogin}
            className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
            >
            Entrar
            </button>
        </div>
        <div className="text-center text-sm text-gray-500 dark:text-neutral-400 mt-6 space-y-2">
            <button onClick={switchToLogin} className="font-semibold text-blue-500 dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300">
                Acceder con otra cuenta
            </button>
        </div>
        </>
    );
  };

  const renderLoginRegisterView = () => (
    <>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">{view === 'register' ? 'Crear Perfil' : 'Iniciar Sesión'}</h2>
        <form onSubmit={view === 'register' ? handleRegisterSubmit : handleLoginSubmit} className="space-y-6">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-600 dark:text-neutral-300">Nombre de Usuario</label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full mt-1 p-3 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoComplete="username"
                    required
                />
            </div>
            <div>
                <label htmlFor="password"  className="block text-sm font-medium text-gray-600 dark:text-neutral-300">Contraseña</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mt-1 p-3 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoComplete={view === 'register' ? "new-password" : "current-password"}
                    required
                />
            </div>
            {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
            <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
            >
                {view === 'register' ? 'Registrar y Entrar' : 'Entrar'}
            </button>
        </form>
        <div className="text-center text-sm text-gray-500 dark:text-neutral-400 mt-6 space-y-2">
            <p>
                {view === 'register' ? '¿Ya tienes un perfil?' : '¿No tienes un perfil?'}
                <button onClick={view === 'register' ? switchToLogin : switchToRegister} className="font-semibold text-blue-500 dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300 ml-1">
                    {view === 'register' ? 'Inicia sesión' : 'Crea uno'}
                </button>
            </p>
        </div>
    </>
  );
  
  const renderRecoveryView = () => (
    <>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Cuentas Guardadas</h2>
        {recoveredAccounts && recoveredAccounts.length > 0 ? (
             <div className="bg-gray-100 dark:bg-neutral-700/50 p-4 rounded-lg space-y-3 max-h-60 overflow-y-auto">
                {recoveredAccounts.map(acc => (
                     <div key={acc.user} className="text-left border-b border-gray-200 dark:border-neutral-600 pb-2 last:border-b-0">
                        <p className="text-gray-800 dark:text-neutral-200"><strong>Usuario:</strong> {acc.user}</p>
                        <p className="text-gray-700 dark:text-neutral-300"><strong>Contraseña:</strong> {acc.pass}</p>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center text-gray-500 dark:text-neutral-400 p-4">
                <p>No hay cuentas guardadas en este dispositivo.</p>
            </div>
        )}
        <div className="text-center text-sm text-gray-500 dark:text-neutral-400 mt-6">
            <button onClick={() => { setView(lastUsername ? 'welcome' : 'login'); setError(''); setRecoveredAccounts(null); }} className="font-semibold text-blue-500 dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300">
                Volver
            </button>
        </div>
    </>
  );

  const renderContent = () => {
    switch (view) {
      case 'welcome': return renderWelcomeView();
      case 'login': return renderLoginRegisterView();
      case 'register': return renderLoginRegisterView();
      case 'recover': return renderRecoveryView();
    }
  };

  const getSubtitle = () => {
    switch(view) {
      case 'welcome': return '¡Qué bueno verte de nuevo!';
      case 'login': return 'Inicia sesión para continuar';
      case 'register': return 'Crea un perfil para empezar';
      case 'recover': return 'Estas son todas las cuentas guardadas';
      default: return '';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <i className="fa-solid fa-wallet text-5xl text-blue-500 mb-4"></i>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-100">Organizador Financiero Pro</h1>
            <p className="text-gray-500 dark:text-neutral-400">{getSubtitle()}</p>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-8 rounded-3xl shadow-lg">
           {renderContent()}
        </div>
        
        {view !== 'recover' && (
             <div className="text-center text-sm text-gray-500 dark:text-neutral-400 mt-6">
                 <button onClick={handleShowAllAccounts} className="font-semibold text-blue-500 dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300">
                    ¿Olvidaste tu cuenta?
                </button>
             </div>
        )}

      </div>
    </div>
  );
};
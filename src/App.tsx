import React, { useState } from 'react';
import { LoginView } from './components/LoginView';
import { MainApp } from './MainApp';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<string | null>(() => {
        try {
            // Use localStorage to persist the session across browser closures
            return window.localStorage.getItem('financial-organizer-currentUser');
        } catch (error) {
            console.warn("Could not access localStorage. User session will not be persisted.", error);
            return null;
        }
    });

    const handleLogin = (username: string) => {
        window.localStorage.setItem('financial-organizer-currentUser', username);
        setCurrentUser(username);
    };

    const handleLogout = () => {
        window.localStorage.removeItem('financial-organizer-currentUser');
        setCurrentUser(null);
    };
    
    return (
        <>
            {!currentUser ? (
                <LoginView onLogin={handleLogin} />
            ) : (
                <MainApp currentUser={currentUser} onLogout={handleLogout} />
            )}
        </>
    );
};

export default App;
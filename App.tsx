import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        // If there is no current user, we are showing the LoginView.
        // In this case, the main app is not performing its async data loading,
        // so we can safely hide the initial loading spinner immediately.
        if (!currentUser) {
            const loadingEl = document.getElementById('app-loading');
            if (loadingEl) {
                loadingEl.style.opacity = '0';
                setTimeout(() => {
                    loadingEl.style.display = 'none';
                }, 300); // Match the CSS transition duration
            }
        }
        // If there IS a currentUser, MainApp will be rendered, and it contains
        // its own logic to hide the spinner only after its async data has finished loading.
    }, [currentUser]);

    const handleLogin = (username: string) => {
        window.localStorage.setItem('financial-organizer-currentUser', username);
        window.localStorage.setItem('financial-organizer-lastUser', username);
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
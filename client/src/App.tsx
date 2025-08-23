import React, { useState, useEffect } from 'react';
import { VideoCall } from './components/VideoCall';
import { ContactList } from './components/ContactList';
import { LoginForm } from './components/LoginForm';
import './App.css';

interface AppState {
  isAuthenticated: boolean;
  currentUser: string | null;
  activeCall: {
    remoteUserId: string;
    isActive: boolean;
  } | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    currentUser: null,
    activeCall: null
  });

  const handleLogin = (userId: string, token: string) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userId', userId);
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      currentUser: userId
    }));
  };

  const handleStartCall = (remoteUserId: string) => {
    setState(prev => ({
      ...prev,
      activeCall: {
        remoteUserId,
        isActive: true
      }
    }));
  };

  const handleEndCall = () => {
    setState(prev => ({
      ...prev,
      activeCall: null
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    setState({
      isAuthenticated: false,
      currentUser: null,
      activeCall: null
    });
  };

  const handleError = (error: string) => {
    console.error('Application error:', error);
    alert(`Ошибка: ${error}`);
  };

  // Check for existing authentication on startup
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (token && userId) {
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentUser: userId
      }));
    }
  }, []);

  if (!state.isAuthenticated) {
    return (
      <div className="app">
        <LoginForm onLogin={handleLogin} onError={handleError} />
      </div>
    );
  }

  if (state.activeCall) {
    return (
      <div className="app">
        <VideoCall
          localUserId={state.currentUser!}
          remoteUserId={state.activeCall.remoteUserId}
          onCallEnd={handleEndCall}
          onError={handleError}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔐 WebRTC E2EE</h1>
        <div className="user-info">
          <span>Пользователь: {state.currentUser}</span>
          <button onClick={handleLogout} className="logout-btn">
            Выйти
          </button>
        </div>
      </header>

      <main className="app-main">
        <ContactList
          currentUserId={state.currentUser!}
          onStartCall={handleStartCall}
          onError={handleError}
        />
      </main>
    </div>
  );
}

export default App;
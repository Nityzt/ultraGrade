import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AppProvider } from './context/AppContext';
import App from './App';
import './index.css';

function AuthLoadingGate({ children }) {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthLoadingGate>
          <AppProvider>
            <App />
          </AppProvider>
        </AuthLoadingGate>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

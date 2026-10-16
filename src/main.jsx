import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import AdminApp from './AdminApp.jsx';
import './styles.css';

function Router() {
  const checkIsAdmin = () =>
    window.location.pathname.startsWith('/admin') ||
    window.location.hash.startsWith('#admin');

  const [isAdmin, setIsAdmin] = useState(checkIsAdmin);

  useEffect(() => {
    const handleRouteChange = () => {
      setIsAdmin(checkIsAdmin());
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  return isAdmin ? <AdminApp /> : <App />;
}

createRoot(document.getElementById('root')).render(<Router />);

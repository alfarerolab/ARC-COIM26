import { useState, useEffect } from 'react';
import { getEsAdmin, api } from './api.js';
import LoginAdmin from './LoginAdmin.jsx';
import PanelAdmin from './PanelAdmin.jsx';

export default function AdminApp() {
  const [autenticado, setAutenticado] = useState(getEsAdmin());

  useEffect(() => {
    setAutenticado(getEsAdmin());
  }, []);

  const handleCerrar = () => {
    api.cerrarAdmin();
    setAutenticado(false);
  };

  return (
    <div className="admin-app-root">
      {autenticado ? (
        <PanelAdmin onCerrarAdmin={handleCerrar} />
      ) : (
        <LoginAdmin onLoginExitoso={() => setAutenticado(true)} />
      )}
    </div>
  );
}

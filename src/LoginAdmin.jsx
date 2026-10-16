import { useState } from 'react';
import { api } from './api.js';
import logoArmada from './images/image.png';

export default function LoginAdmin({ onLoginExitoso }) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [err, setErr] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setCargando(true);
    try {
      await api.validarAdmin(usuario.trim(), clave);
      onLoginExitoso?.();
    } catch (error) {
      setErr(error.message || 'Usuario o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  const irAPublico = () => {
    window.location.href = '/';
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-escudo">
          <img src={logoArmada} alt="Armada de Colombia" />
        </div>
        <div className="admin-login-header">
          <h2>Administración</h2>
          <p>Portal de Control y Monitoreo de Registros</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label>
            Usuario
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ingrese su usuario"
              required
              autoFocus
              autoComplete="username"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>

          {err && (
            <div className="admin-login-error" role="alert">
              {err}
            </div>
          )}

          <button type="submit" disabled={cargando} className="admin-login-btn">
            {cargando ? 'Verificando…' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="admin-login-footer">
          <button type="button" onClick={irAPublico} className="admin-login-link">
            Volver al portal público de formatos
          </button>
        </div>
      </div>
    </div>
  );
}

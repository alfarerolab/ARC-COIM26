import { useState } from 'react';
import { FORMATOS } from './formatos.js';
import Formulario from './Formulario.jsx';
import logoArmada from './images/image.png';

export default function App() {
  const [tipo, setTipo] = useState('encuesta');
  const [version, setVersion] = useState(0);
  const [notificacion, setNotificacion] = useState(null);

  const f = FORMATOS[tipo];

  const handleGuardado = (info) => {
    setVersion((v) => v + 1);
    setNotificacion({
      tipo: 'exito',
      titulo: '¡Encuesta enviada con éxito!',
      mensaje: info?.nombre
        ? `Muchas gracias ${info.nombre}, su respuesta ha sido registrada exitosamente.`
        : 'Muchas gracias por su participación, su encuesta ha sido registrada exitosamente.',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setNotificacion(null), 8000);
  };

  return (
    <div className="app-layout">
      {/* Barra de Navegación Moderna, Dinámica y a la Moda */}
      <header className="navbar-moderno no-print">
        <div className="navbar-container">
          {/* Marca Institucional */}
          <div className="navbar-brand">
            <div className="navbar-logo-wrap">
              <img src={logoArmada} alt="Armada de Colombia" className="navbar-logo" />
            </div>
            <div className="navbar-textos">
              <span className="navbar-subtitulo">ARMADA DE COLOMBIA</span>
              <strong className="navbar-titulo">Acción Integral</strong>
            </div>
          </div>

          {/* Menú de Formatos Interactivo (Pills Dinámicos) — solo formatos públicos */}
          <nav className="navbar-tabs" aria-label="Formatos Institucionales">
            {Object.entries(FORMATOS)
              .filter(([, v]) => !v.soloAdmin)
              .map(([k, v]) => {
              const estaActivo = k === tipo;
              return (
                <button
                  key={k}
                  type="button"
                  className={`navbar-tab-btn ${estaActivo ? 'activo' : ''}`}
                  onClick={() => {
                    if (tipo !== k) {
                      setTipo(k);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  <span className="tab-label">{v.tab}</span>
                  {estaActivo && <span className="tab-indicador-activo" />}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Formulario principal */}
      <main className="main-content">
        {notificacion && (
          <div
            className={`toast-banner toast-${notificacion.tipo} no-print`}
            style={{ maxWidth: '820px', margin: '1rem auto 1.5rem auto' }}
            role="alert"
          >
            <span className="toast-icon">✅</span>
            <div className="toast-text">
              <strong>{notificacion.titulo}</strong>
              <p>{notificacion.mensaje}</p>
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => setNotificacion(null)}
              title="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        )}

        <Formulario
          key={tipo + '-' + version}
          tipo={tipo}
          f={f}
          onGuardado={handleGuardado}
        />
      </main>
    </div>
  );
}

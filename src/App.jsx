import { useState } from 'react';
import { FORMATOS } from './formatos.js';
import Formulario from './Formulario.jsx';
import logoArmada from './images/image.png';

export default function App() {
  const [tipo, setTipo] = useState('encuesta');
  const [version, setVersion] = useState(0);

  const f = FORMATOS[tipo];

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

          {/* Menú de Formatos Interactivo (Pills Dinámicos) */}
          <nav className="navbar-tabs" aria-label="Formatos Institucionales">
            {Object.entries(FORMATOS).map(([k, v]) => {
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
        <Formulario
          key={tipo + '-' + version}
          tipo={tipo}
          f={f}
          onGuardado={() => setVersion((v) => v + 1)}
        />
      </main>
    </div>
  );
}

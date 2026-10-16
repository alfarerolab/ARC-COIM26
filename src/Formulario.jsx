import { useState } from 'react';
import { api } from './api.js';
import logoArmada from './images/image.png';
import FirmaCanvas from './FirmaCanvas.jsx';

const vacio = (f) => ({
  ...Object.fromEntries(f.campos.map((c) => [c.k, ''])),
  calif: {},
  si: {},
  filas: Array.from({ length: f.tabla?.filas || 0 }, () => ({})),
  firmaEncuestado: '',
});

export default function Formulario({ tipo, f, datos, soloLectura, onGuardado }) {
  const [d, setD] = useState(datos || vacio(f));
  const [notificacion, setNotificacion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [modalFirmaFila, setModalFirmaFila] = useState(null);
  const [firmaTemp, setFirmaTemp] = useState('');

  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const setFila = (i, k, v) =>
    setD((x) => ({ ...x, filas: x.filas.map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const setSi = (i, parte) => setD((x) => ({ ...x, si: { ...x.si, [i]: { ...x.si[i], ...parte } } }));

  const abrirModalFirma = (i) => {
    setFirmaTemp(d.filas[i]?.firma || '');
    setModalFirmaFila(i);
  };

  const guardarFirmaModal = () => {
    if (modalFirmaFila !== null) {
      setFila(modalFirmaFila, 'firma', firmaTemp);
      setModalFirmaFila(null);
    }
  };

  async function guardar(e) {
    e.preventDefault();
    setEnviando(true);
    setNotificacion(null);
    try {
      await api.crear(tipo, d);
      setD(vacio(f));
      setNotificacion({
        tipo: 'exito',
        titulo: '¡Registro guardado con éxito!',
        mensaje: 'El formulario se ha reiniciado automáticamente y está listo para diligenciar el siguiente.',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onGuardado?.();
      setTimeout(() => setNotificacion(null), 5000);
    } catch (err) {
      setNotificacion({
        tipo: 'error',
        titulo: 'No se pudo guardar el registro',
        mensaje: err.message,
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="hoja" onSubmit={guardar}>
      {notificacion && (
        <div className={`toast-banner toast-${notificacion.tipo} no-print`} role="alert">
          <span className="toast-icon">{notificacion.tipo === 'exito' ? '✅' : '⚠️'}</span>
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

      <table className="membrete">
        <tbody>
          <tr>
            <td rowSpan="2" className="escudo">
              <img src={logoArmada} alt="Armada de Colombia" className="escudo-img" />
            </td>
            <td colSpan="3" className="titulo">
              {f.titulo}
              {f.subtitulo && <small>{f.subtitulo}</small>}
            </td>
          </tr>
          <tr>
            <td><b>Proceso:</b> {f.proceso}</td>
            <td><b>Autoridad:</b> {f.autoridad}</td>
            <td><b>Código:</b> {f.codigo}<br /><b>Rige desde:</b> {f.vigencia}</td>
          </tr>
        </tbody>
      </table>

      <fieldset disabled={soloLectura}>
        <div className="campos">
          {f.campos.map((c) => (
            <label key={c.k} className={c.span === 2 ? 'ancho' : ''}>
              {c.label}
              {c.type === 'select' ? (
                <select value={d[c.k]} onChange={(e) => set(c.k, e.target.value)}>
                  <option value="">Seleccione…</option>
                  {c.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type={c.type || 'text'} value={d[c.k]} onChange={(e) => set(c.k, e.target.value)} />
              )}
            </label>
          ))}
        </div>

        {f.escala && (
          <section>
            <h3>{f.escalaTitulo}</h3>
            <p className="ayuda">{f.escalaAyuda}</p>
            <div className="tabla-scroll">
              <table className="rejilla">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Consideraciones</th>
                    {f.niveles.map((n, i) => <th key={n}>{i + 1}<br /><small>{n}</small></th>)}
                  </tr>
                </thead>
                <tbody>
                  {f.escala.map((q, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className="pregunta">{q}</td>
                      {f.niveles.map((_, n) => (
                        <td key={n} className="centro">
                          <input
                            type="radio"
                            name={`c${i}`}
                            aria-label={`Pregunta ${i + 1}: ${n + 1}`}
                            checked={d.calif[i] === n + 1}
                            onChange={() => setD((x) => ({ ...x, calif: { ...x.calif, [i]: n + 1 } }))}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {f.siNo && (
          <section>
            <h3>{f.siNoTitulo}</h3>
            <p className="ayuda">{f.siNoAyuda}</p>
            {f.siNo.map((q, i) => (
              <div key={i} className="sino">
                <p>{i + 1}. {q}</p>
                <div className="sino-resp">
                  <label className="inline">
                    <input
                      type="radio"
                      name={`si${i}`}
                      checked={d.si[i]?.resp === 'SI'}
                      onChange={() => setSi(i, { resp: 'SI' })}
                    />
                    Sí
                  </label>
                  <label className="inline">
                    <input
                      type="radio"
                      name={`si${i}`}
                      checked={d.si[i]?.resp === 'NO'}
                      onChange={() => setSi(i, { resp: 'NO' })}
                    />
                    No
                  </label>
                  {d.si[i]?.resp === 'SI' && (
                    <input
                      className="cual"
                      placeholder="Justifique su respuesta…"
                      value={d.si[i]?.detalle || ''}
                      onChange={(e) => setSi(i, { detalle: e.target.value })}
                    />
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {f.tabla && (
          <section>
            <div className="tabla-scroll">
              <table className="rejilla">
                <thead>
                  <tr>
                    <th>No.</th>
                    {f.tabla.cols.map((c) => <th key={c.k}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {d.filas.map((fila, i) => (
                    <tr key={i}>
                      <td className="centro">{i + 1}</td>
                      {f.tabla.cols.map((c) => {
                        // Firma táctil exclusiva para el Listado de Asistencia
                        if (tipo === 'asistencia' && c.k === 'firma') {
                          if (soloLectura) {
                            return (
                              <td key={c.k} className="centro celda-firma">
                                {fila.firma ? (
                                  <img src={fila.firma} alt="Firma" className="firma-tabla-img" />
                                ) : (
                                  <span className="sin-firma">—</span>
                                )}
                              </td>
                            );
                          }
                          return (
                            <td key={c.k} className="centro celda-firma">
                              {fila.firma ? (
                                <div className="firma-miniatura-wrap">
                                  <img src={fila.firma} alt="Firma" className="firma-miniatura" />
                                  <button
                                    type="button"
                                    className="btn-cambiar-firma no-print"
                                    onClick={() => abrirModalFirma(i)}
                                    title="Modificar firma"
                                  >
                                    ✍️
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-borrar-firma no-print"
                                    onClick={() => setFila(i, 'firma', '')}
                                    title="Borrar firma"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-abrir-firma no-print"
                                  onClick={() => abrirModalFirma(i)}
                                >
                                  ✍️ Firmar
                                </button>
                              )}
                            </td>
                          );
                        }

                        // Columna estándar (texto)
                        return (
                          <td key={c.k}>
                            <input
                              aria-label={`${c.label} fila ${i + 1}`}
                              value={fila[c.k] || ''}
                              onChange={(e) => setFila(i, c.k, e.target.value)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!soloLectura && (
              <button
                type="button"
                className="sec no-print"
                onClick={() => set('filas', [...d.filas, {}])}
              >
                Agregar fila
              </button>
            )}
            {f.nota && <p className="nota">{f.nota}</p>}
          </section>
        )}
      </fieldset>

      {/* Firmas institucionales */}
      {f.firmas && (
        <div className="firmas">
          {f.firmas.map((x) => {
            // Firma táctil exclusiva para el encuestado en la Encuesta de satisfacción
            const esFirmaTactilEncuestado = tipo === 'encuesta' && x.toLowerCase().includes('encuestado');

            if (esFirmaTactilEncuestado) {
              return (
                <div key={x} className="firma-bloque-item">
                  {!soloLectura ? (
                    <div className="firma-editor-wrap no-print">
                      <label className="firma-box-title">✍️ Firma digital del encuestado (dibuje con su dedo):</label>
                      <FirmaCanvas
                        ancho={280}
                        alto={120}
                        valorInicial={d.firmaEncuestado}
                        onChange={(v) => set('firmaEncuestado', v)}
                        placeholder="Firme con su dedo aquí"
                      />
                    </div>
                  ) : null}

                  {/* Renderizado de la firma para impresión o visualización */}
                  <div className="firma-preview-espacio">
                    {d.firmaEncuestado ? (
                      <img src={d.firmaEncuestado} alt="Firma encuestado" className="firma-render-img" />
                    ) : (
                      <div className="firma-espacio-blanco" />
                    )}
                  </div>
                  <span className="firma-linea-separador" />
                  <span className="firma-texto-label">{x}</span>
                </div>
              );
            }

            // Firma física tradicional (para suboficial, y para caracterización)
            return (
              <div key={x} className="firma-bloque-item">
                <div className="firma-preview-espacio">
                  <div className="firma-espacio-blanco" />
                </div>
                <span className="firma-linea-separador" />
                <span className="firma-texto-label">{x}</span>
              </div>
            );
          })}
        </div>
      )}

      {!soloLectura && (
        <div className="acciones no-print">
          <button type="submit" className="btn-guardar-principal" disabled={enviando}>
            {enviando ? 'Guardando registro…' : '💾 Guardar registro y continuar'}
          </button>
        </div>
      )}

      {/* Modal táctil de firma para Asistente */}
      {modalFirmaFila !== null && (
        <div className="modal-overlay" onClick={() => setModalFirmaFila(null)}>
          <div className="modal-card modal-firma-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✍️ Firma del Asistente</h3>
              <button type="button" className="modal-close" onClick={() => setModalFirmaFila(null)}>
                ✕
              </button>
            </div>
            <p className="modal-desc">
              {d.filas[modalFirmaFila]?.nombre
                ? `Asistente: ${d.filas[modalFirmaFila].nombre}`
                : `Fila #${modalFirmaFila + 1}`}
            </p>
            <div className="modal-firma-canvas-container">
              <FirmaCanvas
                ancho={320}
                alto={150}
                valorInicial={firmaTemp}
                onChange={(v) => setFirmaTemp(v)}
                placeholder="Firme con su dedo aquí"
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="sec" onClick={() => setModalFirmaFila(null)}>
                Cancelar
              </button>
              <button type="button" onClick={guardarFirmaModal}>
                Guardar Firma
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

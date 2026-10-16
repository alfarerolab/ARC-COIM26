import { useState } from 'react';
import { api } from './api.js';
import logoArmada from './images/image.png';
import FirmaCanvas from './FirmaCanvas.jsx';

const vacio = (f) => ({
  ...Object.fromEntries(f.campos?.map((c) => [c.k, '']) || []),
  calif: {},
  si: {},
  firmaEncuestado: '',
  firma: '',
});

export default function Formulario({ tipo, f, datos, soloLectura, onGuardado }) {
  const [d, setD] = useState(datos || vacio(f));
  const [notificacion, setNotificacion] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const setSi = (i, parte) => setD((x) => ({ ...x, si: { ...x.si, [i]: { ...x.si[i], ...parte } } }));

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

      {/* Membrete Institucional Oficial de la Armada */}
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

      <fieldset disabled={soloLectura} className="formulario-fieldset">
        {/* Renderizado por Secciones (Asistencia y Caracterización) */}
        {f.secciones ? (
          f.secciones.map((sec, sIdx) => (
            <div key={sIdx} className="formulario-seccion-card">
              <div className="formulario-seccion-header">
                <h3 className="formulario-seccion-titulo">{sec.titulo}</h3>
                {sec.descripcion && <p className="formulario-seccion-desc">{sec.descripcion}</p>}
              </div>
              <div className="campos">
                {sec.campos.map((c) => (
                  <label key={c.k} className={c.span === 2 ? 'ancho' : ''}>
                    {c.label}
                    {c.type === 'select' ? (
                      <select value={d[c.k] || ''} onChange={(e) => set(c.k, e.target.value)}>
                        <option value="">Seleccione…</option>
                        {c.options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={c.type || 'text'}
                        placeholder={c.placeholder || ''}
                        value={d[c.k] || ''}
                        onChange={(e) => set(c.k, e.target.value)}
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))
        ) : (
          /* Renderizado tradicional para Encuesta */
          <div className="campos">
            {f.campos.map((c) => (
              <label key={c.k} className={c.span === 2 ? 'ancho' : ''}>
                {c.label}
                {c.type === 'select' ? (
                  <select value={d[c.k] || ''} onChange={(e) => set(c.k, e.target.value)}>
                    <option value="">Seleccione…</option>
                    {c.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={c.type || 'text'}
                    placeholder={c.placeholder || ''}
                    value={d[c.k] || ''}
                    onChange={(e) => set(c.k, e.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
        )}

        {/* Firma digital táctil para Asistencia (campo individual directo en el formulario) */}
        {f.requiereFirmaAsistente && (
          <div className="formulario-seccion-card">
            <div className="formulario-seccion-header">
              <h3 className="formulario-seccion-titulo">Firma Digital del Asistente</h3>
              <p className="formulario-seccion-desc">
                Dibuje su firma directamente en el recuadro con su dedo desde su teléfono móvil o puntero.
              </p>
            </div>
            <div className="firma-individual-wrap">
              {!soloLectura && (
                <div className="firma-editor-container no-print">
                  <FirmaCanvas
                    alto={140}
                    valorInicial={d.firma || ''}
                    onChange={(v) => set('firma', v)}
                    placeholder="Firme con su dedo aquí"
                  />
                </div>
              )}

              {/* Render de la firma para impresión física o visualización en solo lectura */}
              <div className={`firma-bloque-item firma-bloque-asistente ${!soloLectura ? 'only-print' : ''}`}>
                <div className="firma-preview-espacio">
                  {d.firma ? (
                    <img src={d.firma} alt="Firma Asistente" className="firma-render-img" />
                  ) : (
                    <div className="firma-espacio-blanco" />
                  )}
                </div>
                <span className="firma-linea-separador" />
                <span className="firma-texto-label">Firma del Asistente</span>
              </div>
            </div>
          </div>
        )}

        {/* Escala de Satisfacción (Exclusiva para Encuesta) */}
        {f.escala && (
          <section className="seccion-bloque">
            <h3>{f.escalaTitulo}</h3>
            <p className="ayuda">{f.escalaAyuda}</p>
            <div className="tabla-scroll">
              <table className="rejilla">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Consideraciones</th>
                    {f.niveles.map((n, i) => (
                      <th key={n}>{i + 1}<br /><small>{n}</small></th>
                    ))}
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
                            checked={d.calif?.[i] === n + 1}
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

        {/* Preguntas Sí/No (Exclusivas para Encuesta) */}
        {f.siNo && (
          <section className="seccion-bloque">
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
                      checked={d.si?.[i]?.resp === 'SI'}
                      onChange={() => setSi(i, { resp: 'SI' })}
                    />
                    Sí
                  </label>
                  <label className="inline">
                    <input
                      type="radio"
                      name={`si${i}`}
                      checked={d.si?.[i]?.resp === 'NO'}
                      onChange={() => setSi(i, { resp: 'NO' })}
                    />
                    No
                  </label>
                  {d.si?.[i]?.resp === 'SI' && (
                    <input
                      className="cual"
                      placeholder="Justifique su respuesta…"
                      value={d.si?.[i]?.detalle || ''}
                      onChange={(e) => setSi(i, { detalle: e.target.value })}
                    />
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Nota institucional (para Caracterización) */}
        {f.nota && <p className="nota">{f.nota}</p>}
      </fieldset>

      {/* Firmas institucionales (Encuesta y Caracterización) */}
      {f.firmas && (
        <div className="firmas">
          {f.firmas.map((x) => {
            const esFirmaTactilEncuestado = tipo === 'encuesta' && x.toLowerCase().includes('encuestado');

            if (esFirmaTactilEncuestado) {
              return (
                <div key={x} className="firma-bloque-item">
                  {!soloLectura && (
                    <div className="firma-editor-wrap no-print">
                      <label className="firma-box-title">Firma digital del encuestado (dibuje con su dedo):</label>
                      <FirmaCanvas
                        alto={130}
                        valorInicial={d.firmaEncuestado}
                        onChange={(v) => set('firmaEncuestado', v)}
                        placeholder="Firme con su dedo aquí"
                      />
                    </div>
                  )}

                  <div className={`firma-bloque-print-wrap ${!soloLectura ? 'only-print' : ''}`}>
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
                </div>
              );
            }

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

      {/* Botón de Guardado */}
      {!soloLectura && (
        <div className="acciones no-print">
          <button type="submit" className="btn-guardar-principal" disabled={enviando}>
            {enviando ? 'Guardando registro…' : 'Guardar registro y continuar'}
          </button>
        </div>
      )}
    </form>
  );
}

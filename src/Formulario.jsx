import { useState } from 'react';
import { api } from './api.js';

const vacio = (f) => ({
  ...Object.fromEntries(f.campos.map((c) => [c.k, ''])),
  calif: {},
  si: {},
  filas: Array.from({ length: f.tabla?.filas || 0 }, () => ({})),
});

export default function Formulario({ tipo, f, datos, soloLectura, onGuardado }) {
  const [d, setD] = useState(datos || vacio(f));
  const [msg, setMsg] = useState('');
  const [enviando, setEnviando] = useState(false);

  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const setFila = (i, k, v) =>
    setD((x) => ({ ...x, filas: x.filas.map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const setSi = (i, parte) => setD((x) => ({ ...x, si: { ...x.si, [i]: { ...x.si[i], ...parte } } }));

  async function guardar(e) {
    e.preventDefault();
    setEnviando(true);
    setMsg('');
    try {
      await api.crear(tipo, d);
      setD(vacio(f));
      setMsg('Registro guardado.');
      onGuardado?.();
    } catch (err) {
      if (err.message === '401') return onGuardado?.('401');
      setMsg(`No se pudo guardar: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="hoja" onSubmit={guardar}>
      <table className="membrete">
        <tbody>
          <tr>
            <td rowSpan="2" className="escudo">ARMADA<br />DE COLOMBIA</td>
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
              <div className="sino" key={i}>
                <p>{q}</p>
                <div className="sino-resp">
                  {['Sí', 'No'].map((o) => (
                    <label key={o} className="inline">
                      <input type="radio" name={`s${i}`} checked={d.si[i]?.resp === o}
                        onChange={() => setSi(i, { resp: o })} /> {o}
                    </label>
                  ))}
                  {d.si[i]?.resp === 'Sí' && (
                    <input className="cual" placeholder="¿Cuál?" value={d.si[i]?.detalle || ''}
                      onChange={(e) => setSi(i, { detalle: e.target.value })} />
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
                      {f.tabla.cols.map((c) => (
                        <td key={c.k}>
                          <input aria-label={`${c.label} fila ${i + 1}`} value={fila[c.k] || ''}
                            onChange={(e) => setFila(i, c.k, e.target.value)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!soloLectura && (
              <button type="button" className="sec no-print"
                onClick={() => set('filas', [...d.filas, {}])}>
                Agregar fila
              </button>
            )}
            {f.nota && <p className="nota">{f.nota}</p>}
          </section>
        )}
      </fieldset>

      {f.firmas && (
        <div className="firmas">
          {f.firmas.map((x) => <div key={x}><span /> {x}</div>)}
        </div>
      )}

      {!soloLectura && (
        <div className="acciones no-print">
          <button disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar registro'}</button>
          {msg && <span role="status">{msg}</span>}
        </div>
      )}
    </form>
  );
}

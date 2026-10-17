import { useState, useMemo } from 'react';
import { FORMATOS } from './formatos.js';
import Formulario from './Formulario.jsx';
import logoArmada from './images/image.png';

const FILAS_POR_HOJA = 20;

export default function PlanillaOficial({ tipo, registros, onVolver }) {
  const f = FORMATOS[tipo];
  const [filtroEvento, setFiltroEvento] = useState('todos');
  const [folioSeleccionado, setFolioSeleccionado] = useState('todos'); // 'todos' | index (0, 1, 2...)
  const [modoEncuesta, setModoEncuesta] = useState('individual'); // 'individual' | 'matriz'
  const [encuestaIndice, setEncuestaIndice] = useState(0);

  // Extraer todas las filas según formato (encuesta, asistencia, caracterizacion)
  const personas = useMemo(() => {
    const lista = [];

    registros.forEach((r) => {
      const d = r.datos || {};

      if (tipo === 'encuesta') {
        const calif = d.calif || {};
        const vals = Object.values(calif).map(Number).filter((v) => !isNaN(v) && v > 0);
        const promInd = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';

        const item = {
          idRegistro: r.id,
          creado: r.creado,
          eventoKey: d.fecha || 'Jornada General',
          datosEvento: d,
          nombre: d.encuestado || 'Sin nombre',
          encuestado: d.encuestado || 'Sin nombre',
          suboficial: d.suboficial || '—',
          fecha: d.fecha || '—',
          promedio: promInd,
          firma: d.firmaEncuestado || '',
          calif: d.calif || {},
          si: d.si || {},
          ...d,
        };

        for (let i = 0; i < 10; i++) {
          item[`p${i + 1}`] = d.calif?.[i] ? `${d.calif[i]}/5` : '—';
        }

        lista.push(item);
      } else {
        const eventoKey =
          tipo === 'asistencia'
            ? (d.objetivo || d.fecha || 'Evento General')
            : (d.comunidad || d.municipio || 'Jornada General');

        if (Array.isArray(d.filas) && d.filas.length > 0) {
          d.filas.forEach((fi) => {
            if (fi.nombre || fi.cedula || fi.grado) {
              lista.push({
                idRegistro: r.id,
                creado: r.creado,
                eventoKey,
                datosEvento: d,
                ...fi,
              });
            }
          });
        } else if (d.nombre || d.cedula || d.grado) {
          lista.push({
            idRegistro: r.id,
            creado: r.creado,
            eventoKey,
            datosEvento: d,
            ...d,
          });
        }
      }
    });

    return lista;
  }, [registros, tipo]);

  // Lista única de eventos detectados
  const eventosDisponibles = useMemo(() => {
    const setEventos = new Set(personas.map((p) => p.eventoKey));
    return Array.from(setEventos);
  }, [personas]);

  // Personas filtradas según selección de evento
  const personasFiltradas = useMemo(() => {
    if (filtroEvento === 'todos') return personas;
    return personas.filter((p) => p.eventoKey === filtroEvento);
  }, [personas, filtroEvento]);

  // Tomar los datos de encabezado del evento seleccionado o del primer registro disponible
  const datosCabecera = useMemo(() => {
    if (personasFiltradas.length > 0 && personasFiltradas[0].datosEvento) {
      return personasFiltradas[0].datosEvento;
    }
    return {};
  }, [personasFiltradas]);

  // Paginación oficial en folios de máximo 20 filas cada uno
  const folios = useMemo(() => {
    if (personasFiltradas.length === 0) {
      return [
        {
          folioIdx: 0,
          inicioIdx: 0,
          finIdx: 0,
          filas: Array.from({ length: FILAS_POR_HOJA }, () => null),
        },
      ];
    }

    const resultado = [];
    for (let i = 0; i < personasFiltradas.length; i += FILAS_POR_HOJA) {
      const chunk = personasFiltradas.slice(i, i + FILAS_POR_HOJA);
      const totalReales = chunk.length;
      const filasCompletas = [...chunk];
      while (filasCompletas.length < FILAS_POR_HOJA) {
        filasCompletas.push(null);
      }
      resultado.push({
        folioIdx: Math.floor(i / FILAS_POR_HOJA),
        inicioIdx: i + 1,
        finIdx: i + totalReales,
        filas: filasCompletas,
      });
    }
    return resultado;
  }, [personasFiltradas]);

  // Folios que se van a mostrar en pantalla e imprimir
  const foliosVisibles = useMemo(() => {
    if (folioSeleccionado === 'todos') return folios;
    const idx = Number(folioSeleccionado);
    return folios[idx] ? [folios[idx]] : folios;
  }, [folios, folioSeleccionado]);

  // Promedios por pregunta para Encuesta
  const promediosPreguntas = useMemo(() => {
    if (tipo !== 'encuesta') return [];
    return Array.from({ length: 10 }, (_, i) => {
      const vals = personasFiltradas
        .map((p) => Number(p.calif?.[i]))
        .filter((v) => !isNaN(v) && v > 0);
      return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
    });
  }, [personasFiltradas, tipo]);

  // Promedio total para Encuesta
  const promedioTotalEncuesta = useMemo(() => {
    if (tipo !== 'encuesta' || personasFiltradas.length === 0) return null;
    const todos = personasFiltradas.flatMap((p) =>
      Object.values(p.calif || {}).map(Number).filter((v) => !isNaN(v) && v > 0)
    );
    return todos.length > 0 ? (todos.reduce((a, b) => a + b, 0) / todos.length).toFixed(1) : '—';
  }, [personasFiltradas, tipo]);

  // Si es encuesta y está en modo Individual (Formato oficial 1 a 1)
  const encuestaSeleccionada = personasFiltradas[encuestaIndice] || personasFiltradas[0];

  return (
    <div className="admin-planilla-view">
      {/* Barra superior de controles */}
      <div className="barra no-print admin-barra-planilla">
        <button className="sec" onClick={onVolver}>
          Volver al Panel de Registros
        </button>

        <div className="admin-planilla-filtros">
          {/* Si es encuesta, selector entre Formato Individual y Matriz Consolidada */}
          {tipo === 'encuesta' && (
            <div className="admin-toggle-encuesta">
              <button
                type="button"
                className={`admin-filtro-btn ${modoEncuesta === 'individual' ? 'activo' : ''}`}
                onClick={() => setModoEncuesta('individual')}
              >
                Formato Individual Oficial
              </button>
              <button
                type="button"
                className={`admin-filtro-btn ${modoEncuesta === 'matriz' ? 'activo' : ''}`}
                onClick={() => setModoEncuesta('matriz')}
              >
                Matriz Consolidada
              </button>
            </div>
          )}

          {/* Selector de encuestado individual */}
          {tipo === 'encuesta' && modoEncuesta === 'individual' && personasFiltradas.length > 0 && (
            <label className="admin-planilla-select-label">
              Encuestado:
              <select
                value={encuestaIndice}
                onChange={(e) => setEncuestaIndice(Number(e.target.value))}
                className="admin-select-evento"
              >
                {personasFiltradas.map((p, idx) => (
                  <option key={p.idRegistro || idx} value={idx}>
                    #{idx + 1} - {p.encuestado || p.nombre} ({p.fecha || 'Sin fecha'})
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Selector de actividad / fecha si existen múltiples */}
          {eventosDisponibles.length > 1 && (
            <label className="admin-planilla-select-label">
              Actividad:
              <select
                value={filtroEvento}
                onChange={(e) => {
                  setFiltroEvento(e.target.value);
                  setFolioSeleccionado('todos');
                  setEncuestaIndice(0);
                }}
                className="admin-select-evento"
              >
                <option value="todos">Todas las actividades ({personas.length})</option>
                {eventosDisponibles.map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Selector de Folio (Para Asistencia, Caracterización o Matriz) */}
          {(tipo !== 'encuesta' || modoEncuesta === 'matriz') && (
            <label className="admin-planilla-select-label">
              Paginación (Folios de 20):
              <select
                value={folioSeleccionado}
                onChange={(e) => setFolioSeleccionado(e.target.value)}
                className="admin-select-evento"
              >
                <option value="todos">Ver Todos los Folios ({folios.length} hojas para imprimir)</option>
                {folios.map((fol) => (
                  <option key={fol.folioIdx} value={fol.folioIdx}>
                    Folio {fol.folioIdx + 1} de {folios.length} (Filas {fol.inicioIdx} a {fol.finIdx})
                  </option>
                ))}
              </select>
            </label>
          )}

          <span className="badge-tipo badge-asistencia">
            {tipo === 'encuesta' && modoEncuesta === 'individual'
              ? `Encuesta ${encuestaIndice + 1} de ${personasFiltradas.length}`
              : `Total: ${personasFiltradas.length} personas en ${folios.length} folios (máx 20 por hoja)`}
          </span>
        </div>

        <button onClick={() => window.print()} className="btn-imprimir-planilla">
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* RENDERIZADO: Modo Encuesta Individual (Formato Oficial 1 a 1) */}
      {tipo === 'encuesta' && modoEncuesta === 'individual' && encuestaSeleccionada && (
        <div className="admin-folio-wrap">
          <div className="admin-folio-etiqueta no-print">
            Encuesta Oficial Individual #{encuestaIndice + 1} de {personasFiltradas.length} • Beneficiario: {encuestaSeleccionada.encuestado || encuestaSeleccionada.nombre}
          </div>
          <Formulario
            tipo="encuesta"
            f={FORMATOS.encuesta}
            datos={encuestaSeleccionada.datosEvento || encuestaSeleccionada}
            soloLectura
          />
        </div>
      )}

      {/* RENDERIZADO: Planillas de Asistencia, Caracterización o Matriz de Encuestas (Paginadas en Folios de 20) */}
      {(tipo !== 'encuesta' || modoEncuesta === 'matriz') && (
        <div className="admin-folios-contenedor">
          {foliosVisibles.map((fol) => {
            const numeroBase = fol.folioIdx * FILAS_POR_HOJA;

            return (
              <div key={fol.folioIdx} className="admin-folio-wrap">
                {/* Etiqueta visual informativa en pantalla */}
                <div className="admin-folio-etiqueta no-print">
                  Folio {fol.folioIdx + 1} de {folios.length} • Registros {fol.inicioIdx} al {fol.finIdx} (Máximo 20 por planilla oficial)
                </div>

                {/* Hoja física oficial individual con salto de página para impresión */}
                <div className="hoja hoja-planilla-imprimible hoja-folio-imprimible">
                  {/* Membrete Oficial Armada */}
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
                        <td>
                          <b>Código:</b> {f.codigo}<br />
                          <b>Rige desde:</b> {f.vigencia}<br />
                          <b>Folio:</b> Página {fol.folioIdx + 1} de {folios.length}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Encabezado del Formato según tipo */}
                  {tipo === 'asistencia' && (
                    <div className="planilla-resumen-evento">
                      <table className="tabla-cabecera-evento">
                        <tbody>
                          <tr>
                            <td colSpan="2">
                              <b>Objetivo:</b> {datosCabecera.objetivo || 'Reunión / Capacitación Institucional'}
                            </td>
                          </tr>
                          <tr>
                            <td><b>Moderador:</b> {datosCabecera.moderador || '—'}</td>
                            <td><b>Guarnición / Unidad:</b> {datosCabecera.guarnicion || '—'}</td>
                          </tr>
                          <tr>
                            <td>
                              <b>Tipo:</b> {datosCabecera.tipo || '—'}{' '}
                              {datosCabecera.cual ? `(${datosCabecera.cual})` : ''}
                            </td>
                            <td>
                              <b>Fecha:</b> {datosCabecera.fecha || '—'} &nbsp;|&nbsp;{' '}
                              <b>Hora:</b> {datosCabecera.hora || '—'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {tipo === 'caracterizacion' && (
                    <div className="planilla-resumen-evento">
                      <table className="tabla-cabecera-evento">
                        <tbody>
                          <tr>
                            <td><b>Comunidad:</b> {datosCabecera.comunidad || '—'}</td>
                            <td><b>Municipio:</b> {datosCabecera.municipio || '—'}</td>
                            <td><b>Departamento:</b> {datosCabecera.departamento || '—'}</td>
                          </tr>
                          <tr>
                            <td><b>Fechas de la JAD:</b> {datosCabecera.fechas || '—'}</td>
                            <td colSpan="2"><b>Unidad militar que lidera:</b> {datosCabecera.unidad || '—'}</td>
                          </tr>
                          <tr>
                            <td colSpan="3">
                              <b>Encargado Acción Integral:</b> {datosCabecera.encargado || '—'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {tipo === 'encuesta' && (
                    <div className="planilla-resumen-evento">
                      <table className="tabla-cabecera-evento">
                        <tbody>
                          <tr>
                            <td colSpan="2">
                              <b>Campaña / Jornada:</b> CAMPAÑAS NAVEGANDO – CAMPAÑAS BINACIONALES Y JORNADA DE APOYO AL DESARROLLO (CAD-CADB-JAD)
                            </td>
                          </tr>
                          <tr>
                            <td><b>Suboficial de Acción Integral y Desarrollo:</b> {datosCabecera.suboficial || '—'}</td>
                            <td><b>Fecha de Evaluación:</b> {datosCabecera.fecha || '—'}</td>
                          </tr>
                          <tr>
                            <td><b>Encuestas en este Folio:</b> {fol.finIdx - fol.inicioIdx + 1} de {personasFiltradas.length} totales</td>
                            <td>
                              <b>Índice Promedio de Satisfacción:</b>{' '}
                              <strong>{promedioTotalEncuesta ? `${promedioTotalEncuesta} / 5.0` : 'Sin calificaciones'}</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Rejilla Oficial Consolidada de 20 Filas Exactas */}
                  <div className="tabla-scroll">
                    <table className="rejilla rejilla-oficial-consolidada">
                      <thead>
                        <tr>
                          <th className="th-num">No.</th>
                          {f.tablaConsolidada?.cols.map((c) => (
                            <th key={c.k} style={c.k.startsWith('p') ? { width: '42px', textAlign: 'center' } : {}}>
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fol.filas.map((p, rIdx) => {
                          const numeroFila = numeroBase + rIdx + 1;

                          return (
                            <tr key={rIdx}>
                              <td className="centro celda-num">{numeroFila}</td>
                              {f.tablaConsolidada?.cols.map((c) => {
                                if (c.k === 'firma') {
                                  return (
                                    <td key={c.k} className="centro celda-firma">
                                      {p?.firma ? (
                                        <img src={p.firma} alt="Firma" className="firma-tabla-img" />
                                      ) : (
                                        <span className="sin-firma-linea" />
                                      )}
                                    </td>
                                  );
                                }
                                const val = p ? p[c.k] : '';
                                const esCentro = c.k.startsWith('p') || c.k === 'promedio';
                                return (
                                  <td key={c.k} className={`celda-dato ${esCentro ? 'centro' : ''}`}>
                                    {val}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                      {tipo === 'encuesta' && fol.folioIdx === folios.length - 1 && personasFiltradas.length > 0 && (
                        <tfoot>
                          <tr style={{ background: '#eef2f6', fontWeight: 'bold' }}>
                            <td colSpan="2" className="centro">PROMEDIO INSTITUCIONAL:</td>
                            {promediosPreguntas.map((prom, pIdx) => (
                              <td key={pIdx} className="centro" style={{ color: 'var(--marino)' }}>
                                {prom}
                              </td>
                            ))}
                            <td className="centro" style={{ color: 'var(--marino)', fontWeight: '800' }}>
                              {promedioTotalEncuesta}
                            </td>
                            <td className="centro">—</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* Guía abreviada de preguntas para Encuesta */}
                  {tipo === 'encuesta' && (
                    <div className="guia-preguntas-encuesta">
                      <strong>Preguntas Evaluadas (Escala 1 a 5: Malo a Excelente):</strong>
                      <ol className="lista-preguntas-guia">
                        {f.escala.map((q, qIdx) => (
                          <li key={qIdx}>
                            <b>P{qIdx + 1}:</b> {q}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Nota institucional para caracterización */}
                  {f.nota && <p className="nota">{f.nota}</p>}

                  {/* Firmas institucionales al pie de cada hoja oficial */}
                  {tipo === 'asistencia' && (
                    <div className="firmas">
                      <div className="firma-bloque-item">
                        <div className="firma-preview-espacio">
                          <div className="firma-espacio-blanco" />
                        </div>
                        <span className="firma-linea-separador" />
                        <span className="firma-texto-label">Firma del Moderador / Responsable</span>
                      </div>
                      <div className="firma-bloque-item">
                        <div className="firma-preview-espacio">
                          <div className="firma-espacio-blanco" />
                        </div>
                        <span className="firma-linea-separador" />
                        <span className="firma-texto-label">Firma Jefe Acción Integral y Desarrollo</span>
                      </div>
                    </div>
                  )}

                  {tipo === 'caracterizacion' && f.firmas && (
                    <div className="firmas">
                      {f.firmas.map((x) => (
                        <div key={x} className="firma-bloque-item">
                          <div className="firma-preview-espacio">
                            <div className="firma-espacio-blanco" />
                          </div>
                          <span className="firma-linea-separador" />
                          <span className="firma-texto-label">{x}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {tipo === 'encuesta' && (
                    <div className="firmas">
                      <div className="firma-bloque-item">
                        <div className="firma-preview-espacio">
                          <div className="firma-espacio-blanco" />
                        </div>
                        <span className="firma-linea-separador" />
                        <span className="firma-texto-label">Firma Suboficial de Acción Integral y Desarrollo</span>
                      </div>
                      <div className="firma-bloque-item">
                        <div className="firma-preview-espacio">
                          <div className="firma-espacio-blanco" />
                        </div>
                        <span className="firma-linea-separador" />
                        <span className="firma-texto-label">Firma Comandante de Unidad / JACID</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

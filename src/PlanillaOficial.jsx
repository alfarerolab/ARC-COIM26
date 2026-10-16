import { useState, useMemo } from 'react';
import { FORMATOS } from './formatos.js';
import logoArmada from './images/image.png';

export default function PlanillaOficial({ tipo, registros, onVolver }) {
  const f = FORMATOS[tipo];
  const [filtroEvento, setFiltroEvento] = useState('todos');

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

        // Asignar P1 a P10
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

  // Personas filtradas según selección
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

  // Asegurar un mínimo de filas visibles (ej. 15) para que parezca una planilla oficial completa
  const totalFilasMinimo = Math.max(15, personasFiltradas.length);
  const filasCompletas = Array.from({ length: totalFilasMinimo }, (_, i) => personasFiltradas[i] || null);

  return (
    <div className="admin-planilla-view">
      {/* Barra superior de controles */}
      <div className="barra no-print admin-barra-planilla">
        <button className="sec" onClick={onVolver}>
          Volver al Panel de Registros
        </button>

        <div className="admin-planilla-filtros">
          {eventosDisponibles.length > 1 && (
            <label className="admin-planilla-select-label">
              Filtrar por actividad o fecha:
              <select
                value={filtroEvento}
                onChange={(e) => setFiltroEvento(e.target.value)}
                className="admin-select-evento"
              >
                <option value="todos">Todos los registros ({personas.length})</option>
                {eventosDisponibles.map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span className="badge-tipo badge-asistencia">
            Total Registros: {personasFiltradas.length}
          </span>
          {tipo === 'encuesta' && promedioTotalEncuesta && (
            <span className="badge-tipo badge-encuesta">
              Promedio General: {promedioTotalEncuesta} / 5.0
            </span>
          )}
        </div>

        <button onClick={() => window.print()} className="btn-imprimir-planilla">
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Hoja Institucional con Membrete y Rejilla Oficial */}
      <div className="hoja hoja-planilla-imprimible">
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
              <td><b>Código:</b> {f.codigo}<br /><b>Rige desde:</b> {f.vigencia}</td>
            </tr>
          </tbody>
        </table>

        {/* Encabezado del Formato según tipo */}
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
                  <td><b>Total Encuestados Evaluados:</b> {personasFiltradas.length} beneficiarios</td>
                  <td>
                    <b>Índice Promedio de Satisfacción:</b>{' '}
                    <strong>{promedioTotalEncuesta ? `${promedioTotalEncuesta} / 5.0` : 'Sin calificaciones'}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

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

        {/* Rejilla Oficial Consolidada con Filas */}
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
              {filasCompletas.map((p, idx) => (
                <tr key={idx}>
                  <td className="centro celda-num">{idx + 1}</td>
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
              ))}
            </tbody>
            {/* Fila de Promedios Generales por Pregunta para Encuesta */}
            {tipo === 'encuesta' && personasFiltradas.length > 0 && (
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

        {/* Guía abreviada de preguntas P1 a P10 para Encuesta (en impresión oficial) */}
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

        {/* Firmas institucionales inferiores */}
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
      </div>
    </div>
  );
}

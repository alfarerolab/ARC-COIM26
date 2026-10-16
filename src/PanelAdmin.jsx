import { useState, useEffect, useMemo } from 'react';
import { FORMATOS } from './formatos.js';
import Formulario from './Formulario.jsx';
import { api } from './api.js';
import logoArmada from './images/image.png';

function aCSV(f, regs) {
  const filas = [];
  for (const r of regs) {
    const d = r.datos;
    const base = { id: r.id, creado: r.creado, ...Object.fromEntries(f.campos.map((c) => [c.label, d[c.k] || ''])) };
    if (f.escala) {
      const o = { ...base };
      f.escala.forEach((_, i) => (o[`P${i + 1}`] = d.calif?.[i] || ''));
      f.siNo.forEach((_, i) => {
        o[`S${i + 1}`] = d.si?.[i]?.resp || '';
        o[`S${i + 1} detalle`] = d.si?.[i]?.detalle || '';
      });
      filas.push(o);
    } else {
      (d.filas || []).forEach((fi, n) => {
        if (!f.tabla.cols.some((c) => fi[c.k])) return;
        filas.push({ ...base, No: n + 1, ...Object.fromEntries(f.tabla.cols.map((c) => [c.label, fi[c.k] || ''])) });
      });
    }
  }
  const cols = [...new Set(filas.flatMap(Object.keys))];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return '\uFEFF' + [cols.map(esc).join(','), ...filas.map((o) => cols.map((c) => esc(o[c])).join(','))].join('\n');
}

function descargarCSV(nombre, texto) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }));
  a.download = nombre;
  a.click();
}

export default function PanelAdmin({ onVolver, onCerrarAdmin }) {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [registroDetalle, setRegistroDetalle] = useState(null);

  const cargarRegistros = async () => {
    setCargando(true);
    setError('');
    try {
      const data = await api.listar('todos');
      setRegistros(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar los registros');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRegistros();
  }, []);

  const borrarRegistro = async (id, e) => {
    e.stopPropagation();
    if (!confirm(`¿Está seguro de eliminar el registro #${id} de forma permanente?`)) return;
    try {
      await api.borrar(id);
      setRegistros((prev) => prev.filter((r) => r.id !== id));
      if (registroDetalle?.id === id) setRegistroDetalle(null);
    } catch (err) {
      alert(`Error al borrar: ${err.message}`);
    }
  };

  // Métricas
  const metricas = useMemo(() => {
    const total = registros.length;
    const encuestas = registros.filter((r) => r.tipo === 'encuesta');
    const asistencias = registros.filter((r) => r.tipo === 'asistencia');
    const caracterizaciones = registros.filter((r) => r.tipo === 'caracterizacion');

    // Promedio de satisfacción en encuestas (escala 1 a 5)
    let sumaCalif = 0;
    let totalCalif = 0;
    encuestas.forEach((e) => {
      if (e.datos?.calif) {
        Object.values(e.datos.calif).forEach((val) => {
          const num = Number(val);
          if (!isNaN(num) && num > 0) {
            sumaCalif += num;
            totalCalif++;
          }
        });
      }
    });
    const promSatisfaccion = totalCalif > 0 ? (sumaCalif / totalCalif).toFixed(1) : null;

    // Total personas en asistencias
    let totalAsistentes = 0;
    asistencias.forEach((a) => {
      const filas = a.datos?.filas || [];
      const conDatos = filas.filter((fi) => fi.nombre || fi.cedula || fi.grado);
      totalAsistentes += conDatos.length;
    });

    // Total personas caracterizadas
    let totalPersonasCarac = 0;
    caracterizaciones.forEach((c) => {
      const filas = c.datos?.filas || [];
      const conDatos = filas.filter((fi) => fi.nombre || fi.cedula);
      totalPersonasCarac += conDatos.length;
    });

    return {
      total,
      encuestasCount: encuestas.length,
      asistenciasCount: asistencias.length,
      caracterizacionesCount: caracterizaciones.length,
      promSatisfaccion,
      totalAsistentes,
      totalPersonasCarac,
    };
  }, [registros]);

  // Filtrado y búsqueda
  const registrosFiltrados = useMemo(() => {
    return registros.filter((r) => {
      if (filtroTipo !== 'todos' && r.tipo !== filtroTipo) return false;
      if (!busqueda.trim()) return true;

      const q = busqueda.toLowerCase();
      const f = FORMATOS[r.tipo];
      const d = r.datos || {};

      // Búsqueda en campos principales
      const resumen = String(d[f?.resumen] || '').toLowerCase();
      const fecha = String(d.fecha || '').toLowerCase();
      const creado = new Date(r.creado).toLocaleString('es-CO').toLowerCase();
      const id = String(r.id);

      if (id.includes(q) || resumen.includes(q) || fecha.includes(q) || creado.includes(q)) return true;

      // Búsqueda en subcampos (comunidad, municipio, moderador, suboficial, etc.)
      const textoCampos = Object.values(d)
        .filter((v) => typeof v === 'string')
        .join(' ')
        .toLowerCase();
      if (textoCampos.includes(q)) return true;

      // Búsqueda en filas de tablas (asistentes, caracterizados)
      if (Array.isArray(d.filas)) {
        const textoFilas = d.filas
          .map((fi) => Object.values(fi).join(' '))
          .join(' ')
          .toLowerCase();
        if (textoFilas.includes(q)) return true;
      }

      return false;
    });
  }, [registros, filtroTipo, busqueda]);

  const descargarCSVFormato = (tipo) => {
    const regs = registros.filter((r) => r.tipo === tipo);
    if (regs.length === 0) return alert('No hay registros de este formato para exportar.');
    const f = FORMATOS[tipo];
    descargarCSV(`${tipo}_consolidado.csv`, aCSV(f, regs));
  };

  // Vista de detalle / impresión
  if (registroDetalle) {
    const f = FORMATOS[registroDetalle.tipo];
    return (
      <div className="admin-detalle-view">
        <div className="barra no-print admin-barra-detalle">
          <button className="sec" onClick={() => setRegistroDetalle(null)}>
            ← Volver al Panel Administrador
          </button>
          <div className="admin-detalle-meta">
            <span className={`badge-tipo badge-${registroDetalle.tipo}`}>{f.tab}</span>
            <small>ID #{registroDetalle.id} • {new Date(registroDetalle.creado).toLocaleString('es-CO')}</small>
          </div>
          <button onClick={() => window.print()}>🖨️ Imprimir o guardar PDF</button>
        </div>
        <Formulario tipo={registroDetalle.tipo} f={f} datos={registroDetalle.datos} soloLectura />
      </div>
    );
  }

  return (
    <div className="admin-panel">
      {/* Encabezado del Panel */}
      <header className="admin-header">
        <div className="admin-header-brand">
          <img src={logoArmada} alt="Armada de Colombia" className="admin-logo" />
          <div>
            <h1>Panel de Administrador</h1>
            <p>Monitoreo, métricas y consulta de todos los registros institucionales</p>
          </div>
        </div>
        <div className="admin-header-actions no-print">
          <button className="sec" onClick={cargarRegistros} title="Recargar datos">
            🔄 Actualizar
          </button>
          <button className="sec" onClick={() => (window.location.href = '/')} title="Ver el portal público de formatos">
            📋 Ir al Portal Público
          </button>
          <button className="peligro" onClick={onCerrarAdmin} title="Cerrar sesión de administrador">
            🔒 Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Tarjetas de Métricas (KPIs) */}
      <section className="admin-kpis">
        <div className="kpi-card kpi-total">
          <div className="kpi-icon">📁</div>
          <div className="kpi-info">
            <span className="kpi-label">Total de Registros</span>
            <strong className="kpi-value">{metricas.total}</strong>
            <span className="kpi-sub">En los 3 formatos</span>
          </div>
        </div>

        <div className="kpi-card kpi-encuesta">
          <div className="kpi-icon">⭐</div>
          <div className="kpi-info">
            <span className="kpi-label">Encuestas de Satisfacción</span>
            <strong className="kpi-value">{metricas.encuestasCount}</strong>
            <span className="kpi-sub">
              {metricas.promSatisfaccion ? `Promedio: ${metricas.promSatisfaccion} / 5.0` : 'Sin calificaciones'}
            </span>
          </div>
        </div>

        <div className="kpi-card kpi-asistencia">
          <div className="kpi-icon">👥</div>
          <div className="kpi-info">
            <span className="kpi-label">Listados de Asistencia</span>
            <strong className="kpi-value">{metricas.asistenciasCount}</strong>
            <span className="kpi-sub">{metricas.totalAsistentes} personas registradas</span>
          </div>
        </div>

        <div className="kpi-card kpi-caracterizacion">
          <div className="kpi-icon">📋</div>
          <div className="kpi-info">
            <span className="kpi-label">Caracterizaciones</span>
            <strong className="kpi-value">{metricas.caracterizacionesCount}</strong>
            <span className="kpi-sub">{metricas.totalPersonasCarac} profesionales / personal</span>
          </div>
        </div>
      </section>

      {/* Controles de Búsqueda y Exportación */}
      <section className="admin-toolbar">
        <div className="admin-busqueda-wrap">
          <span className="admin-search-icon">🔍</span>
          <input
            type="search"
            className="admin-input-busqueda"
            placeholder="Buscar por encuestado, cédula, comunidad, moderador, fecha..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button className="admin-btn-clear" onClick={() => setBusqueda('')} title="Limpiar búsqueda">
              ✕
            </button>
          )}
        </div>

        <div className="admin-filtros-tipo">
          <button
            className={`admin-filtro-btn ${filtroTipo === 'todos' ? 'activo' : ''}`}
            onClick={() => setFiltroTipo('todos')}
          >
            Todos ({registros.length})
          </button>
          <button
            className={`admin-filtro-btn ${filtroTipo === 'encuesta' ? 'activo' : ''}`}
            onClick={() => setFiltroTipo('encuesta')}
          >
            Encuestas ({metricas.encuestasCount})
          </button>
          <button
            className={`admin-filtro-btn ${filtroTipo === 'asistencia' ? 'activo' : ''}`}
            onClick={() => setFiltroTipo('asistencia')}
          >
            Asistencias ({metricas.asistenciasCount})
          </button>
          <button
            className={`admin-filtro-btn ${filtroTipo === 'caracterizacion' ? 'activo' : ''}`}
            onClick={() => setFiltroTipo('caracterizacion')}
          >
            Caracterizaciones ({metricas.caracterizacionesCount})
          </button>
        </div>

        <div className="admin-exportar-wrap">
          <span className="admin-export-label">Exportar CSV:</span>
          <button className="sec admin-btn-csv" onClick={() => descargarCSVFormato('encuesta')}>
            Encuestas
          </button>
          <button className="sec admin-btn-csv" onClick={() => descargarCSVFormato('asistencia')}>
            Asistencias
          </button>
          <button className="sec admin-btn-csv" onClick={() => descargarCSVFormato('caracterizacion')}>
            Caracterizaciones
          </button>
        </div>
      </section>

      {/* Estado de Carga y Errores */}
      {error && <p className="admin-alert-error" role="alert">⚠️ {error}</p>}
      {cargando && <p className="admin-loading">Cargando registros del sistema…</p>}

      {/* Tabla Unificada de Registros */}
      {!cargando && !error && (
        <section className="admin-table-container">
          <div className="admin-table-header">
            <h3>Registros en el sistema ({registrosFiltrados.length})</h3>
            {busqueda && <small>Filtrados por: «{busqueda}»</small>}
          </div>

          {registrosFiltrados.length === 0 ? (
            <div className="admin-vacio">
              <p>No se encontraron registros {busqueda ? 'con los términos de búsqueda.' : 'en esta sección.'}</p>
            </div>
          ) : (
            <div className="tabla-scroll">
              <table className="admin-tabla">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tipo de Formato</th>
                    <th>Identificador / Título</th>
                    <th>Detalles clave</th>
                    <th>Fecha de Actividad</th>
                    <th>Fecha de Registro</th>
                    <th className="centro">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.map((r) => {
                    const f = FORMATOS[r.tipo] || {};
                    const d = r.datos || {};
                    const tituloPrincipal = d[f.resumen] || 'Sin título';

                    // Resumen secundario según tipo
                    let detalleClave = '';
                    if (r.tipo === 'encuesta') {
                      detalleClave = d.suboficial ? `Suboficial: ${d.suboficial}` : 'CAD / JAD';
                    } else if (r.tipo === 'asistencia') {
                      const total = (d.filas || []).filter((fi) => fi.nombre || fi.cedula).length;
                      detalleClave = `${d.guarnicion || 'Sin guarnición'} • ${total} asistentes`;
                    } else if (r.tipo === 'caracterizacion') {
                      const total = (d.filas || []).filter((fi) => fi.nombre || fi.cedula).length;
                      detalleClave = `${d.municipio || ''} (${d.departamento || ''}) • ${total} personas`;
                    }

                    return (
                      <tr key={r.id} onClick={() => setRegistroDetalle(r)} className="admin-fila-clickable">
                        <td className="admin-td-id">#{r.id}</td>
                        <td>
                          <span className={`badge-tipo badge-${r.tipo}`}>
                            {f.tab || r.tipo}
                          </span>
                        </td>
                        <td className="admin-td-titulo">
                          <strong>{tituloPrincipal}</strong>
                        </td>
                        <td className="admin-td-detalle">
                          <small>{detalleClave}</small>
                        </td>
                        <td>{d.fecha || d.fechas || '—'}</td>
                        <td>
                          <small>{new Date(r.creado).toLocaleString('es-CO')}</small>
                        </td>
                        <td className="centro no-print" onClick={(e) => e.stopPropagation()}>
                          <div className="admin-acciones-td">
                            <button
                              className="sec admin-btn-action"
                              onClick={() => setRegistroDetalle(r)}
                              title="Abrir e imprimir formato oficial"
                            >
                              👁️ Ver
                            </button>
                            <button
                              className="peligro admin-btn-action"
                              onClick={(e) => borrarRegistro(r.id, e)}
                              title="Eliminar permanentemente"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

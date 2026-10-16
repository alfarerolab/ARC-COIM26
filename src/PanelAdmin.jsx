import { useState, useEffect, useMemo } from 'react';
import { FORMATOS } from './formatos.js';
import Formulario from './Formulario.jsx';
import PlanillaOficial from './PlanillaOficial.jsx';
import { api } from './api.js';
import logoArmada from './images/image.png';

function aCSV(f, regs, tipo) {
  const filas = [];
  for (const r of regs) {
    const d = r.datos || {};
    const base = {
      ID: r.id,
      'Fecha Registro': new Date(r.creado).toLocaleString('es-CO'),
    };

    if (tipo === 'encuesta') {
      const o = {
        ...base,
        Fecha: d.fecha || '',
        Encuestado: d.encuestado || '',
        Suboficial: d.suboficial || '',
        'Firma Encuestado': d.firmaEncuestado ? 'Registrada' : 'Sin firma',
      };
      f.escala?.forEach((_, i) => (o[`Pregunta ${i + 1}`] = d.calif?.[i] || ''));
      f.siNo?.forEach((_, i) => {
        o[`Oportunidad ${i + 1} Resp`] = d.si?.[i]?.resp || '';
        o[`Oportunidad ${i + 1} Detalle`] = d.si?.[i]?.detalle || '';
      });
      filas.push(o);
    } else if (tipo === 'asistencia') {
      if (Array.isArray(d.filas) && d.filas.length > 0) {
        d.filas.forEach((fi, n) => {
          if (!fi.nombre && !fi.cedula && !fi.grado) return;
          filas.push({
            ...base,
            No: n + 1,
            Objetivo: d.objetivo || '',
            Moderador: d.moderador || '',
            Guarnición: d.guarnicion || '',
            Tipo: d.tipo || '',
            Fecha: d.fecha || '',
            Hora: d.hora || '',
            Grado: fi.grado || '',
            'Apellidos y nombres': fi.nombre || '',
            Dependencia: fi.dependencia || '',
            Cédula: fi.cedula || '',
            Celular: fi.celular || '',
            Correo: fi.correo || '',
            Firma: fi.firma ? 'Registrada' : 'Sin firma',
          });
        });
      } else {
        filas.push({
          ...base,
          Objetivo: d.objetivo || '',
          Moderador: d.moderador || '',
          Guarnición: d.guarnicion || '',
          Tipo: d.tipo || '',
          Fecha: d.fecha || '',
          Hora: d.hora || '',
          Grado: d.grado || '',
          'Apellidos y nombres': d.nombre || '',
          Dependencia: d.dependencia || '',
          Cédula: d.cedula || '',
          Celular: d.celular || '',
          Correo: d.correo || '',
          Firma: d.firma ? 'Registrada' : 'Sin firma',
        });
      }
    } else if (tipo === 'caracterizacion') {
      if (Array.isArray(d.filas) && d.filas.length > 0) {
        d.filas.forEach((fi, n) => {
          if (!fi.nombre && !fi.cedula) return;
          filas.push({
            ...base,
            No: n + 1,
            Comunidad: d.comunidad || '',
            Municipio: d.municipio || '',
            Departamento: d.departamento || '',
            Fechas: d.fechas || '',
            Unidad: d.unidad || '',
            Encargado: d.encargado || '',
            'Nombres y apellidos': fi.nombre || '',
            Cédula: fi.cedula || '',
            'Tarjeta profesional': fi.tarjeta || '',
            Especialidad: fi.especialidad || '',
            Servicios: fi.servicios || '',
            Entidad: fi.entidad || '',
            'G.S.-RH': fi.gsrh || '',
            EPS: fi.eps || '',
            Celular: fi.celular || '',
          });
        });
      } else {
        filas.push({
          ...base,
          Comunidad: d.comunidad || '',
          Municipio: d.municipio || '',
          Departamento: d.departamento || '',
          Fechas: d.fechas || '',
          Unidad: d.unidad || '',
          Encargado: d.encargado || '',
          'Nombres y apellidos': d.nombre || '',
          Cédula: d.cedula || '',
          'Tarjeta profesional': d.tarjeta || '',
          Especialidad: d.especialidad || '',
          Servicios: d.servicios || '',
          Entidad: d.entidad || '',
          'G.S.-RH': d.gsrh || '',
          EPS: d.eps || '',
          Celular: d.celular || '',
        });
      }
    }
  }
  if (filas.length === 0) return '';
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
  const [vistaPlanilla, setVistaPlanilla] = useState(null);

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
      const d = a.datos || {};
      if (Array.isArray(d.filas) && d.filas.length > 0) {
        const conDatos = d.filas.filter((fi) => fi.nombre || fi.cedula || fi.grado);
        totalAsistentes += conDatos.length;
      } else if (d.nombre || d.cedula || d.grado) {
        totalAsistentes += 1;
      }
    });

    // Total personas en caracterizaciones
    let totalPersonasCarac = 0;
    caracterizaciones.forEach((c) => {
      const d = c.datos || {};
      if (Array.isArray(d.filas) && d.filas.length > 0) {
        const conDatos = d.filas.filter((fi) => fi.nombre || fi.cedula);
        totalPersonasCarac += conDatos.length;
      } else if (d.nombre || d.cedula) {
        totalPersonasCarac += 1;
      }
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

      const resumen = String(d[f?.resumen] || '').toLowerCase();
      const nombre = String(d.nombre || '').toLowerCase();
      const cedula = String(d.cedula || '').toLowerCase();
      const fecha = String(d.fecha || d.fechas || '').toLowerCase();
      const objetivo = String(d.objetivo || d.comunidad || '').toLowerCase();
      const grado = String(d.grado || '').toLowerCase();
      const id = String(r.id);

      if (
        resumen.includes(q) ||
        nombre.includes(q) ||
        cedula.includes(q) ||
        fecha.includes(q) ||
        objetivo.includes(q) ||
        grado.includes(q) ||
        id.includes(q)
      ) {
        return true;
      }

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
    const csvContent = aCSV(f, regs, tipo);
    if (!csvContent) return alert('No se encontraron filas para exportar.');
    descargarCSV(`${tipo}_consolidado.csv`, csvContent);
  };

  // Si está abierta la Planilla Oficial Consolidada
  if (vistaPlanilla) {
    const regsTipo = registros.filter((r) => r.tipo === vistaPlanilla);
    return (
      <PlanillaOficial
        tipo={vistaPlanilla}
        registros={regsTipo}
        onVolver={() => setVistaPlanilla(null)}
      />
    );
  }

  // Vista de detalle individual / impresión
  if (registroDetalle) {
    const f = FORMATOS[registroDetalle.tipo];
    return (
      <div className="admin-detalle-view">
        <div className="barra no-print admin-barra-detalle">
          <button className="sec" onClick={() => setRegistroDetalle(null)}>
            Volver al Panel Administrador
          </button>
          <div className="admin-detalle-meta">
            <span className={`badge-tipo badge-${registroDetalle.tipo}`}>{f.tab}</span>
            <small>ID #{registroDetalle.id} • {new Date(registroDetalle.creado).toLocaleString('es-CO')}</small>
          </div>
          <button onClick={() => window.print()}>Imprimir o guardar PDF</button>
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
            <p>Monitoreo, consulta y planillas consolidadas de Acción Integral</p>
          </div>
        </div>
        <div className="admin-header-actions no-print">
          <button className="sec" onClick={cargarRegistros} title="Recargar datos">
            Actualizar
          </button>
          <button className="sec" onClick={() => (window.location.href = '/')} title="Ver el portal público de formatos">
            Ir al Portal Público
          </button>
          <button className="peligro" onClick={onCerrarAdmin} title="Cerrar sesión de administrador">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Tarjetas KPI de Métricas (Grid de 4 columnas limpio sin emojis) */}
      <section className="admin-kpis">
        <div className="kpi-card kpi-total">
          <div className="kpi-info">
            <span className="kpi-label">Total de Registros</span>
            <strong className="kpi-value">{metricas.total}</strong>
            <span className="kpi-sub">Envíos recibidos</span>
          </div>
        </div>

        <div
          className="kpi-card kpi-encuesta"
          onClick={() => setVistaPlanilla('encuesta')}
          style={{ cursor: 'pointer' }}
          title="Abrir Planilla Oficial de Encuestas de Satisfacción"
        >
          <div className="kpi-info">
            <span className="kpi-label">Encuestas de Satisfacción</span>
            <strong className="kpi-value">{metricas.encuestasCount}</strong>
            <span className="kpi-sub">
              {metricas.promSatisfaccion ? `Promedio: ${metricas.promSatisfaccion} / 5.0` : 'Sin calificaciones'}
            </span>
          </div>
        </div>

        <div
          className="kpi-card kpi-asistencia"
          onClick={() => setVistaPlanilla('asistencia')}
          style={{ cursor: 'pointer' }}
          title="Abrir Planilla Oficial de Asistencia"
        >
          <div className="kpi-info">
            <span className="kpi-label">Listados de Asistencia</span>
            <strong className="kpi-value">{metricas.asistenciasCount}</strong>
            <span className="kpi-sub">{metricas.totalAsistentes} personas registradas</span>
          </div>
        </div>

        <div
          className="kpi-card kpi-caracterizacion"
          onClick={() => setVistaPlanilla('caracterizacion')}
          style={{ cursor: 'pointer' }}
          title="Abrir Planilla Oficial de Caracterización"
        >
          <div className="kpi-info">
            <span className="kpi-label">Caracterizaciones</span>
            <strong className="kpi-value">{metricas.caracterizacionesCount}</strong>
            <span className="kpi-sub">{metricas.totalPersonasCarac} profesionales registrados</span>
          </div>
        </div>
      </section>

      {/* Controles de Búsqueda, Filtros y Planillas */}
      <section className="admin-toolbar">
        <div className="admin-busqueda-wrap">
          <input
            type="search"
            className="admin-input-busqueda"
            placeholder="Buscar por nombre, cédula, comunidad, moderador, fecha..."
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
          <span className="admin-export-label">Planillas oficiales:</span>
          <button className="sec admin-btn-csv" onClick={() => setVistaPlanilla('encuesta')}>
            Planilla Encuestas ({metricas.encuestasCount})
          </button>
          <button className="sec admin-btn-csv" onClick={() => setVistaPlanilla('asistencia')}>
            Planilla Asistencia ({metricas.totalAsistentes})
          </button>
          <button className="sec admin-btn-csv" onClick={() => setVistaPlanilla('caracterizacion')}>
            Planilla Caracterización ({metricas.totalPersonasCarac})
          </button>
          <span className="admin-export-label" style={{ marginLeft: '.5rem' }}>Exportar CSV:</span>
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
      {error && <p className="admin-alert-error" role="alert">{error}</p>}
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
                    <th>Persona / Encuestado</th>
                    <th>Detalles clave</th>
                    <th>Fecha de Actividad</th>
                    <th>Fecha de Envío</th>
                    <th className="centro">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.map((r) => {
                    const f = FORMATOS[r.tipo] || {};
                    const d = r.datos || {};

                    let nombrePersona = '';
                    let detalleClave = '';

                    if (r.tipo === 'encuesta') {
                      nombrePersona = d.encuestado || 'Sin nombre';
                      detalleClave = d.suboficial ? `Suboficial: ${d.suboficial}` : 'CAD / JAD';
                    } else if (r.tipo === 'asistencia') {
                      if (d.nombre) {
                        nombrePersona = d.grado ? `${d.grado} ${d.nombre}` : d.nombre;
                        detalleClave = `CC: ${d.cedula || '—'} • Dep: ${d.dependencia || '—'} • ${d.objetivo || 'Reunión'}`;
                      } else {
                        const total = (d.filas || []).filter((fi) => fi.nombre || fi.cedula).length;
                        nombrePersona = d.objetivo || 'Reunión sin título';
                        detalleClave = `${d.guarnicion || ''} • ${total} asistentes en lote`;
                      }
                    } else if (r.tipo === 'caracterizacion') {
                      if (d.nombre) {
                        nombrePersona = d.nombre;
                        detalleClave = `CC: ${d.cedula || '—'} • ${d.especialidad || 'Salud'} • ${d.municipio || ''} (${d.comunidad || ''})`;
                      } else {
                        const total = (d.filas || []).filter((fi) => fi.nombre || fi.cedula).length;
                        nombrePersona = d.comunidad || d.municipio || 'Jornada sin título';
                        detalleClave = `${total} profesionales en lote`;
                      }
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
                          <strong>{nombrePersona}</strong>
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
                              title="Abrir e inspeccionar individualmente"
                            >
                              Ver
                            </button>
                            <button
                              className="peligro admin-btn-action"
                              onClick={(e) => borrarRegistro(r.id, e)}
                              title="Eliminar permanentemente"
                            >
                              Eliminar
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

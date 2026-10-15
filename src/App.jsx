import { useCallback, useEffect, useState } from 'react';
import { FORMATOS } from './formatos.js';
import Formulario from './Formulario.jsx';
import { api, getClave, setClave } from './api.js';

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

function descargar(nombre, texto) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }));
  a.download = nombre;
  a.click();
}

function Acceso({ onEntrar }) {
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  async function entrar(e) {
    e.preventDefault();
    setClave(v);
    try {
      await api.listar('encuesta');
      onEntrar();
    } catch (x) {
      setErr(x.message === '401' ? 'La clave no es correcta.' : x.message);
    }
  }
  return (
    <form className="acceso" onSubmit={entrar}>
      <h1>Formatos de Acción Integral</h1>
      <label>Clave de acceso
        <input type="password" value={v} onChange={(e) => setV(e.target.value)} autoFocus />
      </label>
      <button>Entrar</button>
      {err && <p role="alert">{err}</p>}
    </form>
  );
}

function Historial({ tipo, f, onSalir }) {
  const [regs, setRegs] = useState(null);
  const [ver, setVer] = useState(null);
  const [err, setErr] = useState('');

  const cargar = useCallback(() => {
    api.listar(tipo).then(setRegs).catch((e) => (e.message === '401' ? onSalir() : setErr(e.message)));
  }, [tipo, onSalir]);
  useEffect(() => { setRegs(null); setVer(null); cargar(); }, [cargar]);

  async function borrar(id) {
    if (!confirm('¿Eliminar este registro de forma permanente?')) return;
    await api.borrar(id);
    cargar();
  }

  if (ver) {
    return (
      <>
        <div className="barra no-print">
          <button className="sec" onClick={() => setVer(null)}>Volver al listado</button>
          <button onClick={() => window.print()}>Imprimir o guardar PDF</button>
        </div>
        <Formulario tipo={tipo} f={f} datos={ver.datos} soloLectura />
      </>
    );
  }

  return (
    <div className="historial">
      <div className="barra">
        <h2>Registros guardados</h2>
        {regs?.length > 0 && (
          <button className="sec" onClick={() => descargar(`${tipo}.csv`, aCSV(f, regs))}>Descargar CSV</button>
        )}
      </div>
      {err && <p role="alert">{err}</p>}
      {regs === null && !err && <p>Cargando…</p>}
      {regs?.length === 0 && <p>Aún no hay registros. Cree el primero en la pestaña «Nuevo registro».</p>}
      <ul>
        {regs?.map((r) => (
          <li key={r.id}>
            <span>
              <b>{r.datos[f.resumen] || 'Sin título'}</b>
              <small>{new Date(r.creado).toLocaleString('es-CO')}</small>
            </span>
            <span>
              <button className="sec" onClick={() => setVer(r)}>Abrir</button>
              <button className="peligro" onClick={() => borrar(r.id)}>Eliminar</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(!!getClave());
  const [tipo, setTipo] = useState('encuesta');
  const [vista, setVista] = useState('nuevo');
  const [version, setVersion] = useState(0);
  const f = FORMATOS[tipo];
  const salir = useCallback(() => { setClave(''); setAuth(false); }, []);

  if (!auth) return <Acceso onEntrar={() => setAuth(true)} />;

  return (
    <div className="app">
      <nav className="no-print" aria-label="Formatos">
        <strong>Acción Integral</strong>
        {Object.entries(FORMATOS).map(([k, v]) => (
          <button key={k} className={k === tipo ? 'activo' : ''} onClick={() => { setTipo(k); setVista('nuevo'); }}>
            {v.tab}
          </button>
        ))}
        <button className="sec salir" onClick={salir}>Salir</button>
      </nav>

      <div className="sub no-print">
        <button className={vista === 'nuevo' ? 'activo' : ''} onClick={() => setVista('nuevo')}>Nuevo registro</button>
        <button className={vista === 'historial' ? 'activo' : ''} onClick={() => setVista('historial')}>Registros guardados</button>
      </div>

      <main>
        {vista === 'nuevo' ? (
          <Formulario key={tipo + version} tipo={tipo} f={f}
            onGuardado={(e) => (e === '401' ? salir() : setVersion((v) => v + 1))} />
        ) : (
          <Historial tipo={tipo} f={f} onSalir={salir} />
        )}
      </main>
    </div>
  );
}

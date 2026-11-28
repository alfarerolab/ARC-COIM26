import { useMemo, useState } from 'react';
import { FORMATOS } from './formatos.js';

const PREGUNTAS_CORTAS = [
  'P1. Satisfacción general',
  'P2. Bienestar físico y emocional',
  'P3. Orientaciones profesionales',
  'P4. Integración y recreación',
  'P5. Calidad de vida y retorno',
];

const NIVELES_META = [
  { val: 5, label: 'Excelente', color: '#16a34a' },
  { val: 4, label: 'Bueno', color: '#2563eb' },
  { val: 3, label: 'Aceptable', color: '#e0a82e' },
  { val: 2, label: 'Regular', color: '#f97316' },
  { val: 1, label: 'Malo', color: '#dc2626' },
];

function colorPromedio(prom) {
  if (prom >= 4.2) return '#16a34a';
  if (prom >= 3.5) return '#2563eb';
  if (prom >= 2.8) return '#e0a82e';
  if (prom >= 2.0) return '#f97316';
  return '#dc2626';
}

function claveDiaLocal(fechaIso) {
  const d = new Date(fechaIso);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DashboardEncuestas({ encuestas = [] }) {
  const [filtroFecha, setFiltroFecha] = useState('todas');
  const [nivelHover, setNivelHover] = useState(null);

  const preguntasCompletas = FORMATOS.encuesta.escala || [];

  // Fechas únicas disponibles (toma d.fecha si existe, si no el día de r.creado)
  const fechasDisponibles = useMemo(() => {
    const set = new Set();
    encuestas.forEach((r) => {
      const f = r.datos?.fecha || claveDiaLocal(r.creado);
      if (f) set.add(f);
    });
    return Array.from(set).sort().reverse();
  }, [encuestas]);

  const encuestasFiltradas = useMemo(() => {
    if (filtroFecha === 'todas') return encuestas;
    return encuestas.filter((r) => {
      const f = r.datos?.fecha || claveDiaLocal(r.creado);
      return f === filtroFecha;
    });
  }, [encuestas, filtroFecha]);

  const analitica = useMemo(() => {
    const numPreguntas = preguntasCompletas.length;
    const porPregunta = Array.from({ length: numPreguntas }, (_, idx) => ({
      idx,
      corta: PREGUNTAS_CORTAS[idx] || `P${idx + 1}`,
      completa: preguntasCompletas[idx],
      suma: 0,
      total: 0,
      promedio: 0,
      conteos: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }));

    const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalCalif = 0;
    let sumaCalif = 0;
    let positivas = 0;
    let conObservaciones = 0;
    const observacionesRecientes = [];

    // Orden cronológico ascendente para las series de tiempo
    const ordenadas = [...encuestasFiltradas].sort(
      (a, b) => new Date(a.creado) - new Date(b.creado)
    );

    const diasUnicos = new Set(ordenadas.map((r) => claveDiaLocal(r.creado)).filter(Boolean));
    const agruparPorHora = diasUnicos.size <= 1;
    const bucketsMap = new Map();

    ordenadas.forEach((r) => {
      const d = r.datos || {};
      const calif = d.calif || {};
      let sumaEnc = 0;
      let countEnc = 0;

      for (let i = 0; i < numPreguntas; i++) {
        const val = Number(calif[i] ?? calif[String(i)]);
        if (!isNaN(val) && val >= 1 && val <= 5) {
          porPregunta[i].suma += val;
          porPregunta[i].total += 1;
          porPregunta[i].conteos[val] += 1;
          distribucion[val] += 1;
          totalCalif += 1;
          sumaCalif += val;
          if (val >= 4) positivas += 1;
          sumaEnc += val;
          countEnc += 1;
        }
      }

      const mejoras = String(d.abierta?.mejoras || '').trim();
      const mensaje = String(d.abierta?.mensaje || '').trim();
      if (mejoras || mensaje) {
        conObservaciones += 1;
        observacionesRecientes.push({
          id: r.id,
          encuestado: d.encuestado || 'Anónimo',
          creado: r.creado,
          mejoras,
          mensaje,
        });
      }

      const fechaObj = new Date(r.creado);
      let keyBucket = 'Sin fecha';
      let etiquetaBucket = 'Sin fecha';
      if (!isNaN(fechaObj.getTime())) {
        if (agruparPorHora) {
          const hh = String(fechaObj.getHours()).padStart(2, '0');
          keyBucket = `${claveDiaLocal(r.creado)}-${hh}`;
          etiquetaBucket = `${hh}:00`;
        } else {
          keyBucket = claveDiaLocal(r.creado);
          etiquetaBucket = `${String(fechaObj.getDate()).padStart(2, '0')}/${String(
            fechaObj.getMonth() + 1
          ).padStart(2, '0')}`;
        }
      }

      if (!bucketsMap.has(keyBucket)) {
        bucketsMap.set(keyBucket, {
          key: keyBucket,
          etiqueta: etiquetaBucket,
          cantidad: 0,
          suma: 0,
          totalNotas: 0,
        });
      }
      const b = bucketsMap.get(keyBucket);
      b.cantidad += 1;
      b.suma += sumaEnc;
      b.totalNotas += countEnc;
    });

    porPregunta.forEach((p) => {
      p.promedio = p.total > 0 ? Number((p.suma / p.total).toFixed(2)) : 0;
    });

    const serieTiempo = Array.from(bucketsMap.values()).map((b) => ({
      ...b,
      promedio: b.totalNotas > 0 ? Number((b.suma / b.totalNotas).toFixed(2)) : 0,
    }));

    const promedioGeneral = totalCalif > 0 ? Number((sumaCalif / totalCalif).toFixed(2)) : 0;
    const pctPositiva = totalCalif > 0 ? Math.round((positivas / totalCalif) * 100) : 0;

    return {
      totalEncuestas: encuestasFiltradas.length,
      totalCalif,
      promedioGeneral,
      pctPositiva,
      conObservaciones,
      porPregunta,
      distribucion,
      serieTiempo,
      agruparPorHora,
      observacionesRecientes: observacionesRecientes.reverse().slice(0, 4),
    };
  }, [encuestasFiltradas, preguntasCompletas]);

  // Geometría Dona SVG
  const radio = 54;
  const circunferencia = 2 * Math.PI * radio;
  let offsetAcumulado = 0;
  const segmentosDona = NIVELES_META.map((nv) => {
    const count = analitica.distribucion[nv.val] || 0;
    const fraccion = analitica.totalCalif > 0 ? count / analitica.totalCalif : 0;
    const largo = fraccion * circunferencia;
    const seg = {
      ...nv,
      count,
      pct: Math.round(fraccion * 100),
      dasharray: `${largo} ${circunferencia - largo}`,
      dashoffset: -offsetAcumulado,
    };
    offsetAcumulado += largo;
    return seg;
  });

  // Geometría SVG Serie de Tiempo
  const chartW = 480;
  const chartH = 210;
  const padL = 34;
  const padR = 34;
  const padT = 20;
  const padB = 34;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const maxCant = Math.max(1, ...analitica.serieTiempo.map((s) => s.cantidad));
  const nPuntos = analitica.serieTiempo.length;

  const puntosSerie = analitica.serieTiempo.map((s, i) => {
    const stepX = nPuntos > 1 ? plotW / nPuntos : plotW;
    const cx = nPuntos === 1 ? padL + plotW / 2 : padL + stepX * i + stepX / 2;
    const barW = Math.min(34, Math.max(12, stepX * 0.5));
    const barH = (s.cantidad / maxCant) * plotH;
    const barY = padT + plotH - barH;
    const lineY = padT + plotH - (s.promedio / 5) * plotH;
    return { ...s, cx, barW, barH, barY, lineY };
  });

  const polylinePts = puntosSerie
    .filter((p) => p.totalNotas > 0)
    .map((p) => `${p.cx},${p.lineY}`)
    .join(' ');

  return (
    <section className="dash-encuestas-wrap" aria-label="Dashboard de Encuestas">
      {/* Cabecera de Analítica */}
      <div className="dash-encuestas-topbar">
        <div className="dash-title-group">
          <h2>Analítica de Encuestas</h2>
          <p className="dash-subtitle">Resultados consolidados de satisfacción</p>
        </div>

        {fechasDisponibles.length > 0 && (
          <div className="dash-controls no-print">
            <select
              className="dash-select-fecha"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              aria-label="Filtrar gráficas por fecha"
            >
              <option value="todas">Todas las fechas ({encuestas.length})</option>
              {fechasDisponibles.map((f) => (
                <option key={f} value={f}>
                  Fecha: {f}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {analitica.totalEncuestas === 0 ? (
            <div className="dash-empty-state">
              <strong>Esperando respuestas de encuestas</strong>
              <p>
                Aún no hay encuestas registradas{filtroFecha !== 'todas' ? ` para la fecha ${filtroFecha}` : ''}.
                En cuanto los beneficiarios envíen sus respuestas desde el portal público, las gráficas aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            <>
              {/* Resumen rápido de encuestas */}
              <div className="dash-mini-kpis">
                <div className="dash-mini-stat">
                  <span>Encuestas analizadas</span>
                  <strong>{analitica.totalEncuestas}</strong>
                </div>
                <div className="dash-mini-stat">
                  <span>Promedio global</span>
                  <strong style={{ color: colorPromedio(analitica.promedioGeneral) }}>
                    {analitica.promedioGeneral.toFixed(2)} / 5.0
                  </strong>
                </div>
                <div className="dash-mini-stat">
                  <span>Satisfacción positiva (Bueno + Excelente)</span>
                  <strong style={{ color: '#16a34a' }}>{analitica.pctPositiva}%</strong>
                </div>
                <div className="dash-mini-stat">
                  <span>Con observaciones escritas</span>
                  <strong>{analitica.conObservaciones}</strong>
                </div>
              </div>

              {/* Grid 2x2 de Gráficas */}
              <div className="dash-charts-grid">
                {/* Gráfica 1: Promedio por Pregunta */}
                <article className="dash-chart-card">
                  <div className="dash-chart-head">
                    <h3>Promedio por Pregunta (Escala 1 – 5)</h3>
                    <small>Pase el cursor para leer la pregunta completa</small>
                  </div>
                  <div className="dash-bars-list">
                    {analitica.porPregunta.map((p) => {
                      const pctAncho = (p.promedio / 5) * 100;
                      const color = colorPromedio(p.promedio);
                      return (
                        <div key={p.idx} className="dash-bar-item" title={p.completa}>
                          <div className="dash-bar-meta">
                            <span className="dash-bar-label">{p.corta}</span>
                            <span className="dash-bar-score" style={{ color }}>
                              {p.total > 0 ? `${p.promedio.toFixed(2)} / 5` : 'Sin datos'}
                              <small> ({p.total} resp.)</small>
                            </span>
                          </div>
                          <div className="dash-bar-track">
                            <div
                              className="dash-bar-fill"
                              style={{ width: `${pctAncho}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>

                {/* Gráfica 2: Distribución de Calificaciones (Dona) */}
                <article className="dash-chart-card">
                  <div className="dash-chart-head">
                    <h3>Distribución Global de Calificaciones</h3>
                    <small>{analitica.totalCalif} respuestas evaluadas</small>
                  </div>
                  <div className="dash-donut-layout">
                    <div className="dash-donut-svg-wrap">
                      <svg viewBox="0 0 140 140" className="dash-donut-svg" role="img" aria-label="Distribución de calificaciones">
                        <circle cx="70" cy="70" r={radio} fill="none" stroke="#e2e8f0" strokeWidth="18" />
                        <g transform="rotate(-90 70 70)">
                          {segmentosDona.map((seg) =>
                            seg.count > 0 ? (
                              <circle
                                key={seg.val}
                                cx="70"
                                cy="70"
                                r={radio}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={nivelHover === seg.val ? 22 : 18}
                                strokeDasharray={seg.dasharray}
                                strokeDashoffset={seg.dashoffset}
                                className="dash-donut-slice"
                                onMouseEnter={() => setNivelHover(seg.val)}
                                onMouseLeave={() => setNivelHover(null)}
                              >
                                <title>{`${seg.label} (${seg.val}): ${seg.count} (${seg.pct}%)`}</title>
                              </circle>
                            ) : null
                          )}
                        </g>
                        <text x="70" y="66" textAnchor="middle" className="dash-donut-center-val">
                          {nivelHover
                            ? `${segmentosDona.find((s) => s.val === nivelHover)?.pct || 0}%`
                            : `${analitica.pctPositiva}%`}
                        </text>
                        <text x="70" y="83" textAnchor="middle" className="dash-donut-center-lbl">
                          {nivelHover
                            ? segmentosDona.find((s) => s.val === nivelHover)?.label
                            : 'Positiva'}
                        </text>
                      </svg>
                    </div>

                    <ul className="dash-donut-legend">
                      {segmentosDona.map((seg) => (
                        <li
                          key={seg.val}
                          className={nivelHover === seg.val ? 'resaltado' : ''}
                          onMouseEnter={() => setNivelHover(seg.val)}
                          onMouseLeave={() => setNivelHover(null)}
                        >
                          <span className="dash-legend-swatch" style={{ backgroundColor: seg.color }} />
                          <span className="dash-legend-name">
                            {seg.val}. {seg.label}
                          </span>
                          <strong className="dash-legend-val">
                            {seg.count} <small>({seg.pct}%)</small>
                          </strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>

                {/* Gráfica 3: Composición 100% Apilada por Pregunta */}
                <article className="dash-chart-card">
                  <div className="dash-chart-head">
                    <h3>Composición de Respuestas por Pregunta</h3>
                    <small>Proporción de niveles 1 a 5 en cada ítem</small>
                  </div>
                  <div className="dash-stacked-list">
                    {analitica.porPregunta.map((p) => (
                      <div key={p.idx} className="dash-stacked-row" title={p.completa}>
                        <span className="dash-stacked-label">{p.corta}</span>
                        <div className="dash-stacked-bar">
                          {NIVELES_META.map((nv) => {
                            const c = p.conteos[nv.val] || 0;
                            const pct = p.total > 0 ? (c / p.total) * 100 : 0;
                            if (pct <= 0) return null;
                            return (
                              <div
                                key={nv.val}
                                className="dash-stacked-seg"
                                style={{ width: `${pct}%`, backgroundColor: nv.color }}
                                title={`${nv.label}: ${c} (${Math.round(pct)}%)`}
                              >
                                {pct >= 12 ? `${Math.round(pct)}%` : ''}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="dash-stacked-legend">
                    {NIVELES_META.map((nv) => (
                      <span key={nv.val}>
                        <i style={{ backgroundColor: nv.color }} />
                        {nv.label}
                      </span>
                    ))}
                  </div>
                </article>

                {/* Gráfica 4: Evolución en el Tiempo (Volumen + Promedio) */}
                <article className="dash-chart-card">
                  <div className="dash-chart-head">
                    <h3>
                      Tendencia en el Tiempo ({analitica.agruparPorHora ? 'Por hora' : 'Por fecha'})
                    </h3>
                    <small>Barras: cantidad de encuestas • Línea: promedio (1–5)</small>
                  </div>
                  <div className="dash-line-wrap">
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="dash-line-svg" role="img" aria-label="Tendencia temporal de encuestas">
                      {/* Líneas horizontales guía (escala derecha 1..5) */}
                      {[1, 2, 3, 4, 5].map((v) => {
                        const y = padT + plotH - (v / 5) * plotH;
                        return (
                          <g key={v}>
                            <line
                              x1={padL}
                              y1={y}
                              x2={chartW - padR}
                              y2={y}
                              stroke="#e2e8f0"
                              strokeDasharray="3 3"
                            />
                            <text x={chartW - padR + 6} y={y + 3} className="dash-axis-text">
                              {v}.0
                            </text>
                          </g>
                        );
                      })}

                      {/* Eje izquierdo máximo volumen */}
                      <text x={padL - 6} y={padT + 4} textAnchor="end" className="dash-axis-text">
                        {maxCant}
                      </text>
                      <text x={padL - 6} y={padT + plotH + 3} textAnchor="end" className="dash-axis-text">
                        0
                      </text>

                      {/* Barras de volumen */}
                      {puntosSerie.map((p, idx) => {
                        const mostrarEtiqueta =
                          nPuntos <= 8 || idx % Math.ceil(nPuntos / 8) === 0 || idx === nPuntos - 1;
                        return (
                          <g key={p.key}>
                            <rect
                              x={p.cx - p.barW / 2}
                              y={p.barY}
                              width={p.barW}
                              height={Math.max(2, p.barH)}
                              rx="3"
                              fill="rgba(18, 48, 79, 0.22)"
                              stroke="#12304f"
                              strokeWidth="1"
                            >
                              <title>{`${p.etiqueta}: ${p.cantidad} encuesta(s), promedio ${p.promedio.toFixed(2)}`}</title>
                            </rect>
                            {mostrarEtiqueta && (
                              <text x={p.cx} y={chartH - 12} textAnchor="middle" className="dash-axis-text">
                                {p.etiqueta}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Línea de promedio */}
                      {puntosSerie.filter((p) => p.totalNotas > 0).length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#e0a82e"
                          strokeWidth="2.8"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          points={polylinePts}
                        />
                      )}

                      {/* Puntos de promedio */}
                      {puntosSerie.map((p) =>
                        p.totalNotas > 0 ? (
                          <g key={`pt-${p.key}`}>
                            <circle
                              cx={p.cx}
                              cy={p.lineY}
                              r="4.5"
                              fill="#e0a82e"
                              stroke="#12304f"
                              strokeWidth="1.5"
                            >
                              <title>{`${p.etiqueta} • Promedio: ${p.promedio.toFixed(2)} / 5 (${p.cantidad} encuestas)`}</title>
                            </circle>
                            <text
                              x={p.cx}
                              y={Math.max(padT + 10, p.lineY - 8)}
                              textAnchor="middle"
                              className="dash-point-val"
                            >
                              {p.promedio.toFixed(1)}
                            </text>
                          </g>
                        ) : null
                      )}
                    </svg>
                  </div>
                </article>
              </div>

              {/* Últimas observaciones abiertas */}
              {analitica.observacionesRecientes.length > 0 && (
                <div className="dash-obs-box">
                  <div className="dash-obs-head">
                    <h3>Últimas observaciones y sugerencias</h3>
                    <small>Mostrando las {analitica.observacionesRecientes.length} más recientes</small>
                  </div>
                  <div className="dash-obs-grid">
                    {analitica.observacionesRecientes.map((o) => (
                      <div key={o.id} className="dash-obs-card">
                        <div className="dash-obs-meta">
                          <strong>{o.encuestado}</strong>
                          <small>{new Date(o.creado).toLocaleString('es-CO')}</small>
                        </div>
                        {o.mejoras && (
                          <p>
                            <b>Mejoras:</b> {o.mejoras}
                          </p>
                        )}
                        {o.mensaje && (
                          <p>
                            <b>Mensaje:</b> {o.mensaje}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
    </section>
  );
}

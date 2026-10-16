import { useRef, useState, useEffect, useCallback } from 'react';

export default function FirmaCanvas({ valorInicial, onChange, ancho = 380, alto = 140, placeholder = 'Firme con su dedo aquí' }) {
  const canvasRef = useRef(null);
  const [dibujando, setDibujando] = useState(false);
  const [tieneTrazo, setTieneTrazo] = useState(!!valorInicial);

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  // Inicializar canvas con DPR para alta definición
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = ancho * dpr;
    canvas.height = alto * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#12304f';

    // Si ya tiene un valor inicial (imagen en base64)
    if (valorInicial) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, ancho, alto);
        setTieneTrazo(true);
      };
      img.src = valorInicial;
    }
  }, [ancho, alto, valorInicial]);

  const iniciarTrazo = (e) => {
    if (e.cancelable && e.type.startsWith('touch')) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDibujando(true);
  };

  const dibujar = (e) => {
    if (!dibujando) return;
    if (e.cancelable && e.type.startsWith('touch')) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setTieneTrazo(true);
  };

  const terminarTrazo = () => {
    if (!dibujando) return;
    setDibujando(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    if (onChange) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setTieneTrazo(false);
    if (onChange) {
      onChange('');
    }
  };

  return (
    <div className="firma-canvas-wrap">
      <div className="firma-canvas-box" style={{ width: ancho, height: alto }}>
        <canvas
          ref={canvasRef}
          style={{ width: ancho, height: alto }}
          onMouseDown={iniciarTrazo}
          onMouseMove={dibujar}
          onMouseUp={terminarTrazo}
          onMouseLeave={terminarTrazo}
          onTouchStart={iniciarTrazo}
          onTouchMove={dibujar}
          onTouchEnd={terminarTrazo}
        />
        {!tieneTrazo && !dibujando && (
          <div className="firma-canvas-placeholder">{placeholder}</div>
        )}
      </div>
      <div className="firma-canvas-actions no-print">
        {tieneTrazo && (
          <button type="button" className="sec firma-btn-limpiar" onClick={limpiar}>
            🗑️ Limpiar firma
          </button>
        )}
      </div>
    </div>
  );
}

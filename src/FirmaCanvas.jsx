import { useRef, useState, useEffect, useCallback } from 'react';

export default function FirmaCanvas({
  valorInicial,
  onChange,
  alto = 150,
  placeholder = 'Firme con su dedo aquí',
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dibujando, setDibujando] = useState(false);
  const [tieneTrazo, setTieneTrazo] = useState(!!valorInicial);
  const [tamano, setTamano] = useState({ ancho: 360, alto });
  const valorRef = useRef(valorInicial || '');

  // Actualizar ancho responsivo según el contenedor
  useEffect(() => {
    function medir() {
      if (containerRef.current) {
        const anchoContenedor = Math.floor(containerRef.current.clientWidth);
        // Ancho fluido entre 260px y 500px según la pantalla del teléfono o escritorio
        const nuevoAncho = Math.max(260, Math.min(anchoContenedor, 500));
        setTamano((prev) => (prev.ancho !== nuevoAncho ? { ancho: nuevoAncho, alto } : prev));
      }
    }
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [alto]);

  // Redibujar o inicializar canvas con DPI alto para máxima nitidez
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = tamano.ancho * dpr;
    canvas.height = tamano.alto * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = '#091a2e';

    // Si ya existe trazo previo, restaurarlo adaptado
    if (valorRef.current) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, tamano.ancho, tamano.alto);
        setTieneTrazo(true);
      };
      img.src = valorRef.current;
    }
  }, [tamano]);

  // Si cambia valorInicial desde fuera (ej. reseteo del formulario)
  useEffect(() => {
    if (!valorInicial) {
      valorRef.current = '';
      setTieneTrazo(false);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      }
    } else {
      valorRef.current = valorInicial;
      setTieneTrazo(true);
    }
  }, [valorInicial]);

  // Obtener posición del puntero o dedo calibrado al pixel del canvas
  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;

    const scaleX = (canvas.width / (window.devicePixelRatio || 1)) / rect.width;
    const scaleY = (canvas.height / (window.devicePixelRatio || 1)) / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

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
    const dataUrl = canvas.toDataURL('image/png');
    valorRef.current = dataUrl;
    onChange?.(dataUrl);
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    valorRef.current = '';
    setTieneTrazo(false);
    onChange?.('');
  };

  return (
    <div className="firma-canvas-wrap" ref={containerRef}>
      <div
        className="firma-canvas-box"
        style={{
          width: '100%',
          maxWidth: `${tamano.ancho}px`,
          height: `${tamano.alto}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            touchAction: 'none',
            display: 'block',
          }}
          onMouseDown={iniciarTrazo}
          onMouseMove={dibujar}
          onMouseUp={terminarTrazo}
          onMouseLeave={terminarTrazo}
          onTouchStart={iniciarTrazo}
          onTouchMove={dibujar}
          onTouchEnd={terminarTrazo}
        />
        {!tieneTrazo && !dibujando && (
          <div className="firma-canvas-placeholder">
            <span>{placeholder}</span>
          </div>
        )}
      </div>
      <div className="firma-canvas-actions no-print">
        {tieneTrazo && (
          <button type="button" className="sec firma-btn-limpiar" onClick={limpiar}>
            Limpiar firma
          </button>
        )}
      </div>
    </div>
  );
}

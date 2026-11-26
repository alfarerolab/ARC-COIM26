// Definición de los tres formatos institucionales. Para cambiar textos o columnas, edite solo este archivo.

export const FORMATOS = {
  encuesta: {
    tab: 'Encuesta de satisfacción',
    titulo: 'ENCUESTA DE SATISFACCIÓN',
    subtitulo: 'JORNADA DE BIENESTAR Y DESARROLLO — ACCIÓN INTEGRAL',
    proceso: 'Acción Integral',
    autoridad: 'JACID',
    codigo: 'ACCIN-FT-022-JACID-V02',
    vigencia: '28/11/2026',
    resumen: 'encuestado',
    campos: [
      { k: 'fecha', label: 'Fecha', type: 'date' },
      { k: 'encuestado', label: 'Encuestado (nombre completo)' },
      { k: 'suboficial', label: 'Suboficial de Acción Integral y Desarrollo (grado / unidad)' },
    ],
    escalaTitulo: 'Satisfacción del beneficiario',
    escalaAyuda:
      'Marque la calificación que considere pertinente de acuerdo a la experiencia personal vivida durante la jornada de bienestar y desarrollo liderada por la Armada Nacional.',
    niveles: ['Malo', 'Regular', 'Aceptable', 'Bueno', 'Excelente'],
    escala: [
      '¿Cómo califica su nivel de satisfacción general con la jornada de bienestar y desarrollo, teniendo en cuenta los servicios de salud, odontología, salud mental, empleabilidad, finanzas personales, integración, recreación y alimentación recibida?',
      '¿Considera que las actividades y los servicios ofrecidos durante la jornada contribuyeron positivamente a su bienestar físico, emocional y personal?',
      '¿Qué tan útiles y enriquecedoras fueron las orientaciones brindadas por los profesionales en las diferentes estaciones, especialmente en temas de salud, salud mental, empleabilidad y finanzas personales?',
      '¿Cómo califica los espacios de integración, recreación, rumbaterapia, juegos, rifas y entrega de premios, como parte de las actividades destinadas a compartir, disfrutar y salir de la rutina?',
      '¿Considera que esta jornada fue un aporte significativo para su calidad de vida y su proceso de preparación para el retorno a la vida civil?',
    ],
    // Preguntas abiertas (texto libre) — se guardan en d.abierta
    abiertasTitulo: 'Observaciones y apreciación personal',
    abiertasAyuda:
      'Comparta sus opiniones, sugerencias y reflexiones. Su respuesta es muy importante para nosotros.',
    abiertas: [
      {
        k: 'mejoras',
        label:
          'Desde su experiencia, ¿qué aspectos considera que podríamos mejorar o qué otras actividades, servicios o iniciativas le gustaría que incluyéramos en futuras jornadas?',
        placeholder: 'Escriba aquí sus sugerencias…',
      },
      {
        k: 'mensaje',
        label:
          '¿Qué mensaje, sugerencia o reflexión quisiera compartirnos sobre esta jornada? Su opinión es muy importante para nosotros, porque nos permite conocer cómo vivió esta experiencia y seguir trabajando por su bienestar y desarrollo integral.',
        placeholder: 'Escriba aquí su mensaje o reflexión…',
      },
    ],
    firmas: ['Firma encuestado', 'Firma Suboficial de Acción Integral y Desarrollo'],
    tablaConsolidada: {
      cols: [
        { k: 'encuestado', label: 'Encuestado (Nombre)' },
        { k: 'p1', label: 'P1' },
        { k: 'p2', label: 'P2' },
        { k: 'p3', label: 'P3' },
        { k: 'p4', label: 'P4' },
        { k: 'p5', label: 'P5' },
        { k: 'promedio', label: 'Promedio' },
        { k: 'mejoras', label: 'P6 Mejoras' },
        { k: 'mensaje', label: 'P7 Mensaje' },
        { k: 'firma', label: 'Firma digital' },
      ],
    },
  },

  asistencia: {
    tab: 'Listado de asistencia',
    soloAdmin: true,
    titulo: 'LISTADO DE ASISTENCIA',
    proceso: 'Documento Institucional',
    autoridad: 'JPLAN',
    codigo: 'ARC-FT-002-JPLAN-V07',
    vigencia: '28/11/2026',
    resumen: 'nombre',
    requiereFirmaAsistente: true,
    secciones: [
      {
        titulo: 'Información de la Reunión o Capacitación',
        descripcion: 'Datos generales del evento institucional liderado por la Armada de Colombia.',
        campos: [
          { k: 'objetivo', label: 'Objetivo', span: 2, placeholder: 'Tema o propósito de la reunión o capacitación' },
          { k: 'moderador', label: 'Moderador', placeholder: 'Grado y nombre del responsable' },
          { k: 'guarnicion', label: 'Guarnición / Unidad', placeholder: 'Ej. COIM26, ARC Bolívar, etc.' },
          { k: 'tipo', label: 'Tipo de actividad', type: 'select', options: ['Capacitación', 'Reunión', 'Otro'] },
          { k: 'cual', label: '¿Cuál? (si seleccionó Otro)', placeholder: 'Especifique el tipo' },
          { k: 'fecha', label: 'Fecha', type: 'date' },
          { k: 'hora', label: 'Hora', type: 'time' },
        ],
      },
      {
        titulo: 'Datos del Asistente',
        descripcion: 'Diligencie sus datos individuales para registrar su asistencia oficial.',
        campos: [
          { k: 'grado', label: 'Grado', placeholder: 'Ej. CC, TN, TF, SM, CP, Particular, etc.' },
          { k: 'nombre', label: 'Apellidos y nombres', span: 2, placeholder: 'Nombre completo del asistente' },
          { k: 'dependencia', label: 'Dependencia / Institución', placeholder: 'Unidad militar, entidad o comunidad' },
          { k: 'cedula', label: 'No. de Cédula', placeholder: 'Número de documento de identidad' },
          { k: 'celular', label: 'Número de Celular', type: 'tel', placeholder: 'Ej. 300 123 4567' },
          { k: 'correo', label: 'Correo electrónico', type: 'email', placeholder: 'correo@ejemplo.com' },
        ],
      },
    ],
    // Todos los campos consolidados para inicialización
    campos: [
      { k: 'objetivo', label: 'Objetivo', span: 2 },
      { k: 'moderador', label: 'Moderador' },
      { k: 'guarnicion', label: 'Guarnición' },
      { k: 'tipo', label: 'Tipo', type: 'select', options: ['Capacitación', 'Reunión', 'Otro'] },
      { k: 'cual', label: '¿Cuál? (si es Otro)' },
      { k: 'fecha', label: 'Fecha', type: 'date' },
      { k: 'hora', label: 'Hora', type: 'time' },
      { k: 'grado', label: 'Grado' },
      { k: 'nombre', label: 'Apellidos y nombres' },
      { k: 'dependencia', label: 'Dependencia' },
      { k: 'cedula', label: 'Cédula' },
      { k: 'celular', label: 'Celular' },
      { k: 'correo', label: 'Correo' },
    ],
    // Estructura oficial de columnas para la planilla consolidada en el Panel de Administrador
    tablaConsolidada: {
      cols: [
        { k: 'grado', label: 'Grado' },
        { k: 'nombre', label: 'Apellidos y nombres' },
        { k: 'dependencia', label: 'Dependencia' },
        { k: 'cedula', label: 'Cédula' },
        { k: 'celular', label: 'Celular' },
        { k: 'correo', label: 'Correo' },
        { k: 'firma', label: 'Firma digital' },
      ],
    },
  },

  caracterizacion: {
    tab: 'Caracterización del personal',
    soloAdmin: true,
    titulo: 'CARACTERIZACIÓN DEL PERSONAL PARA LAS JORNADAS O CAMPAÑAS DE APOYO AL DESARROLLO',
    proceso: 'Acción Integral',
    autoridad: 'JACID',
    codigo: 'ACCIN-FT-005-JACID-V04',
    vigencia: '28/11/2026',
    resumen: 'nombre',
    secciones: [
      {
        titulo: 'Información de la Jornada de Apoyo al Desarrollo (JAD)',
        descripcion: 'Datos de la jornada o campaña liderada por la unidad militar.',
        campos: [
          { k: 'comunidad', label: 'Comunidad beneficiaria', placeholder: 'Nombre de la comunidad o vereda' },
          { k: 'municipio', label: 'Municipio', placeholder: 'Municipio' },
          { k: 'departamento', label: 'Departamento', placeholder: 'Departamento' },
          { k: 'fechas', label: 'Fechas de realización', placeholder: 'Ej. 16 al 18 de Noviembre de 2026' },
          { k: 'unidad', label: 'Unidad militar que lidera la JAD', placeholder: 'Ej. COIM26' },
          { k: 'encargado', label: 'Encargado Acción Integral (grado, nombre, cargo y teléfono)', span: 2 },
        ],
      },
      {
        titulo: 'Datos del Profesional / Personal de Salud',
        descripcion: 'Registro individual de cada profesional participante en la jornada.',
        campos: [
          { k: 'nombre', label: 'Nombres y apellidos', span: 2, placeholder: 'Nombre completo del profesional' },
          { k: 'cedula', label: 'No. de cédula', placeholder: 'Cédula de ciudadanía' },
          { k: 'tarjeta', label: 'No. tarjeta profesional', placeholder: 'Número de tarjeta profesional' },
          { k: 'especialidad', label: 'Especialidad', placeholder: 'Ej. Pediatría, Odontología, Medicina General' },
          { k: 'servicios', label: 'Servicios a ofrecer', placeholder: 'Ej. Consulta médica, profilaxis, vacunación' },
          { k: 'entidad', label: 'Entidad que representa', placeholder: 'Ej. Hospital, Fundación, Particular' },
          { k: 'gsrh', label: 'G.S. - RH', placeholder: 'Ej. O+, A+, etc.' },
          { k: 'eps', label: 'EPS', placeholder: 'EPS a la que está afiliado' },
          { k: 'celular', label: 'Número celular', type: 'tel', placeholder: 'Ej. 310 987 6543' },
        ],
      },
    ],
    // Todos los campos consolidados para inicialización
    campos: [
      { k: 'comunidad', label: 'Comunidad' },
      { k: 'municipio', label: 'Municipio' },
      { k: 'departamento', label: 'Departamento' },
      { k: 'fechas', label: 'Fechas' },
      { k: 'unidad', label: 'Unidad militar que lidera la JAD' },
      { k: 'encargado', label: 'Encargado Acción Integral' },
      { k: 'nombre', label: 'Nombres y apellidos' },
      { k: 'cedula', label: 'No. de cédula' },
      { k: 'tarjeta', label: 'No. tarjeta profesional' },
      { k: 'especialidad', label: 'Especialidad' },
      { k: 'servicios', label: 'Servicios a ofrecer' },
      { k: 'entidad', label: 'Entidad que representa' },
      { k: 'gsrh', label: 'G.S.-RH' },
      { k: 'eps', label: 'EPS' },
      { k: 'celular', label: 'Número celular' },
    ],
    // Estructura oficial de columnas para la planilla consolidada en el Panel de Administrador
    tablaConsolidada: {
      cols: [
        { k: 'nombre', label: 'Nombres y apellidos' },
        { k: 'cedula', label: 'No. de cédula' },
        { k: 'tarjeta', label: 'No. tarjeta profesional' },
        { k: 'especialidad', label: 'Especialidad' },
        { k: 'servicios', label: 'Servicios a ofrecer' },
        { k: 'entidad', label: 'Entidad que representa' },
        { k: 'gsrh', label: 'G.S.-RH' },
        { k: 'eps', label: 'EPS' },
        { k: 'celular', label: 'Número celular' },
      ],
    },
    nota: 'NOTA: No se permite el empleo de personal sin título profesional en áreas de la salud, para realizar atenciones, formulaciones de medicamentos y diagnósticos.',
    firmas: ['Coordinador fundación', 'Jefe Acción Integral de la unidad encargada de la JAD'],
  },
};

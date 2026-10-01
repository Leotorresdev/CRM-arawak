// ==============================================================================
// ARAWAK - MÓDULO: ARRANQUE DE OPERACIONES
// Acta de Liberación de Inicio de Operaciones (AIO)
// ==============================================================================

export type DictamenArranque = "aprobado" | "condicionado" | "rechazado";
export type EstadoRequisito = "cumple" | "no_cumple" | "na";

export interface RequisitoEvaluacion {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  vinculoModulo: "limpieza" | "sanitizacion" | "materia_prima" | "higiene";
}

export interface ActaInicioOperaciones {
  id: string;
  galponId: "galpon-9" | "galpon-8";
  areaMaquina: string;
  lineaNombre: string;
  fecha: string;
  hora: string;
  producto: string;
  sku: string;
  ordenProduccion: string;
  lote: string;
  requisitos: {
    despejeLimpieza: EstadoRequisito; // 1. Despeje de línea y limpieza previa
    sanitizacionEquipos: EstadoRequisito; // 2. sanitización del área y equipos
    materiaPrima: EstadoRequisito; // 3. Materia prima pesada y correcta
    seguridadHigiene: EstadoRequisito; // 4. Seguridad e Higiene del Personal
  };
  observaciones: string;
  dictamen: DictamenArranque;
  firmaProduccion: {
    firmado: boolean;
    nombre: string;
    cargo: string;
    fecha: string;
  };
  firmaCalidad: {
    firmado: boolean;
    nombre: string;
    cargo: string;
    fecha: string;
  };
}

export const catalogoProductosArawak = [
  { nombre: "Galletas Dulces de Cambur (Sin Gluten)", sku: "AWK-GDC-150G", linea: "galpon-9" },
  { nombre: "Galletas Saladas Crackers de Yuca", sku: "AWK-GSY-120G", linea: "galpon-9" },
  { nombre: "Tortillas Horneadas de Yuca y Chía", sku: "AWK-THY-100G", linea: "galpon-9" },
  { nombre: "Galletas de Chocolate & Cambur", sku: "AWK-GCC-150G", linea: "galpon-9" },
  { nombre: "Harina Refinada de Yuca Grado Alimentario", sku: "AWK-HRY-1000G", linea: "galpon-8" },
  { nombre: "Harina Prebiótica de Cambur Verde", sku: "AWK-HPC-500G", linea: "galpon-8" },
  { nombre: "Almidón Nativo de Yuca", sku: "AWK-ANY-1000G", linea: "galpon-8" },
];

export const requisitosCatalogo: RequisitoEvaluacion[] = [
  {
    id: 1,
    codigo: "REQ-01",
    titulo: "1. Despeje de línea y limpieza previa",
    descripcion:
      "Verificar ausencia total de productos anteriores, empaques remanentes, etiquetas obsoletas y partículas ajenas en la tolva y banda transportadora.",
    vinculoModulo: "limpieza",
  },
  {
    id: 2,
    codigo: "REQ-02",
    titulo: "2. Sanitización del área y equipos",
    descripcion:
      "Constatar que el procedimiento POES de 8 pasos esté concluido y validado como Conforme por Control de Calidad (superficies desinfectadas y secas).",
    vinculoModulo: "limpieza",
  },
  {
    id: 3,
    codigo: "REQ-03",
    titulo: "3. Materia prima pesada y correcta",
    descripcion:
      "Verificar que las mezclas e insumos pesados correspondan a la formulación aprobada de la OP, cuenten con certificado libre de gluten y balanza calibrada.",
    vinculoModulo: "materia_prima",
  },
  {
    id: 4,
    codigo: "REQ-04",
    titulo: "4. Seguridad e Higiene del Personal",
    descripcion:
      "Comprobar uso correcto de uniforme sanitario limpio, cofia, tapabocas, uñas cortas sin esmalte, pediluvio y lavado de manos verificado.",
    vinculoModulo: "higiene",
  },
];

// Equipos que componen cada Galpón para el cruce con Limpieza de Planta
export const equiposPorGalpon = {
  "galpon-9": [
    2, // AREA DE PRODUCCIÓN
    3, // MEZCLADORA DE MASA (GALLETAS)
    4, // FORMADORA DE GALLETAS
    5, // MESAS DE ACERO INOXIDABLE
    6, // HORNOS DE GALLETA
    7, // ENVASADORA DE GALLETAS
    8, // CARROS HORNEROS Y BANDEJAS
    9, // MEZCLADORA DE MASA (TORTILLA)
    10, // FORMADORA DE TORTILLAS Y LINEA DE ENFRIAMIENTO
    11, // MEZCLADORA DE HARINAS
    12, // TOLVAS Y MOTORES DE HARINA
    13, // ENVASADORA DE HARINAS
    14, // BANDAS DE PRODUCTO ENVASADO
    15, // BALANZAS
    16, // INSTRUMENTOS DE PRODUCCIÓN
  ],
  "galpon-8": [
    22, // AREA DE RECEPCIÓN Y PROCESO DE M.P.
    23, // PRELAVADORA DE YUCA
    24, // CINTAS TRANSPORTADORAS (4)
    25, // PELADORA DE RODILLOS
    26, // LAVADORA DE INMERSIÓN Y AIRE
    27, // REBANADORA
    28, // HORNOS DE DESHIDRATACIÓN
    29, // CARROS Y BANDEJAS DE DESHIDRATACIÓN
    30, // MOLINO DE HARINAS
    31, // MESAS DE ACERO INOXIDABLE Y BATEAS (AREA SUCIA)
  ],
};

export const initialActasData: Record<"galpon-9" | "galpon-8", ActaInicioOperaciones> = {
  "galpon-9": {
    id: "AIO-G9-20260930-01",
    galponId: "galpon-9",
    areaMaquina: "área de producción galpón 9",
    lineaNombre: "Línea de Formado y Horneado de Galletas / Tortillas Sin Gluten",
    fecha: "2026-09-30",
    hora: "06:30",
    producto: "Galletas Dulces de Cambur (Sin Gluten)",
    sku: "AWK-GDC-150G",
    ordenProduccion: "OP-2026-094",
    lote: "L-260930-G1",
    requisitos: {
      despejeLimpieza: "cumple",
      sanitizacionEquipos: "cumple",
      materiaPrima: "cumple",
      seguridadHigiene: "cumple",
    },
    observaciones: "Línea despejada, sanitización verificada a 150 ppm de amonio cuaternario. Personal 100% equipado y con BPM.",
    dictamen: "aprobado",
    firmaProduccion: {
      firmado: true,
      nombre: "Carlos Mendoza",
      cargo: "Jefe de Producción",
      fecha: "30/09/2026 06:40",
    },
    firmaCalidad: {
      firmado: true,
      nombre: "Mariana Cárdenas",
      cargo: "Responsable de Control de Calidad",
      fecha: "30/09/2026 06:45",
    },
  },
  "galpon-8": {
    id: "AIO-G8-20260930-01",
    galponId: "galpon-8",
    areaMaquina: "área de procesos galpón 8",
    lineaNombre: "Línea de Procesamiento y Molienda de Yuca y Harinas",
    fecha: "2026-09-30",
    hora: "07:00",
    producto: "Harina Refinada de Yuca Grado Alimentario",
    sku: "AWK-HRY-1000G",
    ordenProduccion: "OP-2026-095",
    lote: "L-260930-Y1",
    requisitos: {
      despejeLimpieza: "cumple",
      sanitizacionEquipos: "cumple",
      materiaPrima: "cumple",
      seguridadHigiene: "cumple",
    },
    observaciones: "Molino y rebanadora con inspección visual limpia. Tolvas secas sin residuos de proceso previo.",
    dictamen: "aprobado",
    firmaProduccion: {
      firmado: true,
      nombre: "Carlos Mendoza",
      cargo: "Jefe de Producción",
      fecha: "30/09/2026 07:10",
    },
    firmaCalidad: {
      firmado: true,
      nombre: "Mariana Cárdenas",
      cargo: "Responsable de Control de Calidad",
      fecha: "30/09/2026 07:15",
    },
  },
};

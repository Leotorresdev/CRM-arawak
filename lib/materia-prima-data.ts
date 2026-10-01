// ==============================================================================
// ARAWAK - MÓDULO: MATERIA PRIMA (RECEPCIÓN Y PROCESAMIENTO)
// Control de Calidad e Inspección Técnica de Yuca y Cambur
// ==============================================================================

export type TipoCalibreYuca = "Calibre A (3,5 cm - 6,0 cm)" | "Calibre B (6,1 cm - 8,0 cm)" | "Calibre C (> 8,0 cm)";

export interface NormaCalidadMateriaPrima {
  parametro: string;
  especificacion: string;
  impactoCalidad: string;
}

export const normasCalibreYuca: NormaCalidadMateriaPrima[] = [
  {
    parametro: "Calibre A (Óptimo)",
    especificacion: "Entre 3,5 cm y 6,0 cm de diámetro.",
    impactoCalidad: "Ideal para rebanado homogéneo, deshidratación uniforme y rendimiento óptimo en hojuelas y harinas finas.",
  },
  {
    parametro: "Calibre B (Aceptable)",
    especificacion: "Entre 6,1 cm y 8,0 cm de diámetro.",
    impactoCalidad: "Apto para procesamiento y molienda. Requiere calibración de rodillos de corte.",
  },
  {
    parametro: "Calibre C (Especial)",
    especificacion: "Mayor a 8,0 cm de diámetro.",
    impactoCalidad: "Requiere troceado previo antes de alimentación a tolva para evitar atascos mecánicos.",
  },
  {
    parametro: "Corte Transversal",
    especificacion: "La pulpa debe verse totalmente blanca, limpia y libre de necrosis vascular.",
    impactoCalidad: "Evitar piezas con líneas o manchas grises, negras o marrones (deterioro enzimático o microbiológico).",
  },
  {
    parametro: "Corte Distal",
    especificacion: "El extremo más angosto de la yuca no debe superar los 2 cm de diámetro.",
    impactoCalidad: "Garantiza madurez fisiológica y minimiza el desperdicio leñoso en peladora.",
  },
];

export interface RegistroMateriaPrima {
  id: string;
  semanaRecepcion: string;
  anio: number;
  diasProcesado: string;
  
  // 1. Recepción
  tipoMateriaPrima: string;
  fechaLlegada: string;
  fechaProcesado: string;
  proveedor: string;
  cedula: string;
  placa: string;
  pesoCargaKg: number;
  origenCarga: string;
  calibre: TipoCalibreYuca;
  dedosClusterOEdad: string;
  evaluacionVisual: "Conforme (Pulpa totalmente blanca)" | "No Conforme (Líneas negras/grises)" | "Condicionado (Selección manual)";
  densidad: string;

  // 2. Proceso
  phMateriaPrima: number;
  acidoCitricoAscorbico: string;
  pulpa: string;
  brix: number;
  tiempoDeshidratacion: string;
  olor: "Característico fresco" | "Ligeramente ácido" | "Fermentado / Anormal";
  sabor: "Característico dulce/neutro" | "Ácido" | "Amargo / Desviación";
  reprocesadoKg: number;
  bajoObservacionKg: number;
  totalProcesadoKg: number;

  // 3. Observaciones
  observaciones: string;

  // 4. Firmas
  firmas: {
    calidad: {
      firmado: boolean;
      nombre: string;
      cargo: string;
      fecha: string;
    };
    supervisor: {
      firmado: boolean;
      nombre: string;
      cargo: string;
      fecha: string;
    };
    gerentePlanta: {
      firmado: boolean;
      nombre: string;
      cargo: string;
      fecha: string;
    };
  };
}

export const initialMateriaPrimaRegistro: RegistroMateriaPrima = {
  id: "MP-2026-W40-01",
  semanaRecepcion: "Semana 40 - 2026",
  anio: 2026,
  diasProcesado: "Lunes a Miércoles (3 días)",
  
  // Recepción
  tipoMateriaPrima: "Yuca Dulce Grado Alimentario (Manihot esculenta)",
  fechaLlegada: "2026-09-30",
  fechaProcesado: "2026-09-30",
  proveedor: "Agropecuaria El Palmar C.A.",
  cedula: "J-30948210-4",
  placa: "A82BC4K",
  pesoCargaKg: 4500,
  origenCarga: "Maturín, Estado Monagas",
  calibre: "Calibre A (3,5 cm - 6,0 cm)",
  dedosClusterOEdad: "11 meses de cosecha (Edad óptima de almidón)",
  evaluacionVisual: "Conforme (Pulpa totalmente blanca)",
  densidad: "1.14 g/cm³",

  // Proceso
  phMateriaPrima: 6.4,
  acidoCitricoAscorbico: "Solución antioxidante 1.5% (Inmersión 2 min)",
  pulpa: "Pulpa firme, rendimiento 71%, sin fibras leñosas",
  brix: 2.8,
  tiempoDeshidratacion: "7.5 horas @ 62°C (Humedad residual < 9%)",
  olor: "Característico fresco",
  sabor: "Característico dulce/neutro",
  reprocesadoKg: 85,
  bajoObservacionKg: 0,
  totalProcesadoKg: 4415,

  // Observaciones
  observaciones: "Lote de yuca con excelente turgencia y pulpa blanca inmaculada. Se aprobó recepción para molienda de harina refinada para galletas.",

  // Firmas
  firmas: {
    calidad: {
      firmado: true,
      nombre: "Ing. Laura Montilla",
      cargo: "Jefe de Control de Calidad e Inocuidad",
      fecha: "30/09/2026 09:15",
    },
    supervisor: {
      firmado: true,
      nombre: "Carlos Mendoza",
      cargo: "Supervisor de Producción Galpón 8",
      fecha: "30/09/2026 09:30",
    },
    gerentePlanta: {
      firmado: false,
      nombre: "Ing. Roberto Salazar",
      cargo: "Gerente de Planta Arawak",
      fecha: "",
    },
  },
};

export const historicoRecepcionesMock: RegistroMateriaPrima[] = [
  initialMateriaPrimaRegistro,
  {
    id: "MP-2026-W39-02",
    semanaRecepcion: "Semana 39 - 2026",
    anio: 2026,
    diasProcesado: "Jueves a Viernes (2 días)",
    tipoMateriaPrima: "Cambur Verde Prebiótico (Musa acuminata)",
    fechaLlegada: "2026-09-24",
    fechaProcesado: "2026-09-24",
    proveedor: "Finca La Esperanza",
    cedula: "V-14.892.304",
    placa: "B12MN8D",
    pesoCargaKg: 3200,
    origenCarga: "Nirgua, Estado Yaracuy",
    calibre: "Calibre B (6,1 cm - 8,0 cm)",
    dedosClusterOEdad: "6 a 8 dedos por cluster (Verde grado 1-2)",
    evaluacionVisual: "Conforme (Pulpa totalmente blanca)",
    densidad: "1.08 g/cm³",
    phMateriaPrima: 5.8,
    acidoCitricoAscorbico: "Ácido cítrico 2.0%",
    pulpa: "Pulpa almidonosa verde para harina alta en fibra prebiótica",
    brix: 4.2,
    tiempoDeshidratacion: "8.0 horas @ 58°C",
    olor: "Característico fresco",
    sabor: "Característico dulce/neutro",
    reprocesadoKg: 40,
    bajoObservacionKg: 20,
    totalProcesadoKg: 3140,
    observaciones: "Recepción de cambur verde en estado óptimo sin maduración prematura.",
    firmas: {
      calidad: {
        firmado: true,
        nombre: "Mariana Cárdenas",
        cargo: "Inspector QA Planta",
        fecha: "24/09/2026 10:20",
      },
      supervisor: {
        firmado: true,
        nombre: "Carlos Mendoza",
        cargo: "Supervisor de Producción",
        fecha: "24/09/2026 10:45",
      },
      gerentePlanta: {
        firmado: true,
        nombre: "Ing. Roberto Salazar",
        cargo: "Gerente de Planta Arawak",
        fecha: "24/09/2026 14:00",
      },
    },
  },
];

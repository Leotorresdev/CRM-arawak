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
  id: `MP-${new Date().getFullYear()}-01`,
  semanaRecepcion: "Semana 40 - 2026",
  anio: 2026,
  diasProcesado: "",
  
  // Recepción
  tipoMateriaPrima: "Yuca Dulce Grado Alimentario (Manihot esculenta)",
  fechaLlegada: new Date().toISOString().split("T")[0],
  fechaProcesado: new Date().toISOString().split("T")[0],
  proveedor: "",
  cedula: "",
  placa: "",
  pesoCargaKg: 0,
  origenCarga: "",
  calibre: "Calibre A (3,5 cm - 6,0 cm)",
  dedosClusterOEdad: "",
  evaluacionVisual: "Conforme (Pulpa totalmente blanca)",
  densidad: "",

  // Proceso
  phMateriaPrima: 0,
  acidoCitricoAscorbico: "",
  pulpa: "",
  brix: 0,
  tiempoDeshidratacion: "",
  olor: "Característico fresco",
  sabor: "Característico dulce/neutro",
  reprocesadoKg: 0,
  bajoObservacionKg: 0,
  totalProcesadoKg: 0,

  // Observaciones
  observaciones: "",

  // Firmas
  firmas: {
    calidad: {
      firmado: false,
      nombre: "",
      cargo: "",
      fecha: "",
    },
    supervisor: {
      firmado: false,
      nombre: "",
      cargo: "",
      fecha: "",
    },
    gerentePlanta: {
      firmado: false,
      nombre: "",
      cargo: "",
      fecha: "",
    },
  },
};

export const historicoRecepcionesMock: RegistroMateriaPrima[] = [];

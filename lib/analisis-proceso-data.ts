// ==============================================================================
// ARAWAK - MÓDULO: ANÁLISIS DE PROCESO
// Control de Calidad en Línea, Fisicoquímico y Liberación de Bachs
// ==============================================================================

export interface ParametroAnalisis {
  id: string;
  nombre: string;
  unidad: string;
  especificacion?: string;
  valor: string;
  estado: "conforme" | "desviacion" | "critico";
}

export interface RegistroAnalisisProceso {
  id: string;
  userId: string;
  userNombre: string;
  semana: string;
  anio: number;
  fecha: string;
  producto: "GALLETA" | "TORTILLA" | "NACHO" | "ATOL" | "HARINA CAMBUR" | "HARINA YUCA" | string;
  lote: string;
  fechaFabricacion: string;
  fechaVencimiento: string;
  cantidadBachs: number;
  pesosBachs: number[];
  
  // Lista dinámica de parámetros (Campos modificables, eliminables y creables)
  parametros: ParametroAnalisis[];

  // Totales y Balances (Ruptura/Rechazado DESCARTADO según instrucción)
  productoAceptadoKg: number;
  productoRechazadoKg: number;
  totalProducidoKg: number;
  temperaturaAmbienteC: number;
  observaciones: string;
  dictamen: "aceptado" | "rechazado" | "pendiente";

  // Firmas de Responsabilidad
  firmas: {
    inspector: {
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

export const productosArawakProceso = [
  "GALLETA",
  "TORTILLA",
  "NACHO",
  "ATOL",
  "HARINA CAMBUR",
  "HARINA YUCA",
];

// Parámetros extraídos del Excel ANÁLISIS DE PROCESO (Filas 13-28)
// OMITIENDO RUPTURA / RECHAZADO por instrucción expresa del usuario
export const parametrosAnalisisBase: ParametroAnalisis[] = [
  {
    id: "param_hum_chip",
    nombre: "HUMEDAD DEL CHIP",
    unidad: "%",
    especificacion: "Entre 6.0% y 8.5%",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_hum_molino",
    nombre: "HUMEDAD DEL MOLINO",
    unidad: "%",
    especificacion: "Entre 7.0% y 9.0%",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_hum_mezcla",
    nombre: "HUMEDAD DE LA MEZCLA",
    unidad: "%",
    especificacion: "Entre 12.0% y 15.0%",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_hum_masa",
    nombre: "HUMEDAD DE LA MASA",
    unidad: "%",
    especificacion: "Entre 18.0% y 22.0%",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_hum_pt",
    nombre: "HUMEDAD DEL PT. (Producto Terminado)",
    unidad: "%",
    especificacion: "Máximo 4.5%",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_var_hum",
    nombre: "VARIANZA DE HUMEDAD",
    unidad: "%",
    especificacion: "< 0.5%",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_densidad",
    nombre: "DENSIDAD",
    unidad: "g/cm³",
    especificacion: "0.85 - 1.05 g/cm³",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_brix",
    nombre: "°BRIX",
    unidad: "°Bx",
    especificacion: "2.0 - 4.5 °Bx",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_peso_crudo",
    nombre: "PESO DE LA PORCIÓN CRUDA",
    unidad: "g",
    especificacion: "18.0 ± 1.0 g",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_peso_cocido",
    nombre: "PESO DE LA PORCIÓN COCIDA",
    unidad: "g",
    especificacion: "14.5 ± 0.8 g",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_ph_agua",
    nombre: "pH DEL AGUA",
    unidad: "pH",
    especificacion: "6.5 - 7.5",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_ph_masa",
    nombre: "pH DE MASA",
    unidad: "pH",
    especificacion: "6.0 - 6.8",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_ox_termica",
    nombre: "OXIDACIÓN TÉRMICA ACELERADA",
    unidad: "Escala 1 - 5",
    especificacion: "Nivel 1 (Sin rancidez ni pardeamiento)",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_organoleptico",
    nombre: "ORGANOLÉPTICO (Color, olor, textura)",
    unidad: "Escala 1 - 5",
    especificacion: "Grado 5 (Excelente textura y crocancia)",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_peso_empaque",
    nombre: "PESO DEL EMPAQUE",
    unidad: "g",
    especificacion: "150.0 g ± 2.0 g",
    valor: "",
    estado: "conforme",
  },
  {
    id: "param_sellado_empaque",
    nombre: "SELLADO DEL EMPAQUE",
    unidad: "Visual/Presión",
    especificacion: "100% Hermético sin fugas",
    valor: "",
    estado: "conforme",
  },
];

export function crearRegistroInicialAnalisis(userId: string, userNombre: string): RegistroAnalisisProceso {
  const d = new Date();
  const fechaHoy = d.toISOString().split("T")[0];
  const dVence = new Date();
  dVence.setMonth(dVence.getMonth() + 6);
  const fechaVence = dVence.toISOString().split("T")[0];

  return {
    id: `AP-${Date.now().toString().slice(-6)}`,
    userId,
    userNombre,
    semana: "Semana 40 - 2026",
    anio: 2026,
    fecha: fechaHoy,
    producto: "GALLETA",
    lote: "",
    fechaFabricacion: fechaHoy,
    fechaVencimiento: fechaVence,
    cantidadBachs: 0,
    pesosBachs: [],
    parametros: parametrosAnalisisBase.map((p) => ({ ...p })),
    productoAceptadoKg: 0,
    productoRechazadoKg: 0,
    totalProducidoKg: 0,
    temperaturaAmbienteC: 0,
    observaciones: "",
    dictamen: "aceptado",
    firmas: {
      inspector: {
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
}

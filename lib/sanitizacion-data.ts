// ==============================================================================
// ARAWAK - SISTEMA DE CONTROL DE CALIDAD E INOCUIDAD
// Galletas y Productos Derivados Sin Gluten de Cambur y Yuca
// ==============================================================================

export interface RegistroDia {
  lunes: boolean;
  martes: boolean;
  miercoles: boolean;
  jueves: boolean;
  viernes: boolean;
  sabado: boolean;
  observaciones: string;
}

export interface ItemFormulario {
  id: number;
  parametro: string;
  especificacion?: string;
  valoresDias: RegistroDia;
}

export interface FormularioSemanal {
  id: string;
  semana: string;
  anio: number;
  fechaInicio: string;
  fechaFin: string;
  area: string;
  firmaCalidad: {
    firmado: boolean;
    nombre: string;
    fecha: string;
    cargo: string;
  };
  firmaGerencia: {
    firmado: boolean;
    nombre: string;
    fecha: string;
    cargo: string;
  };
  items: ItemFormulario[];
}

// 1. REGISTRO SEMANAL DE HIGIENE DEL PERSONAL (CONTROL VISUAL)
export const parametrosHigienePersonal: { id: number; parametro: string }[] = [
  { id: 1, parametro: "1. Uniforme limpio, completo y uso de gorro/redecilla." },
  { id: 2, parametro: "2. Ausencia absoluta de joyas, relojes y maquillaje." },
  { id: 3, parametro: "3. Uñas cortas, limpias y sin rastro de esmalte. Barba rasurada." },
  { id: 4, parametro: "4. Heridas y cortes cubiertos con vendaje impermeable." },
  { id: 5, parametro: "5. Lavado de manos riguroso ante cambios de actividad." },
  { id: 6, parametro: "6. Prohibición estricta de comer/fumar/salivar en planta." },
  { id: 7, parametro: "7. Ropa de calle depositada de forma segura en vestuarios." },
];

// 2. REGISTRO SEMANAL DE SANEAMIENTO OPERACIONAL DE PLANTA
export const parametrosSaneamientoOperacional: { id: number; parametro: string; especificacion?: string }[] = [
  { id: 1, parametro: "1. Abastecimiento de agua limpia", especificacion: "Rango: 0.2 - 5.0 ppm Cloro" },
  { id: 2, parametro: "2. Desinfección de mesones y equipos", especificacion: "> 100 ppm de desinfectante" },
  { id: 3, parametro: "3. Prevención de contaminación cruzada", especificacion: "Flujo de empaque separado · Sin Gluten" },
  { id: 4, parametro: "4. Pediluvios operativos", especificacion: "Concentración: 200 ppm" },
  { id: 5, parametro: "5. Lavamanos y sanitarios limpios y equipados con jabón", especificacion: "Dotación continua" },
  { id: 6, parametro: "6. Rotulado y almacenamiento segregado de agentes químicos", especificacion: "Área restringida" },
  { id: 7, parametro: "7. Estaciones de control de plagas despejadas e intactas", especificacion: "MIP Operativo" },
];

// Generar semana estándar inicial
export function getSemanaActual(): { numero: number; anio: number; inicio: string; fin: string; texto: string } {
  const hoy = new Date();
  const primerDiaSemana = new Date(hoy);
  const diaSemana = hoy.getDay();
  const diff = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); // Lunes
  primerDiaSemana.setDate(diff);

  const sabado = new Date(primerDiaSemana);
  sabado.setDate(primerDiaSemana.getDate() + 5); // Sábado

  const inicioStr = primerDiaSemana.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const finStr = sabado.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

  return {
    numero: 40,
    anio: 2026,
    inicio: inicioStr,
    fin: finStr,
    texto: `Semana 40 (${inicioStr} - ${finStr})`,
  };
}

export const initialHigieneData: ItemFormulario[] = parametrosHigienePersonal.map(p => ({
  id: p.id,
  parametro: p.parametro,
  valoresDias: {
    lunes: true,
    martes: true,
    miercoles: true,
    jueves: true,
    viernes: true,
    sabado: false,
    observaciones: "",
  },
}));

export const initialSaneamientoData: ItemFormulario[] = parametrosSaneamientoOperacional.map(p => ({
  id: p.id,
  parametro: p.parametro,
  especificacion: p.especificacion,
  valoresDias: {
    lunes: true,
    martes: true,
    miercoles: true,
    jueves: true,
    viernes: true,
    sabado: false,
    observaciones: p.id === 1 ? "Cloro libre en 1.4 ppm verificado" : "",
  },
}));

export const arawakKpis = [
  {
    titulo: "Saneamiento de Planta",
    cumplimiento: "97.6%",
    estado: "Conforme",
    detalle: "7 de 7 parámetros operativos verificados",
  },
  {
    titulo: "Higiene BPM de Personal",
    cumplimiento: "100%",
    estado: "Excelente",
    detalle: "Control visual de esclusa sin desvíos",
  },
  {
    titulo: "Línea Libre de Gluten",
    cumplimiento: "< 5 ppm",
    estado: "Apto Sin TACC",
    detalle: "Harina de Cambur y Yuca 100% segregada",
  },
  {
    titulo: "Cloro Residual en Red",
    cumplimiento: "1.4 ppm",
    estado: "En Rango",
    detalle: "Norma: 0.2 - 5.0 ppm Cloro libre",
  },
];

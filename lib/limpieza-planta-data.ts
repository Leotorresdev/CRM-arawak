// ==============================================================================
// ARAWAK - MÓDULO: LIMPIEZA DE PLANTA
// POES (Procedimientos Operativos Estandarizados de Saneamiento)
// ==============================================================================

export interface AreaEquipoLimpieza {
  id: number;
  nombre: string;
  frecuencia: string;
  categoria: "Almacén" | "Producción Galletas/Tortillas" | "Procesamiento de Yuca" | "Instalaciones";
}

export interface PasoLimpieza {
  paso: number;
  titulo: string;
  descripcion: string;
  quimico?: string;
}

export interface RegistroEjecucion8Pasos {
  areaId: number;
  turnoResponsable: string;
  paso1_prelimpiezaSeco: boolean;
  paso2_enjuagueInicialAgua: boolean;
  paso3_aplicacionDetergente: boolean;
  paso4_fregadoContacto: boolean;
  paso5_enjuagueFinalJabon: boolean;
  paso6_aplicacionDesinfectante: boolean;
  paso7_enjuagueFinalDesinfectante: boolean;
  paso8_secado: boolean;
  observaciones: string;
}

export interface RegistroInspeccionCalidad {
  areaId: number;
  conforme: boolean;
  noConforme: boolean;
  correctivo: boolean;
  accionCorrectiva: string;
  observacionArea: string;
}

export const pasosProcedimientoLimpieza: PasoLimpieza[] = [
  {
    paso: 1,
    titulo: "Prelimpieza (Limpieza en Seco)",
    descripcion: "Retirar manualmente o con herramientas secas (escobas, palas) los residuos y desechos sólidos y visibles del equipo y la superficie.",
  },
  {
    paso: 2,
    titulo: "Enjuague Inicial (AGUA)",
    descripcion: "Aplicar agua potable para retirar el residuo suelto restante.",
  },
  {
    paso: 3,
    titulo: "Aplicación de Detergente",
    descripcion: "Aplicar la solución jabonosa neutra 1 litro aproximadamente en toda el Área.",
    quimico: "Detergente Neutro / Alcalino Grado Alimentario",
  },
  {
    paso: 4,
    titulo: "Fregado / Tiempo de Contacto",
    descripcion: "Fregar la superficie para desprender la suciedad adherida, respetando el tiempo de contacto químico.",
  },
  {
    paso: 5,
    titulo: "Enjuague Final (JABÓN)",
    descripcion: "Eliminar completamente los residuos de detergente con abundante agua potable.",
  },
  {
    paso: 6,
    titulo: "Aplicación de Desinfectante",
    descripcion: "Aplicar la solución desinfectante aprobada (amonio cuaternario / ácido peracético).",
    quimico: "Amonio Cuaternario (> 100 ppm)",
  },
  {
    paso: 7,
    titulo: "Enjuague Final (Desinfectante)",
    descripcion: "Enjuagar con agua potable si el desinfectante lo requiere (para evitar la contaminación química por residuos).",
  },
  {
    paso: 8,
    titulo: "Secado",
    descripcion: "Dejar secar al aire libre (el método más seguro) o usar paños desechables y limpios para secar superficies críticas.",
  },
];

export const areasEquiposLimpieza: AreaEquipoLimpieza[] = [
  { id: 1, nombre: "ALMACEN DE INSUMOS", frecuencia: "Diaria", categoria: "Almacén" },
  { id: 2, nombre: "AREA DE PRODUCCIÓN", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 3, nombre: "MEZCLADORA DE MASA (GALLETAS)", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 4, nombre: "FORMADORA DE GALLETAS", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 5, nombre: "MESAS DE ACERO INOXIDABLE", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 6, nombre: "HORNOS DE GALLETA", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 7, nombre: "ENVASADORA DE GALLETAS", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 8, nombre: "CARROS HORNEROS Y BANDEJAS", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 9, nombre: "MEZCLADORA DE MASA (TORTILLA)", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 10, nombre: "FORMADORA DE TORTILLAS Y LINEA DE ENFRIAMIENTO", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 11, nombre: "MEZCLADORA DE HARINAS", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 12, nombre: "TOLVAS Y MOTORES DE HARINA", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 13, nombre: "ENVASADORA DE HARINAS", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 14, nombre: "BANDAS DE PRODUCTO ENVASADO", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 15, nombre: "BALANZAS", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 16, nombre: "INSTRUMENTOS DE PRODUCCIÓN (GALLETAS/TORTILLAS)", frecuencia: "Diaria", categoria: "Producción Galletas/Tortillas" },
  { id: 17, nombre: "ALMACEN DE DESPACHO Y P.T.", frecuencia: "Diaria", categoria: "Almacén" },
  { id: 18, nombre: "MESAS Y BATEAS DE ACERO INOXIDABLE (ALMACEN DE P.T.)", frecuencia: "Diaria", categoria: "Almacén" },
  { id: 19, nombre: "PALLETS PLASTICAS", frecuencia: "Sábados", categoria: "Almacén" },
  { id: 20, nombre: "CESTAS RETORNABLES", frecuencia: "Miércoles y Viernes", categoria: "Almacén" },
  { id: 21, nombre: "CORTINAS PLASTICAS (8)", frecuencia: "Diaria", categoria: "Instalaciones" },
  { id: 22, nombre: "AREA DE RECEPCIÓN Y PROCESO DE M.P.", frecuencia: "Diaria", categoria: "Procesamiento de Yuca" },
  { id: 23, nombre: "PRELAVADORA DE YUCA", frecuencia: "Diaria", categoria: "Procesamiento de Yuca" },
  { id: 24, nombre: "CINTAS TRANSPORTADORAS (4)", frecuencia: "Diaria", categoria: "Procesamiento de Yuca" },
  { id: 25, nombre: "PELADORA DE RODILLOS", frecuencia: "Diaria", categoria: "Procesamiento de Yuca" },
  { id: 26, nombre: "LAVADORA DE INMERSIÓN Y AIRE", frecuencia: "Diaria", categoria: "Procesamiento de Yuca" },
  { id: 27, nombre: "REBANADORA", frecuencia: "Diaria", categoria: "Procesamiento de Yuca" },
  { id: 28, nombre: "HORNOS DE DESHIDRATACIÓN", frecuencia: "Sábados", categoria: "Procesamiento de Yuca" },
  { id: 29, nombre: "CARROS Y BANDEJAS DE DESHIDRATACIÓN", frecuencia: "Sábados", categoria: "Procesamiento de Yuca" },
  { id: 30, nombre: "MOLINO DE HARINAS", frecuencia: "Diaria", categoria: "Procesamiento de Yuca" },
  { id: 31, nombre: "MESAS DE ACERO INOXIDABLE Y BATEAS (AREA SUCIA)", frecuencia: "Diaria", categoria: "Procesamiento de Yuca" },
  { id: 32, nombre: "DRENAJES", frecuencia: "Viernes", categoria: "Instalaciones" },
  { id: 33, nombre: "MEZANINA", frecuencia: "Sábados", categoria: "Instalaciones" },
];

export const initialEjecucionData: Record<number, RegistroEjecucion8Pasos> = areasEquiposLimpieza.reduce(
  (acc, area) => {
    acc[area.id] = {
      areaId: area.id,
      turnoResponsable: "Turno Mañana (06:00 - 14:00)",
      paso1_prelimpiezaSeco: false,
      paso2_enjuagueInicialAgua: false,
      paso3_aplicacionDetergente: false,
      paso4_fregadoContacto: false,
      paso5_enjuagueFinalJabon: false,
      paso6_aplicacionDesinfectante: false,
      paso7_enjuagueFinalDesinfectante: false,
      paso8_secado: false,
      observaciones: "",
    };
    return acc;
  },
  {} as Record<number, RegistroEjecucion8Pasos>
);

export const initialInspeccionData: Record<number, RegistroInspeccionCalidad> = areasEquiposLimpieza.reduce(
  (acc, area) => {
    acc[area.id] = {
      areaId: area.id,
      conforme: false,
      noConforme: false,
      correctivo: false,
      accionCorrectiva: "",
      observacionArea: "",
    };
    return acc;
  },
  {} as Record<number, RegistroInspeccionCalidad>
);

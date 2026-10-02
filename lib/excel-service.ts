import * as XLSX from "xlsx";
import { ItemFormulario } from "./sanitizacion-data";
import { AreaEquipoLimpieza, RegistroEjecucion8Pasos, RegistroInspeccionCalidad } from "./limpieza-planta-data";
import { ActaInicioOperaciones } from "./arranque-operaciones-data";
import { RegistroMateriaPrima } from "./materia-prima-data";
import { RegistroAnalisisProceso } from "./analisis-proceso-data";

// ==============================================================================
// 1. FORMATO DE SANITIZACIÓN (EXPORT / IMPORT)
// ==============================================================================

export function exportarSanitizacionExcel(
  saneamiento: ItemFormulario[],
  higiene: ItemFormulario[],
  semanaTexto: string,
  firmaSanitizacion: any
) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Saneamiento Operacional
  const rowsSan = [
    ["ARAWAK C.A. - REGISTRO SEMANAL DE SANEAMIENTO OPERACIONAL DE PLANTA"],
    [`Período: ${semanaTexto}`],
    [`Firma Control de Calidad: ${firmaSanitizacion?.firmado ? firmaSanitizacion.inspector + " (" + firmaSanitizacion.fecha + ")" : "Pendiente"}`],
    [],
    ["ID", "Parámetro Operativo", "Especificación Técnica", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Observaciones"],
    ...saneamiento.map((item) => [
      item.id,
      item.parametro,
      item.especificacion || "Conforme",
      item.valoresDias.lunes ? "C" : "NC",
      item.valoresDias.martes ? "C" : "NC",
      item.valoresDias.miercoles ? "C" : "NC",
      item.valoresDias.jueves ? "C" : "NC",
      item.valoresDias.viernes ? "C" : "NC",
      item.valoresDias.sabado ? "C" : "NC",
      item.valoresDias.observaciones || "",
    ]),
  ];
  const wsSan = XLSX.utils.aoa_to_sheet(rowsSan);
  wsSan["!cols"] = [{ wch: 6 }, { wch: 45 }, { wch: 30 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsSan, "Saneamiento Operacional");

  // Hoja 2: Higiene del Personal
  const rowsHig = [
    ["ARAWAK C.A. - REGISTRO SEMANAL DE HIGIENE DEL PERSONAL (BPM)"],
    [`Período: ${semanaTexto}`],
    [],
    ["ID", "Control Visual de Higiene Personal", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Observaciones"],
    ...higiene.map((item) => [
      item.id,
      item.parametro,
      item.valoresDias.lunes ? "C" : "NC",
      item.valoresDias.martes ? "C" : "NC",
      item.valoresDias.miercoles ? "C" : "NC",
      item.valoresDias.jueves ? "C" : "NC",
      item.valoresDias.viernes ? "C" : "NC",
      item.valoresDias.sabado ? "C" : "NC",
      item.valoresDias.observaciones || "",
    ]),
  ];
  const wsHig = XLSX.utils.aoa_to_sheet(rowsHig);
  wsHig["!cols"] = [{ wch: 6 }, { wch: 55 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsHig, "Higiene Personal");

  XLSX.writeFile(wb, `Arawak_Sanitizacion_${new Date().toISOString().split("T")[0]}.xlsx`);
}

export async function importarSanitizacionExcel(file: File): Promise<{ saneamientoItems?: Partial<ItemFormulario>[]; higieneItems?: Partial<ItemFormulario>[] }> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const result: { saneamientoItems?: Partial<ItemFormulario>[]; higieneItems?: Partial<ItemFormulario>[] } = {};

  const sheetSan = wb.Sheets["Saneamiento Operacional"] || wb.Sheets[wb.SheetNames[0]];
  if (sheetSan) {
    const rawData = XLSX.utils.sheet_to_json<any>(sheetSan, { header: 1 });
    const items: any[] = [];
    const headerRowIndex = rawData.findIndex((row: any) => Array.isArray(row) && row.some((c: any) => String(c).includes("Parámetro") || String(c).includes("Lunes")));
    
    if (headerRowIndex >= 0) {
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || !row[1]) continue;
        const id = Number(row[0]) || items.length + 1;
        items.push({
          id,
          parametro: String(row[1]),
          especificacion: row[2] ? String(row[2]) : undefined,
          valoresDias: {
            lunes: String(row[3]).toUpperCase() === "C" || String(row[3]).toUpperCase() === "SI" || row[3] === true || row[3] === 1,
            martes: String(row[4]).toUpperCase() === "C" || String(row[4]).toUpperCase() === "SI" || row[4] === true || row[4] === 1,
            miercoles: String(row[5]).toUpperCase() === "C" || String(row[5]).toUpperCase() === "SI" || row[5] === true || row[5] === 1,
            jueves: String(row[6]).toUpperCase() === "C" || String(row[6]).toUpperCase() === "SI" || row[6] === true || row[6] === 1,
            viernes: String(row[7]).toUpperCase() === "C" || String(row[7]).toUpperCase() === "SI" || row[7] === true || row[7] === 1,
            sabado: String(row[8]).toUpperCase() === "C" || String(row[8]).toUpperCase() === "SI" || row[8] === true || row[8] === 1,
            observaciones: row[9] ? String(row[9]) : "",
          },
        });
      }
      if (items.length > 0) result.saneamientoItems = items;
    }
  }

  const sheetHig = wb.Sheets["Higiene Personal"] || (wb.SheetNames.length > 1 ? wb.Sheets[wb.SheetNames[1]] : null);
  if (sheetHig) {
    const rawData = XLSX.utils.sheet_to_json<any>(sheetHig, { header: 1 });
    const items: any[] = [];
    const headerRowIndex = rawData.findIndex((row: any) => Array.isArray(row) && row.some((c: any) => String(c).includes("Higiene") || String(c).includes("Lunes")));
    
    if (headerRowIndex >= 0) {
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || !row[1]) continue;
        const id = Number(row[0]) || items.length + 1;
        items.push({
          id,
          parametro: String(row[1]),
          valoresDias: {
            lunes: String(row[2]).toUpperCase() === "C" || String(row[2]).toUpperCase() === "SI" || row[2] === true || row[2] === 1,
            martes: String(row[3]).toUpperCase() === "C" || String(row[3]).toUpperCase() === "SI" || row[3] === true || row[3] === 1,
            miercoles: String(row[4]).toUpperCase() === "C" || String(row[4]).toUpperCase() === "SI" || row[4] === true || row[4] === 1,
            jueves: String(row[5]).toUpperCase() === "C" || String(row[5]).toUpperCase() === "SI" || row[5] === true || row[5] === 1,
            viernes: String(row[6]).toUpperCase() === "C" || String(row[6]).toUpperCase() === "SI" || row[6] === true || row[6] === 1,
            sabado: String(row[7]).toUpperCase() === "C" || String(row[7]).toUpperCase() === "SI" || row[7] === true || row[7] === 1,
            observaciones: row[8] ? String(row[8]) : "",
          },
        });
      }
      if (items.length > 0) result.higieneItems = items;
    }
  }

  return result;
}

// ==============================================================================
// 2. LIMPIEZA DE PLANTA (POES 8 PASOS & INSPECCIÓN)
// ==============================================================================

export function exportarLimpiezaPlantaExcel(
  ejecucion: Record<number, RegistroEjecucion8Pasos>,
  inspeccion: Record<number, RegistroInspeccionCalidad>,
  areas: AreaEquipoLimpieza[],
  fechaLimpieza: string,
  turno: string,
  firmaCalidad: any
) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Cuadro 1 - Ejecución 8 Pasos
  const rowsEj = [
    ["ARAWAK C.A. - POES CUADRO 1: EJECUCIÓN TÉCNICA DE 8 PASOS DE LIMPIEZA"],
    [`Fecha: ${fechaLimpieza}`, `Turno: ${turno}`],
    [`Inspector Calidad: ${firmaCalidad?.firmado ? firmaCalidad.nombre + " (" + firmaCalidad.fecha + ")" : "Pendiente"}`],
    [],
    [
      "ID",
      "Área / Equipo",
      "Categoría",
      "Frecuencia",
      "1. Prelimpieza",
      "2. Enjuague Ini.",
      "3. Detergente",
      "4. Fregado",
      "5. Enjuague Jabón",
      "6. Desinfectante",
      "7. Enjuague Desinf.",
      "8. Secado",
      "Observaciones",
    ],
    ...areas.map((a) => {
      const ej = ejecucion[a.id];
      return [
        a.id,
        a.nombre,
        a.categoria,
        a.frecuencia,
        ej?.paso1_prelimpiezaSeco ? "SI" : "NO",
        ej?.paso2_enjuagueInicialAgua ? "SI" : "NO",
        ej?.paso3_aplicacionDetergente ? "SI" : "NO",
        ej?.paso4_fregadoContacto ? "SI" : "NO",
        ej?.paso5_enjuagueFinalJabon ? "SI" : "NO",
        ej?.paso6_aplicacionDesinfectante ? "SI" : "NO",
        ej?.paso7_enjuagueFinalDesinfectante ? "SI" : "NO",
        ej?.paso8_secado ? "SI" : "NO",
        ej?.observaciones || "",
      ];
    }),
  ];
  const wsEj = XLSX.utils.aoa_to_sheet(rowsEj);
  wsEj["!cols"] = [{ wch: 6 }, { wch: 45 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsEj, "Ejecución 8 Pasos");

  // Hoja 2: Cuadro 2 - Inspección de Calidad
  const rowsInsp = [
    ["ARAWAK C.A. - POES CUADRO 2: INSPECCIÓN Y LIBERACIÓN DE CALIDAD DE PLANTA"],
    [`Fecha: ${fechaLimpieza}`],
    [],
    ["ID", "Área / Equipo", "Categoría", "Frecuencia", "Conforme", "No Conforme", "Correctivo", "Acción Correctiva", "Observación QA"],
    ...areas.map((a) => {
      const ins = inspeccion[a.id];
      return [
        a.id,
        a.nombre,
        a.categoria,
        a.frecuencia,
        ins?.conforme ? "CONFORME" : "",
        ins?.noConforme ? "NO CONFORME" : "",
        ins?.correctivo ? "CORRECTIVO" : "",
        ins?.accionCorrectiva || "",
        ins?.observacionArea || "",
      ];
    }),
  ];
  const wsInsp = XLSX.utils.aoa_to_sheet(rowsInsp);
  wsInsp["!cols"] = [{ wch: 6 }, { wch: 45 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 35 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsInsp, "Inspección Calidad");

  XLSX.writeFile(wb, `Arawak_Limpieza_POES_${fechaLimpieza}.xlsx`);
}

export async function importarLimpiezaPlantaExcel(file: File): Promise<{
  ejecucion?: Record<number, Partial<RegistroEjecucion8Pasos>>;
  inspeccion?: Record<number, Partial<RegistroInspeccionCalidad>>;
}> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const result: {
    ejecucion?: Record<number, Partial<RegistroEjecucion8Pasos>>;
    inspeccion?: Record<number, Partial<RegistroInspeccionCalidad>>;
  } = {};

  const sheetEj = wb.Sheets["Ejecución 8 Pasos"] || wb.Sheets[wb.SheetNames[0]];
  if (sheetEj) {
    const rawData = XLSX.utils.sheet_to_json<any>(sheetEj, { header: 1 });
    const headerRowIndex = rawData.findIndex((row: any) => Array.isArray(row) && row.some((c: any) => String(c).includes("Prelimpieza") || String(c).includes("Área")));
    if (headerRowIndex >= 0) {
      const ejecucionMap: Record<number, any> = {};
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row[0] === undefined) continue;
        const id = Number(row[0]);
        if (!id) continue;
        ejecucionMap[id] = {
          paso1_prelimpiezaSeco: String(row[4]).toUpperCase() === "SI" || row[4] === 1 || row[4] === true,
          paso2_enjuagueInicialAgua: String(row[5]).toUpperCase() === "SI" || row[5] === 1 || row[5] === true,
          paso3_aplicacionDetergente: String(row[6]).toUpperCase() === "SI" || row[6] === 1 || row[6] === true,
          paso4_fregadoContacto: String(row[7]).toUpperCase() === "SI" || row[7] === 1 || row[7] === true,
          paso5_enjuagueFinalJabon: String(row[8]).toUpperCase() === "SI" || row[8] === 1 || row[8] === true,
          paso6_aplicacionDesinfectante: String(row[9]).toUpperCase() === "SI" || row[9] === 1 || row[9] === true,
          paso7_enjuagueFinalDesinfectante: String(row[10]).toUpperCase() === "SI" || row[10] === 1 || row[10] === true,
          paso8_secado: String(row[11]).toUpperCase() === "SI" || row[11] === 1 || row[11] === true,
          observaciones: row[12] ? String(row[12]) : "",
        };
      }
      result.ejecucion = ejecucionMap;
    }
  }

  const sheetInsp = wb.Sheets["Inspección Calidad"] || (wb.SheetNames.length > 1 ? wb.Sheets[wb.SheetNames[1]] : null);
  if (sheetInsp) {
    const rawData = XLSX.utils.sheet_to_json<any>(sheetInsp, { header: 1 });
    const headerRowIndex = rawData.findIndex((row: any) => Array.isArray(row) && row.some((c: any) => String(c).includes("Conforme") || String(c).includes("Acción")));
    if (headerRowIndex >= 0) {
      const inspMap: Record<number, any> = {};
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row[0] === undefined) continue;
        const id = Number(row[0]);
        if (!id) continue;
        const conf = String(row[4]).toUpperCase().includes("CONFORME") || row[4] === true;
        const noConf = String(row[5]).toUpperCase().includes("NO") || row[5] === true;
        const corr = String(row[6]).toUpperCase().includes("CORRECTIVO") || row[6] === true;
        inspMap[id] = {
          conforme: conf,
          noConforme: noConf,
          correctivo: corr,
          accionCorrectiva: row[7] ? String(row[7]) : "",
          observacionArea: row[8] ? String(row[8]) : "",
        };
      }
      result.inspeccion = inspMap;
    }
  }

  return result;
}

// ==============================================================================
// 3. ARRANQUE DE OPERACIONES (GALPÓN 9 & GALPÓN 8)
// ==============================================================================

export function exportarArranqueOperacionesExcel(actas: Record<"galpon-9" | "galpon-8", ActaInicioOperaciones>) {
  const wb = XLSX.utils.book_new();

  for (const [key, acta] of Object.entries(actas)) {
    const nombreGalpon = key === "galpon-9" ? "Galpón 9 (Galletas)" : "Galpón 8 (Harinas y Yuca)";
    const rows = [
      ["ARAWAK C.A. - ACTA DE LIBERACIÓN DE INICIO DE OPERACIONES (AIO)"],
      [`Línea: ${nombreGalpon}`, `Fecha: ${acta.fecha}`, `Hora: ${acta.hora}`],
      [`Producto a Elaborar: ${acta.producto}`, `SKU: ${acta.sku}`],
      [`Orden de Producción: ${acta.ordenProduccion}`, `Lote Programado: ${acta.lote}`],
      [`Dictamen QA: ${acta.dictamen.toUpperCase()}`],
      [],
      ["Requisito de Arranque Operativo", "Evaluación de Calidad"],
      ["1. Despeje de Línea y Limpieza Previa", acta.requisitos.despejeLimpieza.toUpperCase()],
      ["2. Sanitización del Área y Equipos (> 100 ppm)", acta.requisitos.sanitizacionEquipos.toUpperCase()],
      ["3. Materia Prima Pesada y Correcta", acta.requisitos.materiaPrima.toUpperCase()],
      ["4. Seguridad e Higiene del Personal (BPM)", acta.requisitos.seguridadHigiene.toUpperCase()],
      [],
      ["Observaciones de Calidad:", acta.observaciones || "Sin desviaciones."],
      [],
      ["Firma Producción:", acta.firmaProduccion.firmado ? `${acta.firmaProduccion.nombre} (${acta.firmaProduccion.fecha})` : "Pendiente"],
      ["Firma Control de Calidad:", acta.firmaCalidad.firmado ? `${acta.firmaCalidad.nombre} (${acta.firmaCalidad.fecha})` : "Pendiente"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 45 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws, key === "galpon-9" ? "Galpón 9" : "Galpón 8");
  }

  XLSX.writeFile(wb, `Arawak_Arranque_Operaciones_${new Date().toISOString().split("T")[0]}.xlsx`);
}

export async function importarArranqueOperacionesExcel(file: File): Promise<Record<string, Partial<ActaInicioOperaciones>>> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const result: Record<string, Partial<ActaInicioOperaciones>> = {};

  for (const sheetName of wb.SheetNames) {
    const isG9 = sheetName.toLowerCase().includes("9") || sheetName.toLowerCase().includes("galleta");
    const key = isG9 ? "galpon-9" : "galpon-8";
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

    const parcial: Partial<ActaInicioOperaciones> = {};
    data.forEach((row: any) => {
      if (!Array.isArray(row)) return;
      const text0 = String(row[0] || "");
      const text1 = String(row[1] || "");
      if (text0.includes("Producto a Elaborar")) parcial.producto = text0.split(":")[1]?.trim() || text1;
      if (text0.includes("Orden de Producción")) parcial.ordenProduccion = text0.split(":")[1]?.trim() || text1;
      if (text0.includes("Lote Programado") || text1.includes("Lote")) parcial.lote = text1.split(":")[1]?.trim() || text1;
      if (text0.includes("Dictamen")) {
        const d = (text0.split(":")[1] || text1).toLowerCase();
        if (d.includes("aprobado")) parcial.dictamen = "aprobado";
        else if (d.includes("rechazado")) parcial.dictamen = "rechazado";
        else if (d.includes("condicionado")) parcial.dictamen = "condicionado";
      }
    });

    if (Object.keys(parcial).length > 0) {
      result[key] = parcial;
    }
  }

  return result;
}

// ==============================================================================
// 4. MATERIA PRIMA (RECEPCIÓN & CALIBRES)
// ==============================================================================

export function exportarMateriaPrimaExcel(registro: RegistroMateriaPrima, historico?: RegistroMateriaPrima[]) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Ficha Técnica de Recepción Activa
  const rowsFicha = [
    ["ARAWAK C.A. - CONTROL TÉCNICO DE RECEPCIÓN DE MATERIA PRIMA"],
    [`Código Recepción: ${registro.id}`, `Semana: ${registro.semanaRecepcion}`],
    [],
    ["PARÁMETROS DE RECEPCIÓN", "VALOR REGISTRADO"],
    ["Materia Prima", registro.tipoMateriaPrima],
    ["Fecha de Llegada", registro.fechaLlegada],
    ["Fecha de Procesado", registro.fechaProcesado],
    ["Proveedor", registro.proveedor],
    ["Cédula / RIF", registro.cedula],
    ["Placa de Transporte", registro.placa],
    ["Peso Total Recibido (kg)", registro.pesoCargaKg],
    ["Origen de la Carga", registro.origenCarga],
    ["Calibre de Yuca", registro.calibre],
    ["Edad / Cosecha", registro.dedosClusterOEdad],
    ["Evaluación Visual Pulpa", registro.evaluacionVisual],
    ["Densidad (g/cm³)", registro.densidad],
    [],
    ["PARÁMETROS DE PROCESO", "VALOR REGISTRADO"],
    ["pH Materia Prima", registro.phMateriaPrima],
    ["Ácido Cítrico / Antioxidante", registro.acidoCitricoAscorbico],
    ["Estado de Pulpa", registro.pulpa],
    ["Grados °Brix", registro.brix],
    ["Tiempo Deshidratación", registro.tiempoDeshidratacion],
    ["Kilos Reprocesados", registro.reprocesadoKg],
    ["Kilos Bajo Observación", registro.bajoObservacionKg],
    ["Total Procesado Apto (kg)", registro.totalProcesadoKg],
    [],
    ["Observaciones:", registro.observaciones || "Sin observaciones."],
    ["Firma Control de Calidad:", registro.firmas.calidad.firmado ? `${registro.firmas.calidad.nombre} (${registro.firmas.calidad.fecha})` : "Pendiente"],
  ];
  const wsFicha = XLSX.utils.aoa_to_sheet(rowsFicha);
  wsFicha["!cols"] = [{ wch: 35 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsFicha, "Recepción Activa");

  // Hoja 2: Histórico (si hay)
  if (historico && historico.length > 0) {
    const rowsHist = [
      ["ID Lote", "Semana", "Materia Prima", "Proveedor", "Kilos Recibidos", "Calibre", "Total Procesado", "Fecha Llegada"],
      ...historico.map((h) => [
        h.id,
        h.semanaRecepcion,
        h.tipoMateriaPrima,
        h.proveedor,
        h.pesoCargaKg,
        h.calibre,
        h.totalProcesadoKg,
        h.fechaLlegada,
      ]),
    ];
    const wsHist = XLSX.utils.aoa_to_sheet(rowsHist);
    wsHist["!cols"] = [{ wch: 18 }, { wch: 18 }, { wch: 30 }, { wch: 30 }, { wch: 16 }, { wch: 25 }, { wch: 18 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsHist, "Histórico Lotes");
  }

  XLSX.writeFile(wb, `Arawak_Materia_Prima_${registro.id || "Lote"}.xlsx`);
}

export async function importarMateriaPrimaExcel(file: File): Promise<Partial<RegistroMateriaPrima>> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

  const parcial: Partial<RegistroMateriaPrima> = {};
  data.forEach((row: any) => {
    if (!Array.isArray(row) || row.length < 2) return;
    const campo = String(row[0] || "").toLowerCase();
    const val = row[1];
    if (campo.includes("proveedor")) parcial.proveedor = String(val);
    if (campo.includes("cédula") || campo.includes("rif")) parcial.cedula = String(val);
    if (campo.includes("placa")) parcial.placa = String(val);
    if (campo.includes("peso") || campo.includes("kilos recibido")) parcial.pesoCargaKg = Number(val) || 0;
    if (campo.includes("origen")) parcial.origenCarga = String(val);
    if (campo.includes("ph")) parcial.phMateriaPrima = Number(val) || 0;
    if (campo.includes("brix")) parcial.brix = Number(val) || 0;
    if (campo.includes("densidad")) parcial.densidad = String(val);
    if (campo.includes("observacion")) parcial.observaciones = String(val);
  });

  return parcial;
}

// ==============================================================================
// 5. ANÁLISIS DE PROCESO & LIBERACIÓN DE BACHS
// ==============================================================================

export function exportarAnalisisProcesoExcel(registro: RegistroAnalisisProceso) {
  const wb = XLSX.utils.book_new();

  const rows = [
    ["ARAWAK C.A. - REGISTRO DE ANÁLISIS DE PROCESO Y LIBERACIÓN DE BACHS"],
    [`Lote de Producción: ${registro.lote}`, `Producto: ${registro.producto}`, `Fecha: ${registro.fecha}`],
    [`Cantidad de Bachs: ${registro.cantidadBachs}`, `Total Producido (kg): ${registro.totalProducidoKg}`],
    [`Dictamen Final: ${registro.dictamen.toUpperCase()}`],
    [`Firma Control de Calidad: ${registro.firmas.inspector.firmado ? registro.firmas.inspector.nombre + " (" + registro.firmas.inspector.fecha + ")" : "Pendiente"}`],
    [],
    ["ID Parámetro", "Análisis Físico-Químico", "Unidad", "Especificación Arawak", "Valor Medido", "Dictamen Técnico"],
    ...registro.parametros.map((p) => [
      p.id,
      p.nombre,
      p.unidad,
      p.especificacion || "",
      p.valor || "---",
      p.estado.toUpperCase(),
    ]),
    [],
    ["Pesos individuales por Bach (kg):", registro.pesosBachs.join(" kg, ") + (registro.pesosBachs.length ? " kg" : "---")],
    ["Observaciones Generales:", registro.observaciones || "Sin novedades."],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 18 }, { wch: 45 }, { wch: 12 }, { wch: 35 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, "Análisis de Proceso");

  XLSX.writeFile(wb, `Arawak_Analisis_Proceso_${registro.lote || "Lote"}.xlsx`);
}

export async function importarAnalisisProcesoExcel(file: File): Promise<{
  lote?: string;
  producto?: string;
  cantidadBachs?: number;
  totalProducidoKg?: number;
  parametros?: { nombre: string; valor: string; estado?: "conforme" | "desviacion" | "critico" }[];
}> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

  const result: any = { parametros: [] };
  let leyendoParametros = false;

  data.forEach((row: any) => {
    if (!Array.isArray(row)) return;
    const c0 = String(row[0] || "");
    const c1 = String(row[1] || "");

    if (c0.includes("Lote de Producción")) {
      const match = c0.match(/Lote de Producción:\s*([^\s,]+)/);
      if (match) result.lote = match[1];
    }
    if (c0.includes("Cantidad de Bachs")) {
      const match = c0.match(/Cantidad de Bachs:\s*([0-9]+)/);
      if (match) result.cantidadBachs = Number(match[1]);
    }

    if (c0.includes("ID Parámetro") || c1.includes("Análisis Físico-Químico")) {
      leyendoParametros = true;
      return;
    }

    if (leyendoParametros) {
      if (!c1 || c0.includes("Pesos individuales") || c0.includes("Observaciones")) {
        leyendoParametros = false;
        return;
      }
      const nombre = c1.trim();
      const valor = row[4] !== undefined ? String(row[4]).trim() : "";
      const estadoStr = String(row[5] || "").toLowerCase();
      const estado = estadoStr.includes("desv") ? "desviacion" : estadoStr.includes("crit") ? "critico" : "conforme";
      result.parametros.push({ nombre, valor, estado });
    }
  });

  return result;
}

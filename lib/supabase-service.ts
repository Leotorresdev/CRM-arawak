// ==============================================================================
// ARAWAK CRM - SERVICIO DE CONEXIÓN CON SUPABASE
// Sincronización en tiempo real de los 5 módulos operacionales y usuarios
// ==============================================================================

import { supabase, isSupabaseConfigured } from "./supabase/client";
import { getUsuarioActual, UsuarioArawak } from "./auth";

export interface ResultadoOperacion<T = any> {
  exito: boolean;
  datos?: T;
  error?: string;
}

// ------------------------------------------------------------------------------
// 0. GESTIÓN DE USUARIOS
// ------------------------------------------------------------------------------

export async function sincronizarUsuarioEnSupabase(
  usuario: UsuarioArawak & { password?: string }
): Promise<ResultadoOperacion> {
  if (!isSupabaseConfigured()) return { exito: true };

  try {
    const { data, error } = await supabase.from("usuarios").upsert({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email || `${usuario.id}@arawak.com`,
      cargo: usuario.cargo,
      rol: usuario.rol,
      password: usuario.password || "arawak2026",
    }).select().single();

    if (error) {
      console.warn("Error sincronizando usuario en Supabase:", error.message);
      return { exito: false, error: error.message };
    }
    return { exito: true, datos: data };
  } catch (err: any) {
    return { exito: false, error: err.message };
  }
}

export async function obtenerUsuariosSupabase(): Promise<UsuarioArawak[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase.from("usuarios").select("*");
    if (error || !data) return [];
    return data.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      cargo: u.cargo,
      rol: u.rol,
      password: u.password,
      creadoEn: u.creado_en,
    }));
  } catch {
    return [];
  }
}

// ------------------------------------------------------------------------------
// 1. FORMATO DE SANITIZACIÓN (Saneamiento Operacional & Higiene)
// ------------------------------------------------------------------------------

export async function guardarSanitizacionSaneamientoDB(registro: {
  semana_ano: string;
  fecha_inicio: string;
  items: any;
  observaciones_generales?: string;
  firma_calidad: any;
}): Promise<ResultadoOperacion> {
  if (!isSupabaseConfigured()) return { exito: true };

  try {
    const usuario = getUsuarioActual();
    const { data, error } = await supabase
      .from("sanitizacion_saneamiento")
      .insert({
        semana_ano: registro.semana_ano,
        fecha_inicio: registro.fecha_inicio,
        items: registro.items,
        observaciones_generales: registro.observaciones_generales || "",
        firma_calidad: registro.firma_calidad,
        usuario_id: usuario.id,
      })
      .select()
      .single();

    if (error) return { exito: false, error: error.message };
    return { exito: true, datos: data };
  } catch (err: any) {
    return { exito: false, error: err.message };
  }
}

export async function obtenerUltimaSanitizacionSaneamientoDB(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("sanitizacion_saneamiento")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function guardarSanitizacionHigieneDB(registro: {
  semana_ano: string;
  fecha_inicio: string;
  items: any;
  observaciones_generales?: string;
  firma_calidad: any;
}): Promise<ResultadoOperacion> {
  if (!isSupabaseConfigured()) return { exito: true };

  try {
    const usuario = getUsuarioActual();
    const { data, error } = await supabase
      .from("sanitizacion_higiene")
      .insert({
        semana_ano: registro.semana_ano,
        fecha_inicio: registro.fecha_inicio,
        items: registro.items,
        observaciones_generales: registro.observaciones_generales || "",
        firma_calidad: registro.firma_calidad,
        usuario_id: usuario.id,
      })
      .select()
      .single();

    if (error) return { exito: false, error: error.message };
    return { exito: true, datos: data };
  } catch (err: any) {
    return { exito: false, error: err.message };
  }
}

export async function obtenerUltimaSanitizacionHigieneDB(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("sanitizacion_higiene")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------------------
// 2. LIMPIEZA DE PLANTA (Cuadro 1: 8 Pasos POES & Cuadro 2: Inspección)
// ------------------------------------------------------------------------------

export async function guardarLimpiezaPlantaDB(registro: {
  fecha: string;
  turno: string;
  ejecucion_8pasos: any;
  inspeccion_calidad: any;
  observaciones_generales?: string;
  firma_ejecucion: any;
  firma_inspeccion: any;
}): Promise<ResultadoOperacion> {
  if (!isSupabaseConfigured()) return { exito: true };

  try {
    const usuario = getUsuarioActual();
    const { data, error } = await supabase
      .from("limpieza_planta")
      .insert({
        fecha: registro.fecha,
        turno: registro.turno,
        ejecucion_8pasos: registro.ejecucion_8pasos,
        inspeccion_calidad: registro.inspeccion_calidad,
        observaciones_generales: registro.observaciones_generales || "",
        firma_ejecucion: registro.firma_ejecucion,
        firma_inspeccion: registro.firma_inspeccion,
        usuario_id: usuario.id,
      })
      .select()
      .single();

    if (error) return { exito: false, error: error.message };
    return { exito: true, datos: data };
  } catch (err: any) {
    return { exito: false, error: err.message };
  }
}

export async function obtenerUltimaLimpiezaPlantaDB(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("limpieza_planta")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------------------
// 3. ARRANQUE DE OPERACIONES (Galpones 9 & 8)
// ------------------------------------------------------------------------------

export async function guardarArranqueOperacionesDB(registro: {
  fecha: string;
  galpon_id: string;
  producto_a_elaborar: string;
  lote_programado: string;
  dictamen: string;
  requisitos_checklist: any;
  firma_calidad: any;
}): Promise<ResultadoOperacion> {
  if (!isSupabaseConfigured()) return { exito: true };

  try {
    const usuario = getUsuarioActual();
    const { data, error } = await supabase
      .from("arranque_operaciones")
      .insert({
        fecha: registro.fecha,
        galpon_id: registro.galpon_id,
        producto_a_elaborar: registro.producto_a_elaborar,
        lote_programado: registro.lote_programado,
        dictamen: registro.dictamen,
        requisitos_checklist: registro.requisitos_checklist,
        firma_calidad: registro.firma_calidad,
        usuario_id: usuario.id,
      })
      .select()
      .single();

    if (error) return { exito: false, error: error.message };
    return { exito: true, datos: data };
  } catch (err: any) {
    return { exito: false, error: err.message };
  }
}

export async function obtenerUltimoArranqueOperacionesDB(galponId: string): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("arranque_operaciones")
      .select("*")
      .eq("galpon_id", galponId)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------------------
// 4. MATERIA PRIMA (Recepción y Calibres)
// ------------------------------------------------------------------------------

export async function guardarMateriaPrimaDB(registro: {
  fecha: string;
  semana_ano: number;
  lote_materia_prima: string;
  proveedor: string;
  kilos_recibidos?: number;
  calibres_yuca: any;
  pasos_procesamiento: any;
  firma_calidad: any;
  observaciones?: string;
}): Promise<ResultadoOperacion> {
  if (!isSupabaseConfigured()) return { exito: true };

  try {
    const usuario = getUsuarioActual();
    const { data, error } = await supabase
      .from("materia_prima_recepcion")
      .insert({
        fecha: registro.fecha,
        semana_ano: registro.semana_ano,
        lote_materia_prima: registro.lote_materia_prima,
        proveedor: registro.proveedor,
        kilos_recibidos: registro.kilos_recibidos || 0,
        calibres_yuca: registro.calibres_yuca,
        pasos_procesamiento: registro.pasos_procesamiento,
        firma_calidad: registro.firma_calidad,
        observaciones: registro.observaciones || "",
        usuario_id: usuario.id,
      })
      .select()
      .single();

    if (error) return { exito: false, error: error.message };
    return { exito: true, datos: data };
  } catch (err: any) {
    return { exito: false, error: err.message };
  }
}

export async function obtenerUltimaMateriaPrimaDB(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("materia_prima_recepcion")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------------------
// 5. ANÁLISIS DE PROCESO (Línea de Producción)
// ------------------------------------------------------------------------------

export async function guardarAnalisisProcesoDB(registro: {
  fecha: string;
  lote: string;
  producto: string;
  cantidad_bachs: number;
  total_producido_kg: number;
  dictamen: string;
  parametros: any;
  firma_calidad: any;
  observaciones?: string;
}): Promise<ResultadoOperacion> {
  if (!isSupabaseConfigured()) return { exito: true };

  try {
    const usuario = getUsuarioActual();
    const { data, error } = await supabase
      .from("analisis_proceso")
      .insert({
        fecha: registro.fecha,
        lote: registro.lote,
        producto: registro.producto,
        cantidad_bachs: registro.cantidad_bachs,
        total_producido_kg: registro.total_producido_kg,
        dictamen: registro.dictamen,
        parametros: registro.parametros,
        firma_calidad: registro.firma_calidad,
        observaciones: registro.observaciones || "",
        usuario_id: usuario.id,
      })
      .select()
      .single();

    if (error) return { exito: false, error: error.message };
    return { exito: true, datos: data };
  } catch (err: any) {
    return { exito: false, error: err.message };
  }
}

export async function obtenerUltimoAnalisisProcesoDB(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("analisis_proceso")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

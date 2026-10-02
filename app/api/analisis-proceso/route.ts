import { NextResponse } from "next/server";
import {
  crearRegistroInicialAnalisis,
  parametrosAnalisisBase,
  productosArawakProceso,
} from "@/lib/analisis-proceso-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "usr_calidad";
  const userNombre = searchParams.get("userNombre") || "Inspector de Calidad";

  return NextResponse.json({
    empresa: "Arawak",
    modulo: "Análisis de Proceso y Liberación de Bachs",
    codigoDocumento: "ARAWAK-CC-AP-01",
    parametrosBase: parametrosAnalisisBase,
    productosDisponibles: productosArawakProceso,
    registroEjemplo: crearRegistroInicialAnalisis(userId, userNombre),
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      mensaje: "Análisis de Proceso registrado exitosamente en el espacio de usuario (Supabase Ready).",
      userId: body.userId,
      lote: body.lote,
      recibido: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al procesar el análisis de proceso" },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import {
  areasEquiposLimpieza,
  pasosProcedimientoLimpieza,
  initialEjecucionData,
  initialInspeccionData,
} from "@/lib/limpieza-planta-data";

export async function GET() {
  return NextResponse.json({
    empresa: "Arawak",
    planta: "Galletas y derivados sin gluten (Cambur y Yuca)",
    modulo: "Limpieza de Planta e Inspección",
    codigoDocumento: "ARAWAK-CC-LP-01",
    areasTotal: areasEquiposLimpieza.length,
    areas: areasEquiposLimpieza,
    pasosPOES: pasosProcedimientoLimpieza,
    ejecucionInicial: initialEjecucionData,
    inspeccionInicial: initialInspeccionData,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      mensaje: "Registro de Limpieza de Planta (POES 8 pasos e Inspección QA) sincronizado exitosamente.",
      recibido: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al procesar la solicitud de registro de limpieza" },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import {
  initialHigieneData,
  initialSaneamientoData,
  getSemanaActual,
  arawakKpis,
} from "@/lib/sanitizacion-data";

export async function GET() {
  return NextResponse.json({
    empresa: "Arawak",
    rubro: "Galletas y derivados sin gluten (Cambur y Yuca)",
    semana: getSemanaActual(),
    saneamiento: initialSaneamientoData,
    higiene: initialHigieneData,
    kpis: arawakKpis,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      mensaje: "Registro de sanitización Arawak recibido y sincronizado correctamente.",
      recibido: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al procesar la solicitud" }, { status: 400 });
  }
}

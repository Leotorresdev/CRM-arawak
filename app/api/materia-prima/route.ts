import { NextResponse } from "next/server";
import {
  initialMateriaPrimaRegistro,
  normasCalibreYuca,
  historicoRecepcionesMock,
} from "@/lib/materia-prima-data";

export async function GET() {
  return NextResponse.json({
    empresa: "Arawak",
    modulo: "Control de Calidad - Materia Prima",
    codigoDocumento: "ARAWAK-CC-MP-01",
    normasCalibre: normasCalibreYuca,
    registroActual: initialMateriaPrimaRegistro,
    historicoRecepciones: historicoRecepcionesMock,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      mensaje: "Registro de Materia Prima y Variables de Proceso sincronizado exitosamente.",
      recibido: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al procesar el registro de materia prima" },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import {
  initialActasData,
  catalogoProductosArawak,
  requisitosCatalogo,
} from "@/lib/arranque-operaciones-data";

export async function GET() {
  return NextResponse.json({
    empresa: "Arawak",
    modulo: "Arranque de Operaciones (AIO)",
    codigoDocumento: "ARAWAK-CC-AO-01",
    actas: initialActasData,
    requisitos: requisitosCatalogo,
    productos: catalogoProductosArawak,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      mensaje: "Acta de Liberación de Inicio de Operaciones (AIO) sincronizada y registrada.",
      recibido: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al procesar el acta de liberación de inicio de operaciones" },
      { status: 400 }
    );
  }
}

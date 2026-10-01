import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    framework: "Next.js 16 App Router",
    project: "CRM Galletas - Calidad e Inocuidad Alimentaria",
    timestamp: new Date().toISOString(),
  });
}

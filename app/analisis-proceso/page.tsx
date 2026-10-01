"use client";

import { AppShell } from "@/components/layout/AppShell";
import { AnalisisProceso } from "@/components/analisis/AnalisisProceso";

export default function AnalisisProcesoPage() {
  return (
    <AppShell
      title="Análisis de Proceso"
      subtitle="Control de calidad en línea, ensayos fisicoquímicos y liberación de bachs · Arawak"
    >
      <div className="mt-2">
        <AnalisisProceso />
      </div>
    </AppShell>
  );
}

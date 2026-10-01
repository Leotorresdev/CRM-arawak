"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LimpiezaPlanta } from "@/components/limpieza/LimpiezaPlanta";

export default function LimpiezaPage() {
  return (
    <AppShell
      title="Limpieza de Planta e Inspección"
      subtitle="Procedimiento POES de 8 pasos e inspección técnica de control de calidad · Arawak"
    >
      <div className="mt-2">
        <LimpiezaPlanta />
      </div>
    </AppShell>
  );
}

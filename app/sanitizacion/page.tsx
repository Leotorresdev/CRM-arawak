"use client";

import { AppShell } from "@/components/layout/AppShell";
import { FormatoSanitizacion } from "@/components/sanitizacion/FormatoSanitizacion";

export default function SanitizacionPage() {
  return (
    <AppShell
      title="Formatos de Sanitización y BPM"
      subtitle="Registro semanal de saneamiento operacional de planta e higiene visual del personal · Arawak"
    >
      <div className="mt-2">
        <FormatoSanitizacion />
      </div>
    </AppShell>
  );
}

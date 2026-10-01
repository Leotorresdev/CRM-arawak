"use client";

import { AppShell } from "@/components/layout/AppShell";
import { MateriaPrima } from "@/components/materia-prima/MateriaPrima";

export default function MateriaPrimaPage() {
  return (
    <AppShell
      title="Control de Materia Prima"
      subtitle="Recepción, calibres de yuca, variables fisicoquímicas y deshidratación · Arawak"
    >
      <div className="mt-2">
        <MateriaPrima />
      </div>
    </AppShell>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ArranqueOperaciones } from "@/components/arranque/ArranqueOperaciones";

export default function ArranquePage() {
  const router = useRouter();

  return (
    <AppShell
      title="Arranque de Operaciones (AIO)"
      subtitle="Acta de liberación técnica de inicio de producción vinculada a saneamiento POES · Arawak"
    >
      <div className="mt-2">
        <ArranqueOperaciones onIrALimpieza={() => router.push("/limpieza")} />
      </div>
    </AppShell>
  );
}

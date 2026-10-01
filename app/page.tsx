"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { FormatoSanitizacion } from "@/components/sanitizacion/FormatoSanitizacion";
import { LimpiezaPlanta } from "@/components/limpieza/LimpiezaPlanta";
import { ArranqueOperaciones } from "@/components/arranque/ArranqueOperaciones";
import { MateriaPrima } from "@/components/materia-prima/MateriaPrima";
import { AnalisisProceso } from "@/components/analisis/AnalisisProceso";
import { isAutenticado } from "@/lib/auth";
import { FileCheck2, Sparkles, PlayCircle, Wheat, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [seccionActiva, setSeccionActiva] = useState<
    "sanitizacion" | "limpieza" | "arranque" | "materia-prima" | "analisis-proceso"
  >("sanitizacion");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = isAutenticado();
      if (!auth) {
        router.replace("/login");
      } else {
        setAutenticado(true);
      }
    }
  }, [router]);

  // Mientras verifica el estado inicial en cliente o redirige al login
  if (!autenticado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-[#4b5e2a] text-xl font-black text-white animate-pulse">
            AW
          </div>
          <p className="text-xs font-bold text-muted-foreground">Verificando acceso a planta Arawak...</p>
        </div>
      </div>
    );
  }

  const titulos = {
    sanitizacion: "Formato de Sanitización y BPM",
    limpieza: "Limpieza de Planta e Inspección",
    arranque: "Arranque de Operaciones (AIO)",
    "materia-prima": "Control de Materia Prima",
    "analisis-proceso": "Análisis de Proceso y Liberación",
  };

  const subtitulos = {
    sanitizacion: "Registros diarios y semanales de Buenas Prácticas de Manufactura (BPM) e Inocuidad · Arawak",
    limpieza: "Procedimiento POES de 8 pasos e inspección técnica de control de calidad (33 equipos) · Arawak",
    arranque: "Acta de liberación técnica de inicio de producción vinculada a saneamiento POES · Arawak",
    "materia-prima": "Recepción, calibres de yuca, variables fisicoquímicas y deshidratación · Arawak",
    "analisis-proceso": "Control fisicoquímico, humedades, pesos de bachs y dictamen de inocuidad · Arawak",
  };

  return (
    <AppShell
      title={titulos[seccionActiva]}
      subtitle={subtitulos[seccionActiva]}
    >
      {/* Top Section Navigator Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 p-1.5 border border-border/60">
          <button
            onClick={() => setSeccionActiva("sanitizacion")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition-all cursor-pointer",
              seccionActiva === "sanitizacion"
                ? "bg-[#4b5e2a] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <FileCheck2 className="size-3.5" />
            1. Sanitización & BPM
          </button>

          <button
            onClick={() => setSeccionActiva("limpieza")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition-all cursor-pointer",
              seccionActiva === "limpieza"
                ? "bg-[#4b5e2a] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <Sparkles className="size-3.5" />
            2. Limpieza (POES)
          </button>

          <button
            onClick={() => setSeccionActiva("arranque")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition-all cursor-pointer",
              seccionActiva === "arranque"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <PlayCircle className="size-3.5" />
            3. Arranque (AIO)
          </button>

          <button
            onClick={() => setSeccionActiva("materia-prima")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition-all cursor-pointer",
              seccionActiva === "materia-prima"
                ? "bg-[#4b5e2a] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <Wheat className="size-3.5" />
            4. Materia Prima
          </button>

          <button
            onClick={() => setSeccionActiva("analisis-proceso")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition-all cursor-pointer",
              seccionActiva === "analisis-proceso"
                ? "bg-indigo-700 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <FlaskConical className="size-3.5" />
            5. Análisis de Proceso
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-foreground">Arawak CRM</span>
          <span>·</span>
          <span>Control de Procesos 100% Sin Gluten</span>
        </div>
      </div>

      {/* Render Active Section */}
      <div className="mt-2">
        {seccionActiva === "sanitizacion" && <FormatoSanitizacion />}
        {seccionActiva === "limpieza" && <LimpiezaPlanta />}
        {seccionActiva === "arranque" && (
          <ArranqueOperaciones onIrALimpieza={() => setSeccionActiva("limpieza")} />
        )}
        {seccionActiva === "materia-prima" && <MateriaPrima />}
        {seccionActiva === "analisis-proceso" && <AnalisisProceso />}
      </div>
    </AppShell>
  );
}

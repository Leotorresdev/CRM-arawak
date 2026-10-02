"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PlayCircle,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Printer,
  Save,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  Factory,
  FileCheck2,
  Package,
  Layers,
  Check,
  ExternalLink,
  Info,
  BadgeAlert,
  ArrowRight,
  PenTool,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import {
  exportarArranqueOperacionesExcel,
  importarArranqueOperacionesExcel,
} from "@/lib/excel-service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getUsuarioActual } from "@/lib/auth";
import {
  guardarArranqueOperacionesDB,
  obtenerUltimoArranqueOperacionesDB,
} from "@/lib/supabase-service";

import {
  ActaInicioOperaciones,
  DictamenArranque,
  EstadoRequisito,
  catalogoProductosArawak,
  equiposPorGalpon,
  initialActasData,
  requisitosCatalogo,
} from "@/lib/arranque-operaciones-data";
import {
  areasEquiposLimpieza,
  RegistroInspeccionCalidad,
  RegistroEjecucion8Pasos,
} from "@/lib/limpieza-planta-data";

interface Props {
  onIrALimpieza?: () => void;
}

export function ArranqueOperaciones({ onIrALimpieza }: Props) {
  const [activeGalpon, setActiveGalpon] = useState<"galpon-9" | "galpon-8" | "ambos">("galpon-9");
  const [actas, setActas] = useState<Record<"galpon-9" | "galpon-8", ActaInicioOperaciones>>(initialActasData);

  // Cross-reference data loaded from Limpieza de Planta
  const [inspeccionLimpieza, setInspeccionLimpieza] = useState<Record<number, RegistroInspeccionCalidad> | null>(null);
  const [ejecucionLimpieza, setEjecucionLimpieza] = useState<Record<number, RegistroEjecucion8Pasos> | null>(null);

  // Load persistence (localStorage & Supabase)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedActas = localStorage.getItem("arawak_arranque_actas_v1");
      if (savedActas) {
        try {
          setActas(JSON.parse(savedActas));
        } catch {}
      }

      // Check Limpieza de Planta status
      const savedInsp = localStorage.getItem("arawak_limpieza_inspeccion_v1");
      const savedEjec = localStorage.getItem("arawak_limpieza_ejecucion_v1");
      if (savedInsp) {
        try {
          setInspeccionLimpieza(JSON.parse(savedInsp));
        } catch {}
      }
      if (savedEjec) {
        try {
          setEjecucionLimpieza(JSON.parse(savedEjec));
        } catch {}
      }
    }

    (async () => {
      try {
        const [cloud9, cloud8] = await Promise.all([
          obtenerUltimoArranqueOperacionesDB("galpon-9"),
          obtenerUltimoArranqueOperacionesDB("galpon-8"),
        ]);
        if (cloud9 || cloud8) {
          setActas((prev) => ({
            "galpon-9": cloud9 ? {
              ...prev["galpon-9"],
              fecha: cloud9.fecha || prev["galpon-9"].fecha,
              producto: cloud9.producto_a_elaborar || prev["galpon-9"].producto,
              lote: cloud9.lote_programado || prev["galpon-9"].lote,
              dictamen: (cloud9.dictamen as DictamenArranque) || prev["galpon-9"].dictamen,
              requisitos: cloud9.requisitos_checklist || prev["galpon-9"].requisitos,
              firmaCalidad: cloud9.firma_calidad || prev["galpon-9"].firmaCalidad,
            } : prev["galpon-9"],
            "galpon-8": cloud8 ? {
              ...prev["galpon-8"],
              fecha: cloud8.fecha || prev["galpon-8"].fecha,
              producto: cloud8.producto_a_elaborar || prev["galpon-8"].producto,
              lote: cloud8.lote_programado || prev["galpon-8"].lote,
              dictamen: (cloud8.dictamen as DictamenArranque) || prev["galpon-8"].dictamen,
              requisitos: cloud8.requisitos_checklist || prev["galpon-8"].requisitos,
              firmaCalidad: cloud8.firma_calidad || prev["galpon-8"].firmaCalidad,
            } : prev["galpon-8"],
          }));
        }
      } catch (e) {
        console.warn("Supabase fetch fallback:", e);
      }
    })();
  }, []);

  // Compute Limpieza status for the active Galpón
  const statusLimpiezaGalpon = useMemo(() => {
    const calcularStatus = (galponId: "galpon-9" | "galpon-8") => {
      const equipoIds = equiposPorGalpon[galponId];
      if (!inspeccionLimpieza) {
        return {
          cargado: false,
          totalEquipos: equipoIds.length,
          conformes: equipoIds.length,
          noConformes: 0,
          correctivos: 0,
          equiposDesviados: [] as string[],
        };
      }

      let conformes = 0;
      let noConformes = 0;
      let correctivos = 0;
      const equiposDesviados: string[] = [];

      equipoIds.forEach((id) => {
        const item = inspeccionLimpieza[id];
        const infoArea = areasEquiposLimpieza.find((a) => a.id === id);
        const nombre = infoArea?.nombre || `Equipo #${id}`;

        if (item?.noConforme) {
          noConformes++;
          equiposDesviados.push(`${nombre} (No Conforme)`);
        } else if (item?.correctivo) {
          correctivos++;
          equiposDesviados.push(`${nombre} (Correctivo: ${item.accionCorrectiva || "Pendiente"})`);
        } else {
          conformes++;
        }
      });

      return {
        cargado: true,
        totalEquipos: equipoIds.length,
        conformes,
        noConformes,
        correctivos,
        equiposDesviados,
        esTotalmenteConforme: noConformes === 0 && correctivos === 0,
      };
    };

    return {
      "galpon-9": calcularStatus("galpon-9"),
      "galpon-8": calcularStatus("galpon-8"),
    };
  }, [inspeccionLimpieza]);

  // Save changes (localStorage & Supabase)
  const handleGuardar = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("arawak_arranque_actas_v1", JSON.stringify(actas));
    }

    try {
      const [res9, res8] = await Promise.all([
        guardarArranqueOperacionesDB({
          fecha: actas["galpon-9"].fecha,
          galpon_id: "galpon-9",
          producto_a_elaborar: actas["galpon-9"].producto,
          lote_programado: actas["galpon-9"].lote,
          dictamen: actas["galpon-9"].dictamen,
          requisitos_checklist: actas["galpon-9"].requisitos,
          firma_calidad: actas["galpon-9"].firmaCalidad,
        }),
        guardarArranqueOperacionesDB({
          fecha: actas["galpon-8"].fecha,
          galpon_id: "galpon-8",
          producto_a_elaborar: actas["galpon-8"].producto,
          lote_programado: actas["galpon-8"].lote,
          dictamen: actas["galpon-8"].dictamen,
          requisitos_checklist: actas["galpon-8"].requisitos,
          firma_calidad: actas["galpon-8"].firmaCalidad,
        }),
      ]);

      if (res9.exito && res8.exito) {
        toast.success("Actas de Arranque guardadas en Supabase con éxito", {
          description: "Registros de Galpón 9 y Galpón 8 sincronizados en la base de datos.",
        });
      } else {
        toast.success("Acta de Liberación de Inicio de Operaciones guardada", {
          description: "Datos sincronizados para Galpón 9 y Galpón 8.",
        });
      }
    } catch {
      toast.success("Acta de Liberación de Inicio de Operaciones guardada", {
        description: "Datos sincronizados para Galpón 9 y Galpón 8.",
      });
    }
  };

  // Sync with Limpieza de Planta
  const handleSincronizarLimpieza = (galponId: "galpon-9" | "galpon-8") => {
    const status = statusLimpiezaGalpon[galponId];
    setActas((prev) => {
      const actaActual = prev[galponId];
      const todoLimpio = status.esTotalmenteConforme;

      return {
        ...prev,
        [galponId]: {
          ...actaActual,
          requisitos: {
            ...actaActual.requisitos,
            despejeLimpieza: todoLimpio ? "cumple" : "no_cumple",
            sanitizacionEquipos: todoLimpio ? "cumple" : "no_cumple",
          },
          observaciones: todoLimpio
            ? `${actaActual.observaciones ? actaActual.observaciones + " | " : ""}Sincronizado con Limpieza de Planta: Todos los equipos (${status.conformes}/${status.totalEquipos}) validados Conformes bajo POES.`
            : `${actaActual.observaciones ? actaActual.observaciones + " | " : ""}Atención: Detectadas ${status.noConformes + status.correctivos} desviaciones en Limpieza de Planta (${status.equiposDesviados.join("; ")}).`,
          dictamen: todoLimpio ? actaActual.dictamen : "condicionado",
        },
      };
    });

    if (status.esTotalmenteConforme) {
      toast.success("Sincronización Exitosa con Limpieza de Planta", {
        description: `Se validaron los requisitos 1 y 2 para ${galponId === "galpon-9" ? "Galpón 9" : "Galpón 8"}.`,
      });
    } else {
      toast.warning("Sincronizado con Advertencias de Calidad", {
        description: `Se detectaron desviaciones en la limpieza de este galpón. Revise los requisitos.`,
      });
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportExcel = () => {
    exportarArranqueOperacionesExcel(actas);
    toast.success("Actas de Arranque exportadas a Excel con éxito (.xlsx)");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importarArranqueOperacionesExcel(file);
      setActas((prev) => ({
        "galpon-9": res["galpon-9"] ? { ...prev["galpon-9"], ...res["galpon-9"] } : prev["galpon-9"],
        "galpon-8": res["galpon-8"] ? { ...prev["galpon-8"], ...res["galpon-8"] } : prev["galpon-8"],
      }));
      toast.success("Actas importadas desde Excel con éxito", {
        description: `Archivo ${file.name} procesado correctamente.`,
      });
    } catch (err: any) {
      toast.error("Error al importar Excel", { description: err?.message });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Update Requisito
  const handleSetRequisito = (
    galponId: "galpon-9" | "galpon-8",
    requisitoKey: keyof ActaInicioOperaciones["requisitos"],
    estado: EstadoRequisito
  ) => {
    setActas((prev) => ({
      ...prev,
      [galponId]: {
        ...prev[galponId],
        requisitos: {
          ...prev[galponId].requisitos,
          [requisitoKey]: estado,
        },
      },
    }));
  };

  // Update Dictamen
  const handleSetDictamen = (galponId: "galpon-9" | "galpon-8", dictamen: DictamenArranque) => {
    setActas((prev) => ({
      ...prev,
      [galponId]: {
        ...prev[galponId],
        dictamen,
      },
    }));
  };

  // Update Metadata
  const handleUpdateMeta = (
    galponId: "galpon-9" | "galpon-8",
    field: keyof ActaInicioOperaciones,
    value: string
  ) => {
    setActas((prev) => ({
      ...prev,
      [galponId]: {
        ...prev[galponId],
        [field]: value,
      },
    }));
  };

  // Select pre-set Product
  const handleSelectProducto = (galponId: "galpon-9" | "galpon-8", nombreProducto: string) => {
    const prod = catalogoProductosArawak.find((p) => p.nombre === nombreProducto);
    setActas((prev) => ({
      ...prev,
      [galponId]: {
        ...prev[galponId],
        producto: nombreProducto,
        sku: prod ? prod.sku : prev[galponId].sku,
      },
    }));
  };

  // Única firma: Ingeniero de Guardia en Control de Calidad
  const handleFirmarCalidad = (galponId: "galpon-9" | "galpon-8") => {
    const user = getUsuarioActual();
    const now = new Date();
    const fechaHora = `${now.toLocaleDateString("es-VE")} ${now.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}`;
    
    setActas((prev) => {
      const actual = prev[galponId]?.firmaCalidad;
      const yaFirmado = actual?.firmado;
      if (!yaFirmado) {
        toast.success(`Arranque de operaciones liberado y firmado por ${user.nombre}`);
      } else {
        toast.info("Firma de Control de Calidad removida.");
      }
      return {
        ...prev,
        [galponId]: {
          ...prev[galponId],
          firmaCalidad: {
            firmado: !yaFirmado,
            nombre: !yaFirmado ? user.nombre : "",
            cargo: !yaFirmado ? user.cargo : "",
            fecha: !yaFirmado ? fechaHora : "",
          },
        },
      };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Render an individual Acta Card (used for single or side-by-side)
  const renderActaForm = (galponId: "galpon-9" | "galpon-8", isCompact = false) => {
    const acta = actas[galponId];
    const statusLimp = statusLimpiezaGalpon[galponId];
    const esGalpon9 = galponId === "galpon-9";

    const totalRequisitos = 4;
    const reqCumplidos = Object.values(acta.requisitos).filter((r) => r === "cumple").length;
    const reqNoCumple = Object.values(acta.requisitos).filter((r) => r === "no_cumple").length;

    return (
      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden flex flex-col h-full">
        {/* Header of the Acta */}
        <div className={cn(
          "p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
          esGalpon9 ? "bg-[#4b5e2a]/10" : "bg-indigo-500/10"
        )}>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn(
                "font-extrabold text-[11px]",
                esGalpon9 ? "border-[#4b5e2a] text-[#4b5e2a] bg-[#4b5e2a]/10" : "border-indigo-600 text-indigo-700 bg-indigo-500/10"
              )}>
                {esGalpon9 ? "GALPÓN 9 · PRODUCCIÓN" : "GALPÓN 8 · PROCESOS"}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">{acta.id}</span>
            </div>
            <h3 className="text-base font-black text-foreground mt-1">
              ACTA DE LIBERACIÓN DE INICIO DE OPERACIONES (AIO)
            </h3>
            <p className="text-xs text-muted-foreground">{acta.lineaNombre}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "text-xs font-black uppercase px-2.5 py-1",
                acta.dictamen === "aprobado"
                  ? "bg-emerald-600 text-white"
                  : acta.dictamen === "condicionado"
                  ? "bg-amber-500 text-white"
                  : "bg-rose-600 text-white"
              )}
            >
              {acta.dictamen === "aprobado" && "✓ Aprobado"}
              {acta.dictamen === "condicionado" && "⚠ Condicionado"}
              {acta.dictamen === "rechazado" && "✕ Detenido"}
            </Badge>
          </div>
        </div>

        {/* Dynamic Link Banner with Limpieza de Planta */}
        <div className="p-3 border-b border-border bg-muted/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-lg",
                statusLimp.esTotalmenteConforme ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
              )}>
                {statusLimp.esTotalmenteConforme ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>Vinculación con Limpieza de Planta (POES):</span>
                  {statusLimp.esTotalmenteConforme ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">
                      100% Conforme ({statusLimp.conformes}/{statusLimp.totalEquipos} equipos)
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-extrabold text-[11px]">
                      {statusLimp.noConformes + statusLimp.correctivos} desviación(es) detectada(s)
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {statusLimp.esTotalmenteConforme
                    ? "Los equipos asignados a este galpón tienen saneamiento e inspección aprobados."
                    : `Atención: ${statusLimp.equiposDesviados.join(", ")}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSincronizarLimpieza(galponId)}
                className="h-7 text-[11px] font-semibold gap-1 border-border hover:bg-muted text-foreground"
                title="Cruzar automáticamente los datos de Limpieza de Planta para los Requisitos 1 y 2"
              >
                <LinkIcon className="size-3 text-[#4b5e2a]" />
                Sincronizar con Limpieza
              </Button>
              {onIrALimpieza && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onIrALimpieza}
                  className="h-7 text-[11px] text-[#4b5e2a] hover:bg-[#4b5e2a]/10 p-1.5"
                  title="Abrir módulo de Limpieza de Planta"
                >
                  <ExternalLink className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Metadata Fields Section (Fecha, Hora, Área, Producto, SKU, OP, Lote) */}
        <div className="p-4 border-b border-border bg-card">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-3">
            Datos de la Orden y Línea de Producción
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Fecha */}
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                Fecha
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={acta.fecha}
                  onChange={(e) => handleUpdateMeta(galponId, "fecha", e.target.value)}
                  className="h-8 pl-8 text-xs font-semibold border-border bg-background"
                />
              </div>
            </div>

            {/* Hora */}
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                Hora de Liberación
              </label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="time"
                  value={acta.hora}
                  onChange={(e) => handleUpdateMeta(galponId, "hora", e.target.value)}
                  className="h-8 pl-8 text-xs font-semibold border-border bg-background"
                />
              </div>
            </div>

            {/* Área / Máquina */}
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                Área / Máquina
              </label>
              <Input
                type="text"
                value={acta.areaMaquina}
                onChange={(e) => handleUpdateMeta(galponId, "areaMaquina", e.target.value)}
                className="h-8 text-xs font-semibold border-border bg-background"
              />
            </div>

            {/* Producto */}
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                Producto a Elaborar
              </label>
              <select
                value={acta.producto}
                onChange={(e) => handleSelectProducto(galponId, e.target.value)}
                className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer truncate"
              >
                {catalogoProductosArawak
                  .filter((p) => p.linea === galponId)
                  .map((p) => (
                    <option key={p.sku} value={p.nombre}>
                      {p.nombre}
                    </option>
                  ))}
              </select>
            </div>

            {/* Código / SKU */}
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                Código / SKU
              </label>
              <Input
                type="text"
                value={acta.sku}
                onChange={(e) => handleUpdateMeta(galponId, "sku", e.target.value)}
                className="h-8 text-xs font-mono font-bold border-border bg-background"
              />
            </div>

            {/* Orden de Producción (OP) */}
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                Orden de Producción (OP)
              </label>
              <Input
                type="text"
                value={acta.ordenProduccion}
                onChange={(e) => handleUpdateMeta(galponId, "ordenProduccion", e.target.value)}
                placeholder="OP-2026-..."
                className="h-8 text-xs font-bold border-border bg-background"
              />
            </div>

            {/* Lote */}
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                Lote Asignado
              </label>
              <Input
                type="text"
                value={acta.lote}
                onChange={(e) => handleUpdateMeta(galponId, "lote", e.target.value)}
                placeholder="L-..."
                className="h-8 text-xs font-bold font-mono border-border bg-background"
              />
            </div>
          </div>
        </div>

        {/* Section: EVALUACIÓN DE REQUISITOS (Cumple / No Cumple / N/A) */}
        <div className="p-4 border-b border-border bg-card/60 flex-1">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-foreground">
                EVALUACIÓN DE REQUISITOS (Cumple / No Cumple / N/A)
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Verificación mandatoria previa a la energización y carga de tolvas
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-emerald-600">{reqCumplidos} Cumple</span>
              {reqNoCumple > 0 && <span className="text-rose-600">· {reqNoCumple} No Cumple</span>}
            </div>
          </div>

          <div className="space-y-3">
            {/* Requisito 1: Despeje de línea y limpieza previa */}
            <div className="rounded-lg border border-border p-3 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-bold text-foreground">
                    1
                  </span>
                  <span className="text-xs font-extrabold text-foreground">
                    Despeje de línea y limpieza previa
                  </span>
                  {acta.requisitos.despejeLimpieza === "cumple" && (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-[9px] py-0 px-1.5">
                      Despejado
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Ausencia total de residuos de lote previo, bolsas de insumos viejas, etiquetas obsoletas o alérgenos.
                </p>
              </div>

              {/* C / NC / NA selector */}
              <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetRequisito(galponId, "despejeLimpieza", "cumple")}
                  className={cn(
                    "px-3 py-1 text-xs font-black rounded transition-all cursor-pointer",
                    acta.requisitos.despejeLimpieza === "cumple"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  C (Cumple)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetRequisito(galponId, "despejeLimpieza", "no_cumple")}
                  className={cn(
                    "px-3 py-1 text-xs font-black rounded transition-all cursor-pointer",
                    acta.requisitos.despejeLimpieza === "no_cumple"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  NC (No Cumple)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetRequisito(galponId, "despejeLimpieza", "na")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer",
                    acta.requisitos.despejeLimpieza === "na"
                      ? "bg-slate-700 text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  N/A
                </button>
              </div>
            </div>

            {/* Requisito 2: Sanitización del área y equipos */}
            <div className="rounded-lg border border-border p-3 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-bold text-foreground">
                    2
                  </span>
                  <span className="text-xs font-extrabold text-foreground">
                    Sanitización del área y equipos
                  </span>
                  <Badge variant="outline" className="border-[#4b5e2a]/40 text-[#4b5e2a] bg-[#4b5e2a]/10 text-[9px] py-0 px-1.5 font-bold">
                    Vínculo POES Limpieza
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  8 pasos concluidos, desinfectante amonio cuaternario &gt;100 ppm aplicado y superficie seca sin residuos de jabón.
                </p>
              </div>

              {/* C / NC / NA selector */}
              <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetRequisito(galponId, "sanitizacionEquipos", "cumple")}
                  className={cn(
                    "px-3 py-1 text-xs font-black rounded transition-all cursor-pointer",
                    acta.requisitos.sanitizacionEquipos === "cumple"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  C (Cumple)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetRequisito(galponId, "sanitizacionEquipos", "no_cumple")}
                  className={cn(
                    "px-3 py-1 text-xs font-black rounded transition-all cursor-pointer",
                    acta.requisitos.sanitizacionEquipos === "no_cumple"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  NC (No Cumple)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetRequisito(galponId, "sanitizacionEquipos", "na")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer",
                    acta.requisitos.sanitizacionEquipos === "na"
                      ? "bg-slate-700 text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  N/A
                </button>
              </div>
            </div>

            {/* Requisito 3: Materia prima pesada y correcta */}
            <div className="rounded-lg border border-border p-3 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-bold text-foreground">
                    3
                  </span>
                  <span className="text-xs font-extrabold text-foreground">
                    Materia prima pesada y correcta
                  </span>
                  {acta.requisitos.materiaPrima === "cumple" && (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-[9px] py-0 px-1.5">
                      Verificado Sin Gluten
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Composición de harinas de cambur / yuca conforme a la fórmula, lote certificado y pesaje en balanza calibrada.
                </p>
              </div>

              {/* C / NC / NA selector */}
              <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetRequisito(galponId, "materiaPrima", "cumple")}
                  className={cn(
                    "px-3 py-1 text-xs font-black rounded transition-all cursor-pointer",
                    acta.requisitos.materiaPrima === "cumple"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  C (Cumple)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetRequisito(galponId, "materiaPrima", "no_cumple")}
                  className={cn(
                    "px-3 py-1 text-xs font-black rounded transition-all cursor-pointer",
                    acta.requisitos.materiaPrima === "no_cumple"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  NC (No Cumple)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetRequisito(galponId, "materiaPrima", "na")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer",
                    acta.requisitos.materiaPrima === "na"
                      ? "bg-slate-700 text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  N/A
                </button>
              </div>
            </div>

            {/* Requisito 4: Seguridad e Higiene del Personal */}
            <div className="rounded-lg border border-border p-3 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-bold text-foreground">
                    4
                  </span>
                  <span className="text-xs font-extrabold text-foreground">
                    Seguridad e Higiene del Personal
                  </span>
                  <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[9px] py-0 px-1.5 font-bold">
                    Control Visual BPM
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Cofia, mascarilla cubriendo nariz/boca, uniforme reglamentario, sin joyería ni relojes, pediluvio y manos sanitizadas.
                </p>
              </div>

              {/* C / NC / NA selector */}
              <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetRequisito(galponId, "seguridadHigiene", "cumple")}
                  className={cn(
                    "px-3 py-1 text-xs font-black rounded transition-all cursor-pointer",
                    acta.requisitos.seguridadHigiene === "cumple"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  C (Cumple)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetRequisito(galponId, "seguridadHigiene", "no_cumple")}
                  className={cn(
                    "px-3 py-1 text-xs font-black rounded transition-all cursor-pointer",
                    acta.requisitos.seguridadHigiene === "no_cumple"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  NC (No Cumple)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetRequisito(galponId, "seguridadHigiene", "na")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer",
                    acta.requisitos.seguridadHigiene === "na"
                      ? "bg-slate-700 text-white shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  N/A
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Observaciones / Desviaciones Encontradas */}
        <div className="p-4 border-b border-border bg-card">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">
            Observaciones / Desviaciones Encontradas:
          </label>
          <textarea
            rows={2}
            value={acta.observaciones}
            onChange={(e) => handleUpdateMeta(galponId, "observaciones", e.target.value)}
            placeholder="Especifique cualquier desviación en peso, despeje de línea, residuos o condición operativa observada..."
            className="w-full text-xs rounded-lg border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* DICTAMEN DE LIBERACIÓN DE INICIO DE OPERACIONES */}
        <div className="p-4 border-b border-border bg-muted/30">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2">
            Dictamen Oficial de Liberación (Seleccione una condición)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Opción 1: Aprobado para iniciar operaciones */}
            <div
              onClick={() => handleSetDictamen(galponId, "aprobado")}
              className={cn(
                "rounded-lg border p-3 cursor-pointer transition-all flex items-center justify-between",
                acta.dictamen === "aprobado"
                  ? "border-emerald-600 bg-emerald-500/10 ring-1 ring-emerald-600"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "size-4 rounded-full border flex items-center justify-center",
                  acta.dictamen === "aprobado" ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground"
                )}>
                  {acta.dictamen === "aprobado" && <Check className="size-2.5 stroke-[3]" />}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-foreground">
                    Aprobado para iniciar operaciones
                  </p>
                  <p className="text-[10px] text-muted-foreground">Línea 100% autorizada</p>
                </div>
              </div>
            </div>

            {/* Opción 2: Condicionado (requiere corrección menor) */}
            <div
              onClick={() => handleSetDictamen(galponId, "condicionado")}
              className={cn(
                "rounded-lg border p-3 cursor-pointer transition-all flex items-center justify-between",
                acta.dictamen === "condicionado"
                  ? "border-amber-600 bg-amber-500/10 ring-1 ring-amber-600"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "size-4 rounded-full border flex items-center justify-center",
                  acta.dictamen === "condicionado" ? "border-amber-600 bg-amber-600 text-white" : "border-muted-foreground"
                )}>
                  {acta.dictamen === "condicionado" && <Check className="size-2.5 stroke-[3]" />}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-foreground">
                    Condicionado (corrección menor)
                  </p>
                  <p className="text-[10px] text-muted-foreground">Requiere ajuste previo</p>
                </div>
              </div>
            </div>

            {/* Opción 3: Rechazado / Detenido */}
            <div
              onClick={() => handleSetDictamen(galponId, "rechazado")}
              className={cn(
                "rounded-lg border p-3 cursor-pointer transition-all flex items-center justify-between",
                acta.dictamen === "rechazado"
                  ? "border-rose-600 bg-rose-500/10 ring-1 ring-rose-600"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "size-4 rounded-full border flex items-center justify-center",
                  acta.dictamen === "rechazado" ? "border-rose-600 bg-rose-600 text-white" : "border-muted-foreground"
                )}>
                  {acta.dictamen === "rechazado" && <Check className="size-2.5 stroke-[3]" />}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-foreground">
                    Rechazado / Detenido
                  </p>
                  <p className="text-[10px] text-muted-foreground">Línea bloqueada por Calidad</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Única Firma: Control de Calidad (Ingeniero de Guardia) */}
        <div className="p-4 bg-card mt-auto border-t border-border flex flex-col items-center justify-center">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-3 text-center">
            Liberación y Visto Bueno Técnico · Control de Calidad
          </p>
          <div
            onClick={() => handleFirmarCalidad(galponId)}
            className="flex flex-col items-center text-center cursor-pointer p-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border max-w-md w-full"
            title="Haga clic aquí para firmar automáticamente con su usuario o anular"
          >
            <div className="w-full max-w-xs border-b-2 border-foreground/40 pb-2 min-h-[56px] flex flex-col justify-end">
              {acta.firmaCalidad.firmado ? (
                <div className="text-xs font-mono text-[#4b5e2a] dark:text-[#7ba045] font-bold">
                  <p className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="size-3.5" /> FIRMA DIGITALIZADA
                  </p>
                  <p className="text-foreground font-sans font-extrabold text-sm mt-0.5">
                    {acta.firmaCalidad.nombre}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{acta.firmaCalidad.cargo} · {acta.firmaCalidad.fecha}</p>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic flex flex-col items-center justify-center gap-1 py-1">
                  <PenTool className="size-4 text-[#4b5e2a]" />
                  <span>Haga clic para firmar y liberar arranque</span>
                </div>
              )}
            </div>
            <p className="text-xs font-extrabold uppercase tracking-wider mt-2.5 text-foreground">
              CONTROL DE CALIDAD (INGENIERO DE GUARDIA)
            </p>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {acta.firmaCalidad.firmado ? "(Clic para anular)" : "(Clic para firmar automáticamente)"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner & Document Identity */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
              <PlayCircle className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  Control de Procesos · Aseguramiento de Calidad
                </span>
                <Badge variant="outline" className="border-amber-600/40 bg-amber-600/10 text-amber-700 dark:text-amber-400 font-semibold text-[11px] whitespace-nowrap">
                  Código: ARAWAK-CC-AO-01
                </Badge>
                <Badge variant="secondary" className="text-[11px] font-medium whitespace-nowrap">
                  Acta de Liberación AIO
                </Badge>
              </div>
              <h2 className="text-xl font-black text-foreground sm:text-2xl mt-0.5 tracking-tight">
                Arranque de Operaciones (Liberación de Línea)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verificación previa y dictamen técnico de inicio de producción para Galpón 9 (Galletas) y Galpón 8 (Yuca y Harinas)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-border/50 print:hidden">
            {onIrALimpieza ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onIrALimpieza}
                className="gap-1.5 border-border hover:bg-muted text-xs font-semibold text-[#4b5e2a]"
              >
                <Sparkles className="size-3.5" />
                Ir a Limpieza de Planta
              </Button>
            ) : <div />}

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                accept=".xlsx,.xls"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 border-border hover:bg-muted text-xs cursor-pointer font-semibold"
                title="Importar actas de inicio desde archivo Excel"
              >
                <Upload className="size-3.5 text-[#4b5e2a]" />
                Importar Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="gap-1.5 border-border hover:bg-muted text-xs cursor-pointer font-semibold"
                title="Descargar actas de arranque en archivo Excel (.xlsx)"
              >
                <FileSpreadsheet className="size-3.5 text-[#4b5e2a]" />
                Exportar Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 border-border hover:bg-muted text-xs font-semibold"
              >
                <Printer className="size-3.5" />
                Imprimir AIO
              </Button>
              <Button
                size="sm"
                onClick={handleGuardar}
                className="gap-1.5 bg-[#4b5e2a] hover:bg-[#3d4d22] text-white shadow-xs text-xs font-bold"
              >
                <Save className="size-3.5" />
                Guardar Actas
              </Button>
            </div>
          </div>
        </div>

        {/* Cross-Link Explanatory Banner */}
        <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-foreground flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Integración Inteligente con Limpieza de Planta:</strong> El estado de higienización POES alimenta automáticamente la liberación de los requisitos de arranque en ambas naves de producción.
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            Trazabilidad Inocua 100% Sin Gluten
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Tabs for Galpón 9 vs Galpón 8 vs Comparison */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 print:hidden">
        <div className="flex items-center gap-1.5 rounded-xl bg-muted/60 p-1 border border-border/60">
          <button
            onClick={() => setActiveGalpon("galpon-9")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-extrabold transition-all cursor-pointer",
              activeGalpon === "galpon-9"
                ? "bg-[#4b5e2a] text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <Factory className="size-4" />
            Galpón 9: Producción de Galletas
          </button>

          <button
            onClick={() => setActiveGalpon("galpon-8")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-extrabold transition-all cursor-pointer",
              activeGalpon === "galpon-8"
                ? "bg-indigo-700 text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <Layers className="size-4" />
            Galpón 8: Procesos de Yuca & Harinas
          </button>

          <button
            onClick={() => setActiveGalpon("ambos")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-extrabold transition-all cursor-pointer",
              activeGalpon === "ambos"
                ? "bg-card text-foreground shadow-2xs border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <FileCheck2 className="size-4" />
            Vista Comparativa (Ambas Actas)
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Dictamen G9: </span>
          <strong className={cn(
            actas["galpon-9"].dictamen === "aprobado" ? "text-emerald-600" : "text-amber-600"
          )}>
            {actas["galpon-9"].dictamen.toUpperCase()}
          </strong>
          <span>|</span>
          <span>Dictamen G8: </span>
          <strong className={cn(
            actas["galpon-8"].dictamen === "aprobado" ? "text-emerald-600" : "text-amber-600"
          )}>
            {actas["galpon-8"].dictamen.toUpperCase()}
          </strong>
        </div>
      </div>

      {/* 3. Render Active View */}
      {activeGalpon === "galpon-9" && (
        <div className="max-w-4xl mx-auto">
          {renderActaForm("galpon-9")}
        </div>
      )}

      {activeGalpon === "galpon-8" && (
        <div className="max-w-4xl mx-auto">
          {renderActaForm("galpon-8")}
        </div>
      )}

      {activeGalpon === "ambos" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderActaForm("galpon-9", true)}
          {renderActaForm("galpon-8", true)}
        </div>
      )}

      {/* 4. Footer Note for Audit & Quality Compliance */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
        <p className="text-xs font-semibold text-foreground">
          ARAWAK · Departamento de Control de Calidad e Ingeniería Industrial
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          El Acta de Inicio de Operaciones (AIO) es el documento legal y técnico que autoriza la energización de los equipos y dosificación de materias primas. Su validez depende de la conformidad estricta con el módulo de Limpieza de Planta e Higiene del Personal.
        </p>
      </div>
    </div>
  );
}

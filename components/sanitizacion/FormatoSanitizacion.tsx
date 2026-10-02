"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Printer,
  Save,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  PenTool,
  CheckCheck,
  RotateCcw,
  Sparkles,
  UserCheck,
  ShieldCheck,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import {
  exportarSanitizacionExcel,
  importarSanitizacionExcel,
} from "@/lib/excel-service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ItemFormulario,
  initialHigieneData,
  initialSaneamientoData,
  getSemanaActual,
  RegistroDia,
} from "@/lib/sanitizacion-data";
import { getUsuarioActual } from "@/lib/auth";
import {
  guardarSanitizacionSaneamientoDB,
  guardarSanitizacionHigieneDB,
  obtenerUltimaSanitizacionSaneamientoDB,
  obtenerUltimaSanitizacionHigieneDB,
} from "@/lib/supabase-service";

type DiaClave = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado";

const DIAS: { clave: DiaClave; label: string; shortLabel: string }[] = [
  { clave: "lunes", label: "LUNES", shortLabel: "LUN" },
  { clave: "martes", label: "MARTES", shortLabel: "MAR" },
  { clave: "miercoles", label: "MIÉRCOLES", shortLabel: "MIÉ" },
  { clave: "jueves", label: "JUEVES", shortLabel: "JUE" },
  { clave: "viernes", label: "VIERNES", shortLabel: "VIE" },
  { clave: "sabado", label: "SÁBADO", shortLabel: "SÁB" },
];

export function FormatoSanitizacion() {
  const [tab, setTab] = useState<"saneamiento" | "higiene">("saneamiento");
  const [semanaInfo, setSemanaInfo] = useState(getSemanaActual());
  
  // Data states
  const [higieneItems, setHigieneItems] = useState<ItemFormulario[]>(initialHigieneData);
  const [saneamientoItems, setSaneamientoItems] = useState<ItemFormulario[]>(initialSaneamientoData);

  // Única firma: Ingeniero de Guardia en Control de Calidad
  const [firmaCalidadSaneamiento, setFirmaCalidadSaneamiento] = useState<{ firmado: boolean; fecha: string; inspector: string }>({
    firmado: false,
    fecha: "",
    inspector: "",
  });

  const [firmaCalidadHigiene, setFirmaCalidadHigiene] = useState<{ firmado: boolean; fecha: string; inspector: string }>({
    firmado: false,
    fecha: "",
    inspector: "",
  });

  // Load from localStorage & Supabase
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSan = localStorage.getItem("arawak_saneamiento_data");
      const savedHig = localStorage.getItem("arawak_higiene_data");
      if (savedSan) {
        try { setSaneamientoItems(JSON.parse(savedSan)); } catch {}
      }
      if (savedHig) {
        try { setHigieneItems(JSON.parse(savedHig)); } catch {}
      }
    }

    (async () => {
      try {
        const [cloudSan, cloudHig] = await Promise.all([
          obtenerUltimaSanitizacionSaneamientoDB(),
          obtenerUltimaSanitizacionHigieneDB(),
        ]);
        if (cloudSan?.items && Array.isArray(cloudSan.items)) {
          setSaneamientoItems(cloudSan.items);
          if (cloudSan.firma_calidad) setFirmaCalidadSaneamiento(cloudSan.firma_calidad);
        }
        if (cloudHig?.items && Array.isArray(cloudHig.items)) {
          setHigieneItems(cloudHig.items);
          if (cloudHig.firma_calidad) setFirmaCalidadHigiene(cloudHig.firma_calidad);
        }
      } catch (e) {
        console.warn("Supabase fetch fallback:", e);
      }
    })();
  }, []);

  // Handlers for toggling checkboxes
  const handleToggleDia = (
    tipo: "saneamiento" | "higiene",
    itemId: number,
    dia: DiaClave
  ) => {
    if (tipo === "saneamiento") {
      setSaneamientoItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                valoresDias: {
                  ...item.valoresDias,
                  [dia]: !item.valoresDias[dia],
                },
              }
            : item
        )
      );
    } else {
      setHigieneItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                valoresDias: {
                  ...item.valoresDias,
                  [dia]: !item.valoresDias[dia],
                },
              }
            : item
        )
      );
    }
  };

  const handleUpdateObservacion = (
    tipo: "saneamiento" | "higiene",
    itemId: number,
    texto: string
  ) => {
    if (tipo === "saneamiento") {
      setSaneamientoItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                valoresDias: {
                  ...item.valoresDias,
                  observaciones: texto,
                },
              }
            : item
        )
      );
    } else {
      setHigieneItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                valoresDias: {
                  ...item.valoresDias,
                  observaciones: texto,
                },
              }
            : item
        )
      );
    }
  };

  // Helper to mark all parameters for current day
  const handleMarcarTodoHoy = (tipo: "saneamiento" | "higiene") => {
    const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    const mapDays: DiaClave[] = ["sabado", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    const targetDay = mapDays[todayIndex] || "lunes";

    if (tipo === "saneamiento") {
      setSaneamientoItems((prev) =>
        prev.map((item) => ({
          ...item,
          valoresDias: { ...item.valoresDias, [targetDay]: true },
        }))
      );
    } else {
      setHigieneItems((prev) =>
        prev.map((item) => ({
          ...item,
          valoresDias: { ...item.valoresDias, [targetDay]: true },
        }))
      );
    }
    toast.success(`Todos los parámetros marcados como Conformes para hoy (${targetDay.toUpperCase()}).`);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importarSanitizacionExcel(file);
      let count = 0;
      if (res.saneamientoItems && res.saneamientoItems.length > 0) {
        setSaneamientoItems((prev) =>
          prev.map((item, idx) => {
            const match = res.saneamientoItems?.find((s) => s.id === item.id) || res.saneamientoItems?.[idx];
            if (match?.valoresDias) {
              count++;
              return { ...item, valoresDias: match.valoresDias };
            }
            return item;
          })
        );
      }
      if (res.higieneItems && res.higieneItems.length > 0) {
        setHigieneItems((prev) =>
          prev.map((item, idx) => {
            const match = res.higieneItems?.find((h) => h.id === item.id) || res.higieneItems?.[idx];
            if (match?.valoresDias) {
              count++;
              return { ...item, valoresDias: match.valoresDias };
            }
            return item;
          })
        );
      }
      toast.success("Archivo Excel importado con éxito", {
        description: `Se han actualizado los registros de sanitización desde ${file.name}.`,
      });
    } catch (err: any) {
      toast.error("Error al importar Excel", { description: err?.message });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGuardarCambios = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("arawak_saneamiento_data", JSON.stringify(saneamientoItems));
      localStorage.setItem("arawak_higiene_data", JSON.stringify(higieneItems));
    }

    try {
      const [resSan, resHig] = await Promise.all([
        guardarSanitizacionSaneamientoDB({
          semana_ano: semanaInfo.texto,
          fecha_inicio: semanaInfo.inicio,
          items: saneamientoItems,
          firma_calidad: firmaCalidadSaneamiento,
        }),
        guardarSanitizacionHigieneDB({
          semana_ano: semanaInfo.texto,
          fecha_inicio: semanaInfo.inicio,
          items: higieneItems,
          firma_calidad: firmaCalidadHigiene,
        }),
      ]);

      if (resSan.exito && resHig.exito) {
        toast.success("Registro de sanitización guardado en Supabase con éxito.", {
          description: "Datos sincronizados en la nube de Arawak.",
        });
      } else {
        toast.success("Registro guardado localmente.", {
          description: resSan.error || resHig.error,
        });
      }
    } catch {
      toast.success("Registro de sanitización guardado con éxito.");
    }
  };

  // Única función de firma: Ingeniero de Guardia en Control de Calidad
  const handleFirmarCalidad = (tipo: "saneamiento" | "higiene") => {
    const user = getUsuarioActual();
    const ahora = new Date().toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    const inspectorNombre = `${user.nombre} (${user.cargo})`;

    if (tipo === "saneamiento") {
      setFirmaCalidadSaneamiento((prev) => {
        const nuevoEstado = !prev.firmado;
        if (nuevoEstado) {
          toast.success(`Firma registrada automáticamente: ${user.nombre}`);
        } else {
          toast.info("Firma removida.");
        }
        return {
          firmado: nuevoEstado,
          fecha: nuevoEstado ? ahora : "",
          inspector: nuevoEstado ? inspectorNombre : "",
        };
      });
    } else {
      setFirmaCalidadHigiene((prev) => {
        const nuevoEstado = !prev.firmado;
        if (nuevoEstado) {
          toast.success(`Firma registrada automáticamente: ${user.nombre}`);
        } else {
          toast.info("Firma removida.");
        }
        return {
          firmado: nuevoEstado,
          fecha: nuevoEstado ? ahora : "",
          inspector: nuevoEstado ? inspectorNombre : "",
        };
      });
    }
  };

  // Metrics computation
  const statsSaneamiento = useMemo(() => {
    let totalChecks = 0;
    let checkedCount = 0;
    saneamientoItems.forEach((item) => {
      DIAS.forEach((d) => {
        totalChecks++;
        if (item.valoresDias[d.clave]) checkedCount++;
      });
    });
    const pct = totalChecks ? Math.round((checkedCount / totalChecks) * 100) : 0;
    return { totalChecks, checkedCount, pct };
  }, [saneamientoItems]);

  const statsHigiene = useMemo(() => {
    let totalChecks = 0;
    let checkedCount = 0;
    higieneItems.forEach((item) => {
      DIAS.forEach((d) => {
        totalChecks++;
        if (item.valoresDias[d.clave]) checkedCount++;
      });
    });
    const pct = totalChecks ? Math.round((checkedCount / totalChecks) * 100) : 0;
    return { totalChecks, checkedCount, pct };
  }, [higieneItems]);

  const currentStats = tab === "saneamiento" ? statsSaneamiento : statsHigiene;

  return (
    <div className="space-y-6">
      {/* Top Banner & Company Identity */}
      <div className="surface-card p-5 sm:p-6 border-l-4 border-l-[#4b5e2a] bg-gradient-to-r from-card via-card to-[#4b5e2a]/5 shadow-xs">
        <div className="flex flex-col gap-4">
          {/* Header Title & Identity */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-[#4b5e2a] text-white px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                Arawak · Planta de Producción
              </span>
              <Badge variant="outline" className="border-[#4b5e2a]/40 text-[#4b5e2a] dark:text-[#7ba045] bg-[#4b5e2a]/10 font-semibold text-xs whitespace-nowrap">
                Línea Galletas de Cambur y Yuca (Sin Gluten)
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono font-medium whitespace-nowrap">
                POES-01 / BPM-02
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Formato de Sanitización y Buenas Prácticas de Manufactura (BPM)
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-4xl">
              Digitalización oficial de planillas operativas para reemplazo de hojas de cálculo físicas en planta.
            </p>
          </div>

          {/* Action Toolbar & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
            {/* Week navigation */}
            <div className="flex items-center border border-border rounded-lg bg-secondary/40 px-3 py-1.5 gap-2">
              <Calendar className="size-4 text-[#4b5e2a]" />
              <span className="text-xs font-bold font-mono text-foreground">{semanaInfo.texto}</span>
            </div>

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
                className="gap-1.5 cursor-pointer text-xs font-semibold border-border hover:bg-secondary"
                title="Importar registro semanal desde archivo Excel"
              >
                <Upload className="size-3.5 text-[#4b5e2a]" /> Importar Excel
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => exportarSanitizacionExcel(saneamientoItems, higieneItems, semanaInfo.texto, firmaCalidadSaneamiento)}
                className="gap-1.5 cursor-pointer text-xs font-semibold border-border hover:bg-secondary"
                title="Descargar registro en archivo Excel (.xlsx)"
              >
                <FileSpreadsheet className="size-3.5 text-[#4b5e2a]" /> Exportar Excel
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-2 cursor-pointer print:hidden text-xs font-semibold border-border hover:bg-secondary"
                title="Imprimir formato oficial para auditoría"
              >
                <Printer className="size-3.5" /> Imprimir
              </Button>

              <Button
                size="sm"
                onClick={handleGuardarCambios}
                className="gap-2 bg-[#4b5e2a] hover:bg-[#3d4d22] text-white cursor-pointer shadow-xs text-xs font-bold"
              >
                <Save className="size-3.5" /> Guardar Cambios
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Compliance Bar */}
        <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-secondary/20 p-3 rounded-lg border border-border/40">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground">Cumplimiento Global</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-bold text-foreground num">{currentStats.pct}%</span>
              <span className="text-xs text-muted-foreground">({currentStats.checkedCount}/{currentStats.totalChecks} inspecciones)</span>
            </div>
          </div>

          <div className="bg-secondary/20 p-3 rounded-lg border border-border/40">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground">Límites Cloro Agua</span>
            <p className="text-base font-bold text-[#4b5e2a] mt-1">0.2 - 5.0 ppm</p>
          </div>

          <div className="bg-secondary/20 p-3 rounded-lg border border-border/40">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground">Desinfectante Mesones</span>
            <p className="text-base font-bold text-foreground mt-1">&gt; 100 ppm</p>
          </div>

          <div className="bg-secondary/20 p-3 rounded-lg border border-border/40">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground">Pediluvios de Acceso</span>
            <p className="text-base font-bold text-foreground mt-1">200 ppm</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation matching the 2 Excel Images */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <TabsList className="bg-secondary/60 p-1 border border-border">
            <TabsTrigger
              value="saneamiento"
              className="gap-2 data-[state=active]:bg-[#4b5e2a] data-[state=active]:text-white font-semibold text-xs sm:text-sm"
            >
              <Sparkles className="size-4" />
              1. Saneamiento Operacional de Planta
            </TabsTrigger>
            <TabsTrigger
              value="higiene"
              className="gap-2 data-[state=active]:bg-[#4b5e2a] data-[state=active]:text-white font-semibold text-xs sm:text-sm"
            >
              <UserCheck className="size-4" />
              2. Higiene del Personal (Control Visual)
            </TabsTrigger>
          </TabsList>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleMarcarTodoHoy(tab)}
            className="text-xs font-semibold gap-1.5 self-start sm:self-auto cursor-pointer border border-border hover:bg-secondary"
          >
            <CheckCheck className="size-4 text-[#4b5e2a]" />
            Marcar todo conforme hoy
          </Button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: REGISTRO SEMANAL DE SANEAMIENTO OPERACIONAL DE PLANTA             */}
        {/* ========================================================================= */}
        <TabsContent value="saneamiento" className="space-y-6 mt-0">
          <div className="surface-card overflow-hidden border border-border shadow-sm">
            {/* Excel Sheet Styled Header */}
            <div className="bg-[#4b5e2a] text-white px-5 py-3 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wide">
                REGISTRO SEMANAL DE SANEAMIENTO OPERACIONAL DE PLANTA
              </h3>
              <span className="text-xs font-mono font-medium opacity-90">
                Arawak POES-01 · Planta Galletas
              </span>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm text-left">
                <thead>
                  <tr className="bg-[#38461f] text-white border-b border-[#2d3819] text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-3 min-w-[280px] sm:min-w-[340px]">
                      Parámetro Operativo de Saneamiento
                    </th>
                    {DIAS.map((d) => (
                      <th key={d.clave} className="px-3 py-3 text-center min-w-[56px]">
                        {d.shortLabel}
                      </th>
                    ))}
                    <th className="px-4 py-3 min-w-[240px]">
                      OBSERVACIONES Y NO CONFORMES
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {saneamientoItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "transition-colors",
                        idx % 2 === 0 ? "bg-card" : "bg-secondary/15",
                        "hover:bg-secondary/40"
                      )}
                    >
                      {/* Param Title */}
                      <td className="px-4 py-3.5 align-middle">
                        <p className="font-semibold text-foreground text-sm leading-snug">
                          {item.parametro}
                        </p>
                        {item.especificacion && (
                          <span className="inline-block mt-0.5 text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded border border-border/50">
                            {item.especificacion}
                          </span>
                        )}
                      </td>

                      {/* Day Checkboxes */}
                      {DIAS.map((d) => {
                        const isChecked = item.valoresDias[d.clave];
                        return (
                          <td key={d.clave} className="px-3 py-3 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleToggleDia("saneamiento", item.id, d.clave)}
                              aria-label={`Marcar ${item.parametro} para ${d.label}`}
                              className={cn(
                                "size-7 mx-auto rounded border flex items-center justify-center transition-all cursor-pointer",
                                isChecked
                                  ? "bg-[#4b5e2a] border-[#4b5e2a] text-white shadow-xs"
                                  : "bg-background border-border hover:border-[#4b5e2a]/60"
                              )}
                            >
                              {isChecked && <CheckCircle2 className="size-5" />}
                            </button>
                          </td>
                        );
                      })}

                      {/* Observation Field */}
                      <td className="px-4 py-2 align-middle">
                        <Input
                          placeholder="Sin novedades..."
                          value={item.valoresDias.observaciones}
                          onChange={(e) => handleUpdateObservacion("saneamiento", item.id, e.target.value)}
                          className="h-9 text-xs bg-background/80"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signature Block: Única Firma de Control de Calidad (Ingeniero de Guardia) */}
            <div className="p-6 bg-secondary/25 border-t border-border flex flex-col items-center justify-center">
              <div
                onClick={() => handleFirmarCalidad("saneamiento")}
                className="flex flex-col items-center text-center cursor-pointer p-4 rounded-xl hover:bg-card/70 transition-all border border-transparent hover:border-border max-w-md w-full"
                title="Haga clic aquí para firmar automáticamente con su usuario o anular"
              >
                <div className="w-full max-w-xs border-b-2 border-foreground/40 pb-2 min-h-[56px] flex flex-col justify-end">
                  {firmaCalidadSaneamiento.firmado ? (
                    <div className="text-xs font-mono text-[#4b5e2a] dark:text-[#7ba045] font-bold">
                      <p className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="size-3.5" /> FIRMA DIGITALIZADA
                      </p>
                      <p className="text-foreground font-sans font-extrabold text-sm mt-0.5">
                        {firmaCalidadSaneamiento.inspector}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{firmaCalidadSaneamiento.fecha}</p>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic flex flex-col items-center justify-center gap-1 py-1">
                      <PenTool className="size-4 text-[#4b5e2a]" />
                      <span>Haga clic para firmar automáticamente</span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-extrabold uppercase tracking-wider mt-2.5 text-foreground">
                  CONTROL DE CALIDAD (INGENIERO DE GUARDIA)
                </p>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {firmaCalidadSaneamiento.firmado ? "(Clic para anular)" : "(Clic para firmar automáticamente)"}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: REGISTRO SEMANAL DE HIGIENE DEL PERSONAL (CONTROL VISUAL)         */}
        {/* ========================================================================= */}
        <TabsContent value="higiene" className="space-y-6 mt-0">
          <div className="surface-card overflow-hidden border border-border shadow-sm">
            {/* Excel Sheet Styled Header */}
            <div className="bg-[#4b5e2a] text-white px-5 py-3 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wide">
                REGISTRO SEMANAL DE HIGIENE DEL PERSONAL (CONTROL VISUAL)
              </h3>
              <span className="text-xs font-mono font-medium opacity-90">
                Arawak BPM-02 · Esclusa Sanitaria
              </span>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm text-left">
                <thead>
                  <tr className="bg-[#38461f] text-white border-b border-[#2d3819] text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-3 min-w-[280px] sm:min-w-[340px]">
                      Parámetro Evaluado
                    </th>
                    {DIAS.map((d) => (
                      <th key={d.clave} className="px-3 py-3 text-center min-w-[56px]">
                        {d.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 min-w-[240px]">
                      OBSERVACIONES Y NO CONFORMES
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {higieneItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "transition-colors",
                        idx % 2 === 0 ? "bg-card" : "bg-secondary/15",
                        "hover:bg-secondary/40"
                      )}
                    >
                      {/* Param Title */}
                      <td className="px-4 py-3.5 align-middle">
                        <p className="font-semibold text-foreground text-sm leading-snug">
                          {item.parametro}
                        </p>
                      </td>

                      {/* Day Checkboxes */}
                      {DIAS.map((d) => {
                        const isChecked = item.valoresDias[d.clave];
                        return (
                          <td key={d.clave} className="px-3 py-3 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleToggleDia("higiene", item.id, d.clave)}
                              aria-label={`Marcar ${item.parametro} para ${d.label}`}
                              className={cn(
                                "size-7 mx-auto rounded border flex items-center justify-center transition-all cursor-pointer",
                                isChecked
                                  ? "bg-[#4b5e2a] border-[#4b5e2a] text-white shadow-xs"
                                  : "bg-background border-border hover:border-[#4b5e2a]/60"
                              )}
                            >
                              {isChecked && <CheckCircle2 className="size-5" />}
                            </button>
                          </td>
                        );
                      })}

                      {/* Observation Field */}
                      <td className="px-4 py-2 align-middle">
                        <Input
                          placeholder="Sin observaciones..."
                          value={item.valoresDias.observaciones}
                          onChange={(e) => handleUpdateObservacion("higiene", item.id, e.target.value)}
                          className="h-9 text-xs bg-background/80"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signature Block: Única Firma de Control de Calidad (Ingeniero de Guardia) */}
            <div className="p-6 bg-secondary/25 border-t border-border flex flex-col items-center justify-center">
              <div
                onClick={() => handleFirmarCalidad("higiene")}
                className="flex flex-col items-center text-center cursor-pointer p-4 rounded-xl hover:bg-card/70 transition-all border border-transparent hover:border-border max-w-md w-full"
                title="Haga clic aquí para firmar automáticamente con su usuario o anular"
              >
                <div className="w-full max-w-xs border-b-2 border-foreground/40 pb-2 min-h-[56px] flex flex-col justify-end">
                  {firmaCalidadHigiene.firmado ? (
                    <div className="text-xs font-mono text-[#4b5e2a] dark:text-[#7ba045] font-bold">
                      <p className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="size-3.5" /> FIRMA DIGITALIZADA
                      </p>
                      <p className="text-foreground font-sans font-extrabold text-sm mt-0.5">
                        {firmaCalidadHigiene.inspector}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{firmaCalidadHigiene.fecha}</p>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic flex flex-col items-center justify-center gap-1 py-1">
                      <PenTool className="size-4 text-[#4b5e2a]" />
                      <span>Haga clic para firmar automáticamente</span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-extrabold uppercase tracking-wider mt-2.5 text-foreground">
                  CONTROL DE CALIDAD (INGENIERO DE GUARDIA)
                </p>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {firmaCalidadHigiene.firmado ? "(Clic para anular)" : "(Clic para firmar automáticamente)"}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Printer,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Sparkles,
  ShieldCheck,
  Filter,
  CheckCheck,
  RotateCcw,
  BookOpen,
  UserCheck,
  Factory,
  Layers,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Download,
  Clock,
  HelpCircle,
  AlertCircle,
  PenTool,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getUsuarioActual } from "@/lib/auth";
import {
  guardarLimpiezaPlantaDB,
  obtenerUltimaLimpiezaPlantaDB,
} from "@/lib/supabase-service";
import {
  areasEquiposLimpieza,
  pasosProcedimientoLimpieza,
  initialEjecucionData,
  initialInspeccionData,
  AreaEquipoLimpieza,
  RegistroEjecucion8Pasos,
  RegistroInspeccionCalidad,
} from "@/lib/limpieza-planta-data";

type VistaCuadros = "ambos" | "ejecucion" | "inspeccion";

export function LimpiezaPlanta() {
  const [vista, setVista] = useState<VistaCuadros>("ambos");
  const [fechaLimpieza, setFechaLimpieza] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [fechaInspeccion, setFechaInspeccion] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [turnoGlobal, setTurnoGlobal] = useState<string>("Turno Mañana (06:00 - 14:00)");
  const [observacionesGenerales, setObservacionesGenerales] = useState<string>("");

  // States for Cuadro 1 & Cuadro 2
  const [ejecucionData, setEjecucionData] = useState<Record<number, RegistroEjecucion8Pasos>>(initialEjecucionData);
  const [inspeccionData, setInspeccionData] = useState<Record<number, RegistroInspeccionCalidad>>(initialInspeccionData);

  // Filters (Category & Frequency)
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroFrecuencia, setFiltroFrecuencia] = useState<string>("todas");
  const [mostrarGuia8Pasos, setMostrarGuia8Pasos] = useState(false);

  // Única firma: Ingeniero de Guardia en Control de Calidad
  const [firmaCalidadEjecucion, setFirmaCalidadEjecucion] = useState({
    firmado: false,
    nombre: "",
    cargo: "",
    fecha: "",
  });

  const [firmaCalidadInspeccion, setFirmaCalidadInspeccion] = useState({
    firmado: false,
    nombre: "",
    cargo: "",
    fecha: "",
  });

  const handleFirmarEjecucion = () => {
    const user = getUsuarioActual();
    const ahora = new Date().toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    setFirmaCalidadEjecucion((prev) => {
      const nuevo = !prev.firmado;
      if (nuevo) {
        toast.success(`Firma de Control de Calidad registrada: ${user.nombre}`);
      } else {
        toast.info("Firma de Control de Calidad removida.");
      }
      return {
        firmado: nuevo,
        nombre: nuevo ? user.nombre : "",
        cargo: nuevo ? user.cargo : "",
        fecha: nuevo ? ahora : "",
      };
    });
  };

  const handleFirmarInspeccion = () => {
    const user = getUsuarioActual();
    const ahora = new Date().toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    setFirmaCalidadInspeccion((prev) => {
      const nuevo = !prev.firmado;
      if (nuevo) {
        toast.success(`Firma de Control de Calidad registrada: ${user.nombre}`);
      } else {
        toast.info("Firma de Control de Calidad removida.");
      }
      return {
        firmado: nuevo,
        nombre: nuevo ? user.nombre : "",
        cargo: nuevo ? user.cargo : "",
        fecha: nuevo ? ahora : "",
      };
    });
  };

  // LocalStorage & Supabase Persistence
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEjecucion = localStorage.getItem("arawak_limpieza_ejecucion_v1");
      const savedInspeccion = localStorage.getItem("arawak_limpieza_inspeccion_v1");
      const savedObs = localStorage.getItem("arawak_limpieza_observaciones");

      if (savedEjecucion) {
        try { setEjecucionData(JSON.parse(savedEjecucion)); } catch {}
      }
      if (savedInspeccion) {
        try { setInspeccionData(JSON.parse(savedInspeccion)); } catch {}
      }
      if (savedObs) {
        setObservacionesGenerales(savedObs);
      }
    }

    (async () => {
      try {
        const cloud = await obtenerUltimaLimpiezaPlantaDB();
        if (cloud) {
          if (cloud.ejecucion_8pasos) setEjecucionData(cloud.ejecucion_8pasos);
          if (cloud.inspeccion_calidad) setInspeccionData(cloud.inspeccion_calidad);
          if (cloud.observaciones_generales) setObservacionesGenerales(cloud.observaciones_generales);
          if (cloud.firma_ejecucion) setFirmaCalidadEjecucion(cloud.firma_ejecucion);
          if (cloud.firma_inspeccion) setFirmaCalidadInspeccion(cloud.firma_inspeccion);
        }
      } catch (e) {
        console.warn("Supabase fetch fallback:", e);
      }
    })();
  }, []);

  // Save to LocalStorage & Supabase
  const handleGuardar = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("arawak_limpieza_ejecucion_v1", JSON.stringify(ejecucionData));
      localStorage.setItem("arawak_limpieza_inspeccion_v1", JSON.stringify(inspeccionData));
      localStorage.setItem("arawak_limpieza_observaciones", observacionesGenerales);
    }

    try {
      const res = await guardarLimpiezaPlantaDB({
        fecha: fechaLimpieza,
        turno: turnoGlobal,
        ejecucion_8pasos: ejecucionData,
        inspeccion_calidad: inspeccionData,
        observaciones_generales: observacionesGenerales,
        firma_ejecucion: firmaCalidadEjecucion,
        firma_inspeccion: firmaCalidadInspeccion,
      });

      if (res.exito) {
        toast.success("Limpieza e Inspección guardada en Supabase con éxito", {
          description: `Registrado en la base de datos de planta para la fecha ${fechaLimpieza}.`,
        });
      } else {
        toast.success("Registro guardado localmente", {
          description: res.error,
        });
      }
    } catch {
      toast.success("Registro de Limpieza e Inspección guardado exitosamente", {
        description: `Se han registrado los datos para la fecha ${fechaLimpieza}.`,
      });
    }
  };

  // Toggle step for an area in Cuadro 1
  const handleTogglePaso = (areaId: number, pasoKey: keyof RegistroEjecucion8Pasos) => {
    setEjecucionData((prev) => {
      const actual = prev[areaId];
      if (!actual) return prev;
      return {
        ...prev,
        [areaId]: {
          ...actual,
          [pasoKey]: !actual[pasoKey],
        },
      };
    });
  };

  // Change Shift for an area
  const handleChangeTurnoArea = (areaId: number, turno: string) => {
    setEjecucionData((prev) => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        turnoResponsable: turno,
      },
    }));
  };

  // Change Inspeccion status (conforme / noConforme / correctivo)
  const handleSetEstadoInspeccion = (
    areaId: number,
    tipo: "conforme" | "noConforme" | "correctivo"
  ) => {
    setInspeccionData((prev) => {
      const actual = prev[areaId] || {
        areaId,
        conforme: false,
        noConforme: false,
        correctivo: false,
        accionCorrectiva: "",
        observacionArea: "",
      };
      return {
        ...prev,
        [areaId]: {
          ...actual,
          conforme: tipo === "conforme",
          noConforme: tipo === "noConforme",
          correctivo: tipo === "correctivo",
        },
      };
    });
  };

  // Change Action Corrective text
  const handleChangeAccionCorrectiva = (areaId: number, text: string) => {
    setInspeccionData((prev) => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        accionCorrectiva: text,
      },
    }));
  };

  // Change Area Observation text
  const handleChangeObservacionArea = (areaId: number, text: string) => {
    setInspeccionData((prev) => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        observacionArea: text,
      },
    }));
  };

  // Batch actions
  const handleMarcarTodos8Pasos = () => {
    setEjecucionData((prev) => {
      const next = { ...prev };
      areasFiltradas.forEach((area) => {
        next[area.id] = {
          ...next[area.id],
          paso1_prelimpiezaSeco: true,
          paso2_enjuagueInicialAgua: true,
          paso3_aplicacionDetergente: true,
          paso4_fregadoContacto: true,
          paso5_enjuagueFinalJabon: true,
          paso6_aplicacionDesinfectante: true,
          paso7_enjuagueFinalDesinfectante: true,
          paso8_secado: true,
        };
      });
      return next;
    });
    toast.success("Todos los 8 pasos POES marcados como ejecutados para las áreas seleccionadas");
  };

  const handleMarcarTodosConformes = () => {
    setInspeccionData((prev) => {
      const next = { ...prev };
      areasFiltradas.forEach((area) => {
        next[area.id] = {
          ...next[area.id],
          conforme: true,
          noConforme: false,
          correctivo: false,
        };
      });
      return next;
    });
    toast.success("Todas las áreas seleccionadas marcadas como CONFORMES por Control de Calidad");
  };

  const handleRestablecerTodo = () => {
    if (confirm("¿Estás seguro de restablecer todos los registros a los valores iniciales?")) {
      setEjecucionData(initialEjecucionData);
      setInspeccionData(initialInspeccionData);
      toast.info("Valores restablecidos a los parámetros iniciales");
    }
  };

  // Filtered areas
  const areasFiltradas = useMemo(() => {
    return areasEquiposLimpieza.filter((area) => {
      const coincideCat = filtroCategoria === "todas" || area.categoria === filtroCategoria;
      const coincideFrec = filtroFrecuencia === "todas" || area.frecuencia.toLowerCase() === filtroFrecuencia.toLowerCase();
      return coincideCat && coincideFrec;
    });
  }, [filtroCategoria, filtroFrecuencia]);

  // Statistics
  const stats = useMemo(() => {
    const totalAreas = areasEquiposLimpieza.length;
    let totalConformes = 0;
    let totalNoConformes = 0;
    let totalCorrectivos = 0;
    let totalPasosCompletados = 0;
    const totalPasosPosibles = totalAreas * 8;

    areasEquiposLimpieza.forEach((area) => {
      const insp = inspeccionData[area.id];
      if (insp?.conforme) totalConformes++;
      if (insp?.noConforme) totalNoConformes++;
      if (insp?.correctivo) totalCorrectivos++;

      const ejec = ejecucionData[area.id];
      if (ejec) {
        if (ejec.paso1_prelimpiezaSeco) totalPasosCompletados++;
        if (ejec.paso2_enjuagueInicialAgua) totalPasosCompletados++;
        if (ejec.paso3_aplicacionDetergente) totalPasosCompletados++;
        if (ejec.paso4_fregadoContacto) totalPasosCompletados++;
        if (ejec.paso5_enjuagueFinalJabon) totalPasosCompletados++;
        if (ejec.paso6_aplicacionDesinfectante) totalPasosCompletados++;
        if (ejec.paso7_enjuagueFinalDesinfectante) totalPasosCompletados++;
        if (ejec.paso8_secado) totalPasosCompletados++;
      }
    });

    const porcentajeConformidad = Math.round((totalConformes / totalAreas) * 100);
    const porcentajePasos = Math.round((totalPasosCompletados / totalPasosPosibles) * 100);

    return {
      totalAreas,
      totalConformes,
      totalNoConformes,
      totalCorrectivos,
      totalPasosCompletados,
      totalPasosPosibles,
      porcentajeConformidad,
      porcentajePasos,
    };
  }, [inspeccionData, ejecucionData]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Área / Equipo",
      "Categoría",
      "Frecuencia",
      "Turno Responsable",
      "P1 Limpieza Seco",
      "P2 Enjuague Inicial",
      "P3 Detergente",
      "P4 Fregado Contacto",
      "P5 Enjuague Jabón",
      "P6 Desinfectante",
      "P7 Enjuague Desinfectante",
      "P8 Secado",
      "Conforme",
      "No Conforme",
      "Correctivo",
      "Acción Correctiva",
      "Observación del Área",
    ];

    const rows = areasEquiposLimpieza.map((a) => {
      const ej = ejecucionData[a.id];
      const ins = inspeccionData[a.id];
      return [
        a.id,
        `"${a.nombre}"`,
        `"${a.categoria}"`,
        `"${a.frecuencia}"`,
        `"${ej?.turnoResponsable || ""}"`,
        ej?.paso1_prelimpiezaSeco ? "SÍ" : "NO",
        ej?.paso2_enjuagueInicialAgua ? "SÍ" : "NO",
        ej?.paso3_aplicacionDetergente ? "SÍ" : "NO",
        ej?.paso4_fregadoContacto ? "SÍ" : "NO",
        ej?.paso5_enjuagueFinalJabon ? "SÍ" : "NO",
        ej?.paso6_aplicacionDesinfectante ? "SÍ" : "NO",
        ej?.paso7_enjuagueFinalDesinfectante ? "SÍ" : "NO",
        ej?.paso8_secado ? "SÍ" : "NO",
        ins?.conforme ? "CONFORME" : "",
        ins?.noConforme ? "NO CONFORME" : "",
        ins?.correctivo ? "CORRECTIVO" : "",
        `"${ins?.accionCorrectiva || ""}"`,
        `"${ins?.observacionArea || ""}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Arawak_Limpieza_Planta_${fechaLimpieza}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Reporte CSV descargado con éxito");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner & Document Identity */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#4b5e2a] text-white shadow-xs">
              <Factory className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4b5e2a] dark:text-[#7ba045]">
                  POES · Saneamiento Operativo Industrial
                </span>
                <Badge variant="outline" className="border-[#4b5e2a]/40 bg-[#4b5e2a]/10 text-[#4b5e2a] dark:text-[#7ba045] font-semibold text-[11px]">
                  Código: ARAWAK-CC-LP-01
                </Badge>
                <Badge variant="secondary" className="text-[11px] font-medium">
                  Rev. 04 · Vigente
                </Badge>
              </div>
              <h2 className="text-xl font-black text-foreground sm:text-2xl mt-0.5 tracking-tight">
                Control de Calidad: Limpieza de Planta e Inspección
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Planta Arawak · Cuadro 1 (Procedimiento 8 Pasos) & Cuadro 2 (Inspección de Calidad)
              </p>
            </div>
          </div>

          {/* Quick Global Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarGuia8Pasos(!mostrarGuia8Pasos)}
              className="gap-1.5 border-border hover:bg-muted text-xs font-semibold"
            >
              <BookOpen className="size-3.5 text-[#4b5e2a]" />
              {mostrarGuia8Pasos ? "Ocultar Guía POES" : "Guía 8 Pasos POES"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 border-border hover:bg-muted text-xs"
            >
              <Download className="size-3.5" />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 border-border hover:bg-muted text-xs"
            >
              <Printer className="size-3.5" />
              Imprimir
            </Button>
            <Button
              size="sm"
              onClick={handleGuardar}
              className="gap-1.5 bg-[#4b5e2a] hover:bg-[#3d4d22] text-white shadow-xs text-xs font-semibold"
            >
              <Save className="size-3.5" />
              Guardar Cambios
            </Button>
          </div>
        </div>

        {/* Date, Shift & Inspection Meta Selectors */}
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
            <Calendar className="size-4 shrink-0 text-[#4b5e2a]" />
            <div className="min-w-0 flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Fecha de Limpieza (Cuadro 1)
              </label>
              <input
                type="date"
                value={fechaLimpieza}
                onChange={(e) => setFechaLimpieza(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Fecha de Inspección (Cuadro 2)
              </label>
              <input
                type="date"
                value={fechaInspeccion}
                onChange={(e) => setFechaInspeccion(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
            <Clock className="size-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Turno General
              </label>
              <select
                value={turnoGlobal}
                onChange={(e) => setTurnoGlobal(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="Turno Mañana (06:00 - 14:00)">Turno Mañana (06:00 - 14:00)</option>
                <option value="Turno Tarde (14:00 - 22:00)">Turno Tarde (14:00 - 22:00)</option>
                <option value="Turno Noche (22:00 - 06:00)">Turno Noche (22:00 - 06:00)</option>
                <option value="Turno Especial Saneamiento">Turno Especial Saneamiento</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
            <Factory className="size-4 shrink-0 text-indigo-600" />
            <div className="min-w-0 flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Planta / Ubicación
              </label>
              <p className="text-xs font-bold text-foreground truncate">
                Línea Galletas & Harinas Sin Gluten
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Educational / Technical Reference for the 8 Steps (Collapsible) */}
      <AnimatePresence>
        {mostrarGuia8Pasos && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-[#4b5e2a]/30 bg-[#4b5e2a]/5 dark:bg-[#4b5e2a]/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-[#4b5e2a]" />
                    <CardTitle className="text-sm font-extrabold uppercase tracking-wide text-foreground">
                      Procedimiento Oficial de los 8 Pasos (POES - Limpieza Profunda)
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="border-[#4b5e2a]/40 text-[#4b5e2a] font-bold text-[11px]">
                    Norma Técnica de Saneamiento Arawak
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {pasosProcedimientoLimpieza.map((p) => (
                  <div
                    key={p.paso}
                    className="flex flex-col justify-between rounded-lg border border-border bg-card p-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#4b5e2a] text-white text-xs font-black">
                          {p.paso}
                        </span>
                        <h4 className="text-xs font-extrabold text-foreground leading-snug">
                          {p.titulo}
                        </h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {p.descripcion}
                      </p>
                    </div>
                    {p.quimico && (
                      <div className="mt-2 rounded bg-amber-500/10 p-1.5 border border-amber-500/20 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        🧪 {p.quimico}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Engineering KPI Cards Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Áreas / Equipos</p>
            <p className="text-xl font-black text-foreground">{stats.totalAreas}</p>
            <p className="text-[10px] text-muted-foreground">33 activos monitoreados</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Conformidad QA</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.porcentajeConformidad}%
              </span>
              <span className="text-[11px] font-bold text-muted-foreground">
                ({stats.totalConformes}/{stats.totalAreas})
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Áreas aprobadas</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#4b5e2a]/15 text-[#4b5e2a]">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">POES 8 Pasos</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-[#4b5e2a] dark:text-[#7ba045]">
                {stats.porcentajePasos}%
              </span>
              <span className="text-[11px] font-bold text-muted-foreground">
                ({stats.totalPasosCompletados}/{stats.totalPasosPosibles})
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Pasos completados</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            stats.totalNoConformes + stats.totalCorrectivos > 0
              ? "bg-amber-500/15 text-amber-600"
              : "bg-muted text-muted-foreground"
          )}>
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Desviaciones</p>
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                "text-xl font-black",
                stats.totalNoConformes + stats.totalCorrectivos > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
              )}>
                {stats.totalNoConformes + stats.totalCorrectivos}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ({stats.totalNoConformes} NC, {stats.totalCorrectivos} Corr)
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Requieren seguimiento</p>
          </div>
        </div>
      </div>

      {/* 4. Controls, Filters and View Toggle Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between print:hidden">
        {/* View Switcher: Both, Execution only, Inspection only */}
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setVista("ambos")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
              vista === "ambos"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Vista Integral (Ambos Cuadros)
          </button>
          <button
            onClick={() => setVista("ejecucion")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
              vista === "ejecucion"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Cuadro 1: 8 Pasos
          </button>
          <button
            onClick={() => setVista("inspeccion")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
              vista === "inspeccion"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Cuadro 2: Inspección QA
          </button>
        </div>

        {/* Category & Frequency Filters */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Category */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none cursor-pointer"
          >
            <option value="todas">Todas las categorías</option>
            <option value="Almacén">Almacén</option>
            <option value="Producción Galletas/Tortillas">Producción Galletas/Tortillas</option>
            <option value="Procesamiento de Yuca">Procesamiento de Yuca</option>
            <option value="Instalaciones">Instalaciones</option>
          </select>

          {/* Frequency */}
          <select
            value={filtroFrecuencia}
            onChange={(e) => setFiltroFrecuencia(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none cursor-pointer"
          >
            <option value="todas">Todas las frecuencias</option>
            <option value="Diaria">Diaria</option>
            <option value="Sábados">Sábados</option>
            <option value="Miércoles y Viernes">Miércoles y Viernes</option>
            <option value="Viernes">Viernes</option>
          </select>

          {/* Quick complete helpers */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarcarTodos8Pasos}
            title="Marcar los 8 pasos completos para las áreas mostradas"
            className="h-8 px-2 text-xs text-[#4b5e2a] hover:bg-[#4b5e2a]/10 font-medium"
          >
            <CheckCheck className="size-3.5 mr-1" />
            8 Pasos OK
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarcarTodosConformes}
            title="Marcar conforme en inspección para las áreas mostradas"
            className="h-8 px-2 text-xs text-emerald-600 hover:bg-emerald-500/10 font-medium"
          >
            <CheckCircle2 className="size-3.5 mr-1" />
            Conforme Todo
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestablecerTodo}
            title="Restablecer"
            className="h-8 size-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 5. THE TWO TABLES: CUADRO 1 (LIMPIEZA DE PLANTA - 8 PASOS) & CUADRO 2 (INSPECCIÓN DE LIMPIEZA) */}
      <div className="space-y-8">
        {/* ========================================================================= */}
        {/* CUADRO 1: PROCEDIMIENTO DE LOS 8 PASOS (LIMPIEZA DE PLANTA)               */}
        {/* ========================================================================= */}
        {(vista === "ambos" || vista === "ejecucion") && (
          <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
            {/* Header of Cuadro 1 */}
            <div className="flex flex-col gap-2 border-b border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[#4b5e2a] text-white text-xs font-black">
                  1
                </span>
                <div>
                  <h3 className="text-base font-black text-foreground tracking-tight">
                    CUADRO 1: LIMPIEZA DE PLANTA (Procedimiento de los 8 Pasos)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ejecución física de limpieza y desinfección por los operarios de turno según POES
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-border text-xs font-medium">
                  Fecha: <strong className="ml-1 text-foreground">{fechaLimpieza}</strong>
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {areasFiltradas.length} áreas filtradas
                </Badge>
              </div>
            </div>

            {/* Table Cuadro 1 */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/70 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-3 min-w-[200px] border-r border-border/60">Área / Equipo</th>
                    <th className="py-3 px-2 w-28 text-center border-r border-border/60">Frecuencia</th>
                    <th className="py-3 px-2 w-44 text-center border-r border-border/60">TURNO Responsable</th>
                    <th className="py-3 px-1.5 w-16 text-center border-r border-border/60" title="1. Prelimpieza (Limpieza en Seco)">
                      1. Seco
                    </th>
                    <th className="py-3 px-1.5 w-16 text-center border-r border-border/60" title="2. Enjuague Inicial (AGUA)">
                      2. Agua
                    </th>
                    <th className="py-3 px-1.5 w-16 text-center border-r border-border/60" title="3. Aplicación de Detergente">
                      3. Deterg.
                    </th>
                    <th className="py-3 px-1.5 w-16 text-center border-r border-border/60" title="4. Fregado / Tiempo de Contacto">
                      4. Fregado
                    </th>
                    <th className="py-3 px-1.5 w-16 text-center border-r border-border/60" title="5. Enjuague Final (JABON)">
                      5. Enj. Jab.
                    </th>
                    <th className="py-3 px-1.5 w-16 text-center border-r border-border/60" title="6. Aplicación de Desinfectante">
                      6. Desinf.
                    </th>
                    <th className="py-3 px-1.5 w-16 text-center border-r border-border/60" title="7. Enjuague Final (Desinfectante)">
                      7. Enj. Des.
                    </th>
                    <th className="py-3 px-1.5 w-16 text-center">
                      8. Secado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-sans">
                  {areasFiltradas.map((area) => {
                    const row = ejecucionData[area.id] || {
                      areaId: area.id,
                      turnoResponsable: turnoGlobal,
                      paso1_prelimpiezaSeco: false,
                      paso2_enjuagueInicialAgua: false,
                      paso3_aplicacionDetergente: false,
                      paso4_fregadoContacto: false,
                      paso5_enjuagueFinalJabon: false,
                      paso6_aplicacionDesinfectante: false,
                      paso7_enjuagueFinalDesinfectante: false,
                      paso8_secado: false,
                      observaciones: "",
                    };

                    const pasosArray: (keyof RegistroEjecucion8Pasos)[] = [
                      "paso1_prelimpiezaSeco",
                      "paso2_enjuagueInicialAgua",
                      "paso3_aplicacionDetergente",
                      "paso4_fregadoContacto",
                      "paso5_enjuagueFinalJabon",
                      "paso6_aplicacionDesinfectante",
                      "paso7_enjuagueFinalDesinfectante",
                      "paso8_secado",
                    ];

                    const completitud = pasosArray.filter((p) => Boolean(row[p])).length;
                    const esCompleto = completitud === 8;

                    return (
                      <tr
                        key={area.id}
                        className={cn(
                          "transition-colors hover:bg-muted/40",
                          esCompleto ? "bg-card" : "bg-amber-500/[0.02]"
                        )}
                      >
                        {/* Area Name */}
                        <td className="py-2.5 px-3 border-r border-border/60">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground w-5 shrink-0">
                              #{area.id}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-xs leading-tight">
                                {area.nombre}
                              </p>
                              <span className="text-[10px] text-muted-foreground">
                                {area.categoria}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Frecuencia */}
                        <td className="py-2.5 px-2 text-center border-r border-border/60">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 whitespace-nowrap",
                              area.frecuencia === "Diaria"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            )}
                          >
                            {area.frecuencia}
                          </Badge>
                        </td>

                        {/* Turno Responsable */}
                        <td className="py-2.5 px-2 text-center border-r border-border/60">
                          <select
                            value={row.turnoResponsable}
                            onChange={(e) => handleChangeTurnoArea(area.id, e.target.value)}
                            className="w-full text-[11px] rounded border border-border bg-background px-1.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer truncate"
                          >
                            <option value="Turno Mañana (06:00 - 14:00)">T. Mañana</option>
                            <option value="Turno Tarde (14:00 - 22:00)">T. Tarde</option>
                            <option value="Turno Noche (22:00 - 06:00)">T. Noche</option>
                            <option value="Operario Líder">Op. Líder</option>
                          </select>
                        </td>

                        {/* 8 Pasos Checkboxes */}
                        {pasosArray.map((pasoKey, idx) => {
                          const val = Boolean(row[pasoKey]);
                          return (
                            <td
                              key={pasoKey}
                              className={cn(
                                "py-2 px-1 text-center border-r border-border/60 last:border-r-0 cursor-pointer select-none transition-colors",
                                val ? "bg-[#4b5e2a]/5" : "bg-transparent"
                              )}
                              onClick={() => handleTogglePaso(area.id, pasoKey)}
                              title={`Paso ${idx + 1}: ${pasosProcedimientoLimpieza[idx]?.titulo}`}
                            >
                              <div className="flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={val}
                                  onChange={() => {}} // Handled by cell click
                                  className="size-4 rounded border-border text-[#4b5e2a] focus:ring-[#4b5e2a] cursor-pointer accent-[#4b5e2a]"
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Observations Bottom Section of Cuadro 1 */}
            <div className="border-t border-border p-4 bg-muted/20">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                OBSERVACIONES GENERALES DE LIMPIEZA DE PLANTA:
              </label>
              <textarea
                rows={2}
                value={observacionesGenerales}
                onChange={(e) => setObservacionesGenerales(e.target.value)}
                placeholder="Indique desviaciones en la aplicación de jabón, desinfectante amonio cuaternario, tiempos de contacto o secado..."
                className="w-full text-xs rounded-lg border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-[#4b5e2a]"
              />
            </div>

            {/* Signatures of Cuadro 1 */}
            <div className="border-t border-border p-4 bg-card">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-3 text-center">
                Validación de Calidad · POES Cuadro 1
              </p>
              <div className="flex flex-col items-center justify-center">
                <div
                  onClick={handleFirmarEjecucion}
                  className="flex flex-col items-center text-center cursor-pointer p-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border max-w-md w-full"
                  title="Haga clic aquí para firmar automáticamente con su usuario o anular"
                >
                  <div className="w-full max-w-xs border-b-2 border-foreground/40 pb-2 min-h-[56px] flex flex-col justify-end">
                    {firmaCalidadEjecucion.firmado ? (
                      <div className="text-xs font-mono text-[#4b5e2a] dark:text-[#7ba045] font-bold">
                        <p className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="size-3.5" /> FIRMA DIGITALIZADA
                        </p>
                        <p className="text-foreground font-sans font-extrabold text-sm mt-0.5">
                          {firmaCalidadEjecucion.nombre}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{firmaCalidadEjecucion.cargo} · {firmaCalidadEjecucion.fecha}</p>
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
                    {firmaCalidadEjecucion.firmado ? "(Clic para anular)" : "(Clic para firmar automáticamente)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CUADRO 2: INSPECCIÓN DE LIMPIEZA DE PLANTA (CONTROL DE CALIDAD)           */}
        {/* ========================================================================= */}
        {(vista === "ambos" || vista === "inspeccion") && (
          <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
            {/* Header of Cuadro 2 */}
            <div className="flex flex-col gap-2 border-b border-border bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-700 text-white text-xs font-black">
                  2
                </span>
                <div>
                  <h3 className="text-base font-black text-foreground tracking-tight">
                    CUADRO 2: INSPECCIÓN DE LIMPIEZA DE PLANTA (Control de Calidad)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Verificación técnica, dictamen de inocuidad y determinación de acciones correctivas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-border text-xs font-medium">
                  Fecha Inspección: <strong className="ml-1 text-foreground">{fechaInspeccion}</strong>
                </Badge>
                <Badge className="bg-emerald-600 text-white text-xs font-bold">
                  {stats.totalConformes} / {stats.totalAreas} Conformes
                </Badge>
              </div>
            </div>

            {/* Table Cuadro 2 */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/70 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-3 min-w-[200px] border-r border-border/60">Área / Equipo</th>
                    <th className="py-3 px-2 w-28 text-center border-r border-border/60">Frecuencia</th>
                    <th className="py-3 px-2 w-24 text-center border-r border-border/60 text-emerald-700 dark:text-emerald-400">
                      Conforme
                    </th>
                    <th className="py-3 px-2 w-28 text-center border-r border-border/60 text-rose-700 dark:text-rose-400">
                      No Conforme
                    </th>
                    <th className="py-3 px-2 w-24 text-center border-r border-border/60 text-amber-700 dark:text-amber-400">
                      Correctivo
                    </th>
                    <th className="py-3 px-3 min-w-[220px] border-r border-border/60">
                      Acción Correctiva
                    </th>
                    <th className="py-3 px-3 min-w-[220px]">
                      Observación del Área
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-sans">
                  {areasFiltradas.map((area) => {
                    const row = inspeccionData[area.id] || {
                      areaId: area.id,
                      conforme: true,
                      noConforme: false,
                      correctivo: false,
                      accionCorrectiva: "",
                      observacionArea: "",
                    };

                    return (
                      <tr
                        key={area.id}
                        className={cn(
                          "transition-colors hover:bg-muted/40",
                          row.noConforme ? "bg-rose-500/[0.04]" : row.correctivo ? "bg-amber-500/[0.04]" : "bg-card"
                        )}
                      >
                        {/* Area / Equipo */}
                        <td className="py-2.5 px-3 border-r border-border/60">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground w-5 shrink-0">
                              #{area.id}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-xs leading-tight">
                                {area.nombre}
                              </p>
                              <span className="text-[10px] text-muted-foreground">
                                {area.categoria}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Frecuencia */}
                        <td className="py-2.5 px-2 text-center border-r border-border/60">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-semibold px-1.5 py-0.5 whitespace-nowrap bg-muted"
                          >
                            {area.frecuencia}
                          </Badge>
                        </td>

                        {/* Conforme (Radio / Check) */}
                        <td
                          className="py-2.5 px-2 text-center border-r border-border/60 cursor-pointer select-none"
                          onClick={() => handleSetEstadoInspeccion(area.id, "conforme")}
                        >
                          <div className="flex items-center justify-center">
                            <input
                              type="radio"
                              name={`inspeccion_${area.id}`}
                              checked={row.conforme}
                              onChange={() => {}}
                              className="size-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                            />
                          </div>
                        </td>

                        {/* No Conforme */}
                        <td
                          className="py-2.5 px-2 text-center border-r border-border/60 cursor-pointer select-none"
                          onClick={() => handleSetEstadoInspeccion(area.id, "noConforme")}
                        >
                          <div className="flex items-center justify-center">
                            <input
                              type="radio"
                              name={`inspeccion_${area.id}`}
                              checked={row.noConforme}
                              onChange={() => {}}
                              className="size-4 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                            />
                          </div>
                        </td>

                        {/* Correctivo */}
                        <td
                          className="py-2.5 px-2 text-center border-r border-border/60 cursor-pointer select-none"
                          onClick={() => handleSetEstadoInspeccion(area.id, "correctivo")}
                        >
                          <div className="flex items-center justify-center">
                            <input
                              type="radio"
                              name={`inspeccion_${area.id}`}
                              checked={row.correctivo}
                              onChange={() => {}}
                              className="size-4 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                            />
                          </div>
                        </td>

                        {/* Acción Correctiva */}
                        <td className="py-2 px-2 border-r border-border/60">
                          <Input
                            type="text"
                            placeholder={row.noConforme || row.correctivo ? "Especifique acción correctiva obligatoria..." : "N/A - Conforme"}
                            value={row.accionCorrectiva}
                            onChange={(e) => handleChangeAccionCorrectiva(area.id, e.target.value)}
                            className={cn(
                              "h-7 text-xs border-border bg-background/80",
                              (row.noConforme || row.correctivo) && !row.accionCorrectiva
                                ? "border-amber-500/80 bg-amber-500/5 focus-visible:ring-amber-500"
                                : ""
                            )}
                          />
                        </td>

                        {/* Observación del Área */}
                        <td className="py-2 px-2">
                          <Input
                            type="text"
                            placeholder="Detalle visual o condición observada..."
                            value={row.observacionArea}
                            onChange={(e) => handleChangeObservacionArea(area.id, e.target.value)}
                            className="h-7 text-xs border-border bg-background/80"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signatures of Cuadro 2: Única Firma de Control de Calidad */}
            <div className="border-t border-border p-4 bg-card">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-3 text-center">
                Dictamen e Inspección de Calidad · Cuadro 2
              </p>
              <div className="flex flex-col items-center justify-center">
                <div
                  onClick={handleFirmarInspeccion}
                  className="flex flex-col items-center text-center cursor-pointer p-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border max-w-md w-full"
                  title="Haga clic aquí para firmar automáticamente con su usuario o anular"
                >
                  <div className="w-full max-w-xs border-b-2 border-foreground/40 pb-2 min-h-[56px] flex flex-col justify-end">
                    {firmaCalidadInspeccion.firmado ? (
                      <div className="text-xs font-mono text-[#4b5e2a] dark:text-[#7ba045] font-bold">
                        <p className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="size-3.5" /> FIRMA DIGITALIZADA
                        </p>
                        <p className="text-foreground font-sans font-extrabold text-sm mt-0.5">
                          {firmaCalidadInspeccion.nombre}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{firmaCalidadInspeccion.cargo} · {firmaCalidadInspeccion.fecha}</p>
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
                    {firmaCalidadInspeccion.firmado ? "(Clic para anular)" : "(Clic para firmar automáticamente)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Footer Note for Audit & Quality Compliance */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
        <p className="text-xs font-semibold text-foreground">
          ARAWAK · Departamento de Aseguramiento de la Calidad e Inocuidad Alimentaria
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Este registro digital sustituye la planilla física de Excel, garantizando trazabilidad, integridad de datos POES y cumplimiento con las normativas sanitarias vigentes para alimentos sin gluten.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wheat,
  Scale,
  Calendar,
  Clock,
  Printer,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileCheck2,
  Download,
  Info,
  ChevronRight,
  ChevronLeft,
  Truck,
  Check,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Thermometer,
  Eye,
  AlertCircle,
  PenTool,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  normasCalibreYuca,
  RegistroMateriaPrima,
  initialMateriaPrimaRegistro,
  historicoRecepcionesMock,
  TipoCalibreYuca,
} from "@/lib/materia-prima-data";
import { getUsuarioActual, UsuarioArawak } from "@/lib/auth";
import {
  guardarMateriaPrimaDB,
  obtenerUltimaMateriaPrimaDB,
} from "@/lib/supabase-service";

export function MateriaPrima() {
  const [registro, setRegistro] = useState<RegistroMateriaPrima>(initialMateriaPrimaRegistro);
  const [historico, setHistorico] = useState<RegistroMateriaPrima[]>(historicoRecepcionesMock);
  const [vista, setVista] = useState<"formulario" | "normativa" | "historico">("formulario");
  const [usuarioActual, setUsuarioActual] = useState<UsuarioArawak>(getUsuarioActual());

  // Week navigation
  const [numSemana, setNumSemana] = useState(40);
  const [anioActual, setAnioActual] = useState(2026);

  // Sync user profile from auth
  useEffect(() => {
    setUsuarioActual(getUsuarioActual());
  }, []);

  // Load from LocalStorage & Supabase
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedReg = localStorage.getItem("arawak_materia_prima_registro_v1");
      const savedHist = localStorage.getItem("arawak_materia_prima_historico_v1");
      if (savedReg) {
        try { setRegistro(JSON.parse(savedReg)); } catch {}
      }
      if (savedHist) {
        try { setHistorico(JSON.parse(savedHist)); } catch {}
      }
    }

    (async () => {
      try {
        const cloud = await obtenerUltimaMateriaPrimaDB();
        if (cloud) {
          setRegistro((prev) => ({
            ...prev,
            fechaLlegada: cloud.fecha || prev.fechaLlegada,
            semanaRecepcion: cloud.semana_ano ? `Semana ${cloud.semana_ano}` : prev.semanaRecepcion,
            id: cloud.lote_materia_prima || prev.id,
            proveedor: cloud.proveedor || prev.proveedor,
            pesoCargaKg: cloud.kilos_recibidos || prev.pesoCargaKg,
            calibre: cloud.calibres_yuca?.calibre || prev.calibre,
            firmas: {
              ...prev.firmas,
              calidad: cloud.firma_calidad || prev.firmas.calidad,
            },
            observaciones: cloud.observaciones || prev.observaciones,
          }));
        }
      } catch (e) {
        console.warn("Supabase fetch fallback:", e);
      }
    })();
  }, []);

  // Auto-calculate Total Procesado & Rendimiento
  const statsCalculadas = useMemo(() => {
    const peso = Number(registro.pesoCargaKg) || 0;
    const reprocesado = Number(registro.reprocesadoKg) || 0;
    const bajoObs = Number(registro.bajoObservacionKg) || 0;
    const totalProc = Math.max(0, peso - reprocesado - bajoObs);
    const rendimiento = peso > 0 ? ((totalProc / peso) * 100).toFixed(1) : "0.0";

    return {
      totalProc,
      rendimiento,
    };
  }, [registro.pesoCargaKg, registro.reprocesadoKg, registro.bajoObservacionKg]);

  // Keep totalProcesadoKg synchronized
  useEffect(() => {
    setRegistro((prev) => ({
      ...prev,
      totalProcesadoKg: statsCalculadas.totalProc,
    }));
  }, [statsCalculadas.totalProc]);

  // Handle Input Changes
  const handleChange = (field: keyof RegistroMateriaPrima, value: any) => {
    setRegistro((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save to LocalStorage, History & Supabase
  const handleGuardar = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("arawak_materia_prima_registro_v1", JSON.stringify(registro));

      // Update or add in historic records
      setHistorico((prev) => {
        const index = prev.findIndex((item) => item.id === registro.id);
        let updated: RegistroMateriaPrima[];
        if (index >= 0) {
          updated = [...prev];
          updated[index] = registro;
        } else {
          updated = [registro, ...prev];
        }
        localStorage.setItem("arawak_materia_prima_historico_v1", JSON.stringify(updated));
        return updated;
      });
    }

    try {
      const numSemana = parseInt(registro.semanaRecepcion.replace(/\D/g, "")) || 40;
      const res = await guardarMateriaPrimaDB({
        fecha: registro.fechaLlegada,
        semana_ano: numSemana,
        lote_materia_prima: registro.id,
        proveedor: registro.proveedor,
        kilos_recibidos: Number(registro.pesoCargaKg) || 0,
        calibres_yuca: { calibre: registro.calibre },
        pasos_procesamiento: {
          diasProcesado: registro.diasProcesado,
          phMateriaPrima: registro.phMateriaPrima,
          brix: registro.brix,
          totalProcesadoKg: registro.totalProcesadoKg,
        },
        firma_calidad: registro.firmas.calidad,
        observaciones: registro.observaciones,
      });

      if (res.exito) {
        toast.success("Materia Prima sincronizada en Supabase con éxito", {
          description: `Lote ${registro.id} guardado en la base de datos de planta.`,
        });
      } else {
        toast.success("Registro de Materia Prima guardado exitosamente", {
          description: `Lote ${registro.id} para fecha ${registro.fechaLlegada}.`,
        });
      }
    } catch {
      toast.success("Registro de Materia Prima guardado exitosamente", {
        description: `Lote ${registro.id} para fecha ${registro.fechaLlegada}.`,
      });
    }
  };

  // Easy Quick Signature with Current Logged-in User
  const handleFirmarComoUsuario = (tipoFirma: "calidad" | "supervisor" | "gerentePlanta") => {
    const user = getUsuarioActual();
    const now = new Date();
    const fechaHora = `${now.toLocaleDateString("es-VE")} ${now.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}`;

    setRegistro((prev) => {
      const actual = prev.firmas[tipoFirma];
      const yaFirmado = actual.firmado;

      const updated = {
        ...prev,
        firmas: {
          ...prev.firmas,
          [tipoFirma]: {
            firmado: !yaFirmado,
            nombre: !yaFirmado ? user.nombre : "",
            cargo: !yaFirmado ? user.cargo : "",
            fecha: !yaFirmado ? fechaHora : "",
          },
        },
      };

      if (!yaFirmado) {
        toast.success(`Firma registrada por ${user.nombre}`, {
          description: `Cargo: ${user.cargo} (${fechaHora})`,
        });
      } else {
        toast.info("Firma removida para edición.");
      }

      return updated;
    });
  };

  // Week Navigator
  const handleSemanaAnterior = () => {
    const nuevaSem = numSemana > 1 ? numSemana - 1 : 52;
    setNumSemana(nuevaSem);
    setRegistro((prev) => ({
      ...prev,
      semanaRecepcion: `Semana ${nuevaSem} - ${anioActual}`,
    }));
  };

  const handleSemanaSiguiente = () => {
    const nuevaSem = numSemana < 52 ? numSemana + 1 : 1;
    setNumSemana(nuevaSem);
    setRegistro((prev) => ({
      ...prev,
      semanaRecepcion: `Semana ${nuevaSem} - ${anioActual}`,
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Semana",
      "Tipo MP",
      "Fecha Llegada",
      "Fecha Procesado",
      "Proveedor",
      "Cédula/RIF",
      "Placa",
      "Peso Carga (kg)",
      "Origen",
      "Calibre",
      "Edad/Cluster",
      "Visual",
      "pH",
      "Brix",
      "Deshidratación",
      "Total Procesado (kg)",
    ];

    const row = [
      registro.id,
      `"${registro.semanaRecepcion}"`,
      `"${registro.tipoMateriaPrima}"`,
      registro.fechaLlegada,
      registro.fechaProcesado,
      `"${registro.proveedor}"`,
      `"${registro.cedula}"`,
      `"${registro.placa}"`,
      registro.pesoCargaKg,
      `"${registro.origenCarga}"`,
      `"${registro.calibre}"`,
      `"${registro.dedosClusterOEdad}"`,
      `"${registro.evaluacionVisual}"`,
      registro.phMateriaPrima,
      registro.brix,
      `"${registro.tiempoDeshidratacion}"`,
      registro.totalProcesadoKg,
    ];

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), row.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Arawak_MateriaPrima_${registro.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exportado exitosamente");
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner & Identificación Documental */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#4b5e2a] text-white shadow-xs">
              <Wheat className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4b5e2a] dark:text-[#7ba045]">
                  Control de Calidad · Procesos y Recepción
                </span>
                <Badge variant="outline" className="border-[#4b5e2a]/40 bg-[#4b5e2a]/10 text-[#4b5e2a] dark:text-[#7ba045] font-semibold text-[11px]">
                  Código: ARAWAK-CC-MP-01
                </Badge>
                <Badge variant="secondary" className="text-[11px] font-medium">
                  Yuca & Cambur
                </Badge>
              </div>
              <h2 className="text-xl font-black text-foreground sm:text-2xl mt-0.5 tracking-tight">
                Control de Materia Prima: Recepción, Calibre y Proceso
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Registros diarios y semanales de parámetros físicos, calibres, densidad, pH, °Brix y deshidratación · Arawak
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVista(vista === "normativa" ? "formulario" : "normativa")}
              className="gap-1.5 border-border hover:bg-muted text-xs font-semibold"
            >
              <Info className="size-3.5 text-[#4b5e2a]" />
              {vista === "normativa" ? "Volver al Formulario" : "Ficha Técnica Calibres"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 border-border hover:bg-muted text-xs"
            >
              <Download className="size-3.5" />
              CSV
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
              Guardar Registro
            </Button>
          </div>
        </div>

        {/* Fechas Modificables y Navegación Semanal */}
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Semana con Flechas */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5">
            <button
              onClick={handleSemanaAnterior}
              className="size-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="text-center min-w-0">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Semana de Recepción
              </label>
              <span className="text-xs font-black text-foreground">
                Semana {numSemana} - {anioActual}
              </span>
            </div>
            <button
              onClick={handleSemanaSiguiente}
              className="size-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Semana siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Fecha de Llegada Modificable */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
            <Calendar className="size-4 shrink-0 text-[#4b5e2a]" />
            <div className="min-w-0 flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Fecha de Llegada (Modificable)
              </label>
              <input
                type="date"
                value={registro.fechaLlegada}
                onChange={(e) => handleChange("fechaLlegada", e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Fecha de Procesado Modificable */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
            <Clock className="size-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Fecha de Procesado (Modificable)
              </label>
              <input
                type="date"
                value={registro.fechaProcesado}
                onChange={(e) => handleChange("fechaProcesado", e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Días de Procesado */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
            <Layers className="size-4 shrink-0 text-indigo-600" />
            <div className="min-w-0 flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Días de Procesado
              </label>
              <input
                type="text"
                value={registro.diasProcesado}
                onChange={(e) => handleChange("diasProcesado", e.target.value)}
                placeholder="Ej. 3 días / Lunes a Miércoles"
                className="w-full bg-transparent text-xs font-bold text-foreground focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ficha Técnica Oficial de Calibres y Cortes de Yuca (Excel Panel J) */}
      <AnimatePresence>
        {vista === "normativa" && (
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
                      Parámetros Oficiales de Calidad y Calibre de Yuca (Arawak)
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="border-[#4b5e2a]/40 text-[#4b5e2a] font-bold text-[11px]">
                    Extracción Directa de Control de Calidad Excel
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {normasCalibreYuca.map((norma, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-lg border border-border bg-card p-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="size-2 rounded-full bg-[#4b5e2a]" />
                        <h4 className="text-xs font-black text-foreground">{norma.parametro}</h4>
                      </div>
                      <p className="text-xs font-extrabold text-[#4b5e2a] dark:text-[#7ba045] mt-0.5">
                        {norma.especificacion}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                        {norma.impactoCalidad}
                      </p>
                    </div>
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
            <Scale className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Peso de Carga</p>
            <p className="text-xl font-black text-foreground">{registro.pesoCargaKg.toLocaleString()} kg</p>
            <p className="text-[10px] text-muted-foreground">Materia prima bruta</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Total Procesado</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {statsCalculadas.totalProc.toLocaleString()} kg
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">{statsCalculadas.rendimiento}% rendimiento neto</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
            <Thermometer className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">pH & °Brix</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-foreground">
                pH {registro.phMateriaPrima}
              </span>
              <span className="text-[11px] font-bold text-muted-foreground">
                · {registro.brix}°Bx
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Acidez y sólidos solubles</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            registro.bajoObservacionKg > 0 ? "bg-rose-500/15 text-rose-600" : "bg-muted text-muted-foreground"
          )}>
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Bajo Observación</p>
            <p className={cn(
              "text-xl font-black",
              registro.bajoObservacionKg > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
            )}>
              {registro.bajoObservacionKg} kg
            </p>
            <p className="text-[10px] text-muted-foreground">Merma o cuarentena</p>
          </div>
        </div>
      </div>

      {/* 4. FORMULARIO PRINCIPAL: SECCIÓN 1 (RECEPCIÓN) & SECCIÓN 2 (PROCESO) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================================= */}
        {/* SECCIÓN 1: RECEPCIÓN DE MATERIA PRIMA                                      */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 border-b border-border bg-[#4b5e2a]/10 p-4">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#4b5e2a] text-white text-xs font-black">
              1
            </span>
            <div>
              <h3 className="text-base font-black text-foreground tracking-tight">
                Recepción e Inspección de Entrada
              </h3>
              <p className="text-xs text-muted-foreground">
                Datos de transporte, proveedor, calibre físico y evaluación visual de pulpa
              </p>
            </div>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {/* Tipo de Materia Prima */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                TIPO DE MP (Materia Prima)
              </label>
              <select
                value={registro.tipoMateriaPrima}
                onChange={(e) => handleChange("tipoMateriaPrima", e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="Yuca Dulce Grado Alimentario (Manihot esculenta)">
                  Yuca Dulce Grado Alimentario (Manihot esculenta)
                </option>
                <option value="Cambur Verde Prebiótico (Musa acuminata)">
                  Cambur Verde Prebiótico (Musa acuminata)
                </option>
                <option value="Cambur Maduro para Mezcla de Masa">
                  Cambur Maduro para Mezcla de Masa
                </option>
                <option value="Yuca Amarga / Almidón Industrial">
                  Yuca Amarga / Almidón Industrial
                </option>
              </select>
            </div>

            {/* Proveedor y Cédula/RIF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  PROVEEDOR:
                </label>
                <Input
                  type="text"
                  value={registro.proveedor}
                  onChange={(e) => handleChange("proveedor", e.target.value)}
                  placeholder="Nombre de la finca o proveedor"
                  className="h-8 text-xs font-semibold border-border bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  CÉDULA / RIF:
                </label>
                <Input
                  type="text"
                  value={registro.cedula}
                  onChange={(e) => handleChange("cedula", e.target.value)}
                  placeholder="V- / J-..."
                  className="h-8 text-xs font-semibold border-border bg-background font-mono"
                />
              </div>
            </div>

            {/* Placa y Origen de Carga */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  PLACA:
                </label>
                <Input
                  type="text"
                  value={registro.placa}
                  onChange={(e) => handleChange("placa", e.target.value)}
                  placeholder="Placa del vehículo"
                  className="h-8 text-xs font-bold border-border bg-background font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  ORIGEN DE CARGA:
                </label>
                <Input
                  type="text"
                  value={registro.origenCarga}
                  onChange={(e) => handleChange("origenCarga", e.target.value)}
                  placeholder="Municipio / Estado de procedencia"
                  className="h-8 text-xs font-semibold border-border bg-background"
                />
              </div>
            </div>

            {/* Peso de Carga y Calibre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  PESO DE CARGA (kg):
                </label>
                <Input
                  type="number"
                  value={registro.pesoCargaKg}
                  onChange={(e) => handleChange("pesoCargaKg", Number(e.target.value))}
                  className="h-8 text-xs font-black border-border bg-background text-[#4b5e2a]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  CALIBRE (Diámetro):
                </label>
                <select
                  value={registro.calibre}
                  onChange={(e) => handleChange("calibre", e.target.value as TipoCalibreYuca)}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer truncate"
                >
                  <option value="Calibre A (3,5 cm - 6,0 cm)">
                    Calibre A (3,5 cm - 6,0 cm) · Óptimo
                  </option>
                  <option value="Calibre B (6,1 cm - 8,0 cm)">
                    Calibre B (6,1 cm - 8,0 cm) · Aceptable
                  </option>
                  <option value="Calibre C (> 8,0 cm)">
                    Calibre C (&gt; 8,0 cm) · Requiere troceado
                  </option>
                </select>
              </div>
            </div>

            {/* Dedos del Cluster / Edad y Densidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  DEDOS DEL CLUSTER / EDAD (YUCA):
                </label>
                <Input
                  type="text"
                  value={registro.dedosClusterOEdad}
                  onChange={(e) => handleChange("dedosClusterOEdad", e.target.value)}
                  placeholder="Ej. 11 meses de cosecha"
                  className="h-8 text-xs font-semibold border-border bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  DENSIDAD:
                </label>
                <Input
                  type="text"
                  value={registro.densidad}
                  onChange={(e) => handleChange("densidad", e.target.value)}
                  placeholder="Ej. 1.14 g/cm³"
                  className="h-8 text-xs font-semibold border-border bg-background font-mono"
                />
              </div>
            </div>

            {/* Control Visual (Corte Transversal y Distal) */}
            <div className="space-y-1 pt-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>EVALUACIÓN VISUAL (Corte transversal blanco y corte distal):</span>
                <span className="text-[10px] text-[#4b5e2a] font-normal">Norma Arawak</span>
              </label>
              <select
                value={registro.evaluacionVisual}
                onChange={(e) => handleChange("evaluacionVisual", e.target.value as any)}
                className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="Conforme (Pulpa totalmente blanca)">
                  ✓ Conforme (Pulpa totalmente blanca sin manchas ni estrías)
                </option>
                <option value="Condicionado (Selección manual)">
                  ⚠ Condicionado (Requiere descarte de extremos o selección)
                </option>
                <option value="No Conforme (Líneas negras/grises)">
                  ✕ No Conforme (Manchas oscuras / fermentación / Rechazo)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 2: PROCESO (VARIABLES CRÍTICAS Y DESHIDRATACIÓN)                  */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 border-b border-border bg-amber-500/10 p-4">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-600 text-white text-xs font-black">
              2
            </span>
            <div>
              <h3 className="text-base font-black text-foreground tracking-tight">
                Variables de Proceso y Deshidratación
              </h3>
              <p className="text-xs text-muted-foreground">
                Mediciones fisicoquímicas, baño antioxidante, grados Brix y tiempos de secado
              </p>
            </div>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {/* pH y Grados Brix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  pH DE MATERIA PRIMA (Óptimo 6.0 - 6.8):
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={registro.phMateriaPrima}
                  onChange={(e) => handleChange("phMateriaPrima", Number(e.target.value))}
                  className={cn(
                    "h-8 text-xs font-black border-border bg-background font-mono",
                    registro.phMateriaPrima < 5.8 || registro.phMateriaPrima > 7.0
                      ? "border-amber-500 text-amber-600"
                      : "text-foreground"
                  )}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  °BRIX (Azúcares Solubles):
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={registro.brix}
                  onChange={(e) => handleChange("brix", Number(e.target.value))}
                  className="h-8 text-xs font-black border-border bg-background font-mono"
                />
              </div>
            </div>

            {/* Ácido Cítrico / Ácido Ascórbico */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                ÁCIDO CÍTRICO / ÁCIDO ASCÓRBICO (Baño Antioxidante):
              </label>
              <Input
                type="text"
                value={registro.acidoCitricoAscorbico}
                onChange={(e) => handleChange("acidoCitricoAscorbico", e.target.value)}
                placeholder="Ej. Inmersión al 1.5% durante 2 minutos"
                className="h-8 text-xs font-semibold border-border bg-background"
              />
            </div>

            {/* Pulpa y Tiempo de Deshidratación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  PULPA (Rendimiento y Aspecto):
                </label>
                <Input
                  type="text"
                  value={registro.pulpa}
                  onChange={(e) => handleChange("pulpa", e.target.value)}
                  placeholder="Ej. Firme, rendimiento 71%"
                  className="h-8 text-xs font-semibold border-border bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  TIEMPO DE DESHIDRATACIÓN:
                </label>
                <Input
                  type="text"
                  value={registro.tiempoDeshidratacion}
                  onChange={(e) => handleChange("tiempoDeshidratacion", e.target.value)}
                  placeholder="Ej. 7.5 horas @ 62°C"
                  className="h-8 text-xs font-semibold border-border bg-background"
                />
              </div>
            </div>

            {/* Olor y Sabor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  OLOR:
                </label>
                <select
                  value={registro.olor}
                  onChange={(e) => handleChange("olor", e.target.value as any)}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs font-bold text-foreground focus:outline-none cursor-pointer truncate"
                >
                  <option value="Característico fresco">Característico fresco</option>
                  <option value="Ligeramente ácido">Ligeramente ácido</option>
                  <option value="Fermentado / Anormal">Fermentado / Anormal</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  SABOR:
                </label>
                <select
                  value={registro.sabor}
                  onChange={(e) => handleChange("sabor", e.target.value as any)}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs font-bold text-foreground focus:outline-none cursor-pointer truncate"
                >
                  <option value="Característico dulce/neutro">Característico dulce/neutro</option>
                  <option value="Ácido">Ácido</option>
                  <option value="Amargo / Desviación">Amargo / Desviación</option>
                </select>
              </div>
            </div>

            {/* Reprocesado, Bajo Observación y Total Procesado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  REPROCESADO (kg):
                </label>
                <Input
                  type="number"
                  value={registro.reprocesadoKg}
                  onChange={(e) => handleChange("reprocesadoKg", Number(e.target.value))}
                  className="h-8 text-xs font-semibold border-border bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  BAJO OBSERVACIÓN:
                </label>
                <Input
                  type="number"
                  value={registro.bajoObservacionKg}
                  onChange={(e) => handleChange("bajoObservacionKg", Number(e.target.value))}
                  className="h-8 text-xs font-semibold border-border bg-background text-rose-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  TOTAL PROCESADO:
                </label>
                <Input
                  type="number"
                  readOnly
                  value={statsCalculadas.totalProc}
                  className="h-8 text-xs font-black border-border bg-muted text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. OBSERVACIONES GENERALES */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
        <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block mb-1.5">
          OBSERVACIONES DEL LOTE DE MATERIA PRIMA:
        </label>
        <textarea
          rows={2}
          value={registro.observaciones}
          onChange={(e) => handleChange("observaciones", e.target.value)}
          placeholder="Especifique notas sobre el cargamento, condiciones climáticas durante el flete, humedad visual o rendimiento de deshidratación..."
          className="w-full text-xs rounded-lg border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-[#4b5e2a]"
        />
      </div>

      {/* 6. FIRMA DE APROBACIÓN TÉCNICA: Única Firma Control de Calidad */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-2xs flex flex-col items-center justify-center">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-3 text-center">
          Aprobación Técnica de Materia Prima · Control de Calidad
        </p>
        <div
          onClick={() => handleFirmarComoUsuario("calidad")}
          className="flex flex-col items-center text-center cursor-pointer p-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border max-w-md w-full"
          title="Haga clic aquí para firmar automáticamente con su usuario o anular"
        >
          <div className="w-full max-w-xs border-b-2 border-foreground/40 pb-2 min-h-[56px] flex flex-col justify-end">
            {registro.firmas.calidad.firmado ? (
              <div className="text-xs font-mono text-[#4b5e2a] dark:text-[#7ba045] font-bold">
                <p className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="size-3.5" /> FIRMA DIGITALIZADA
                </p>
                <p className="text-foreground font-sans font-extrabold text-sm mt-0.5">
                  {registro.firmas.calidad.nombre}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{registro.firmas.calidad.cargo} · {registro.firmas.calidad.fecha}</p>
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
            {registro.firmas.calidad.firmado ? "(Clic para anular)" : "(Clic para firmar automáticamente)"}
          </span>
        </div>
      </div>

      {/* 7. Footer Note */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
        <p className="text-xs font-semibold text-foreground">
          ARAWAK · Control de Calidad e Inocuidad de Materias Primas Sin Gluten
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Este módulo asegura la trazabilidad desde el pesaje y calibre en báscula hasta el secado final en hornos deshidratadores para garantizar harinas y masas de óptimo rendimiento culinario.
        </p>
      </div>
    </div>
  );
}

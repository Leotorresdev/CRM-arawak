"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FlaskConical,
  Scale,
  Calendar,
  Clock,
  Printer,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  Info,
  Check,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Edit2,
  PenTool,
} from "lucide-react";
import {
  exportarAnalisisProcesoExcel,
  importarAnalisisProcesoExcel,
} from "@/lib/excel-service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  RegistroAnalisisProceso,
  ParametroAnalisis,
  productosArawakProceso,
  crearRegistroInicialAnalisis,
} from "@/lib/analisis-proceso-data";
import { getUsuarioActual, getStorageKeyParaUsuario, UsuarioArawak } from "@/lib/auth";
import {
  guardarAnalisisProcesoDB,
  obtenerUltimoAnalisisProcesoDB,
} from "@/lib/supabase-service";

export function AnalisisProceso() {
  const [usuario, setUsuario] = useState<UsuarioArawak>(getUsuarioActual());
  const [registro, setRegistro] = useState<RegistroAnalisisProceso>(() =>
    crearRegistroInicialAnalisis(getUsuarioActual().id, getUsuarioActual().nombre)
  );

  // Modal / Form state for adding custom parameter field
  const [mostrarModalNuevoCampo, setMostrarModalNuevoCampo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaUnidad, setNuevaUnidad] = useState("%");
  const [nuevaEspecificacion, setNuevaEspecificacion] = useState("");
  const [nuevoValorInicial, setNuevoValorInicial] = useState("");

  // Load user profile and user-isolated data (localStorage & Supabase)
  useEffect(() => {
    const user = getUsuarioActual();
    setUsuario(user);

    if (typeof window !== "undefined") {
      const storageKey = getStorageKeyParaUsuario("analisis_proceso", user.id);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setRegistro(parsed);
        } catch {}
      } else {
        // Initialize fresh isolated record for this user
        setRegistro(crearRegistroInicialAnalisis(user.id, user.nombre));
      }
    }

    (async () => {
      try {
        const cloud = await obtenerUltimoAnalisisProcesoDB();
        if (cloud) {
          setRegistro((prev) => ({
            ...prev,
            fecha: cloud.fecha || prev.fecha,
            lote: cloud.lote || prev.lote,
            producto: cloud.producto || prev.producto,
            cantidadBachs: cloud.cantidad_bachs || prev.cantidadBachs,
            totalProducidoKg: cloud.total_producido_kg || prev.totalProducidoKg,
            dictamen: cloud.dictamen || prev.dictamen,
            parametros: cloud.parametros || prev.parametros,
            firmas: {
              ...prev.firmas,
              inspector: cloud.firma_calidad || prev.firmas.inspector,
            },
            observaciones: cloud.observaciones || prev.observaciones,
          }));
        }
      } catch (e) {
        console.warn("Supabase fetch fallback:", e);
      }
    })();
  }, []);

  // Recalculate Total Producido from Bachs or from Aceptado + Rechazado
  const totalBachsCalculado = useMemo(() => {
    return registro.pesosBachs.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  }, [registro.pesosBachs]);

  // Keep totalProducidoKg updated
  useEffect(() => {
    if (totalBachsCalculado > 0) {
      setRegistro((prev) => ({
        ...prev,
        totalProducidoKg: totalBachsCalculado,
      }));
    }
  }, [totalBachsCalculado]);

  // Save current record isolated for the logged in user & Supabase
  const handleGuardar = async () => {
    if (typeof window !== "undefined") {
      const storageKey = getStorageKeyParaUsuario("analisis_proceso", usuario.id);
      localStorage.setItem(storageKey, JSON.stringify(registro));

      // Also register into API
      fetch("/api/analisis-proceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registro),
      }).catch(() => {});
    }

    try {
      const res = await guardarAnalisisProcesoDB({
        fecha: registro.fecha,
        lote: registro.lote,
        producto: registro.producto,
        cantidad_bachs: registro.cantidadBachs,
        total_producido_kg: registro.totalProducidoKg,
        dictamen: registro.dictamen,
        parametros: registro.parametros,
        firma_calidad: registro.firmas.inspector,
        observaciones: registro.observaciones,
      });

      if (res.exito) {
        toast.success("Análisis de Proceso guardado en Supabase con éxito", {
          description: `Lote ${registro.lote} sincronizado en la base de datos de planta.`,
        });
      } else {
        toast.success("Análisis de Proceso guardado exitosamente", {
          description: `Guardado en el espacio de ${usuario.nombre} para el lote ${registro.lote}.`,
        });
      }
    } catch {
      toast.success("Análisis de Proceso guardado exitosamente", {
        description: `Guardado en el espacio de ${usuario.nombre} para el lote ${registro.lote}.`,
      });
    }
  };

  // Change Bach Weight
  const handleCambiarPesoBach = (index: number, peso: number) => {
    setRegistro((prev) => {
      const nuevosPesos = [...prev.pesosBachs];
      nuevosPesos[index] = peso;
      return {
        ...prev,
        pesosBachs: nuevosPesos,
      };
    });
  };

  // Add a Bach row
  const handleAgregarBach = () => {
    setRegistro((prev) => ({
      ...prev,
      cantidadBachs: prev.cantidadBachs + 1,
      pesosBachs: [...prev.pesosBachs, 400],
    }));
    toast.info(`Bach #${registro.pesosBachs.length + 1} agregado al análisis`);
  };

  // Remove last Bach row
  const handleRemoverBach = (index: number) => {
    if (registro.pesosBachs.length <= 1) {
      toast.warning("Debe existir al menos 1 Bach en la orden de producción");
      return;
    }
    setRegistro((prev) => ({
      ...prev,
      cantidadBachs: prev.cantidadBachs - 1,
      pesosBachs: prev.pesosBachs.filter((_, i) => i !== index),
    }));
  };

  // Update dynamic parameter value or state
  const handleActualizarParametro = (
    id: string,
    field: keyof ParametroAnalisis,
    value: any
  ) => {
    setRegistro((prev) => ({
      ...prev,
      parametros: prev.parametros.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    }));
  };

  // Delete a parameter field
  const handleEliminarParametro = (id: string, nombreParam: string) => {
    if (confirm(`¿Estás seguro de eliminar el campo de análisis "${nombreParam}"?`)) {
      setRegistro((prev) => ({
        ...prev,
        parametros: prev.parametros.filter((p) => p.id !== id),
      }));
      toast.success(`Campo "${nombreParam}" eliminado del formulario`);
    }
  };

  // Add new custom parameter field
  const handleCrearNuevoCampo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) {
      toast.error("Indica el nombre del nuevo análisis o parámetro");
      return;
    }

    const nuevoParametro: ParametroAnalisis = {
      id: `param_custom_${Date.now()}`,
      nombre: nuevoNombre.trim().toUpperCase(),
      unidad: nuevaUnidad.trim() || "%",
      especificacion: nuevaEspecificacion.trim() || "Parámetro personalizado",
      valor: nuevoValorInicial.trim() || "0",
      estado: "conforme",
    };

    setRegistro((prev) => ({
      ...prev,
      parametros: [...prev.parametros, nuevoParametro],
    }));

    setNuevoNombre("");
    setNuevaEspecificacion("");
    setNuevoValorInicial("");
    setMostrarModalNuevoCampo(false);
    toast.success(`Campo "${nuevoParametro.nombre}" agregado exitosamente`);
  };

  // Única firma: Ingeniero de Guardia en Control de Calidad
  const handleFirmarCalidad = () => {
    const now = new Date();
    const fechaHora = `${now.toLocaleDateString("es-VE")} ${now.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}`;

    setRegistro((prev) => {
      const actual = prev.firmas.inspector;
      const yaFirmado = actual.firmado;

      if (!yaFirmado) {
        toast.success(`Firma de Control de Calidad registrada: ${usuario.nombre}`);
      } else {
        toast.info("Firma de Control de Calidad removida.");
      }

      return {
        ...prev,
        firmas: {
          ...prev.firmas,
          inspector: {
            firmado: !yaFirmado,
            nombre: !yaFirmado ? usuario.nombre : "",
            cargo: !yaFirmado ? usuario.cargo : "",
            fecha: !yaFirmado ? fechaHora : "",
          },
        },
      };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportExcel = () => {
    exportarAnalisisProcesoExcel(registro);
    toast.success("Análisis de Proceso exportado a Excel con éxito (.xlsx)");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importarAnalisisProcesoExcel(file);
      setRegistro((prev) => {
        let nuevosParams = [...prev.parametros];
        if (res.parametros && res.parametros.length > 0) {
          res.parametros.forEach((imp) => {
            const idx = nuevosParams.findIndex((p) => p.nombre.toLowerCase() === imp.nombre.toLowerCase());
            if (idx >= 0) {
              nuevosParams[idx] = {
                ...nuevosParams[idx],
                valor: imp.valor,
                estado: imp.estado || nuevosParams[idx].estado,
              };
            }
          });
        }
        return {
          ...prev,
          lote: res.lote || prev.lote,
          cantidadBachs: res.cantidadBachs !== undefined ? res.cantidadBachs : prev.cantidadBachs,
          parametros: nuevosParams,
        };
      });
      toast.success("Análisis de Proceso importado desde Excel", {
        description: `Datos actualizados desde ${file.name}.`,
      });
    } catch (err: any) {
      toast.error("Error al importar Excel", { description: err?.message });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner & Identificación Documental */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-700 text-white shadow-xs">
              <FlaskConical className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                  Control de Procesos · Ensayos Fisicoquímicos & Liberación
                </span>
                <Badge variant="outline" className="border-indigo-600/40 bg-indigo-600/10 text-indigo-700 dark:text-indigo-400 font-semibold text-[11px] whitespace-nowrap">
                  Código: ARAWAK-CC-AP-01
                </Badge>
                <Badge className="bg-[#4b5e2a] text-white text-[10px] font-bold whitespace-nowrap">
                  Usuario: {usuario.nombre}
                </Badge>
              </div>
              <h2 className="text-xl font-black text-foreground sm:text-2xl mt-0.5 tracking-tight">
                Análisis de Proceso y Liberación de Bachs
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ensayos en línea: humedades, densidades, pH, porción cruda/cocida y hermeticidad de empaque · Arawak
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-border/50 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarModalNuevoCampo(true)}
              className="gap-1.5 border-[#4b5e2a]/50 text-[#4b5e2a] hover:bg-[#4b5e2a]/10 text-xs font-bold"
            >
              <Plus className="size-3.5" />
              Crear Nuevo Campo / Análisis
            </Button>

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
                title="Importar ensayos físico-químicos desde archivo Excel"
              >
                <Upload className="size-3.5 text-[#4b5e2a]" />
                Importar Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="gap-1.5 border-border hover:bg-muted text-xs cursor-pointer font-semibold"
                title="Descargar análisis y liberación de bachs en archivo Excel (.xlsx)"
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
                Imprimir
              </Button>
              <Button
                size="sm"
                onClick={handleGuardar}
                className="gap-1.5 bg-[#4b5e2a] hover:bg-[#3d4d22] text-white shadow-xs text-xs font-bold"
              >
                <Save className="size-3.5" />
                Guardar en Supabase / Local
              </Button>
            </div>
          </div>
        </div>

        {/* User Isolation Info Note */}
        <div className="mt-4 rounded-lg bg-muted/40 border border-border/80 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className="size-4 text-[#4b5e2a] shrink-0" />
            <span>
              <strong>Espacio de Trabajo Aislado:</strong> Sesión activa de <strong>{usuario.nombre}</strong> ({usuario.cargo}). Los registros guardados aquí son independientes y no interfieren con otros operadores.
            </span>
          </div>
          <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
            ID: {usuario.id}
          </Badge>
        </div>

        {/* Metadatos de la Orden y Bachs (Filas 5 a 11 del Excel) */}
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* Fecha */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
              FECHA:
            </label>
            <Input
              type="date"
              value={registro.fecha}
              onChange={(e) => setRegistro((prev) => ({ ...prev, fecha: e.target.value }))}
              className="h-8 text-xs font-bold border-border bg-background"
            />
          </div>

          {/* Producto */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
              PRODUCTO:
            </label>
            <select
              value={registro.producto}
              onChange={(e) => setRegistro((prev) => ({ ...prev, producto: e.target.value }))}
              className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs font-black text-foreground focus:outline-none cursor-pointer"
            >
              {productosArawakProceso.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Lote */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
              LOTE:
            </label>
            <Input
              type="text"
              value={registro.lote}
              onChange={(e) => setRegistro((prev) => ({ ...prev, lote: e.target.value }))}
              className="h-8 text-xs font-mono font-bold border-border bg-background"
            />
          </div>

          {/* Fabricación */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
              FABRICACIÓN:
            </label>
            <Input
              type="date"
              value={registro.fechaFabricacion}
              onChange={(e) => setRegistro((prev) => ({ ...prev, fechaFabricacion: e.target.value }))}
              className="h-8 text-xs font-bold border-border bg-background"
            />
          </div>

          {/* Vencimiento */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
              VENCIMIENTO:
            </label>
            <Input
              type="date"
              value={registro.fechaVencimiento}
              onChange={(e) => setRegistro((prev) => ({ ...prev, fechaVencimiento: e.target.value }))}
              className="h-8 text-xs font-bold border-border bg-background"
            />
          </div>

          {/* Cantidad de Bachs */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
              CANTIDAD DE BACHS:
            </label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                readOnly
                value={registro.pesosBachs.length}
                className="h-8 text-xs font-black border-border bg-muted w-16 text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAgregarBach}
                className="h-8 px-2 text-xs font-bold border-[#4b5e2a]/40 text-[#4b5e2a]"
                title="Añadir otro bach a la orden"
              >
                + Bach
              </Button>
            </div>
          </div>
        </div>

        {/* Sección de Pesos de Cada Bach (Filas 6 a 11 del Excel) */}
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
            <span>PESO INDIVIDUAL DE CADA BACH (kg):</span>
            <span className="text-xs font-bold text-foreground">
              Total Acumulado: <strong className="text-[#4b5e2a] dark:text-[#7ba045] font-black">{totalBachsCalculado.toLocaleString()} kg</strong>
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {registro.pesosBachs.map((peso, idx) => (
              <div key={idx} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-1.5">
                <span className="text-[10px] font-bold text-muted-foreground">B#{idx + 1}:</span>
                <Input
                  type="number"
                  value={peso}
                  onChange={(e) => handleCambiarPesoBach(idx, Number(e.target.value))}
                  className="h-7 w-20 text-xs font-black border-border bg-background text-center"
                />
                <span className="text-[10px] text-muted-foreground font-semibold">kg</span>
                {registro.pesosBachs.length > 1 && (
                  <button
                    onClick={() => handleRemoverBach(idx)}
                    className="size-5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center cursor-pointer"
                    title="Eliminar este bach"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Modal / Card para Crear Nuevo Campo Dinámico */}
      <AnimatePresence>
        {mostrarModalNuevoCampo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <Card className="border-[#4b5e2a] bg-[#4b5e2a]/5 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-[#4b5e2a]" />
                    <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                      Crear Nuevo Campo de Análisis / Ensayo de Proceso
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMostrarModalNuevoCampo(false)}
                    className="h-6 w-6 p-0 text-muted-foreground"
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCrearNuevoCampo} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-extrabold uppercase text-muted-foreground block">
                      Nombre del Análisis / Ensayo
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej. VISCOSIDAD APARENTE, COLOR L*, ETC."
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      required
                      className="h-8 text-xs font-bold border-border bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-muted-foreground block">
                      Unidad de Medida
                    </label>
                    <Input
                      type="text"
                      placeholder="%, g, cP, escala, etc."
                      value={nuevaUnidad}
                      onChange={(e) => setNuevaUnidad(e.target.value)}
                      className="h-8 text-xs font-semibold border-border bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-muted-foreground block">
                      Especificación / Límite
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej. < 10.0%, 6.5 - 7.5"
                      value={nuevaEspecificacion}
                      onChange={(e) => setNuevaEspecificacion(e.target.value)}
                      className="h-8 text-xs font-semibold border-border bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-muted-foreground block">
                      Valor Inicial
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej. 7.5"
                      value={nuevoValorInicial}
                      onChange={(e) => setNuevoValorInicial(e.target.value)}
                      className="h-8 text-xs font-semibold border-border bg-background"
                    />
                  </div>

                  <div className="flex items-center gap-2 sm:col-span-3">
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 bg-[#4b5e2a] hover:bg-[#3d4d22] text-white text-xs font-bold gap-1.5"
                    >
                      <Plus className="size-3.5" />
                      Guardar y Añadir a la Tabla
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrarModalNuevoCampo(false)}
                      className="h-8 text-xs"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. TABLA PRINCIPAL DE ANÁLISIS DE PROCESO (Filas 12-28 del Excel) */}
      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-muted/40 p-4">
          <div>
            <h3 className="text-base font-black text-foreground tracking-tight">
              Matriz de Análisis Fisicoquímico y de Inocuidad
            </h3>
            <p className="text-xs text-muted-foreground">
              Campos dinámicos modificables y eliminables. (Campo <em>% Ruptura / Rechazado</em> descartado según norma).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border text-xs font-bold">
              {registro.parametros.length} parámetros configurados
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/70 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-3 w-12 text-center border-r border-border/60">#</th>
                <th className="py-3 px-4 min-w-[260px] border-r border-border/60">
                  Parámetro / Ensayo Analítico
                </th>
                <th className="py-3 px-2 w-24 text-center border-r border-border/60">Unidad</th>
                <th className="py-3 px-3 min-w-[180px] border-r border-border/60">
                  Especificación de Calidad
                </th>
                <th className="py-3 px-3 w-40 text-center border-r border-border/60">
                  Valor Medido
                </th>
                <th className="py-3 px-2 w-32 text-center border-r border-border/60">
                  Dictamen
                </th>
                <th className="py-3 px-2 w-16 text-center print:hidden">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-sans">
              {registro.parametros.map((param, index) => (
                <tr
                  key={param.id}
                  className={cn(
                    "transition-colors hover:bg-muted/40",
                    param.estado === "critico"
                      ? "bg-rose-500/[0.04]"
                      : param.estado === "desviacion"
                      ? "bg-amber-500/[0.04]"
                      : "bg-card"
                  )}
                >
                  {/* Index */}
                  <td className="py-2.5 px-2 text-center border-r border-border/60 font-mono text-[10px] text-muted-foreground">
                    {index + 1}
                  </td>

                  {/* Nombre del Parámetro (Editable) */}
                  <td className="py-2.5 px-4 border-r border-border/60">
                    <input
                      type="text"
                      value={param.nombre}
                      onChange={(e) => handleActualizarParametro(param.id, "nombre", e.target.value)}
                      className="w-full bg-transparent font-bold text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
                    />
                  </td>

                  {/* Unidad */}
                  <td className="py-2.5 px-2 text-center border-r border-border/60">
                    <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0.5">
                      {param.unidad}
                    </Badge>
                  </td>

                  {/* Especificación */}
                  <td className="py-2.5 px-3 border-r border-border/60">
                    <input
                      type="text"
                      value={param.especificacion || ""}
                      onChange={(e) => handleActualizarParametro(param.id, "especificacion", e.target.value)}
                      placeholder="Sin especificación"
                      className="w-full bg-transparent text-[11px] text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
                    />
                  </td>

                  {/* Valor Medido */}
                  <td className="py-2 px-3 text-center border-r border-border/60">
                    <Input
                      type="text"
                      value={param.valor}
                      onChange={(e) => handleActualizarParametro(param.id, "valor", e.target.value)}
                      className="h-7 text-xs font-black text-center border-border bg-background"
                    />
                  </td>

                  {/* Estado / Dictamen */}
                  <td className="py-2 px-2 text-center border-r border-border/60">
                    <select
                      value={param.estado}
                      onChange={(e) => handleActualizarParametro(param.id, "estado", e.target.value)}
                      className={cn(
                        "w-full h-7 rounded text-[10px] font-black uppercase text-center focus:outline-none cursor-pointer border",
                        param.estado === "conforme"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                          : param.estado === "desviacion"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                      )}
                    >
                      <option value="conforme">✓ Conforme</option>
                      <option value="desviacion">⚠ Desviación</option>
                      <option value="critico">✕ Crítico</option>
                    </select>
                  </td>

                  {/* Botón Eliminar Campo */}
                  <td className="py-2 px-2 text-center print:hidden">
                    <button
                      onClick={() => handleEliminarParametro(param.id, param.nombre)}
                      className="size-7 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors cursor-pointer mx-auto"
                      title="Eliminar este campo del formulario"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. TOTALES DE PRODUCCIÓN, TEMPERATURA Y DICTAMEN (Filas 29 a 36 del Excel) */}
        <div className="border-t border-border p-4 bg-muted/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Producto Aceptado */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                PRODUCTO ACEPTADO (kg):
              </label>
              <Input
                type="number"
                value={registro.productoAceptadoKg}
                onChange={(e) => setRegistro((prev) => ({ ...prev, productoAceptadoKg: Number(e.target.value) }))}
                className="h-8 text-xs font-black border-border bg-background text-emerald-600 dark:text-emerald-400"
              />
            </div>

            {/* Producto Rechazado */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                PRODUCTO RECHAZADO (kg):
              </label>
              <Input
                type="number"
                value={registro.productoRechazadoKg}
                onChange={(e) => setRegistro((prev) => ({ ...prev, productoRechazadoKg: Number(e.target.value) }))}
                className="h-8 text-xs font-black border-border bg-background text-rose-600 dark:text-rose-400"
              />
            </div>

            {/* Total Producido */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                TOTAL PRODUCIDO (kg):
              </label>
              <Input
                type="number"
                readOnly
                value={registro.totalProducidoKg}
                className="h-8 text-xs font-black border-border bg-muted text-foreground"
              />
            </div>

            {/* Temperatura Ambiente */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                TEMPERATURA AMBIENTE (°C):
              </label>
              <Input
                type="number"
                step="0.1"
                value={registro.temperaturaAmbienteC}
                onChange={(e) => setRegistro((prev) => ({ ...prev, temperaturaAmbienteC: Number(e.target.value) }))}
                className="h-8 text-xs font-black border-border bg-background font-mono"
              />
            </div>
          </div>

          {/* Observaciones y Dictamen Oficial */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2 space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                OBSERVACIONES DEL ANÁLISIS DE PROCESO:
              </label>
              <textarea
                rows={2}
                value={registro.observaciones}
                onChange={(e) => setRegistro((prev) => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Indique desviaciones de humedad, ajustes en temperatura de túnel o lote de mezcla..."
                className="w-full text-xs rounded-lg border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Dictamen (Aceptado / Rechazado de Filas 34-36) */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                DICTAMEN TÉCNICO FINAL:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegistro((prev) => ({ ...prev, dictamen: "aceptado" }))}
                  className={cn(
                    "h-10 rounded-lg border font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    registro.dictamen === "aceptado"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-card border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Check className="size-4 stroke-[3]" />
                  ACEPTADO
                </button>

                <button
                  type="button"
                  onClick={() => setRegistro((prev) => ({ ...prev, dictamen: "rechazado" }))}
                  className={cn(
                    "h-10 rounded-lg border font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    registro.dictamen === "rechazado"
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-card border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <XCircle className="size-4" />
                  RECHAZADO
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. FIRMA DE RESPONSABILIDAD: Única Firma Control de Calidad */}
        <div className="border-t border-border p-6 bg-card flex flex-col items-center justify-center">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-3 text-center">
            Validación de Auditoría Técnica · Control de Calidad
          </p>
          <div
            onClick={handleFirmarCalidad}
            className="flex flex-col items-center text-center cursor-pointer p-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border max-w-md w-full"
            title="Haga clic aquí para firmar automáticamente con su usuario o anular"
          >
            <div className="w-full max-w-xs border-b-2 border-foreground/40 pb-2 min-h-[56px] flex flex-col justify-end">
              {registro.firmas.inspector.firmado ? (
                <div className="text-xs font-mono text-[#4b5e2a] dark:text-[#7ba045] font-bold">
                  <p className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="size-3.5" /> FIRMA DIGITALIZADA
                  </p>
                  <p className="text-foreground font-sans font-extrabold text-sm mt-0.5">
                    {registro.firmas.inspector.nombre}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{registro.firmas.inspector.cargo} · {registro.firmas.inspector.fecha}</p>
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
              {registro.firmas.inspector.firmado ? "(Clic para anular)" : "(Clic para firmar automáticamente)"}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Footer Note */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
        <p className="text-xs font-semibold text-foreground">
          ARAWAK · Departamento de Control de Calidad y Análisis Fisicoquímico
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Este registro valida que los productos sin gluten (galletas, tortillas, nachos y harinas) cumplan estrictamente los estándares de humedad, acidez y sellado antes de su distribución comercial.
        </p>
      </div>
    </div>
  );
}

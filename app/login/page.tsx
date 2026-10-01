"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Lock,
  User,
  Briefcase,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  autenticarUsuario,
  registrarNuevoUsuario,
  getUsuariosRegistrados,
  isAutenticado,
  UsuarioArawak,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "registro">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<(UsuarioArawak & { password?: string })[]>([]);

  // Form states - Login
  const [usuario, setUsuario] = useState("Roberto");
  const [password, setPassword] = useState("arawak2026");

  // Form states - Registro
  const [regNombre, setRegNombre] = useState("");
  const [regCargo, setRegCargo] = useState("Inspector de Control de Calidad");
  const [regRol, setRegRol] = useState<"calidad" | "produccion" | "gerencia">("calidad");
  const [regPassword, setRegPassword] = useState("arawak2026");

  useEffect(() => {
    setUsuariosDisponibles(getUsuariosRegistrados());
    if (typeof window !== "undefined" && isAutenticado()) {
      router.replace("/");
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const usuarioLogueado = autenticarUsuario(usuario, password);

      if (usuarioLogueado) {
        toast.success(`¡Bienvenido(a), ${usuarioLogueado.nombre}!`, {
          description: `Sesión iniciada con éxito (${usuarioLogueado.cargo}). Ingresando al CRM...`,
        });
        window.location.href = "/";
      } else {
        toast.error("Credenciales incorrectas", {
          description: "Verifica tu usuario y contraseña, o selecciona un perfil rápido.",
        });
      }
    }, 350);
  };

  const handleRegistro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNombre.trim()) {
      toast.error("Por favor completa tu nombre completo.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const nuevo = registrarNuevoUsuario({
        nombre: regNombre.trim(),
        cargo: regCargo.trim() || "Inspector de Control de Calidad",
        rol: regRol,
        password: regPassword || "arawak2026",
      });

      toast.success("¡Registro completado con éxito!", {
        description: `Bienvenido(a), ${nuevo.nombre}. Ingresando al CRM...`,
      });
      window.location.href = "/";
    }, 450);
  };

  const handleSeleccionarCuentaRapida = (u: UsuarioArawak & { password?: string }) => {
    setUsuario(u.nombre);
    setPassword(u.password || "arawak2026");
    toast.info(`Usuario cargado: ${u.nombre}`, {
      description: `${u.cargo}`,
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Columna Izquierda: Identidad y Nombre de la Empresa */}
      <div className="hidden lg:flex flex-col justify-between bg-sidebar border-r border-sidebar-border p-12 relative overflow-hidden">
        {/* Glow ambient de fondo */}
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-[#4b5e2a]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Brand Header: Solo Nombre de la Empresa */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#4b5e2a] text-xl font-black text-white shadow-lg shadow-[#4b5e2a]/25">
            AW
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-sidebar-foreground">Arawak</span>
          </div>
        </div>

        {/* Central Proposition: Simple, Atractivo y Directo al propósito del CRM */}
        <div className="relative z-10 max-w-lg my-auto py-8">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-[1.15] mb-4">
            Control de Calidad y Procesos
          </h1>

          <p className="text-muted-foreground text-base leading-relaxed">
            Plataforma digital para el registro técnico, supervisión operativa y aseguramiento de la calidad en planta.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>&copy; 2026 Arawak · Todos los derechos reservados</span>
          <span className="font-mono">CRM Operativo</span>
        </div>
      </div>

      {/* Columna Derecha: Formulario de Login / Registro */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Mobile Header: Solo Nombre de la Empresa */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#4b5e2a] text-lg font-black text-white">
              AW
            </div>
            <div>
              <p className="text-xl font-black tracking-tight">Arawak</p>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {tab === "login" ? "Acceso al CRM" : "Registro de Usuario"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {tab === "login"
                ? "Inicia sesión con tu usuario y contraseña para ingresar al sistema."
                : "Crea tu cuenta de ingeniero o supervisor para registrarte en el CRM."}
            </p>
          </div>

          {/* Tab Switcher: Login vs Registro */}
          <div className="grid grid-cols-2 rounded-xl bg-muted/60 p-1 border border-border">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === "login"
                  ? "bg-card text-foreground shadow-2xs font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setTab("registro")}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === "registro"
                  ? "bg-card text-foreground shadow-2xs font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Nuevo Usuario
            </button>
          </div>

          {/* Formulario Login */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="usuario" className="text-xs font-bold text-foreground">
                  Usuario o Nombre
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="usuario"
                    type="text"
                    placeholder="Ej. Roberto / Pedro / Tu Nombre"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    required
                    className="pl-9 h-11 text-xs border-border bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold text-foreground">
                    Contraseña
                  </Label>
                  <span className="text-[11px] font-semibold text-[#4b5e2a] dark:text-[#7ba045] hover:underline cursor-pointer">
                    ¿Olvidaste tu clave?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 h-11 text-xs border-border bg-background"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#4b5e2a] hover:bg-[#3d4d22] text-white font-extrabold text-xs shadow-xs gap-2 cursor-pointer"
              >
                {isLoading ? "Validando credenciales..." : "Ingresar al CRM"}
                <ArrowRight className="size-4" />
              </Button>

              {/* Quick Fill Credentials Bar for Team */}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Ingreso Rápido por Usuario:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {usuariosDisponibles.slice(0, 3).map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => handleSeleccionarCuentaRapida(u)}
                      className={`text-left rounded-lg border p-2 transition-all cursor-pointer ${
                        usuario.toLowerCase() === u.nombre.toLowerCase()
                          ? "border-[#4b5e2a] bg-[#4b5e2a]/10 ring-1 ring-[#4b5e2a]"
                          : "border-border hover:bg-muted/60"
                      }`}
                    >
                      <p className="text-[11px] font-bold text-foreground truncate">{u.nombre}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.cargo}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  Clave para cuentas demo: <code className="font-mono font-bold text-foreground">arawak2026</code>
                </p>
              </div>
            </form>
          )}

          {/* Formulario Registro de Ingeniero */}
          {tab === "registro" && (
            <form onSubmit={handleRegistro} className="space-y-3.5">
              {/* 1. Nombre Completo */}
              <div className="space-y-1">
                <Label htmlFor="regNombre" className="text-xs font-bold text-foreground">
                  Nombre Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="regNombre"
                    type="text"
                    placeholder="Ej. Mariana Cárdenas / Ing. Carlos"
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    required
                    className="pl-9 h-10 text-xs border-border bg-background"
                  />
                </div>
              </div>

              {/* 2 & 3. Cargo y Área */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="regCargo" className="text-xs font-bold text-foreground">
                    Cargo en Planta
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="regCargo"
                      type="text"
                      placeholder="Ej. Inspector QA"
                      value={regCargo}
                      onChange={(e) => setRegCargo(e.target.value)}
                      required
                      className="pl-8 h-10 text-xs border-border bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="regRol" className="text-xs font-bold text-foreground">
                    Área
                  </Label>
                  <select
                    id="regRol"
                    value={regRol}
                    onChange={(e) => setRegRol(e.target.value as any)}
                    className="w-full h-10 rounded-md border border-border bg-background px-2 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="calidad">Control de Calidad (QA/QC)</option>
                    <option value="produccion">Producción de Planta</option>
                    <option value="gerencia">Gerencia de Operaciones</option>
                  </select>
                </div>
              </div>

              {/* 4. Contraseña de Acceso */}
              <div className="space-y-1">
                <Label htmlFor="regPassword" className="text-xs font-bold text-foreground">
                  Contraseña de Acceso
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="regPassword"
                    type="password"
                    placeholder="Crea tu clave de acceso"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    className="pl-9 h-10 text-xs border-border bg-background"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#4b5e2a] hover:bg-[#3d4d22] text-white font-extrabold text-xs shadow-xs gap-2 mt-2 cursor-pointer"
              >
                {isLoading ? "Creando perfil..." : "Registrar Cuenta e Ingresar"}
                <CheckCircle2 className="size-4" />
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

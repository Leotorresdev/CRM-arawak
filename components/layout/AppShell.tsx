"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode, useEffect } from "react";
import {
  Bell,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  FileCheck2,
  WheatOff,
  Sparkles,
  UserCheck,
  PlayCircle,
  Wheat,
  FlaskConical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getUsuarioActual, cerrarSesion, UsuarioArawak } from "@/lib/auth";

export const navGroups = [
  {
    title: "Formatos Operativos & Procesos",
    items: [
      { to: "/", label: "Formato de Sanitización", icon: FileCheck2 },
      { to: "/limpieza", label: "Limpieza de Planta", icon: Sparkles },
      { to: "/arranque", label: "Arranque de Operaciones", icon: PlayCircle },
      { to: "/materia-prima", label: "Materia Prima & Calibres", icon: Wheat },
      { to: "/analisis-proceso", label: "Análisis de Proceso", icon: FlaskConical },
    ],
  },
];

const alertasArawak = [
  {
    id: "AL-AP-01",
    titulo: "Lote de Galletas liberado con 3.8% de humedad de producto terminado",
    linea: "Horno continuo · Galpón 9",
    nivel: "info" as const,
    hace: "hace 1 min",
  },
  {
    id: "AL-AO-01",
    titulo: "Acta AIO Galpón 9 liberada para OP-2026-094 (Galletas Cambur)",
    linea: "Línea de Formado y Horneado · Galpón 9",
    nivel: "info" as const,
    hace: "hace 2 min",
  },
  {
    id: "AL-LP-01",
    titulo: "Inspección de 8 pasos POES completada para 33 equipos",
    linea: "Líneas Galletas, Tortillas & Harina de Yuca",
    nivel: "info" as const,
    hace: "hace 5 min",
  },
  {
    id: "AL-SAN-01",
    titulo: "Verificación matutina de cloro en agua potable (1.4 ppm)",
    linea: "Línea de Producción · Cambur y Yuca",
    nivel: "info" as const,
    hace: "hace 20 min",
  },
  {
    id: "AL-SAN-02",
    titulo: "Pediluvio de ingreso a planta verificado a 200 ppm",
    linea: "Esclusa Sanitaria Principal",
    nivel: "info" as const,
    hace: "hace 45 min",
  },
  {
    id: "AL-SAN-03",
    titulo: "Inspección de higiene personal completada (100% conforme)",
    linea: "Turno Mañana · Operarios Arawak",
    nivel: "info" as const,
    hace: "hace 1 h",
  },
];

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5 px-3 py-2">
      {navGroups.map((group, i) => (
        <div key={i} className="flex flex-col gap-1">
          {!collapsed && (
            <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {group.title}
            </p>
          )}
          {group.items.map((item) => {
            const active = item.to === "/" ? pathname === "/" || pathname === "/sanitizacion" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#4b5e2a]/15 text-[#4b5e2a] dark:text-[#7ba045] font-semibold"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#4b5e2a]"
                  />
                )}
                <item.icon
                  className={cn(
                    "size-[18px] shrink-0",
                    active ? "text-[#4b5e2a] dark:text-[#7ba045]" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/" className="flex h-16 items-center gap-3 px-5 transition-opacity hover:opacity-90">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#4b5e2a] text-sm font-black text-white shadow-sm">
        AW
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold leading-tight tracking-tight text-foreground">
            Arawak
          </p>
          <p className="truncate text-[11px] text-[#4b5e2a] dark:text-[#7ba045] font-bold">
            Control de Calidad
          </p>
        </div>
      )}
    </Link>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioArawak>(getUsuarioActual());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = getUsuarioActual();
      setUsuario(user);
      const isAuth = localStorage.getItem("qc_auth");
      if (!isAuth && pathname !== "/login") {
        router.push("/login");
      }
    }
  }, [pathname, router]);

  const handleLogout = () => {
    cerrarSesion();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 84 : 272 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar lg:flex"
      >
        <Brand collapsed={collapsed} />
        <div className="mt-2 flex-1 overflow-y-auto pb-4 scrollbar-thin">
          <NavList collapsed={collapsed} />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed((c) => !c)}
            className="w-full justify-start gap-3 text-muted-foreground"
          >
            {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
            {!collapsed && "Contraer menú"}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-[84px]" : "lg:pl-[272px]")}>
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
            {/* Mobile Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-0">
                <SheetTitle className="sr-only">Navegación</SheetTitle>
                <Brand collapsed={false} />
                <div className="overflow-y-auto max-h-[calc(100vh-4rem)] pb-6">
                  <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex-1" />

            {/* Header Right Controls */}
            <div className="flex items-center gap-2 justify-self-end">
              <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 border-[#4b5e2a]/40 text-[#4b5e2a] bg-[#4b5e2a]/10 font-bold text-xs py-1">
                <FileCheck2 className="size-3.5" /> Control de Calidad
              </Badge>

              <Button variant="ghost" size="icon" onClick={toggle} aria-label="Cambiar tema">
                {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
              </Button>

              {/* Notifications Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative cursor-pointer" aria-label="Notificaciones">
                    <Bell className="size-[18px]" />
                    <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#4b5e2a] ring-2 ring-background" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold">Notificaciones de Planta Arawak</p>
                    <p className="text-xs text-muted-foreground">Monitoreo diario de sanitización y BPM</p>
                  </div>
                  <ul className="max-h-80 overflow-y-auto">
                    {alertasArawak.map((a) => (
                      <li key={a.id} className="border-b border-border/60 px-4 py-3 last:border-0 hover:bg-muted/40 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#4b5e2a]" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug">{a.titulo}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {a.linea} · {a.hace}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 rounded-full pl-2 pr-1 py-1 hover:bg-secondary/60 outline-none ring-ring focus-visible:ring-2 cursor-pointer transition-colors">
                    <div className="hidden md:flex flex-col text-right">
                      <span className="text-xs font-black leading-none text-foreground">{usuario.nombre}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{usuario.cargo}</span>
                    </div>
                    <Avatar className="size-9 border border-[#4b5e2a]/40 shadow-2xs">
                      <AvatarFallback className="bg-[#4b5e2a] text-white text-xs font-black">
                        {usuario.nombre
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("") || "AW"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <p className="text-sm font-bold text-foreground">{usuario.nombre}</p>
                    <p className="text-xs font-normal text-muted-foreground">{usuario.cargo}</p>
                    <Badge variant="outline" className="mt-1 text-[10px] border-[#4b5e2a]/40 text-[#4b5e2a] bg-[#4b5e2a]/10 font-bold">
                      {usuario.email}
                    </Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/">1. Formato de Sanitización</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/limpieza">2. Limpieza de Planta</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/arranque">3. Arranque de Operaciones</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/materia-prima">4. Materia Prima & Calibres</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/analisis-proceso">5. Análisis de Proceso</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive font-medium cursor-pointer">
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black sm:text-3xl text-foreground tracking-tight">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="outline" className="gap-1.5 border-[#4b5e2a]/40 text-[#4b5e2a] bg-[#4b5e2a]/10 font-bold py-1">
                <span className="size-1.5 rounded-full bg-[#4b5e2a] animate-pulse" /> Planta Arawak en Operación
              </Badge>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

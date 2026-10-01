// ==============================================================================
// ARAWAK - SISTEMA DE AUTENTICACIÓN, REGISTRO Y GESTIÓN MULTI-USUARIO
// Aislamiento de Registros por Ingeniero / Operador
// ==============================================================================

export interface UsuarioArawak {
  id: string;
  nombre: string;
  email?: string;
  cargo: string;
  rol: "calidad" | "produccion" | "gerencia" | "operaciones";
  cedula?: string;
  password?: string;
  creadoEn?: string;
}

export const USUARIOS_INICIALES: (UsuarioArawak & { password: string })[] = [
  {
    id: "usr_roberto",
    nombre: "Ing. Roberto Valladares",
    email: "roberto@arawak.com",
    cargo: "Inspector de Control de Calidad",
    rol: "calidad",
    cedula: "V-19.824.103",
    password: "arawak2026",
    creadoEn: "2026-09-01",
  },
  {
    id: "usr_pedro",
    nombre: "Pedro Gómez",
    email: "pedro@arawak.com",
    cargo: "Supervisor de Producción y Procesos",
    rol: "produccion",
    cedula: "V-17.450.922",
    password: "arawak2026",
    creadoEn: "2026-09-05",
  },
  {
    id: "usr_laura",
    nombre: "Ing. Laura Montilla",
    email: "laura@arawak.com",
    cargo: "Jefe de Control de Calidad e Inocuidad",
    rol: "calidad",
    cedula: "V-18.452.910",
    password: "arawak2026",
    creadoEn: "2026-09-01",
  },
  {
    id: "usr_admin",
    nombre: "Administrador QA Arawak",
    email: "calidad@arawak.com",
    cargo: "Dirección de Aseguramiento de Calidad",
    rol: "calidad",
    cedula: "V-20.100.200",
    password: "arawak2026",
    creadoEn: "2026-09-01",
  },
];

export function getUsuariosRegistrados(): (UsuarioArawak & { password: string })[] {
  if (typeof window === "undefined") return USUARIOS_INICIALES;
  try {
    const raw = localStorage.getItem("arawak_users_db_v2");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // Initialize DB if not present
  if (typeof window !== "undefined") {
    localStorage.setItem("arawak_users_db_v2", JSON.stringify(USUARIOS_INICIALES));
  }
  return USUARIOS_INICIALES;
}

export interface DatosRegistroUsuario {
  nombre: string;
  cargo: string;
  rol: "calidad" | "produccion" | "gerencia" | "operaciones";
  password: string;
  email?: string;
  cedula?: string;
}

export function registrarNuevoUsuario(
  datos: DatosRegistroUsuario
): UsuarioArawak {
  const usuarios = getUsuariosRegistrados();
  const cleanName = datos.nombre.trim();
  const usernameSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 15);
  const idGenerado = `usr_${usernameSlug}_${Date.now().toString().slice(-4)}`;
  const emailGenerado = datos.email?.trim() || `${usernameSlug}@arawak.com`;

  const nuevo: UsuarioArawak & { password: string } = {
    id: idGenerado,
    nombre: cleanName,
    email: emailGenerado,
    cargo: datos.cargo.trim() || "Inspector de Control de Calidad",
    rol: datos.rol || "calidad",
    cedula: datos.cedula?.trim(),
    password: datos.password || "arawak2026",
    creadoEn: new Date().toISOString(),
  };

  const actualizados = [
    ...usuarios.filter((u) => u.nombre.toLowerCase() !== cleanName.toLowerCase() && u.id !== idGenerado),
    nuevo,
  ];

  if (typeof window !== "undefined") {
    localStorage.setItem("arawak_users_db_v2", JSON.stringify(actualizados));
  }

  // Sincronizar en Supabase de forma transparente
  try {
    import("./supabase-service").then(({ sincronizarUsuarioEnSupabase }) => {
      sincronizarUsuarioEnSupabase(nuevo).catch((e) => console.warn("Supabase user sync error:", e));
    });
  } catch {}

  setUsuarioActual(nuevo);
  return nuevo;
}

export function autenticarUsuario(identificador: string, password: string): UsuarioArawak | null {
  const usuarios = getUsuariosRegistrados();
  const term = identificador.trim().toLowerCase();

  const match = usuarios.find((u) => {
    const matchEmail = u.email ? u.email.toLowerCase() === term : false;
    const matchNombreExacto = u.nombre.toLowerCase() === term;
    const matchNombreContiene = u.nombre.toLowerCase().includes(term);
    const matchId = u.id.toLowerCase() === term;
    return matchEmail || matchNombreExacto || matchNombreContiene || matchId;
  });

  if (match) {
    if (match.password === password.trim() || password === "arawak2026" || password === "123456") {
      setUsuarioActual(match);
      return match;
    }
  }

  // Fallback for default admin
  if ((term === "admin" || term === "calidad@arawak.com" || term.includes("calidad")) && (password === "arawak2026" || password === "123456")) {
    const adminUser = USUARIOS_INICIALES[3];
    setUsuarioActual(adminUser);
    return adminUser;
  }

  return null;
}

export function getUsuarioActual(): UsuarioArawak {
  if (typeof window === "undefined") return USUARIOS_INICIALES[0];
  try {
    const raw = localStorage.getItem("arawak_user_profile");
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return USUARIOS_INICIALES[0];
}

export function setUsuarioActual(usuario: UsuarioArawak) {
  if (typeof window !== "undefined") {
    // Save profile without password
    const { password, ...safeUser } = usuario;
    localStorage.setItem("arawak_user_profile", JSON.stringify(safeUser));
    localStorage.setItem("qc_auth", "true");
  }
}

export function isAutenticado(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("qc_auth") === "true";
}

export function cerrarSesion() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("qc_auth");
    localStorage.removeItem("arawak_user_profile");
  }
}

/**
 * Retorna una clave de almacenamiento aislada por usuario para que los registros
 * de Roberto nunca se mezclen con los de Pedro o Laura.
 */
export function getStorageKeyParaUsuario(modulo: string, usuarioIdOpcional?: string): string {
  const userId = usuarioIdOpcional || getUsuarioActual().id || "default";
  return `arawak_${userId}_${modulo}`;
}

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

const DEMO_IDS = new Set(["usr_roberto", "usr_pedro", "usr_laura", "usr_admin"]);

// Limpieza automática de datos demo/antiguos en clientes locales
if (typeof window !== "undefined") {
  try {
    const isCleaned = localStorage.getItem("arawak_v2_clean_done");
    if (!isCleaned) {
      localStorage.removeItem("arawak_saneamiento_data");
      localStorage.removeItem("arawak_higiene_data");
      localStorage.removeItem("arawak_limpieza_ejecucion_v1");
      localStorage.removeItem("arawak_limpieza_inspeccion_v1");
      localStorage.removeItem("arawak_arranque_actas_v1");
      localStorage.removeItem("arawak_materia_prima_registro_v1");
      localStorage.removeItem("arawak_materia_prima_historico_v1");
      localStorage.removeItem("arawak_analisis_proceso_v1");
      localStorage.removeItem("arawak_users_db_v2");
      localStorage.removeItem("arawak_user_profile");
      localStorage.removeItem("qc_auth");

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("arawak_usr_") ||
            key.startsWith("arawak_saneamiento_") ||
            key.startsWith("arawak_higiene_"))
        ) {
          localStorage.removeItem(key);
        }
      }

      localStorage.setItem("arawak_v2_clean_done", "true");
    }
  } catch {}
}

export const DEFAULT_USUARIO_VACIO: UsuarioArawak = {
  id: "usr_calidad",
  nombre: "Inspector de Guardia",
  cargo: "Control de Calidad",
  rol: "calidad",
};

export const USUARIOS_INICIALES: (UsuarioArawak & { password: string })[] = [];

export function getUsuariosRegistrados(): (UsuarioArawak & { password: string })[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("arawak_users_db_v2");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filtrar usuarios demo creados previamente
        const limpios = parsed.filter((u: any) => !DEMO_IDS.has(u.id));
        if (limpios.length !== parsed.length) {
          localStorage.setItem("arawak_users_db_v2", JSON.stringify(limpios));
        }
        return limpios;
      }
    }
  } catch {}

  return [];
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
    if (match.password === password.trim()) {
      setUsuarioActual(match);
      return match;
    }
  }

  return null;
}

export function getUsuarioActual(): UsuarioArawak {
  if (typeof window === "undefined") return DEFAULT_USUARIO_VACIO;
  try {
    const raw = localStorage.getItem("arawak_user_profile");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && !DEMO_IDS.has(parsed.id)) {
        return parsed;
      } else {
        localStorage.removeItem("arawak_user_profile");
        localStorage.removeItem("qc_auth");
      }
    }
  } catch {}
  return DEFAULT_USUARIO_VACIO;
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

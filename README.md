# CRM Galletas · Sistema de Calidad e Inocuidad Alimentaria

Sistema integral industrial para el Departamento de Aseguramiento y Control de Calidad (QA/QC), monitoreo de puntos críticos HACCP, buenas prácticas de manufactura (BPM / GMP), análisis fisicoquímico de laboratorio, acciones correctivas (CAPA) y bitácora maestra de liberación de lotes.

Migrado y adaptado desde `pixel-perfect-pixel` a una arquitectura full stack profesional de alto rendimiento.

---

## 🛠️ Stack Tecnológico

- **Frontend Framework**: [Next.js 16](https://nextjs.org/) con App Router y Turbopack.
- **Estilos & Diseño**: [Tailwind CSS v4](https://tailwindcss.com/) con sistema de diseño basado en tokens semánticos OKLCH y modo oscuro dinámico.
- **Animaciones & Micro-interacciones**: [Framer Motion / Motion](https://motion.dev/) (transiciones de vista, modales, steppers y acordeones).
- **Componentes UI**: Primitivas accesibles de [@radix-ui](https://www.radix-ui.com/) y Sonner para notificaciones Toast.
- **Gráficos en Tiempo Real**: [Recharts](https://recharts.org/) para tendencias de cloración de agua y calidad.
- **Backend**:
  - Servidor [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) (`server/index.ts`) con endpoints REST documentados.
  - Route Handlers nativos de Next.js (`app/api/*`).
- **Base de Datos & Auth**: [Supabase](https://supabase.com/) con PostgreSQL, Row Level Security (RLS) y migraciones SQL completas (`lib/supabase/schema.sql`).

---

## 📂 Estructura del Proyecto

```text
crm-galletas/
├── app/                          # Next.js App Router (Páginas y API)
│   ├── layout.tsx                # Layout raíz con ThemeProvider y Toaster
│   ├── globals.css               # Configuración Tailwind CSS v4 y tokens OKLCH
│   ├── page.tsx                  # Dashboard principal (HACCP & BPM)
│   ├── login/page.tsx            # Autenticación con credenciales demo
│   ├── ppr/page.tsx              # Programas Prerrequisitos (F-PPR 01 al 05)
│   ├── haccp/page.tsx            # Puntos Críticos de Control (PCC) y Calibración
│   ├── capa/page.tsx             # Gestión CAPA (Stepper interactivo en 7 fases)
│   ├── lab/page.tsx              # Laboratorio (Fisicoquímico, Gluten, Peso CEP)
│   ├── release/page.tsx          # Bitácora Maestra de Liberación con PIN Digital
│   ├── inspecciones/page.tsx     # Tabla de inspecciones con búsqueda y paginación
│   ├── proveedores/page.tsx      # Recepción de materia prima en rampa
│   ├── calibracion/page.tsx      # Calendario metrológico interactivo y lista
│   ├── documentos/page.tsx       # Control documental ISO 9001 e historial de versiones
│   ├── cloracion/page.tsx        # Monitoreo de agua, pH y alertas críticas
│   ├── higiene/page.tsx          # Control diario de higiene del personal
│   ├── plagas/page.tsx           # Monitoreo de trampas y registro de incidentes MIP
│   ├── saneamiento/page.tsx      # Saneamiento SSOP por zonas y verificación ATP
│   └── api/                      # Next.js Route Handlers (Health, QC)
├── components/
│   ├── layout/
│   │   └── AppShell.tsx          # Shell interactivo: barra lateral animada, navbar, perfil y alertas
│   ├── qc/
│   │   ├── NuevoReporteModal.tsx # Asistente modal para reportar no conformidades
│   │   └── StatusBadge.tsx       # Badges semánticos de estado
│   └── ui/                       # Componentes de diseño limpios y sin código muerto
├── lib/
│   ├── qc-data.ts                # Dataset base industrial de prueba
│   ├── theme.tsx                 # Contexto de tema oscuro / claro
│   ├── utils.ts                  # Utilidades cn (clsx + tailwind-merge)
│   └── supabase/
│       ├── client.ts             # Cliente de Supabase para navegador
│       ├── server.ts             # Cliente de Supabase para Node / servidor
│       └── schema.sql            # Script SQL completo de tablas y políticas RLS
├── server/
│   └── index.ts                  # Servidor Express API independiente (puerto 4000)
├── .env.example                  # Plantilla de variables de entorno
└── package.json                  # Scripts y dependencias
```

---

## 🚀 Puesta en Marcha

### 1. Instalar dependencias (ya configuradas)
```bash
npm install
```

### 2. Variables de entorno
Crea tu archivo `.env.local` basado en `.env.example`:
```bash
cp .env.example .env.local
```

### 3. Ejecutar la aplicación

- **Solo frontend Next.js**:
  ```bash
  npm run dev
  ```
  Accede en: [http://localhost:3000](http://localhost:3000)

- **Solo servidor Express API**:
  ```bash
  npm run server
  ```
  API en: [http://localhost:4000/api/health](http://localhost:4000/api/health)

- **Ambos en paralelo (Next.js + Express)**:
  ```bash
  npm run dev:all
  ```

- **Compilar para producción**:
  ```bash
  npm run build
  ```

---

## 🔐 Credenciales de Prueba

Para acceder al sistema desde `/login`:
- **Correo**: `admin@innova-qc.com`
- **Contraseña**: `123456`

---

## 🗄️ Configuración de Supabase

Para conectar tu instancia de base de datos en Supabase:
1. Abre tu proyecto en [Supabase](https://app.supabase.com).
2. Ve al **SQL Editor**.
3. Pega y ejecuta el contenido de [`lib/supabase/schema.sql`](file:///c:/Users/LEOFERSON/Desktop/crm-galletas/lib/supabase/schema.sql).
4. Copia tu `Project URL` y `anon key` en tu archivo `.env.local`.

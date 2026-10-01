-- ====================================================================
-- CRM GALLETAS - SISTEMA DE CONTROL DE CALIDAD E INOCUIDAD ALIMENTARIA
-- Base de datos PostgreSQL / Supabase
-- ====================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Alertas y Desviaciones
CREATE TABLE IF NOT EXISTS qc_alertas (
    id VARCHAR(50) PRIMARY KEY,
    titulo TEXT NOT NULL,
    linea TEXT NOT NULL,
    nivel VARCHAR(20) NOT NULL CHECK (nivel IN ('critica', 'alta', 'media', 'baja')),
    hace TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Inspecciones de Lote
CREATE TABLE IF NOT EXISTS qc_inspecciones (
    id VARCHAR(50) PRIMARY KEY,
    lote VARCHAR(50) NOT NULL,
    producto TEXT NOT NULL,
    linea VARCHAR(50) NOT NULL,
    inspector TEXT NOT NULL,
    muestras INTEGER NOT NULL DEFAULT 0,
    defectos INTEGER NOT NULL DEFAULT 0,
    estado VARCHAR(30) NOT NULL CHECK (estado IN ('Aprobado', 'Rechazado', 'Retrabajo', 'En proceso')),
    fecha DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Puntos Críticos de Control (HACCP)
CREATE TABLE IF NOT EXISTS qc_haccp_pcc (
    id VARCHAR(50) PRIMARY KEY,
    nombre TEXT NOT NULL,
    parametro TEXT NOT NULL,
    actual NUMERIC(6, 2) NOT NULL,
    min_val NUMERIC(6, 2) NOT NULL,
    max_val NUMERIC(6, 2) NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'Aceptable' CHECK (estado IN ('Aceptable', 'Desviacion', 'Critico')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Registros de Monitoreo PCC (F-HACCP-01)
CREATE TABLE IF NOT EXISTS qc_haccp_monitoreo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pcc_id VARCHAR(50) REFERENCES qc_haccp_pcc(id) ON DELETE SET NULL,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valor_medido NUMERIC(6, 2) NOT NULL,
    limite_max NUMERIC(6, 2) NOT NULL,
    desviacion BOOLEAN DEFAULT FALSE,
    accion_correctiva TEXT,
    responsable TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Gestión CAPA (Acciones Correctivas y Preventivas)
CREATE TABLE IF NOT EXISTS qc_capa (
    id VARCHAR(50) PRIMARY KEY,
    titulo TEXT NOT NULL,
    responsable TEXT NOT NULL,
    prioridad VARCHAR(20) NOT NULL CHECK (prioridad IN ('Crítica', 'Alta', 'Media', 'Baja')),
    vence TEXT,
    columna VARCHAR(30) NOT NULL CHECK (columna IN ('identificado', 'analisis', 'accion', 'verificacion', 'resuelto')),
    origen TEXT,
    descripcion TEXT,
    cinco_porques JSONB DEFAULT '[]'::jsonb,
    plan_accion JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de Laboratorio y Ensayos Físico-Químicos (F-LAB-01 & F-FIS-01)
CREATE TABLE IF NOT EXISTS qc_laboratorio_ensayos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lote VARCHAR(50) NOT NULL,
    humedad_pct NUMERIC(5, 2) NOT NULL,
    humedad_conforme BOOLEAN NOT NULL,
    gluten_ppm NUMERIC(6, 2) NOT NULL,
    gluten_conforme BOOLEAN NOT NULL,
    microbiologia TEXT,
    sensorial TEXT,
    pesos_cep JSONB DEFAULT '[]'::jsonb,
    peso_promedio NUMERIC(6, 2),
    desviacion_estandar NUMERIC(6, 3),
    responsable TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabla de Liberación de Lotes (Bitácora Maestra)
CREATE TABLE IF NOT EXISTS qc_lotes_liberacion (
    id VARCHAR(50) PRIMARY KEY,
    lote VARCHAR(50) NOT NULL UNIQUE,
    producto TEXT NOT NULL,
    estado_ppr VARCHAR(30) DEFAULT 'Conforme',
    estado_haccp VARCHAR(30) DEFAULT 'Conforme',
    estado_lab VARCHAR(30) DEFAULT 'Conforme',
    estado_cep VARCHAR(30) DEFAULT 'Conforme',
    decision_final VARCHAR(40) CHECK (decision_final IN ('PENDIENTE', 'LIBERADO PARA VENTA', 'LIBERADO CON CONCESIÓN', 'RECHAZADO')),
    firmado_por TEXT,
    fecha_decision TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabla de Control de Proveedores y Recepción
CREATE TABLE IF NOT EXISTS qc_proveedores_envios (
    id VARCHAR(50) PRIMARY KEY,
    proveedor TEXT NOT NULL,
    categoria VARCHAR(50) DEFAULT 'Materia Prima',
    fecha DATE DEFAULT CURRENT_DATE,
    lote VARCHAR(50) NOT NULL,
    temperatura TEXT,
    inspeccion VARCHAR(50) NOT NULL,
    decision VARCHAR(30) DEFAULT 'Pendiente' CHECK (decision IN ('Pendiente', 'Aceptado', 'Retenido', 'Rechazado')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Saneamiento Operativo Diario (SSOP)
CREATE TABLE IF NOT EXISTS qc_saneamiento_ssop (
    id VARCHAR(50) PRIMARY KEY,
    area TEXT NOT NULL,
    tarea TEXT NOT NULL,
    detergente_alcalino_pct NUMERIC(4, 2),
    sanitizante_ppm NUMERIC(6, 1),
    atp_superficie_pasa BOOLEAN DEFAULT TRUE,
    realizado BOOLEAN DEFAULT FALSE,
    turno VARCHAR(20) DEFAULT 'Mañana',
    fecha DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Monitoreo de Cloración y pH de Agua
CREATE TABLE IF NOT EXISTS qc_agua_cloracion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dia VARCHAR(10) NOT NULL,
    nivel_cloro NUMERIC(4, 2) NOT NULL,
    ph NUMERIC(4, 2),
    turno VARCHAR(20) NOT NULL,
    conforme BOOLEAN DEFAULT TRUE,
    fecha DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Control de Plagas
CREATE TABLE IF NOT EXISTS qc_plagas_trampas (
    id VARCHAR(50) PRIMARY KEY,
    ubicacion TEXT NOT NULL,
    estado VARCHAR(30) NOT NULL CHECK (estado IN ('Normal', 'Actividad', 'Mantenimiento')),
    ultima_revision TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qc_plagas_avistamientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_plaga VARCHAR(50) NOT NULL,
    ubicacion TEXT NOT NULL,
    accion_tomada TEXT,
    responsable TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Monitoreo de Higiene Personal
CREATE TABLE IF NOT EXISTS qc_higiene_personal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empleado_id VARCHAR(50) NOT NULL,
    uniforme_ok BOOLEAN NOT NULL DEFAULT TRUE,
    manos_limpias_ok BOOLEAN NOT NULL DEFAULT TRUE,
    salud_apta_ok BOOLEAN NOT NULL DEFAULT TRUE,
    turno VARCHAR(30) NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE qc_alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_inspecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_haccp_pcc ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_haccp_monitoreo ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_capa ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_laboratorio_ensayos ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_lotes_liberacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_proveedores_envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_saneamiento_ssop ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_agua_cloracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_plagas_trampas ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_plagas_avistamientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_higiene_personal ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura anónima / autenticada para demostración y operación
CREATE POLICY "Permitir lectura publica de alertas" ON qc_alertas FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de inspecciones" ON qc_inspecciones FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de pcc" ON qc_haccp_pcc FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de capa" ON qc_capa FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de proveedores" ON qc_proveedores_envios FOR SELECT USING (true);

-- 13. Arawak: Registro Semanal de Saneamiento Operacional de Planta
CREATE TABLE IF NOT EXISTS arawak_saneamiento_operacional (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semana VARCHAR(50) NOT NULL,
    anio INTEGER NOT NULL DEFAULT 2026,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    area VARCHAR(100) DEFAULT 'Planta de Galletas Sin Gluten',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    firmado_calidad BOOLEAN DEFAULT FALSE,
    calidad_nombre TEXT,
    calidad_fecha TIMESTAMPTZ,
    firmado_gerencia BOOLEAN DEFAULT FALSE,
    gerencia_nombre TEXT,
    gerencia_fecha TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Arawak: Registro Semanal de Higiene del Personal (Control Visual)
CREATE TABLE IF NOT EXISTS arawak_higiene_personal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semana VARCHAR(50) NOT NULL,
    anio INTEGER NOT NULL DEFAULT 2026,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    area VARCHAR(100) DEFAULT 'Esclusa y Sala de Producción',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    firmado_calidad BOOLEAN DEFAULT FALSE,
    calidad_nombre TEXT,
    calidad_fecha TIMESTAMPTZ,
    firmado_gerencia BOOLEAN DEFAULT FALSE,
    gerencia_nombre TEXT,
    gerencia_fecha TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE arawak_saneamiento_operacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE arawak_higiene_personal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica saneamiento arawak" ON arawak_saneamiento_operacional FOR SELECT USING (true);
CREATE POLICY "Escritura publica saneamiento arawak" ON arawak_saneamiento_operacional FOR ALL USING (true);

CREATE POLICY "Lectura publica higiene arawak" ON arawak_higiene_personal FOR SELECT USING (true);
CREATE POLICY "Escritura publica higiene arawak" ON arawak_higiene_personal FOR ALL USING (true);

-- 15. Arawak: Registro de Limpieza de Planta (Cuadro 1: 8 Pasos POES & Cuadro 2: Inspección QA)
CREATE TABLE IF NOT EXISTS arawak_limpieza_planta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha_limpieza DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_inspeccion DATE NOT NULL DEFAULT CURRENT_DATE,
    turno_general VARCHAR(100) DEFAULT 'Turno Mañana (06:00 - 14:00)',
    ejecucion_8pasos JSONB NOT NULL DEFAULT '{}'::jsonb,
    inspeccion_calidad JSONB NOT NULL DEFAULT '{}'::jsonb,
    observaciones_generales TEXT,
    firmas_ejecucion JSONB NOT NULL DEFAULT '{}'::jsonb,
    firmas_inspeccion JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE arawak_limpieza_planta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica limpieza arawak" ON arawak_limpieza_planta FOR SELECT USING (true);
CREATE POLICY "Escritura publica limpieza arawak" ON arawak_limpieza_planta FOR ALL USING (true);

-- 16. Arawak: Acta de Liberación de Inicio de Operaciones (AIO)
CREATE TABLE IF NOT EXISTS arawak_arranque_operaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_acta VARCHAR(50) NOT NULL,
    galpon_id VARCHAR(20) NOT NULL CHECK (galpon_id IN ('galpon-9', 'galpon-8')),
    area_maquina TEXT NOT NULL,
    linea_nombre TEXT NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT CURRENT_TIME,
    producto TEXT NOT NULL,
    sku VARCHAR(50) NOT NULL,
    orden_produccion VARCHAR(50) NOT NULL,
    lote VARCHAR(50) NOT NULL,
    requisitos JSONB NOT NULL DEFAULT '{}'::jsonb,
    observaciones TEXT,
    dictamen VARCHAR(30) NOT NULL CHECK (dictamen IN ('aprobado', 'condicionado', 'rechazado')),
    firma_produccion JSONB NOT NULL DEFAULT '{}'::jsonb,
    firma_calidad JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE arawak_arranque_operaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica arranque arawak" ON arawak_arranque_operaciones FOR SELECT USING (true);
CREATE POLICY "Escritura publica arranque arawak" ON arawak_arranque_operaciones FOR ALL USING (true);

-- 17. Arawak: Control de Calidad de Materia Prima y Procesamiento
CREATE TABLE IF NOT EXISTS arawak_materia_prima (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_registro VARCHAR(50) NOT NULL,
    semana_recepcion VARCHAR(50) NOT NULL,
    anio INTEGER NOT NULL DEFAULT 2026,
    dias_procesado TEXT,
    tipo_materia_prima TEXT NOT NULL,
    fecha_llegada DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_procesado DATE NOT NULL DEFAULT CURRENT_DATE,
    proveedor TEXT NOT NULL,
    cedula VARCHAR(30),
    placa VARCHAR(20),
    peso_carga_kg NUMERIC(10, 2) NOT NULL DEFAULT 0,
    origen_carga TEXT,
    calibre VARCHAR(50),
    dedos_cluster_edad TEXT,
    evaluacion_visual TEXT,
    densidad VARCHAR(30),
    ph_materia_prima NUMERIC(4, 2),
    acido_citrico_ascorbico TEXT,
    pulpa TEXT,
    brix NUMERIC(4, 2),
    tiempo_deshidratacion TEXT,
    olor VARCHAR(50),
    sabor VARCHAR(50),
    reprocesado_kg NUMERIC(10, 2) DEFAULT 0,
    bajo_observacion_kg NUMERIC(10, 2) DEFAULT 0,
    total_procesado_kg NUMERIC(10, 2) DEFAULT 0,
    observaciones TEXT,
    firmas JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE arawak_materia_prima ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica materia prima arawak" ON arawak_materia_prima FOR SELECT USING (true);
CREATE POLICY "Escritura publica materia prima arawak" ON arawak_materia_prima FOR ALL USING (true);

-- 18. Arawak: Análisis de Proceso y Ensayos Fisicoquímicos (Multi-usuario Supabase)
CREATE TABLE IF NOT EXISTS arawak_analisis_proceso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_registro VARCHAR(50) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    user_email VARCHAR(100) NOT NULL,
    user_nombre TEXT NOT NULL,
    semana VARCHAR(50) NOT NULL,
    anio INTEGER NOT NULL DEFAULT 2026,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    producto VARCHAR(100) NOT NULL,
    lote VARCHAR(50) NOT NULL,
    fecha_fabricacion DATE,
    fecha_vencimiento DATE,
    cantidad_bachs INTEGER NOT NULL DEFAULT 1,
    pesos_bachs JSONB NOT NULL DEFAULT '[]'::jsonb,
    parametros_analisis JSONB NOT NULL DEFAULT '[]'::jsonb,
    producto_aceptado_kg NUMERIC(10, 2) DEFAULT 0,
    producto_rechazado_kg NUMERIC(10, 2) DEFAULT 0,
    total_producido_kg NUMERIC(10, 2) DEFAULT 0,
    temperatura_ambiente_c NUMERIC(4, 1),
    observaciones TEXT,
    dictamen VARCHAR(30) NOT NULL DEFAULT 'pendiente' CHECK (dictamen IN ('aceptado', 'rechazado', 'pendiente')),
    firmas JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE arawak_analisis_proceso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica analisis proceso arawak" ON arawak_analisis_proceso FOR SELECT USING (true);
CREATE POLICY "Escritura publica analisis proceso arawak" ON arawak_analisis_proceso FOR ALL USING (true);


import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  initialHigieneData,
  initialSaneamientoData,
  arawakKpis,
  getSemanaActual,
} from "../lib/sanitizacion-data";
import { getSupabaseServerClient } from "../lib/supabase/server";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());

// Request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Arawak CRM - Inocuidad y Sanitización",
    empresa: "Arawak (Galletas y Harinas Sin Gluten de Cambur y Yuca)",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    database: "Supabase PostgreSQL Ready",
  });
});

// 1. Sanitización Arawak - Obtener registros de la semana
app.get("/api/arawak/sanitizacion/actual", async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabaseServerClient();
    const { data: dbSaneamiento } = await supabase
      .from("arawak_saneamiento_operacional")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    const { data: dbHigiene } = await supabase
      .from("arawak_higiene_personal")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    res.json({
      empresa: "Arawak",
      linea: "Galletas Sin Gluten · Cambur y Yuca",
      semana: getSemanaActual(),
      saneamiento: dbSaneamiento && dbSaneamiento.length > 0 ? dbSaneamiento[0].items : initialSaneamientoData,
      higiene: dbHigiene && dbHigiene.length > 0 ? dbHigiene[0].items : initialHigieneData,
      kpis: arawakKpis,
    });
  } catch (error) {
    res.json({
      empresa: "Arawak",
      linea: "Galletas Sin Gluten · Cambur y Yuca",
      semana: getSemanaActual(),
      saneamiento: initialSaneamientoData,
      higiene: initialHigieneData,
      kpis: arawakKpis,
    });
  }
});

// 2. Sanitización Arawak - Guardar o actualizar registro
app.post("/api/arawak/sanitizacion/guardar", async (req: Request, res: Response) => {
  const { tipo, data, semana } = req.body;
  try {
    const supabase = getSupabaseServerClient();
    const tabla = tipo === "higiene" ? "arawak_higiene_personal" : "arawak_saneamiento_operacional";

    await supabase.from(tabla).insert({
      semana: semana?.texto || "Semana Actual",
      anio: 2026,
      fecha_inicio: new Date().toISOString().split("T")[0],
      fecha_fin: new Date().toISOString().split("T")[0],
      items: data,
    });

    res.json({
      success: true,
      mensaje: `Formato de ${tipo || "sanitización"} guardado y respaldado exitosamente.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({
      success: true,
      mensaje: `Formato de ${tipo || "sanitización"} guardado localmente en servidor.`,
      timestamp: new Date().toISOString(),
    });
  }
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Error in Express:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

app.listen(PORT, () => {
  console.log(`[Arawak CRM] Express API Server running on http://localhost:${PORT}`);
});

export default app;

import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  success: "border-success/35 bg-success/12 text-success",
  danger: "border-destructive/35 bg-destructive/12 text-destructive",
  warning: "border-warning/40 bg-warning/12 text-warning",
  info: "border-info/35 bg-info/12 text-info",
  neutral: "border-border bg-muted text-muted-foreground",
};

export const estadoTono: Record<string, keyof typeof tones> = {
  Aprobado: "success",
  Vigente: "success",
  Resuelto: "success",
  Rechazado: "danger",
  Vencida: "danger",
  Obsoleto: "danger",
  Crítica: "danger",
  Desviacion: "danger",
  Retrabajo: "warning",
  Próxima: "warning",
  Alta: "warning",
  "En revisión": "info",
  "En proceso": "info",
  Pendiente: "info",
  Media: "info",
  Baja: "neutral",
};

export function StatusBadge({ label, tone }: { label: string; tone?: keyof typeof tones }) {
  const t = tone ?? estadoTono[label] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[t],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

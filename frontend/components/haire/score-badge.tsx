import { cn } from "@/lib/utils"
import { nivelColor } from "@/lib/mock-data"

export function ScoreBadge({
  porcentaje,
  className,
}: {
  porcentaje: number
  className?: string
}) {
  const nivel = nivelColor(porcentaje)

  const estilos: Record<typeof nivel, string> = {
    success: "bg-success/15 text-success-foreground ring-success/30",
    warning: "bg-warning/20 text-warning-foreground ring-warning/40",
    destructive: "bg-destructive/10 text-destructive ring-destructive/30",
  }

  // Texto legible sobre fondos claros: usamos tonos saturados para el número.
  const texto: Record<typeof nivel, string> = {
    success: "text-success",
    warning: "text-warning-foreground",
    destructive: "text-destructive",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums ring-1 ring-inset",
        estilos[nivel],
        texto[nivel],
        className,
      )}
    >
      {porcentaje}%
    </span>
  )
}

"use client"

import { cn } from "@/lib/utils"

function scoreColor(score: number) {
  if (score > 80) return "var(--success)"
  if (score >= 50) return "var(--warning)"
  return "var(--destructive)"
}

export function ScoreCircle({
  score,
  size = 180,
  strokeWidth = 14,
}: {
  score: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = scoreColor(score)

  return (
    <div
      className="relative flex items-center justify-center group"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Compatibilidad ${score}%`}
    >
      {/* Halo brillante difuso de fondo */}
      <div
        className="absolute inset-2 rounded-full opacity-20 blur-xl animate-pulse-halo pointer-events-none transition-all duration-700"
        style={{ backgroundColor: color }}
      />

      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn("text-4xl font-extrabold tabular-nums tracking-tight")}
          style={{ color }}
        >
          {score}%
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
          Match IA
        </span>
      </div>
    </div>
  )
}

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
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Compatibilidad ${score}%`}
    >
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
          className={cn("text-4xl font-bold tabular-nums")}
          style={{ color }}
        >
          {score}%
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          Compatibilidad
        </span>
      </div>
    </div>
  )
}

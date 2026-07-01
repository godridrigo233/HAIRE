import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({
  className,
  variant = "light",
}: {
  className?: string
  variant?: "light" | "dark"
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
        <Sparkles className="size-4" aria-hidden="true" />
      </div>
      <span
        className={cn(
          "text-lg font-semibold tracking-tight",
          variant === "light" ? "text-sidebar-foreground" : "text-foreground",
        )}
      >
        Haire
      </span>
    </div>
  )
}

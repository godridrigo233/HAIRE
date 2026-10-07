"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  Sparkles,
  ChevronRight,
  ArrowRight,
  User,
  MoreVertical,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ETAPAS_CONFIG } from "@/components/haire/ranking-view"
import { ScoreBadge } from "@/components/haire/score-badge"
import { useToast } from "@/components/haire/toast"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import type { Candidato } from "@/lib/mock-data"

const ETAPAS_ORDENADAS: Array<{ key: string; label: string; dotColor: string; headerBg: string }> = [
  { key: "nuevo", label: "Nuevos", dotColor: "bg-slate-500", headerBg: "bg-slate-50 dark:bg-zinc-900/50" },
  { key: "en_revision", label: "En Revisión", dotColor: "bg-blue-500", headerBg: "bg-blue-50/50 dark:bg-blue-950/20" },
  { key: "entrevista", label: "Entrevista", dotColor: "bg-purple-500", headerBg: "bg-purple-50/50 dark:bg-purple-950/20" },
  { key: "oferta", label: "Oferta", dotColor: "bg-amber-500", headerBg: "bg-amber-50/50 dark:bg-amber-950/20" },
  { key: "contratado", label: "Contratados", dotColor: "bg-emerald-500", headerBg: "bg-emerald-50/50 dark:bg-emerald-950/20" },
  { key: "rechazado", label: "Descartados", dotColor: "bg-rose-500", headerBg: "bg-rose-50/50 dark:bg-rose-950/20" },
]

export function KanbanView({
  vacanteId,
  onRefresh,
}: {
  vacanteId: string
  onRefresh?: () => void
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroTexto, setFiltroTexto] = useState("")
  const [actualizandoId, setActualizandoId] = useState<string | null>(null)

  const cargarCandidatos = useCallback(async () => {
    setCargando(true)
    try {
      const data = await api.getCandidatosDeVacante(vacanteId, {
        page: 1,
        page_size: 100,
      })
      setCandidatos(data.items)
    } catch (err) {
      console.error("Error al cargar pipeline de candidatos:", err)
    } finally {
      setCargando(false)
    }
  }, [vacanteId])

  useEffect(() => {
    cargarCandidatos()
  }, [cargarCandidatos])

  const moverEtapa = async (candidatoId: string, nuevaEtapa: string) => {
    setActualizandoId(candidatoId)
    const candidatoPrevio = candidatos.find((c) => c.id === candidatoId)
    try {
      await api.cambiarEtapaCandidato(candidatoId, nuevaEtapa)
      setCandidatos((prev) =>
        prev.map((c) => (c.id === candidatoId ? { ...c, etapa: nuevaEtapa } : c)),
      )
      const nombre = candidatoPrevio ? candidatoPrevio.nombre : "Candidato"
      const nombreEtapa = ETAPAS_CONFIG[nuevaEtapa]?.label || nuevaEtapa
      toast("success", `${nombre} movido a "${nombreEtapa}"`)
      onRefresh?.()
    } catch (err) {
      toast("error", "Error al actualizar la etapa del candidato")
      console.error("Error cambiando etapa:", err)
    } finally {
      setActualizandoId(null)
    }
  }

  const candidatosFiltrados = candidatos.filter((c) => {
    if (!filtroTexto.trim()) return true
    const q = filtroTexto.toLowerCase()
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.correo && c.correo.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-4">
      {/* Barra de herramientas superior */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar candidatos en tablero..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Total en pipeline: <strong>{candidatos.length}</strong></span>
          <Button
            variant="ghost"
            size="sm"
            onClick={cargarCandidatos}
            disabled={cargando}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("size-3.5", cargando && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tablero Kanban horizontal con scroll */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-4">
        {ETAPAS_ORDENADAS.map((col, index) => {
          const candidatosColumna = candidatosFiltrados.filter(
            (c) => (c.etapa || "nuevo") === col.key,
          )

          // Etapa siguiente en el pipeline sugerida
          const siguienteCol = ETAPAS_ORDENADAS[index + 1]?.key

          return (
            <div
              key={col.key}
              className="flex flex-col rounded-xl border border-border bg-muted/30 overflow-hidden min-w-[240px]"
            >
              {/* Cabecera de la columna */}
              <div className={cn("flex items-center justify-between px-3.5 py-2.5 border-b border-border/80", col.headerBg)}>
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", col.dotColor)} />
                  <span className="text-xs font-semibold text-foreground tracking-tight">
                    {col.label}
                  </span>
                </div>
                <span className="text-[11px] font-bold rounded-full bg-background px-2 py-0.5 text-muted-foreground border border-border">
                  {candidatosColumna.length}
                </span>
              </div>

              {/* Lista de tarjetas */}
              <div className="flex flex-col gap-2.5 p-2.5 min-h-[300px]">
                {candidatosColumna.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-muted-foreground/60 border border-dashed border-border/60 rounded-lg">
                    Sin candidatos
                  </div>
                ) : (
                  candidatosColumna.map((c) => {
                    const reqCumplidas = c.requeridas.filter((r) => r.cumple).length
                    const estaActualizando = actualizandoId === c.id

                    return (
                      <Card
                        key={c.id}
                        className={cn(
                          "group relative border border-border bg-card shadow-xs hover:shadow-md transition-all rounded-lg overflow-hidden",
                          estaActualizando && "opacity-50 pointer-events-none",
                        )}
                      >
                        <CardContent className="p-3 space-y-2.5">
                          {/* Top: Score y acciones */}
                          <div className="flex items-start justify-between gap-1.5">
                            <ScoreBadge porcentaje={c.porcentaje} className="text-[11px] font-semibold px-2 py-0.5" />
                            <DropdownMenu>
                              <DropdownMenuTrigger className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                                <MoreVertical className="size-3.5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs w-44">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/candidatos/${c.id}`)}
                                  className="gap-2 cursor-pointer"
                                >
                                  <ExternalLink className="size-3.5" />
                                  Ver perfil completo
                                </DropdownMenuItem>
                                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                  Mover etapa a:
                                </div>
                                {ETAPAS_ORDENADAS.map((target) => (
                                  <DropdownMenuItem
                                    key={target.key}
                                    disabled={target.key === col.key}
                                    onClick={() => moverEtapa(c.id, target.key)}
                                    className="gap-2 text-xs cursor-pointer"
                                  >
                                    <span className={cn("size-2 rounded-full", target.dotColor)} />
                                    {target.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Nombre del candidato */}
                          <div>
                            <Link
                              href={`/candidatos/${c.id}`}
                              className="text-xs font-semibold text-foreground hover:text-brand hover:underline line-clamp-1 transition-colors"
                            >
                              {c.nombre}
                            </Link>
                            {c.correo && (
                              <p className="text-[11px] text-muted-foreground truncate">
                                {c.correo}
                              </p>
                            )}
                          </div>

                          {/* Requerimientos e IA badge */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
                            {c.esRecomendado && (
                              <Badge className="bg-brand/10 text-brand border border-brand/30 px-1.5 py-0 text-[10px] font-medium gap-1 shadow-none">
                                <Sparkles className="size-2.5" />
                                Top IA
                              </Badge>
                            )}
                            <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-[10px]">
                              {reqCumplidas}/{c.requeridas.length} req.
                            </span>
                          </div>

                          {/* Botón rápido de avanzar pipeline si aplica */}
                          {siguienteCol && col.key !== "rechazado" && col.key !== "contratado" && (
                            <div className="pt-1 border-t border-border/50 flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moverEtapa(c.id, siguienteCol)}
                                className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground font-medium"
                              >
                                Pasar a {ETAPAS_CONFIG[siguienteCol]?.label}
                                <ArrowRight className="size-3" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Sparkles,
  Trophy,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants, Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { ScoreBadge } from "@/components/haire/score-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Candidato } from "@/lib/mock-data"
import { api } from "@/lib/api"

export const ETAPAS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  nuevo: {
    label: "Nuevo",
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
  },
  en_revision: {
    label: "En revisión",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-300",
  },
  entrevista: {
    label: "Entrevista",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-300",
  },
  oferta: {
    label: "Oferta",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
  },
  contratado: {
    label: "Contratado",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300",
  },
  rechazado: {
    label: "Rechazado",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-300",
  },
}

const PAGE_SIZE = 10

export function RankingView({
  vacanteId,
  cargando: cargandoExterno = false,
  onRefresh,
}: {
  vacanteId: string
  cargando?: boolean
  onRefresh?: () => void
}) {
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [q, setQ] = useState("")
  const [etapaFiltro, setEtapaFiltro] = useState<string>("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchCandidatos = useCallback(
    (searchQ: string, p: number, etapa: string) => {
      setCargandoDatos(true)
      api
        .getCandidatosDeVacante(vacanteId, {
          q: searchQ || undefined,
          page: p,
          page_size: PAGE_SIZE,
          etapa: etapa || undefined,
        })
        .then((res) => {
          setCandidatos(res.items)
          setTotal(res.total)
        })
        .catch(() => {
          setCandidatos([])
          setTotal(0)
        })
        .finally(() => setCargandoDatos(false))
    },
    [vacanteId],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchCandidatos(q, 1, etapaFiltro)
    }, 300)
    return () => clearTimeout(timer)
  }, [q, etapaFiltro, fetchCandidatos])

  useEffect(() => {
    fetchCandidatos(q, page, etapaFiltro)
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCambiarEtapa = async (candidatoId: string, nuevaEtapa: string) => {
    try {
      await api.cambiarEtapaCandidato(candidatoId, nuevaEtapa)
      setCandidatos((prev) =>
        prev.map((c) => (c.id === candidatoId ? { ...c, etapa: nuevaEtapa } : c)),
      )
    } catch (err) {
      console.error("Error cambiando etapa:", err)
    }
  }

  const handleDelete = async (e: React.MouseEvent, candidatoId: string) => {
    e.stopPropagation()
    if (!window.confirm("¿Eliminar este candidato?")) return
    try {
      await api.eliminarCandidato(candidatoId)
      setCandidatos((prev) => prev.filter((c) => c.id !== candidatoId))
      setTotal((prev) => Math.max(0, prev - 1))
      onRefresh?.()
    } catch (err) {
      console.error("Error eliminando candidato", err)
    }
  }

  const recomendado = candidatos.find((c) => c.esRecomendado) ?? candidatos[0]

  if (cargandoExterno || (cargandoDatos && !candidatos.length && page === 1 && !q && !etapaFiltro)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Recomendación principal de la IA */}
      {!q && !etapaFiltro && page === 1 && recomendado && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sidebar via-sidebar/95 to-sidebar/90 p-6 text-sidebar-foreground shadow-lg border border-sidebar-border">
          <div className="flex items-center gap-2 text-brand">
            <Sparkles className="size-4 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Candidato Recomendado por IA
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-2xl font-bold">
                <Trophy className="size-6 text-yellow-500" />
                {recomendado.nombre}
              </h3>
              <p className="mt-2 max-w-2xl text-pretty text-sm text-sidebar-foreground/80 leading-relaxed">
                {recomendado.justificacion}
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/candidatos/${recomendado.id}`}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "bg-brand text-brand-foreground hover:bg-brand/90 font-medium",
                  )}
                >
                  Ver Perfil Completo
                </Link>
              </div>
            </div>
            <div className="shrink-0 text-center">
              <div className="rounded-2xl bg-brand/20 border border-brand/40 px-6 py-4 backdrop-blur">
                <p className="text-4xl font-extrabold tabular-nums text-brand">
                  {recomendado.porcentaje}%
                </p>
                <p className="text-xs font-semibold text-sidebar-foreground/70 uppercase mt-0.5">
                  Compatibilidad
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Podium Top 3 */}
      {!q && !etapaFiltro && page === 1 && candidatos.length >= 2 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Trophy className="size-4 text-brand" /> Top Candidatos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {candidatos.slice(0, 3).map((cand, idx) => {
              const podiumConfig = [
                {
                  badge: "🥇 1er Lugar",
                  border: "border-yellow-500/40 bg-yellow-500/5 hover:border-yellow-500/70",
                },
                {
                  badge: "🥈 2do Lugar",
                  border: "border-slate-400/40 bg-slate-400/5 hover:border-slate-400/70",
                },
                {
                  badge: "🥉 3er Lugar",
                  border: "border-amber-700/30 bg-amber-700/5 hover:border-amber-700/60",
                },
              ][idx]

              return (
                <div
                  key={cand.id}
                  className={cn(
                    "flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                    podiumConfig.border,
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {podiumConfig.badge}
                      </span>
                      <ScoreBadge porcentaje={cand.porcentaje} />
                    </div>
                    <p className="font-semibold text-foreground truncate text-base">
                      {cand.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {cand.justificacion || "Evaluación completada."}
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border/50 flex justify-end">
                    <Link
                      href={`/candidatos/${cand.id}`}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      Ver detalles &rarr;
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabla de candidatos y filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar candidato por nombre..."
                className="pl-8"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* Filtro por etapa de pipeline */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                <Filter className="size-3" /> Etapa:
              </span>
              <button
                type="button"
                onClick={() => setEtapaFiltro("")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors shrink-0",
                  etapaFiltro === ""
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                Todas
              </button>
              {Object.entries(ETAPAS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEtapaFiltro(etapaFiltro === key ? "" : key)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors shrink-0 border",
                    etapaFiltro === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted",
                  )}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {candidatos.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {q || etapaFiltro
                  ? "No se encontraron candidatos con los filtros seleccionados."
                  : "Aún no hay candidatos analizados para esta vacante."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidato</TableHead>
                      <TableHead>Compatibilidad</TableHead>
                      <TableHead>Etapa del Pipeline</TableHead>
                      <TableHead>Habilidades detectadas</TableHead>
                      <TableHead className="w-0" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidatos.map((c, i) => {
                      const habilidades = [
                        ...c.requeridas.filter((r) => r.cumple).map((r) => r.nombre),
                        ...c.adicionales,
                      ]
                      const visibles = habilidades.slice(0, 4)
                      const extra = habilidades.length - visibles.length
                      const globalIndex = (page - 1) * PAGE_SIZE + i
                      const etapaKey = c.etapa || "nuevo"
                      const etapaInfo = ETAPAS_CONFIG[etapaKey] || ETAPAS_CONFIG.nuevo

                      return (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground tabular-nums">
                                {globalIndex + 1}
                              </span>
                              <div>
                                <p className="font-medium text-foreground">
                                  {c.nombre}
                                </p>
                                {c.esRecomendado && (
                                  <span className="text-xs font-medium text-brand">
                                    Recomendado
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <ScoreBadge porcentaje={c.porcentaje} />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80">
                                <span className={cn("size-1.5 rounded-full", etapaInfo.color)} />
                                {etapaInfo.label}
                                <ChevronDown className="size-3 opacity-60" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                {Object.entries(ETAPAS_CONFIG).map(([k, cfg]) => (
                                  <DropdownMenuItem
                                    key={k}
                                    onClick={() => handleCambiarEtapa(c.id, k)}
                                    className={cn(
                                      "text-xs cursor-pointer",
                                      k === etapaKey && "font-bold",
                                    )}
                                  >
                                    <span className={cn("size-2 rounded-full mr-2", cfg.color)} />
                                    {cfg.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {visibles.map((h) => (
                                <Badge key={h} variant="outline" className="font-normal text-xs">
                                  {h}
                                </Badge>
                              ))}
                              {extra > 0 && (
                                <Badge variant="secondary" className="font-normal text-xs">
                                  +{extra} más
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/candidatos/${c.id}`}
                                className={cn(
                                  buttonVariants({ variant: "outline", size: "sm" }),
                                )}
                              >
                                Ver detalle
                              </Link>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => handleDelete(e, c.id)}
                                title="Eliminar candidato"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">
                    Mostrando {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, total)} de {total} candidatos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="size-4" />
                      Anterior
                    </Button>
                    <span className="text-xs font-medium tabular-nums">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Siguiente
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

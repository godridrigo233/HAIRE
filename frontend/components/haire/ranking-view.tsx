"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Sparkles, Trophy, Trash2, Search } from "lucide-react"

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
import { cn } from "@/lib/utils"
import type { Candidato } from "@/lib/mock-data"
import { api } from "@/lib/api"

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

  const fetchCandidatos = useCallback((searchQ: string) => {
    setCargandoDatos(true)
    api
      .getCandidatosDeVacante(vacanteId, searchQ)
      .then(setCandidatos)
      .catch(() => setCandidatos([]))
      .finally(() => setCargandoDatos(false))
  }, [vacanteId])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCandidatos(q)
    }, 300)
    return () => clearTimeout(timer)
  }, [q, fetchCandidatos])

  const handleDelete = async (e: React.MouseEvent, candidatoId: string) => {
    e.stopPropagation()
    if (!window.confirm("¿Eliminar este candidato?")) return
    try {
      await api.eliminarCandidato(candidatoId)
      setCandidatos(prev => prev.filter(c => c.id !== candidatoId))
      onRefresh?.()
    } catch (err) {
      console.error("Error eliminando candidato", err)
    }
  }

  // La API ya devuelve ordenado por porcentaje desc.
  const recomendado = candidatos.find((c) => c.esRecomendado) ?? candidatos[0]

  if (cargandoExterno || (cargandoDatos && !candidatos.length)) {
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
      {!q && recomendado && (
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

      {/* Podium Top 3 (visible cuando hay al menos 2 candidatos y no hay búsqueda activa) */}
      {!q && candidatos.length >= 2 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Trophy className="size-4 text-brand" /> Top Candidatos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {candidatos.slice(0, 3).map((cand, idx) => {
              const podiumConfig = [
                {
                  rank: "1",
                  badge: "🥇 1er Lugar",
                  border: "border-yellow-500/40 bg-yellow-500/5 hover:border-yellow-500/70",
                  scoreColor: "text-yellow-600 dark:text-yellow-400",
                },
                {
                  rank: "2",
                  badge: "🥈 2do Lugar",
                  border: "border-slate-400/40 bg-slate-400/5 hover:border-slate-400/70",
                  scoreColor: "text-slate-600 dark:text-slate-300",
                },
                {
                  rank: "3",
                  badge: "🥉 3er Lugar",
                  border: "border-amber-700/30 bg-amber-700/5 hover:border-amber-700/60",
                  scoreColor: "text-amber-700 dark:text-amber-400",
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

      {/* Tabla de candidatos */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar candidato..."
              className="pl-8"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {candidatos.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {q ? "No se encontraron candidatos." : "Aún no hay candidatos analizados para esta vacante."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidato</TableHead>
                    <TableHead>Compatibilidad</TableHead>
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
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground tabular-nums">
                              {i + 1}
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
                          <div className="flex flex-wrap gap-1">
                            {visibles.map((h) => (
                              <Badge key={h} variant="outline" className="font-normal">
                                {h}
                              </Badge>
                            ))}
                            {extra > 0 && (
                              <Badge variant="secondary" className="font-normal">
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

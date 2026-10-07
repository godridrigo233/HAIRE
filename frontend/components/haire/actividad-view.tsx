"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  History,
  Briefcase,
  Users,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck,
  UserCheck,
  Award,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScoreBadge } from "@/components/haire/score-badge"
import { api } from "@/lib/api"
import { formatearFecha, type Vacante, type Candidato } from "@/lib/mock-data"
import { ETAPAS_CONFIG } from "@/components/haire/ranking-view"

interface ActividadViewProps {
  vacante: Vacante
}

interface EventoTimeline {
  id: string
  fecha: string
  titulo: string
  descripcion: string
  tipo: "creacion" | "cv_procesado" | "etapa" | "estado" | "hito"
  icono: "briefcase" | "sparkles" | "users" | "check" | "clock" | "award"
  color: string
  candidatoId?: string
  candidatoNombre?: string
  candidatoScore?: number
}

export function ActividadView({ vacante }: ActividadViewProps) {
  const [cargando, setCargando] = useState(true)
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [eventos, setEventos] = useState<EventoTimeline[]>([])

  useEffect(() => {
    let montado = true

    api
      .getCandidatosDeVacante(vacante.id, { page: 1, page_size: 50 })
      .then((res) => {
        if (!montado) return
        setCandidatos(res.items)

        const lista: EventoTimeline[] = []

        // 1. Hito: Creación de la vacante
        lista.push({
          id: `creacion-${vacante.id}`,
          fecha: vacante.fechaCreacion,
          titulo: "Vacante creada y publicada",
          descripcion: `Se abrió el proceso para "${vacante.titulo}" requiriendo ${vacante.experienciaMinima} años de experiencia y ${vacante.requerimientos.length} habilidades clave.`,
          tipo: "creacion",
          icono: "briefcase",
          color: "bg-blue-500",
        })

        // 2. Eventos derivados de los candidatos
        res.items.forEach((c) => {
          // Evaluación por IA
          lista.push({
            id: `eval-${c.id}`,
            fecha: c.fechaPostulacion || vacante.fechaCreacion,
            titulo: `Evaluación IA completada: ${c.nombre}`,
            descripcion: c.resumenProfesional
              ? `${c.resumenProfesional.slice(0, 110)}...`
              : `Perfil analizado con Match Score del ${c.porcentaje}%.`,
            tipo: "cv_procesado",
            icono: "sparkles",
            color: "bg-brand",
            candidatoId: c.id,
            candidatoNombre: c.nombre,
            candidatoScore: c.porcentaje,
          })

          // Avance de etapa si no es "nuevo"
          if (c.etapa && c.etapa !== "nuevo") {
            const etapaMeta = ETAPAS_CONFIG[c.etapa] || { label: c.etapa }
            const isFinal = c.etapa === "contratado" || c.etapa === "oferta"
            lista.push({
              id: `etapa-${c.id}-${c.etapa}`,
              fecha: c.fechaPostulacion || vacante.fechaCreacion,
              titulo: `${c.nombre} avanzó a ${etapaMeta.label}`,
              descripcion: isFinal
                ? `El candidato alcanzó una etapa destacada en el pipeline con un porcentaje de afinidad de ${c.porcentaje}%.`
                : `Actualización de pipeline de selección hacia la fase de ${etapaMeta.label}.`,
              tipo: "etapa",
              icono: isFinal ? "award" : "check",
              color: isFinal ? "bg-amber-500" : "bg-emerald-500",
              candidatoId: c.id,
              candidatoNombre: c.nombre,
              candidatoScore: c.porcentaje,
            })
          }
        })

        // 3. Hito: Estado actual
        if (vacante.estado === "cerrada") {
          lista.push({
            id: `cerrada-${vacante.id}`,
            fecha: new Date().toISOString(),
            titulo: "Vacante cerrada",
            descripcion: "El proceso de selección ha sido cerrado por el equipo de reclutamiento.",
            tipo: "estado",
            icono: "clock",
            color: "bg-slate-500",
          })
        }

        // Orden cronológico descendente (lo más reciente primero)
        lista.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        setEventos(lista)
      })
      .catch((err) => {
        console.error("Error cargando historial de actividad:", err)
      })
      .finally(() => {
        if (montado) setCargando(false)
      })

    return () => {
      montado = false
    }
  }, [vacante])

  const recomendadosCount = candidatos.filter((c) => c.esRecomendado).length
  const promedioScore = candidatos.length
    ? Math.round(candidatos.reduce((acc, c) => acc + c.porcentaje, 0) / candidatos.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Tarjetas resumen de métricas del proceso */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recomendados por IA</p>
              <p className="text-lg font-bold text-foreground">
                {recomendadosCount} <span className="text-xs font-normal text-muted-foreground">de {candidatos.length}</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Afinidad Promedio</p>
              <p className="text-lg font-bold text-foreground">
                {promedioScore}% <span className="text-xs font-normal text-muted-foreground">Match Score</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <FileCheck className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Eventos Registrados</p>
              <p className="text-lg font-bold text-foreground">
                {eventos.length} <span className="text-xs font-normal text-muted-foreground">en el historial</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline de auditoría y actividad */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="size-4 text-brand" />
                Historial de Actividad y Auditoría
              </CardTitle>
              <CardDescription className="text-xs">
                Trazabilidad cronológica de cambios, subidas de CV y decisiones en el proceso.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {eventos.length} hitos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-start">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : eventos.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No hay actividad registrada aún en esta vacante.
            </div>
          ) : (
            <div className="relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border space-y-6 pt-2">
              {eventos.map((ev) => (
                <div key={ev.id} className="relative flex items-start gap-4 group">
                  {/* Icono del nodo */}
                  <div
                    className={`absolute -left-6 mt-1 flex size-5 items-center justify-center rounded-full text-white ring-4 ring-background ${ev.color}`}
                  >
                    {ev.icono === "briefcase" && <Briefcase className="size-2.5" />}
                    {ev.icono === "sparkles" && <Sparkles className="size-2.5" />}
                    {ev.icono === "check" && <CheckCircle2 className="size-2.5" />}
                    {ev.icono === "award" && <Award className="size-2.5" />}
                    {ev.icono === "clock" && <Clock className="size-2.5" />}
                    {ev.icono === "users" && <Users className="size-2.5" />}
                  </div>

                  {/* Detalle del evento */}
                  <div className="flex-1 rounded-lg border border-border/70 bg-card p-3 shadow-2xs hover:border-border transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-foreground">
                          {ev.titulo}
                        </h4>
                        {ev.candidatoScore !== undefined && (
                          <ScoreBadge score={ev.candidatoScore} className="text-[10px] py-0 px-1.5" />
                        )}
                      </div>
                      <time className="text-[10px] text-muted-foreground tabular-nums font-mono">
                        {formatearFecha(ev.fecha)}
                      </time>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {ev.descripcion}
                    </p>

                    {ev.candidatoId && (
                      <div className="mt-2.5 pt-2 border-t border-border/50 flex justify-end">
                        <Link
                          href={`/candidatos/${ev.candidatoId}`}
                          className="inline-flex items-center text-[11px] font-medium text-brand hover:underline"
                        >
                          Ver perfil de {ev.candidatoNombre?.split(" ")[0]}
                          <ArrowRight className="size-3 ml-1" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

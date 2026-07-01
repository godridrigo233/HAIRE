"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  Phone,
  Check,
  X,
  Sparkles,
  Trophy,
} from "lucide-react"

import { PageHeader } from "@/components/haire/page-header"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScoreCircle } from "@/components/haire/score-circle"
import { cn } from "@/lib/utils"
import { nivelColor, type Candidato, type Vacante } from "@/lib/mock-data"
import { api, ApiError } from "@/lib/api"

export default function CandidatoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [candidato, setCandidato] = useState<Candidato | null>(null)
  const [vacante, setVacante] = useState<Vacante | null>(null)
  const [cargando, setCargando] = useState(true)
  const [noExiste, setNoExiste] = useState(false)

  useEffect(() => {
    api
      .getCandidato(id)
      .then((c) => {
        setCandidato(c)
        return api.getVacante(c.vacanteId).then(setVacante).catch(() => {})
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNoExiste(true)
      })
      .finally(() => setCargando(false))
  }, [id])

  if (noExiste) notFound()
  if (!candidato) return null

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/vacantes/${candidato.vacanteId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver al ranking
      </Link>

      <PageHeader title={candidato.nombre}>
        {candidato.esRecomendado && (
          <Badge className="bg-brand text-brand-foreground">
            <Trophy className="size-3" />
            Recomendado
          </Badge>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Columna izquierda: score + contacto */}
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              {cargando ? (
                <Skeleton className="size-40 rounded-full" />
              ) : (
                <ScoreCircle score={candidato.porcentaje} />
              )}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Compatibilidad con la vacante
                </p>
                {vacante && (
                  <p className="text-sm font-medium text-foreground">
                    {vacante.titulo}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos de contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 text-muted-foreground" />
                <span className="text-foreground">{candidato.correo}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 text-muted-foreground" />
                <span
                  className={
                    candidato.telefono
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {candidato.telefono ?? "No detectado"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: habilidades + justificación */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Habilidades requeridas vs detectadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {candidato.requeridas.map((r) => (
                  <li
                    key={r.nombre}
                    className="flex items-center justify-between py-2.5"
                  >
                    <span className="flex items-center gap-2 text-sm text-foreground">
                      {r.nombre}
                      {r.obligatoria && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Obligatoria
                        </span>
                      )}
                    </span>
                    {r.cumple ? (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                        <span className="flex size-5 items-center justify-center rounded-full bg-success/15">
                          <Check className="size-3.5" />
                        </span>
                        Cumple
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                        <span className="flex size-5 items-center justify-center rounded-full bg-destructive/10">
                          <X className="size-3.5" />
                        </span>
                        No cumple
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {candidato.adicionales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Habilidades adicionales detectadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {candidato.adicionales.map((h) => (
                    <Badge key={h} variant="secondary" className="font-normal">
                      {h}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card
            className={cn(
              "border-l-4",
              nivelColor(candidato.porcentaje) === "success"
                ? "border-l-success"
                : nivelColor(candidato.porcentaje) === "warning"
                  ? "border-l-warning"
                  : "border-l-destructive",
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-brand" />
                Justificación de la IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                {candidato.justificacion}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

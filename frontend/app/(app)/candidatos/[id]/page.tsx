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
  FileText,
  ExternalLink,
  Download,
  ChevronDown,
} from "lucide-react"

import { PageHeader } from "@/components/haire/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ETAPAS_CONFIG } from "@/components/haire/ranking-view"
import { ScoreCircle } from "@/components/haire/score-circle"
import { cn } from "@/lib/utils"
import { nivelColor, type Candidato, type Vacante } from "@/lib/mock-data"
import { api, ApiError } from "@/lib/api"
import { useToast } from "@/components/haire/toast"

export default function CandidatoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { toast } = useToast()
  const [candidato, setCandidato] = useState<Candidato | null>(null)
  const [vacante, setVacante] = useState<Vacante | null>(null)
  const [cargando, setCargando] = useState(true)
  const [noExiste, setNoExiste] = useState(false)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)

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

  // Calcular estadísticas de ajuste de habilidades
  const obligatorias = candidato.requeridas.filter((r) => r.obligatoria)
  const obligatoriasCumplidas = obligatorias.filter((r) => r.cumple)
  const obligatoriasPct = obligatorias.length
    ? Math.round((obligatoriasCumplidas.length / obligatorias.length) * 100)
    : 100

  const opcionales = candidato.requeridas.filter((r) => !r.obligatoria)
  const opcionalesCumplidas = opcionales.filter((r) => r.cumple)
  const opcionalesPct = opcionales.length
    ? Math.round((opcionalesCumplidas.length / opcionales.length) * 100)
    : 100

  const handleCambiarEtapa = async (nuevaEtapa: string) => {
    try {
      await api.cambiarEtapaCandidato(id, nuevaEtapa)
      setCandidato((prev) => (prev ? { ...prev, etapa: nuevaEtapa } : null))
      const label = ETAPAS_CONFIG[nuevaEtapa]?.label || nuevaEtapa
      toast("success", `Etapa cambiada a "${label}"`)
    } catch (err) {
      console.error("Error cambiando etapa:", err)
      toast("error", "Error al actualizar la etapa del candidato")
    }
  }

  const etapaKey = candidato.etapa || "nuevo"
  const etapaInfo = ETAPAS_CONFIG[etapaKey] || ETAPAS_CONFIG.nuevo

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/vacantes/${candidato.vacanteId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver al ranking
        </Link>
        {candidato.pdfUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPdfModalOpen(true)}
            className="gap-2 border-brand/40 text-foreground hover:bg-brand/10"
          >
            <FileText className="size-4 text-brand" />
            Ver Documento CV
          </Button>
        )}
      </div>

      <PageHeader title={candidato.nombre}>
        <div className="flex items-center gap-2">
          {candidato.esRecomendado && (
            <Badge className="bg-brand text-brand-foreground shadow-sm">
              <Trophy className="size-3" />
              Recomendado por IA
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:opacity-80">
              <span className={cn("size-2 rounded-full", etapaInfo.color)} />
              Etapa: {etapaInfo.label}
              <ChevronDown className="size-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(ETAPAS_CONFIG).map(([k, cfg]) => (
                <DropdownMenuItem
                  key={k}
                  onClick={() => handleCambiarEtapa(k)}
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
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Columna izquierda: score + contacto + métricas */}
        <div className="space-y-6">
          <Card className="glass-card shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              {cargando ? (
                <Skeleton className="size-40 rounded-full" />
              ) : (
                <ScoreCircle score={candidato.porcentaje} />
              )}
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Compatibilidad General
                </p>
                {vacante && (
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {vacante.titulo}
                  </p>
                )}
              </div>

              {/* Barras de desglose */}
              <div className="w-full space-y-3 pt-4 border-t border-border/60">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Requisitos Obligatorios</span>
                    <span className="font-semibold text-foreground">
                      {obligatoriasCumplidas.length}/{obligatorias.length} ({obligatoriasPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        obligatoriasPct === 100 ? "bg-success" : "bg-warning",
                      )}
                      style={{ width: `${obligatoriasPct}%` }}
                    />
                  </div>
                </div>

                {opcionales.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-muted-foreground">Habilidades Opcionales</span>
                      <span className="font-semibold text-foreground">
                        {opcionalesCumplidas.length}/{opcionales.length} ({opcionalesPct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-500"
                        style={{ width: `${opcionalesPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Datos de contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 text-brand shrink-0" />
                <span className="text-foreground truncate">{candidato.correo || "No registrado"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 text-brand shrink-0" />
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
              {candidato.pdfUrl && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => setPdfModalOpen(true)}
                  >
                    <FileText className="size-3.5" />
                    Vista previa de CV
                  </Button>
                </div>
              )}
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
              "border-l-4 glass-card shadow-sm",
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

      {/* Modal de Vista Previa de Documento PDF */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-4">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div>
              <DialogTitle className="text-base flex items-center gap-2">
                <FileText className="size-4 text-brand" />
                Curriculum Vitae: {candidato.nombre}
              </DialogTitle>
            </div>
            {candidato.pdfUrl && (
              <a
                href={candidato.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand hover:underline font-medium"
              >
                <Download className="size-3.5" /> Descargar / Abrir en pestaña
              </a>
            )}
          </DialogHeader>
          <div className="flex-1 w-full h-full min-h-0 bg-muted/40 rounded-lg overflow-hidden mt-2">
            {candidato.pdfUrl ? (
              <iframe
                src={candidato.pdfUrl}
                className="w-full h-full border-0"
                title={`CV de ${candidato.nombre}`}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No hay URL de documento disponible para este candidato.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

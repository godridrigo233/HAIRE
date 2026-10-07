"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Briefcase, Users, Plus, ArrowUpRight, TrendingUp, Sparkles, Trophy, ChevronRight, CheckCircle2, Circle, X } from "lucide-react"

import { PageHeader } from "@/components/haire/page-header"
import { buttonVariants, Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { formatearFecha, type Vacante, type Candidato } from "@/lib/mock-data"
import { api } from "@/lib/api"
import { getUsuario } from "@/lib/auth"
import { ScoreBadge } from "@/components/haire/score-badge"
import { ETAPAS_CONFIG } from "@/components/haire/ranking-view"

export default function DashboardPage() {
  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [cargandoCandidatos, setCargandoCandidatos] = useState(true)
  const [vacantes, setVacantes] = useState<Vacante[]>([])
  const [topCandidatos, setTopCandidatos] = useState<Array<Candidato & { vacanteTitulo: string }>>([])
  const [nombre, setNombre] = useState("")

  const [pipelineDistribucion, setPipelineDistribucion] = useState<Record<string, number>>({
    nuevo: 0,
    en_revision: 0,
    entrevista: 0,
    oferta: 0,
    contratado: 0,
  })
  const [tasaRecomendados, setTasaRecomendados] = useState(0)
  const [totalEnPipeline, setTotalEnPipeline] = useState(0)
  const [onboardingOculto, setOnboardingOculto] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ocultado = localStorage.getItem("haire_onboarding_dismissed") === "true"
      setOnboardingOculto(ocultado)
    }
  }, [])

  const descartarOnboarding = () => {
    setOnboardingOculto(true)
    if (typeof window !== "undefined") {
      localStorage.setItem("haire_onboarding_dismissed", "true")
    }
  }

  useEffect(() => {
    setNombre(getUsuario()?.nombres ?? "")
    api
      .listarVacantes()
      .then(async (data) => {
        setVacantes(data.items)
        setCargando(false)

        try {
          const activasConPostulantes = data.items
            .filter((v) => v.candidatos > 0)
            .slice(0, 5)

          if (activasConPostulantes.length > 0) {
            const promesas = activasConPostulantes.map(async (v) => {
              const res = await api.getCandidatosDeVacante(v.id, {
                page: 1,
                page_size: 20,
              })
              return res.items.map((c) => ({ ...c, vacanteTitulo: v.titulo }))
            })
            const listas = await Promise.all(promesas)
            const todos = listas.flat()

            // Distribución de etapas
            const distrib: Record<string, number> = {
              nuevo: 0,
              en_revision: 0,
              entrevista: 0,
              oferta: 0,
              contratado: 0,
            }
            let recCount = 0
            todos.forEach((c) => {
              const k = c.etapa || "nuevo"
              if (distrib[k] !== undefined) distrib[k]++
              if (c.esRecomendado) recCount++
            })

            setPipelineDistribucion(distrib)
            setTotalEnPipeline(todos.length)
            setTasaRecomendados(
              todos.length ? Math.round((recCount / todos.length) * 100) : 0,
            )

            // Top candidatos ordenados
            const copia = [...todos]
            copia.sort((a, b) => b.porcentaje - a.porcentaje)
            setTopCandidatos(copia.slice(0, 6))
          }
        } catch (err) {
          console.error("Error cargando candidatos top:", err)
        } finally {
          setCargandoCandidatos(false)
        }
      })
      .catch(() => {
        setVacantes([])
        setCargando(false)
        setCargandoCandidatos(false)
      })
  }, [])

  const totalVacantesActivas = vacantes.filter((v) => v.estado === "activa").length
  const totalPostulantes = vacantes.reduce((acc, v) => acc + v.candidatos, 0)
  const promedioCandidatos = vacantes.length ? Math.round(totalPostulantes / vacantes.length) : 0

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`Hola, ${nombre}`}
        description="Este es el resumen de tus procesos de selección."
      >
        <Link
          href="/vacantes/nueva"
          className={cn(
            buttonVariants(),
            "bg-brand text-brand-foreground hover:bg-brand/90",
          )}
        >
          <Plus className="size-4" />
          Nueva Vacante
        </Link>
      </PageHeader>

      {/* Guía de Primeros Pasos (Onboarding) */}
      {!onboardingOculto && (
        <Card className="mb-8 border-brand/20 bg-brand/[0.03] shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Guía de Inicio Rápido en HAIRE
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sigue estos tres pasos para poner en marcha tu selección inteligente de talento.
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={descartarOnboarding}
                title="Ocultar guía"
              >
                <X className="size-3.5 mr-1" />
                Ocultar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Paso 1 */}
              <div
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  vacantes.length > 0
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border bg-card",
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Paso 1
                  </span>
                  {vacantes.length > 0 ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" /> Listo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Circle className="size-3.5" /> Pendiente
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-foreground mb-1">
                  Crea tu primera vacante
                </h4>
                <p className="text-[11px] text-muted-foreground mb-2.5">
                  Define el puesto, las habilidades clave y la experiencia requerida.
                </p>
                {vacantes.length === 0 ? (
                  <Link
                    href="/vacantes/nueva"
                    className="inline-flex items-center text-xs font-semibold text-brand hover:underline"
                  >
                    Crear vacante <ChevronRight className="size-3 ml-0.5" />
                  </Link>
                ) : (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    {vacantes.length} vacante{vacantes.length > 1 ? "s" : ""} creada{vacantes.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Paso 2 */}
              <div
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  totalPostulantes > 0
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border bg-card",
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Paso 2
                  </span>
                  {totalPostulantes > 0 ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" /> Listo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Circle className="size-3.5" /> Pendiente
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-foreground mb-1">
                  Carga CVs en PDF
                </h4>
                <p className="text-[11px] text-muted-foreground mb-2.5">
                  Arrastra los archivos en lote para que la IA extraiga y evalúe perfiles.
                </p>
                {totalPostulantes === 0 ? (
                  <Link
                    href={vacantes.length > 0 ? `/vacantes/${vacantes[0].id}` : "/vacantes"}
                    className="inline-flex items-center text-xs font-semibold text-brand hover:underline"
                  >
                    Subir currículums <ChevronRight className="size-3 ml-0.5" />
                  </Link>
                ) : (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    {totalPostulantes} CV{totalPostulantes > 1 ? "s" : ""} procesado{totalPostulantes > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Paso 3 */}
              <div
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  totalEnPipeline > 0
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border bg-card",
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Paso 3
                  </span>
                  {totalEnPipeline > 0 ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" /> Listo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Circle className="size-3.5" /> Pendiente
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-foreground mb-1">
                  Pipeline & Rankings
                </h4>
                <p className="text-[11px] text-muted-foreground mb-2.5">
                  Revisa los Match Scores y mueve postulantes por las etapas de selección.
                </p>
                {vacantes.length > 0 ? (
                  <Link
                    href={`/vacantes/${vacantes[0].id}`}
                    className="inline-flex items-center text-xs font-semibold text-brand hover:underline"
                  >
                    Ver ranking <ChevronRight className="size-3 ml-0.5" />
                  </Link>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Esperando vacante</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tarjetas resumen */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ResumenCard
          cargando={cargando}
          icon={<Briefcase className="size-5" />}
          label="Vacantes activas"
          value={totalVacantesActivas}
          hint={`${vacantes.length} vacantes en total`}
        />
        <ResumenCard
          cargando={cargando}
          icon={<Users className="size-5" />}
          label="Postulantes cargados"
          value={totalPostulantes}
          hint="En todas las vacantes"
        />
        <ResumenCard
          cargando={cargando}
          icon={<ArrowUpRight className="size-5" />}
          label="Vacantes cerradas"
          value={vacantes.filter((v) => v.estado === "cerrada").length}
          hint="Procesos finalizados"
        />
        <ResumenCard
          cargando={cargando}
          icon={<TrendingUp className="size-5" />}
          label="Promedio por vacante"
          value={promedioCandidatos}
          hint="Candidatos / puesto"
        />
      </div>

      {/* Embudo del Pipeline de Selección */}
      {totalEnPipeline > 0 && (
        <Card className="mb-8 border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="size-4 text-brand" />
                  Embudo de Selección (Pipeline Funnel)
                </CardTitle>
                <CardDescription className="text-xs">
                  Progresión de {totalEnPipeline} candidatos analizados por etapas de contratación.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-brand/5 border-brand/20 text-brand">
                  <Sparkles className="size-3 mr-1" /> {tasaRecomendados}% Recomendados IA
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                {
                  label: "Nuevos",
                  count: pipelineDistribucion.nuevo || 0,
                  color: "bg-slate-500",
                  barColor: "bg-slate-400",
                },
                {
                  label: "En Revisión",
                  count: pipelineDistribucion.en_revision || 0,
                  color: "bg-blue-500",
                  barColor: "bg-blue-500",
                },
                {
                  label: "Entrevista",
                  count: pipelineDistribucion.entrevista || 0,
                  color: "bg-purple-500",
                  barColor: "bg-purple-500",
                },
                {
                  label: "Oferta",
                  count: pipelineDistribucion.oferta || 0,
                  color: "bg-amber-500",
                  barColor: "bg-amber-500",
                },
                {
                  label: "Contratados",
                  count: pipelineDistribucion.contratado || 0,
                  color: "bg-emerald-500",
                  barColor: "bg-emerald-500",
                },
              ].map((etapa) => {
                const pct = totalEnPipeline
                  ? Math.round((etapa.count / totalEnPipeline) * 100)
                  : 0
                return (
                  <div
                    key={etapa.label}
                    className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className={cn("size-2 rounded-full", etapa.color)} />
                        {etapa.label}
                      </span>
                      <span className="font-bold tabular-nums text-foreground">
                        {etapa.count}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          etapa.barColor,
                        )}
                        style={{
                          width: `${Math.max(pct, etapa.count > 0 ? 8 : 0)}%`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right tabular-nums">
                      {pct}% del total
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de vacantes */}
      <Card>
        <CardHeader>
          <CardTitle>Tus vacantes</CardTitle>
          <CardDescription>
            Haz clic en una vacante para ver el detalle y el ranking de
            candidatos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <TablaSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Puesto</TableHead>
                    <TableHead className="text-center">Candidatos</TableHead>
                    <TableHead>Creación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vacantes.map((v) => (
                    <TableRow
                      key={v.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/vacantes/${v.id}`)}
                    >
                      <TableCell className="font-medium text-foreground">
                        {v.titulo}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {v.candidatos}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatearFecha(v.fechaCreacion)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={v.estado === "activa" ? "default" : "secondary"}
                          className={
                            v.estado === "activa"
                              ? "bg-success/15 text-success"
                              : ""
                          }
                        >
                          {v.estado === "activa" ? "Activa" : "Cerrada"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/vacantes/${v.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                        >
                          Ver
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección de candidatos top talent */}
      {topCandidatos.length > 0 && (
        <Card className="mt-8 border-brand/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="size-5 text-brand" />
                  Candidatos Más Destacados
                </CardTitle>
                <CardDescription>
                  Postulantes con los puntajes más altos analizados por IA en todos tus procesos.
                </CardDescription>
              </div>
              <Badge className="bg-brand/10 text-brand border-brand/30 shadow-none">
                <Sparkles className="size-3 mr-1" /> Top Afinidades
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topCandidatos.map((c) => {
                const etapaInfo = ETAPAS_CONFIG[c.etapa || "nuevo"] || ETAPAS_CONFIG.nuevo
                return (
                  <Link
                    key={c.id}
                    href={`/candidatos/${c.id}`}
                    className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-brand/40 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <ScoreBadge porcentaje={c.porcentaje} className="font-semibold text-xs" />
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", etapaInfo.color)}>
                          {etapaInfo.label}
                        </span>
                      </div>
                      <h4 className="font-semibold text-foreground text-sm group-hover:text-brand transition-colors line-clamp-1">
                        {c.nombre}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {c.vacanteTitulo}
                      </p>
                      {c.justificacion && (
                        <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2 italic">
                          &quot;{c.justificacion}&quot;
                        </p>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-brand font-medium">
                      <span>Ver evaluación completa</span>
                      <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


function ResumenCard({
  cargando,
  icon,
  label,
  value,
  hint,
}: {
  cargando: boolean
  icon: React.ReactNode
  label: string
  value: number
  hint: string
}) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-md glass-card">
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {cargando ? (
            <Skeleton className="mt-1 h-8 w-16" />
          ) : (
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {value}
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function TablaSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

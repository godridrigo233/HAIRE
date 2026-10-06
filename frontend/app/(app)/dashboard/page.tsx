"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Briefcase, Users, Plus, ArrowUpRight, TrendingUp, Sparkles, Trophy, ChevronRight } from "lucide-react"

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
            .slice(0, 4)

          if (activasConPostulantes.length > 0) {
            const promesas = activasConPostulantes.map(async (v) => {
              const res = await api.getCandidatosDeVacante(v.id, {
                page: 1,
                page_size: 5,
              })
              return res.items.map((c) => ({ ...c, vacanteTitulo: v.titulo }))
            })
            const listas = await Promise.all(promesas)
            const todos = listas.flat()
            todos.sort((a, b) => b.porcentaje - a.porcentaje)
            setTopCandidatos(todos.slice(0, 6))
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
                        <ScoreBadge score={c.porcentaje} className="font-semibold text-xs" />
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

"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Upload, Trophy, Briefcase, Lock, LockOpen, Loader2, Pencil, Columns3, History, AlertTriangle } from "lucide-react"

import { PageHeader } from "@/components/haire/page-header"
import { CvUploader } from "@/components/haire/cv-uploader"
import { RankingView } from "@/components/haire/ranking-view"
import { KanbanView } from "@/components/haire/kanban-view"
import { ActividadView } from "@/components/haire/actividad-view"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatearFecha, type Vacante } from "@/lib/mock-data"
import { api, ApiError } from "@/lib/api"

type Tab = "ranking" | "kanban" | "cargar" | "actividad"

export default function VacanteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [vacante, setVacante] = useState<Vacante | null>(null)
  const [tab, setTab] = useState<Tab>("ranking")
  const [cargando, setCargando] = useState(true)
  const [noExiste, setNoExiste] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [dialogoConfirmarOpen, setDialogoConfirmarOpen] = useState(false)

  useEffect(() => {
    api
      .getVacante(id)
      .then(setVacante)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNoExiste(true)
      })
      .finally(() => setCargando(false))
  }, [id])

  if (noExiste) notFound()
  if (!vacante) return null

  const toggleEstado = async () => {
    setToggling(true)
    const isActive = vacante.estado === 'activa'
    try {
      const updated = await api.patchVacante(vacante.id, !isActive)
      setVacante(updated)
    } catch (e) {
      console.error(e)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/vacantes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Vacantes
      </Link>

      <PageHeader title={vacante.titulo}>
        <div className="flex items-center gap-3">
          <Badge
            variant={vacante.estado === "activa" ? "default" : "secondary"}
            className={
              vacante.estado === "activa" ? "bg-success/15 text-success" : ""
            }
          >
            {vacante.estado === "activa" ? "Activa" : "Cerrada"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (vacante.estado === "activa") {
                setDialogoConfirmarOpen(true)
              } else {
                toggleEstado()
              }
            }}
            disabled={toggling}
            className="flex items-center gap-1.5"
          >
            {toggling ? (
              <Loader2 className="size-4 animate-spin" />
            ) : vacante.estado === "activa" ? (
              <Lock className="size-4" />
            ) : (
              <LockOpen className="size-4" />
            )}
            {vacante.estado === "activa" ? "Cerrar vacante" : "Reabrir vacante"}
          </Button>
          <Link
            href={`/vacantes/${id}/editar`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex items-center gap-1.5")}
          >
            <Pencil className="size-4" />
            Editar
          </Link>
        </div>
      </PageHeader>

      {/* Info de la vacante */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="size-4 text-muted-foreground" />
            Requisitos del puesto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {vacante.descripcion && (
            <p className="text-sm text-muted-foreground">
              {vacante.descripcion}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {vacante.requerimientos.map((r) => (
              <Badge
                key={r.nombre}
                variant={r.obligatoria ? "default" : "outline"}
                className={
                  r.obligatoria ? "bg-primary text-primary-foreground" : ""
                }
              >
                {r.nombre}
                {r.obligatoria && " *"}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Experiencia mínima: </span>
              <span className="font-medium text-foreground">
                {vacante.experienciaMinima} años
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Candidatos: </span>
              <span className="font-medium text-foreground">
                {vacante.candidatos}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Creada: </span>
              <span className="font-medium text-foreground">
                {formatearFecha(vacante.fechaCreacion)}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            * Habilidad obligatoria
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-border">
        <TabButton
          active={tab === "ranking"}
          onClick={() => setTab("ranking")}
          icon={<Trophy className="size-4" />}
        >
          Ranking de candidatos
        </TabButton>
        <TabButton
          active={tab === "kanban"}
          onClick={() => setTab("kanban")}
          icon={<Columns3 className="size-4" />}
        >
          Pipeline Kanban
        </TabButton>
        <TabButton
          active={tab === "cargar"}
          onClick={() => setTab("cargar")}
          icon={<Upload className="size-4" />}
        >
          Cargar CVs
        </TabButton>
        <TabButton
          active={tab === "actividad"}
          onClick={() => setTab("actividad")}
          icon={<History className="size-4" />}
        >
          Historial de actividad
        </TabButton>
      </div>

      {tab === "ranking" ? (
        <RankingView vacanteId={vacante.id} cargando={cargando} />
      ) : tab === "kanban" ? (
        <KanbanView vacanteId={vacante.id} />
      ) : tab === "actividad" ? (
        <ActividadView vacante={vacante} />
      ) : (
        <CvUploader
          vacanteId={vacante.id}
          onCompletado={() => setTab("ranking")}
        />
      )}

      {/* Diálogo de Confirmación para Cerrar Vacante */}
      <Dialog open={dialogoConfirmarOpen} onOpenChange={setDialogoConfirmarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <DialogTitle>¿Confirmas el cierre de esta vacante?</DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  Al cerrar "{vacante.titulo}", se suspenderá la recepción de nuevos candidatos y el proceso se marcará como concluido.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
            Podrás reabrir la vacante en cualquier momento si decides reactivar la búsqueda de talento.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogoConfirmarOpen(false)}
              disabled={toggling}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setDialogoConfirmarOpen(false)
                toggleEstado()
              }}
              disabled={toggling}
              className="gap-1.5"
            >
              {toggling && <Loader2 className="size-3.5 animate-spin" />}
              Sí, cerrar vacante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-brand text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  )
}

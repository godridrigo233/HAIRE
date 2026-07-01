"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Briefcase, Users, Plus, ArrowUpRight } from "lucide-react"

import { PageHeader } from "@/components/haire/page-header"
import { buttonVariants } from "@/components/ui/button"
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
import { formatearFecha, type Vacante } from "@/lib/mock-data"
import { api } from "@/lib/api"
import { getUsuario } from "@/lib/auth"

export default function DashboardPage() {
  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [vacantes, setVacantes] = useState<Vacante[]>([])
  const [nombre, setNombre] = useState("")

  useEffect(() => {
    setNombre(getUsuario()?.nombres ?? "")
    api
      .listarVacantes()
      .then(setVacantes)
      .catch(() => setVacantes([]))
      .finally(() => setCargando(false))
  }, [])

  const totalVacantesActivas = vacantes.filter((v) => v.estado === "activa").length
  const totalPostulantes = vacantes.reduce((acc, v) => acc + v.candidatos, 0)

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
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          {cargando ? (
            <Skeleton className="mt-1 h-8 w-16" />
          ) : (
            <p className="text-3xl font-semibold tabular-nums text-foreground">
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

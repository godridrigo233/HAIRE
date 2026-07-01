"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Users, Calendar } from "lucide-react"

import { PageHeader } from "@/components/haire/page-header"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatearFecha, type Vacante } from "@/lib/mock-data"
import { api } from "@/lib/api"

export default function VacantesPage() {
  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [vacantes, setVacantes] = useState<Vacante[]>([])

  useEffect(() => {
    api
      .listarVacantes()
      .then(setVacantes)
      .catch(() => setVacantes([]))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Vacantes"
        description="Gestiona tus procesos de selección y revisa sus candidatos."
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

      {!cargando && vacantes.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aún no tienes vacantes. Crea la primera para empezar a evaluar candidatos.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cargando
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))
          : vacantes.map((v) => (
              <Card
                key={v.id}
                className="cursor-pointer transition-shadow hover:ring-2 hover:ring-brand/30"
                onClick={() => router.push(`/vacantes/${v.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{v.titulo}</CardTitle>
                    <Badge
                      variant={v.estado === "activa" ? "default" : "secondary"}
                      className={
                        v.estado === "activa" ? "bg-success/15 text-success" : ""
                      }
                    >
                      {v.estado === "activa" ? "Activa" : "Cerrada"}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {v.descripcion}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {v.requerimientos.slice(0, 4).map((r) => (
                      <Badge key={r.nombre} variant="outline">
                        {r.nombre}
                      </Badge>
                    ))}
                    {v.requerimientos.length > 4 && (
                      <Badge variant="outline">
                        +{v.requerimientos.length - 4}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {v.candidatos} candidatos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    {formatearFecha(v.fechaCreacion)}
                  </span>
                </CardFooter>
              </Card>
            ))}
      </div>
    </div>
  )
}

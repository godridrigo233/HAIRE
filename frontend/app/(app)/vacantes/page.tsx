"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Users, Calendar, Search, Lock, LockOpen } from "lucide-react"

import { PageHeader } from "@/components/haire/page-header"
import { buttonVariants, Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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

function VacantesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQ = searchParams.get("q") || ""
  
  const [cargando, setCargando] = useState(true)
  const [vacantes, setVacantes] = useState<Vacante[]>([])
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState(initialQ)
  const [page, setPage] = useState(1)
  const pageSize = 12

  const fetchVacantes = useCallback(
    (searchQ: string, searchPage: number) => {
      setCargando(true)
      api
        .listarVacantes({ q: searchQ, page: searchPage, page_size: pageSize })
        .then((data) => {
          setVacantes(data.items)
          setTotal(data.total)
        })
        .catch(() => {
          setVacantes([])
          setTotal(0)
        })
        .finally(() => setCargando(false))
    },
    []
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVacantes(q, page)
    }, 300)
    return () => clearTimeout(timer)
  }, [q, page, fetchVacantes])

  // Sync initial query from URL on mount only if it changed
  useEffect(() => {
    const query = searchParams.get("q") || ""
    if (query !== q) {
      setQ(query)
      setPage(1)
    }
  }, [searchParams])

  const toggleEstado = async (e: React.MouseEvent, v: Vacante) => {
    e.stopPropagation()
    const isActive = v.estado === "activa"
    try {
      await api.patchVacante(v.id, !isActive)
      fetchVacantes(q, page)
    } catch (err) {
      console.error("Error patching vacante", err)
    }
  }

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

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar vacantes..."
            className="pl-8"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          Total: {total} {total === 1 ? 'vacante' : 'vacantes'}
        </div>
      </div>

      {!cargando && vacantes.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {q ? "No se encontraron vacantes para la búsqueda." : "Aún no tienes vacantes. Crea la primera para empezar a evaluar candidatos."}
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
                className="cursor-pointer transition-shadow hover:ring-2 hover:ring-brand/30 flex flex-col"
                onClick={() => router.push(`/vacantes/${v.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{v.titulo}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => toggleEstado(e, v)}
                        title={v.estado === "activa" ? "Cerrar vacante" : "Reabrir vacante"}
                      >
                        {v.estado === "activa" ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
                      </Button>
                      <Badge
                        variant={v.estado === "activa" ? "default" : "secondary"}
                        className={
                          v.estado === "activa" ? "bg-success/15 text-success" : ""
                        }
                      >
                        {v.estado === "activa" ? "Activa" : "Cerrada"}
                      </Badge>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {v.descripcion}
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
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
                <CardFooter className="justify-between text-xs text-muted-foreground border-t pt-4">
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
      
      {total > pageSize && (
        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={page * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}

export default function VacantesPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <VacantesContent />
    </Suspense>
  )
}

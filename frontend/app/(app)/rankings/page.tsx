"use client"

import { useEffect, useState } from "react"

import { PageHeader } from "@/components/haire/page-header"
import { RankingView } from "@/components/haire/ranking-view"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { vacantes } from "@/lib/mock-data"

export default function RankingsPage() {
  const vacantesActivas = vacantes.filter((v) => v.candidatos > 0)
  const [seleccion, setSeleccion] = useState(vacantesActivas[0]?.id ?? "")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setCargando(true)
    const t = setTimeout(() => setCargando(false), 500)
    return () => clearTimeout(t)
  }, [seleccion])

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Rankings"
        description="Compara los candidatos evaluados por la IA en cada vacante."
      />

      {/* Selector de vacante */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <p className="mb-3 text-sm font-medium text-foreground">
            Selecciona una vacante
          </p>
          <div className="flex flex-wrap gap-2">
            {vacantesActivas.map((v) => (
              <button
                key={v.id}
                onClick={() => setSeleccion(v.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  seleccion === v.id
                    ? "border-brand bg-brand/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {v.titulo}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {seleccion && <RankingView vacanteId={seleccion} cargando={cargando} />}
    </div>
  )
}

"use client"

import { useState } from "react"

import { PageHeader } from "@/components/haire/page-header"
import { CvUploader } from "@/components/haire/cv-uploader"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { vacantes } from "@/lib/mock-data"

export default function CargarPage() {
  const activas = vacantes.filter((v) => v.estado === "activa")
  const [seleccion, setSeleccion] = useState(activas[0]?.id ?? "")

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Cargar CV"
        description="Sube los currículums de los postulantes a una vacante para que la IA los analice."
      />

      <Card>
        <CardHeader>
          <CardTitle>Vacante de destino</CardTitle>
          <CardDescription>
            Los CVs se asociarán a la vacante seleccionada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {activas.map((v) => (
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

          <CvUploader />
        </CardContent>
      </Card>
    </div>
  )
}

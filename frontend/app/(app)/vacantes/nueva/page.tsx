"use client"

import { useState, type KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, ArrowLeft } from "lucide-react"

import { PageHeader } from "@/components/haire/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Skill {
  nombre: string
  obligatoria: boolean
}

export default function NuevaVacantePage() {
  const router = useRouter()
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [experiencia, setExperiencia] = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [skills, setSkills] = useState<Skill[]>([])

  function agregarSkill() {
    const nombre = skillInput.trim()
    if (!nombre) return
    if (skills.some((s) => s.nombre.toLowerCase() === nombre.toLowerCase())) {
      setSkillInput("")
      return
    }
    setSkills((prev) => [...prev, { nombre, obligatoria: false }])
    setSkillInput("")
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      agregarSkill()
    }
  }

  function eliminarSkill(nombre: string) {
    setSkills((prev) => prev.filter((s) => s.nombre !== nombre))
  }

  function toggleObligatoria(nombre: string) {
    setSkills((prev) =>
      prev.map((s) =>
        s.nombre === nombre ? { ...s, obligatoria: !s.obligatoria } : s,
      ),
    )
  }

  function guardar() {
    // Simulado: en la demo volvemos al listado de vacantes.
    router.push("/vacantes")
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver
      </button>

      <PageHeader
        title="Nueva vacante"
        description="Define el puesto y las habilidades que buscas. La IA usará estos requisitos para evaluar cada CV."
      />

      <Card>
        <CardHeader>
          <CardTitle>Detalles del puesto</CardTitle>
          <CardDescription>
            Los campos marcados son obligatorios para poder analizar candidatos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título del puesto</Label>
            <Input
              id="titulo"
              placeholder="Ej: Desarrollador Frontend Senior"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">
              Descripción{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </Label>
            <Textarea
              id="descripcion"
              rows={4}
              placeholder="Describe las responsabilidades y el contexto del puesto..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skill">Habilidades requeridas</Label>
            <div className="flex gap-2">
              <Input
                id="skill"
                placeholder="Escribe una habilidad (ej: React) y pulsa Enter"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <Button
                type="button"
                variant="outline"
                onClick={agregarSkill}
                aria-label="Agregar habilidad"
              >
                <Plus className="size-4" />
                Agregar
              </Button>
            </div>

            {skills.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                Aún no has agregado habilidades.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {skills.map((s) => (
                  <li
                    key={s.nombre}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      {s.nombre}
                      {s.obligatoria && (
                        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand">
                          Obligatoria
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      <label
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                        htmlFor={`obl-${s.nombre}`}
                      >
                        ¿Es obligatoria?
                        <Switch
                          id={`obl-${s.nombre}`}
                          checked={s.obligatoria}
                          onCheckedChange={() => toggleObligatoria(s.nombre)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => eliminarSkill(s.nombre)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Eliminar ${s.nombre}`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp">Años de experiencia mínima</Label>
            <Input
              id="exp"
              type="number"
              min={0}
              placeholder="0"
              value={experiencia}
              onChange={(e) => setExperiencia(e.target.value)}
              className="max-w-[160px]"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button
              onClick={guardar}
              disabled={!titulo.trim()}
              className={cn("bg-brand text-brand-foreground hover:bg-brand/90")}
            >
              Guardar vacante
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

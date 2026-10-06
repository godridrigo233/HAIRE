"use client"

import { use, useEffect, useState, type KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, ArrowLeft, Loader2 } from "lucide-react"

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
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { api, ApiError } from "@/lib/api"
import { useToast } from "@/components/haire/toast"

interface Skill {
  nombre: string
  obligatoria: boolean
}

export default function EditarVacantePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [cargando, setCargando] = useState(true)
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [experiencia, setExperiencia] = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [skills, setSkills] = useState<Skill[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    api
      .getVacante(id)
      .then((v) => {
        setTitulo(v.titulo)
        setDescripcion(v.descripcion || "")
        setExperiencia(String(v.experienciaMinima))
        setSkills(
          v.requerimientos.map((r) => ({
            nombre: r.nombre,
            obligatoria: r.obligatoria,
          })),
        )
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          router.replace("/vacantes")
        }
        setError("No se pudo cargar la vacante")
      })
      .finally(() => setCargando(false))
  }, [id, router])

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

  async function guardar() {
    setError("")
    setGuardando(true)
    try {
      await api.editarVacante(id, {
        titulo_puesto: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        experiencia_minima_anios: Number(experiencia) || 0,
        requerimientos: skills.map((s) => ({
          nombre: s.nombre,
          es_obligatoria: s.obligatoria,
        })),
      })
      toast("success", "Vacante actualizada exitosamente")
      router.push(`/vacantes/${id}`)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "No se pudo actualizar la vacante. Intenta de nuevo."
      setError(msg)
      toast("error", msg)
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    )
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
        title="Editar vacante"
        description="Modifica los datos del puesto. Los cambios se reflejarán en las próximas evaluaciones."
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

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => router.back()} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              onClick={guardar}
              disabled={!titulo.trim() || guardando}
              className={cn("bg-brand text-brand-foreground hover:bg-brand/90")}
            >
              {guardando ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

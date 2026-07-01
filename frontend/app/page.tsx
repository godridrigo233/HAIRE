"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2, Sparkles } from "lucide-react"

import { Logo } from "@/components/haire/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CREDENCIALES_DEMO } from "@/lib/mock-data"
import { api, ApiError } from "@/lib/api"
import { guardarSesion } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [mensajeError, setMensajeError] = useState("")
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(false)
    setCargando(true)

    try {
      const { token, usuario } = await api.login(correo.trim(), password)
      guardarSesion(token, usuario)
      router.push("/dashboard")
    } catch (err) {
      setError(true)
      setMensajeError(
        err instanceof ApiError && err.status === 0
          ? "No se pudo conectar con el servidor."
          : "Credenciales incorrectas. Revisa tu correo y contraseña.",
      )
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Panel de marca */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <Logo />
        <div className="space-y-6">
          <div className="flex size-12 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <Sparkles className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-tight">
            El candidato adecuado, sin leer 30 CVs a mano.
          </h1>
          <p className="max-w-md text-pretty text-sidebar-foreground/70">
            Haire analiza cada currículum con IA, calcula su compatibilidad con
            la vacante y te muestra un ranking con la recomendación del mejor
            postulante.
          </p>
        </div>
        <p className="text-sm text-sidebar-foreground/50">
          © 2026 Haire. Reclutamiento inteligente.
        </p>
      </div>

      {/* Panel de formulario */}
      <div className="flex w-full items-center justify-center bg-background p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo variant="dark" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground">
              Iniciar sesión
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Accede a tu panel de reclutamiento.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{mensajeError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="correo">Correo electrónico</Label>
              <Input
                id="correo"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@empresa.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                aria-invalid={error}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-brand hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error}
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={cargando}
              className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {cargando && <Loader2 className="size-4 animate-spin" />}
              {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Demo:</span>{" "}
            {CREDENCIALES_DEMO.correo} · {CREDENCIALES_DEMO.password}
          </div>
        </div>
      </div>
    </div>
  )
}

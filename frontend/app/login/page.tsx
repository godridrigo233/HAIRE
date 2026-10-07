"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Loader2, Sparkles, ArrowLeft } from "lucide-react"

import { Logo } from "@/components/haire/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
        <Link href="/">
          <Logo />
        </Link>
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
          © 2026 Haire. Reclutamiento inteligente con IA.
        </p>
      </div>

      {/* Panel de formulario */}
      <div className="flex w-full items-center justify-center bg-background p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Volver al inicio
            </Link>
          </div>

          <div className="mb-8 lg:hidden">
            <Logo variant="dark" />
          </div>

          <div className="mb-8 space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Iniciar sesión
            </h2>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder a la plataforma.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{mensajeError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="correo">Correo electrónico</Label>
              <Input
                id="correo"
                type="email"
                placeholder="reclutador@empresa.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                autoComplete="email"
                disabled={cargando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={cargando}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Entrar a Haire"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="font-medium text-brand hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

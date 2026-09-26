"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Loader2, Sparkles } from "lucide-react"

import { Logo } from "@/components/haire/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, ApiError } from "@/lib/api"
import { guardarSesion } from "@/lib/auth"

export default function RegisterPage() {
  const router = useRouter()
  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState(false)
  const [mensajeError, setMensajeError] = useState("")
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(false)

    if (password.length < 6) {
      setError(true)
      setMensajeError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError(true)
      setMensajeError("Las contraseñas no coinciden.")
      return
    }

    setCargando(true)

    try {
      const { token, usuario } = await api.register({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: correo.trim(),
        password,
      })
      guardarSesion(token, usuario)
      router.push("/dashboard")
    } catch (err) {
      setError(true)
      setMensajeError(
        err instanceof ApiError && err.status === 0
          ? "No se pudo conectar con el servidor."
          : (err instanceof ApiError ? err.message : "Error al registrarse. Intenta de nuevo.")
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
            Descubre al candidato perfecto para tu equipo.
          </h1>
          <p className="max-w-md text-pretty text-sidebar-foreground/70">
            Únete a Haire y transforma tu proceso de reclutamiento con el poder de la IA. Analiza CVs automáticamente y enfócate en las entrevistas que importan.
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
              Crear una cuenta
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Comienza a gestionar tus procesos de selección.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{mensajeError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombres">Nombres</Label>
                <Input
                  id="nombres"
                  placeholder="Juan"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  aria-invalid={error}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  placeholder="Pérez"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  aria-invalid={error}
                  required
                />
              </div>
            </div>

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
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={error}
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={cargando}
              className="w-full bg-brand text-brand-foreground hover:bg-brand/90 mt-2"
            >
              {cargando && <Loader2 className="size-4 animate-spin" />}
              {cargando ? "Creando cuenta..." : "Regístrate"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/" className="font-medium text-brand hover:underline">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

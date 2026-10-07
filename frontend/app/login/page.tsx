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

  // Estados de recuperación de contraseña
  const [modalRecuperar, setModalRecuperar] = useState(false)
  const [correoRecuperar, setCorreoRecuperar] = useState("")
  const [passwordNueva, setPasswordNueva] = useState("")
  const [cargandoRecuperar, setCargandoRecuperar] = useState(false)
  const [recuperarExito, setRecuperarExito] = useState(false)
  const [recuperarError, setRecuperarError] = useState("")
  const [tokenResetRecibido, setTokenResetRecibido] = useState<string | null>(null)

  async function handleSolicitarRecuperacion(e: FormEvent) {
    e.preventDefault()
    setRecuperarError("")
    setCargandoRecuperar(true)
    try {
      const resp = await api.recuperarPassword(correoRecuperar.trim())
      setRecuperarExito(true)
      if (resp.token_reset) {
        setTokenResetRecibido(resp.token_reset)
      }
    } catch (err) {
      setRecuperarError(
        err instanceof ApiError ? err.message : "Error al procesar la solicitud de recuperación.",
      )
    } finally {
      setCargandoRecuperar(false)
    }
  }

  async function handleEjecutarReset(e: FormEvent) {
    e.preventDefault()
    if (!tokenResetRecibido) return
    setRecuperarError("")
    setCargandoRecuperar(true)
    try {
      await api.resetPassword({
        token: tokenResetRecibido,
        passwordNueva: passwordNueva,
      })
      alert("¡Contraseña restablecida con éxito! Ya puedes iniciar sesión.")
      setModalRecuperar(false)
      setPassword(passwordNueva)
      setCorreo(correoRecuperar)
    } catch (err) {
      setRecuperarError(
        err instanceof ApiError ? err.message : "Error al restablecer la contraseña.",
      )
    } finally {
      setCargandoRecuperar(false)
    }
  }

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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <button
                  type="button"
                  onClick={() => {
                    setModalRecuperar(true)
                    setRecuperarExito(false)
                    setRecuperarError("")
                  }}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
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

      {/* Modal de Recuperación de Contraseña */}
      {modalRecuperar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Recuperar contraseña
              </h3>
              <button
                type="button"
                onClick={() => setModalRecuperar(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {recuperarError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                {recuperarError}
              </div>
            )}

            {!recuperarExito ? (
              <form onSubmit={handleSolicitarRecuperacion} className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ingresa tu correo electrónico registrado. Te enviaremos las instrucciones para restablecer tu acceso.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="correo-recuperar" className="text-xs">Correo electrónico</Label>
                  <Input
                    id="correo-recuperar"
                    type="email"
                    placeholder="ejemplo@empresa.com"
                    value={correoRecuperar}
                    onChange={(e) => setCorreoRecuperar(e.target.value)}
                    required
                    disabled={cargandoRecuperar}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setModalRecuperar(false)}
                    disabled={cargandoRecuperar}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-brand text-brand-foreground hover:bg-brand/90"
                    disabled={cargandoRecuperar}
                  >
                    {cargandoRecuperar ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar instrucciones"
                    )}
                  </Button>
                </div>
              </form>
            ) : tokenResetRecibido ? (
              <form onSubmit={handleEjecutarReset} className="space-y-4">
                <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                  Código de restablecimiento verificado. Ingresa tu nueva contraseña para continuar.
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password-nueva" className="text-xs">Nueva contraseña</Label>
                  <Input
                    id="password-nueva"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    required
                    minLength={6}
                    disabled={cargandoRecuperar}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-brand text-brand-foreground hover:bg-brand/90"
                    disabled={cargandoRecuperar}
                  >
                    {cargandoRecuperar ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Actualizando...
                      </>
                    ) : (
                      "Guardar nueva contraseña"
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                  Si tu correo existe en el sistema, hemos enviado las instrucciones para restablecer tu contraseña.
                </div>
                <Button
                  type="button"
                  className="w-full"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalRecuperar(false)}
                >
                  Entendido
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

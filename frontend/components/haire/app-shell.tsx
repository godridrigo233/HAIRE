"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Briefcase,
  Upload,
  Trophy,
  Search,
  LogOut,
  Settings,
  ChevronDown,
  User,
  Bell,
  Shield,
  Sun,
  Moon,
  Loader2,
  KeyRound,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/haire/logo"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  getToken,
  getUsuario,
  cerrarSesion,
  actualizarUsuarioSesion,
  iniciales as inicialesDe,
  type UsuarioSesion,
} from "@/lib/auth"
import { api, ApiError } from "@/lib/api"
import { useToast } from "@/components/haire/toast"

const navItems = [
  { href: "/dashboard", label: "Panel de Control", icon: LayoutDashboard },
  { href: "/vacantes", label: "Vacantes", icon: Briefcase },
  { href: "/cargar", label: "Cargar CV", icon: Upload },
  { href: "/rankings", label: "Rankings", icon: Trophy },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<"perfil" | "seguridad">("perfil")
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDark, setIsDark] = useState(false)

  // Estados del formulario de perfil
  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [errorPerfil, setErrorPerfil] = useState("")

  // Estados del formulario de contraseña
  const [passActual, setPassActual] = useState("")
  const [passNueva, setPassNueva] = useState("")
  const [passConfirmar, setPassConfirmar] = useState("")
  const [guardandoPass, setGuardandoPass] = useState(false)
  const [errorPass, setErrorPass] = useState("")

  useEffect(() => {
    if (settingsOpen && usuario) {
      setNombres(usuario.nombres || "")
      setApellidos(usuario.apellidos || "")
      setErrorPerfil("")
      setPassActual("")
      setPassNueva("")
      setPassConfirmar("")
      setErrorPass("")
    }
  }, [settingsOpen, usuario])

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombres.trim() || !apellidos.trim()) {
      setErrorPerfil("Nombres y apellidos son requeridos")
      return
    }
    setErrorPerfil("")
    setGuardandoPerfil(true)
    try {
      const actualizado = await api.actualizarPerfil({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
      })
      actualizarUsuarioSesion({
        nombres: actualizado.nombres,
        apellidos: actualizado.apellidos,
      })
      setUsuario((prev) =>
        prev
          ? {
              ...prev,
              nombres: actualizado.nombres,
              apellidos: actualizado.apellidos,
            }
          : null,
      )
      toast("success", "Perfil actualizado con éxito")
      setSettingsOpen(false)
    } catch (err: any) {
      setErrorPerfil(err?.message || "Error al actualizar perfil")
      toast("error", "Error al actualizar perfil")
    } finally {
      setGuardandoPerfil(false)
    }
  }

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passActual) {
      setErrorPass("Ingresa tu contraseña actual")
      return
    }
    if (passNueva.length < 6) {
      setErrorPass("La nueva contraseña debe tener al menos 6 caracteres")
      return
    }
    if (passNueva !== passConfirmar) {
      setErrorPass("Las contraseñas no coinciden")
      return
    }
    setErrorPass("")
    setGuardandoPass(true)
    try {
      await api.cambiarPassword({
        passwordActual: passActual,
        passwordNueva: passNueva,
      })
      toast("success", "Contraseña actualizada exitosamente")
      setPassActual("")
      setPassNueva("")
      setPassConfirmar("")
      setSettingsOpen(false)
    } catch (err: any) {
      setErrorPass(err?.message || "Error al actualizar contraseña")
      toast("error", err?.message || "Error al actualizar contraseña")
    } finally {
      setGuardandoPass(false)
    }
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem("haire_theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark)
    setIsDark(shouldBeDark)
    if (shouldBeDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const toggleTheme = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("haire_theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("haire_theme", "light")
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/vacantes?q=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  // Protección de rutas: sin token, de vuelta al login.
  useEffect(() => {
    if (!getToken()) {
      router.replace("/")
      return
    }
    setUsuario(getUsuario())
  }, [router])

  function logout() {
    cerrarSesion()
    router.replace("/")
  }

  // Mientras se resuelve la sesión no renderizamos la app (evita parpadeo).
  if (!usuario) return null

  const nombreCompleto = `${usuario.nombres} ${usuario.apellidos}`.trim()

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Navegación principal">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/60">
            Haire · Reclutamiento con IA
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur md:px-6">
          <div className="md:hidden">
            <Logo variant="dark" />
          </div>
          <form className="relative hidden max-w-md flex-1 items-center sm:flex" onSubmit={handleSearch}>
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar vacantes..."
              className="pl-9"
              aria-label="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              aria-label="Alternar tema claro/oscuro"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-warning" />
              ) : (
                <Moon className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label="Menú de usuario"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {inicialesDe(usuario)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left leading-tight sm:block">
                  <p className="text-sm font-medium text-foreground">
                    {nombreCompleto}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {usuario.rol}
                  </p>
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="leading-tight">
                    <p className="text-sm font-medium">{nombreCompleto}</p>
                    <p className="text-xs font-normal text-muted-foreground">
                      {usuario.correo}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="size-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="size-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configuración de la Cuenta</DialogTitle>
            <DialogDescription>
              Gestiona tus datos personales y credenciales de acceso.
            </DialogDescription>
          </DialogHeader>

          {/* Selector de pestañas */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setSettingsTab("perfil")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 border-b-2 py-2 text-sm font-medium transition-colors",
                settingsTab === "perfil"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <User className="size-4" />
              Mi Perfil
            </button>
            <button
              type="button"
              onClick={() => setSettingsTab("seguridad")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 border-b-2 py-2 text-sm font-medium transition-colors",
                settingsTab === "seguridad"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <KeyRound className="size-4" />
              Seguridad
            </button>
          </div>

          {settingsTab === "perfil" && (
            <form onSubmit={handleGuardarPerfil} className="space-y-4 py-2">
              {errorPerfil && (
                <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
                  {errorPerfil}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="perfil-nombres">Nombres</Label>
                <Input
                  id="perfil-nombres"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Tus nombres"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perfil-apellidos">Apellidos</Label>
                <Input
                  id="perfil-apellidos"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Tus apellidos"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perfil-correo">Correo Electrónico</Label>
                <Input
                  id="perfil-correo"
                  value={usuario.correo}
                  disabled
                  className="bg-muted opacity-80 cursor-not-allowed"
                />
                <p className="text-[11px] text-muted-foreground">
                  El correo es el identificador principal de tu cuenta y no puede modificarse.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSettingsOpen(false)}
                  disabled={guardandoPerfil}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={guardandoPerfil}
                  className="bg-primary text-primary-foreground gap-2"
                >
                  {guardandoPerfil && <Loader2 className="size-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          )}

          {settingsTab === "seguridad" && (
            <form onSubmit={handleCambiarPassword} className="space-y-4 py-2">
              {errorPass && (
                <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
                  {errorPass}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="pass-actual">Contraseña Actual</Label>
                <Input
                  id="pass-actual"
                  type="password"
                  value={passActual}
                  onChange={(e) => setPassActual(e.target.value)}
                  placeholder="Tu contraseña actual"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass-nueva">Nueva Contraseña</Label>
                <Input
                  id="pass-nueva"
                  type="password"
                  value={passNueva}
                  onChange={(e) => setPassNueva(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass-confirmar">Confirmar Nueva Contraseña</Label>
                <Input
                  id="pass-confirmar"
                  type="password"
                  value={passConfirmar}
                  onChange={(e) => setPassConfirmar(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSettingsOpen(false)}
                  disabled={guardandoPass}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={guardandoPass}
                  className="bg-primary text-primary-foreground gap-2"
                >
                  {guardandoPass && <Loader2 className="size-4 animate-spin" />}
                  Actualizar Contraseña
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


"use client"

import { useState, type ReactNode } from "react"
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
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/haire/logo"
import { Input } from "@/components/ui/input"
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
import { usuarioActual } from "@/lib/mock-data"

const navItems = [
  { href: "/dashboard", label: "Panel de Control", icon: LayoutDashboard },
  { href: "/vacantes", label: "Vacantes", icon: Briefcase },
  { href: "/cargar", label: "Cargar CV", icon: Upload },
  { href: "/rankings", label: "Rankings", icon: Trophy },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [settingsOpen, setSettingsOpen] = useState(false)

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
          <div className="relative hidden max-w-md flex-1 items-center sm:flex">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar vacantes o candidatos..."
              className="pl-9"
              aria-label="Buscar"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label="Menú de usuario"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {usuarioActual.iniciales}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left leading-tight sm:block">
                  <p className="text-sm font-medium text-foreground">
                    {usuarioActual.nombres} {usuarioActual.apellidos}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {usuarioActual.rol}
                  </p>
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="leading-tight">
                    <p className="text-sm font-medium">
                      {usuarioActual.nombres} {usuarioActual.apellidos}
                    </p>
                    <p className="text-xs font-normal text-muted-foreground">
                      {usuarioActual.correo}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="size-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/")}>
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
            <DialogTitle>Configuración</DialogTitle>
            <DialogDescription>
              Ajustes de tu cuenta y preferencias de la plataforma.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Profile section */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="size-4 text-primary" />
                Perfil
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <span className="text-muted-foreground">Nombre</span>
                <span className="font-medium">{usuarioActual.nombres} {usuarioActual.apellidos}</span>
                <span className="text-muted-foreground">Correo</span>
                <span className="font-medium truncate">{usuarioActual.correo}</span>
                <span className="text-muted-foreground">Rol</span>
                <span className="font-medium capitalize">{usuarioActual.rol}</span>
                <span className="text-muted-foreground">Empresa</span>
                <span className="font-medium">{usuarioActual.empresa}</span>
              </div>
            </div>

            {/* Notifications section */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Bell className="size-4 text-primary" />
                Notificaciones
              </div>
              <p className="text-sm text-muted-foreground">
                Las notificaciones por correo se activan automáticamente al completar el análisis de CVs.
              </p>
            </div>

            {/* Security section */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Shield className="size-4 text-primary" />
                Seguridad
              </div>
              <p className="text-sm text-muted-foreground">
                La gestión avanzada de contraseñas y roles estará disponible en la versión completa del MVP.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setSettingsOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

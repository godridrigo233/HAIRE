"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Columns3,
  ArrowLeftRight,
  Download,
  ShieldCheck,
  Zap,
  BarChart3,
  FileText,
  Users,
  Sun,
  Moon,
} from "lucide-react"

import { Logo } from "@/components/haire/logo"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function LandingPage() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("haire_theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldBeDark = saved === "dark" || (!saved && prefersDark)
    setIsDark(shouldBeDark)
    if (shouldBeDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("haire_theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("haire_theme", "light")
    }
  }
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand/20">
      {/* Barra de Navegación Superior */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#caracteristicas" className="hover:text-foreground transition-colors">
              Características
            </a>
            <a href="#como-funciona" className="hover:text-foreground transition-colors">
              Cómo funciona
            </a>
            <a href="#beneficios" className="hover:text-foreground transition-colors">
              Beneficios
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              aria-label="Alternar tema claro/oscuro"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-xs font-semibold",
              )}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-brand text-brand-foreground hover:bg-brand/90 text-xs font-semibold shadow-xs",
              )}
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32">
        {/* Glow de fondo decorativo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-brand/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs font-medium text-brand">
            <Sparkles className="size-3.5" />
            <span>Plataforma ATS Potenciada por Inteligencia Artificial</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground text-balance leading-tight">
            Contrata al mejor talento en{" "}
            <span className="text-brand underline decoration-brand/30 underline-offset-8">
              minutos
            </span>
            , no en semanas.
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed text-pretty">
            HAIRE analiza y clasifica automáticamente currículums en PDF contra los
            requerimientos exactos de tu vacante. Puntuaciones objetivas, rankings
            inteligentes y pipeline visual para decisiones certeras.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full sm:w-auto bg-brand text-brand-foreground hover:bg-brand/90 gap-2 font-semibold shadow-md",
              )}
            >
              Empezar ahora gratis
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto font-medium",
              )}
            >
              Acceder a mi cuenta
            </Link>
          </div>

          {/* Tarjeta de Demostración Visual */}
          <div className="pt-12 mx-auto max-w-3xl">
            <Card className="border border-border/80 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-muted/40 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="size-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 font-mono text-[11px]">app.haire.pe / vacantes / lead-developer</span>
                </div>
                <Badge className="bg-brand/10 text-brand border-brand/20 text-[10px] shadow-none">
                  IA Activa
                </Badge>
              </div>
              <CardContent className="p-6 text-left space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-brand uppercase tracking-wider">Top Candidato Recomendado</span>
                    <h3 className="text-lg font-bold text-foreground">Carlos Mendoza — Senior Fullstack</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-brand tabular-nums">94%</span>
                    <span className="text-xs font-medium text-muted-foreground">Match IA</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic bg-muted/30 p-3 rounded-lg border border-border/40">
                  &quot;Cumple con los 4 requerimientos obligatorios (Next.js, FastAPI, PostgreSQL, Docker) y cuenta con 6 años de experiencia demostrada. Excelente perfil técnico.&quot;
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 text-[11px] font-medium">
                    <CheckCircle2 className="size-3" /> Next.js 16
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 text-[11px] font-medium">
                    <CheckCircle2 className="size-3" /> FastAPI
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 text-[11px] font-medium">
                    <CheckCircle2 className="size-3" /> PostgreSQL
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 text-[11px] font-medium">
                    <CheckCircle2 className="size-3" /> Docker
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Características Destacadas */}
      <section id="caracteristicas" className="py-20 border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Todo lo que tu equipo de selección necesita
            </h2>
            <p className="text-sm text-muted-foreground">
              Diseñado para reclutadores modernos que buscan velocidad y precisión sin sesgos manuales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border bg-card p-6 space-y-3 rounded-xl shadow-xs">
              <div className="size-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                <FileText className="size-5" />
              </div>
              <h3 className="font-semibold text-foreground text-base">Análisis de CV en PDF</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Extracción y procesamiento en segundo plano con IA. Carga múltiples currículums y recibe resultados sin bloqueos.
              </p>
            </Card>

            <Card className="border-border bg-card p-6 space-y-3 rounded-xl shadow-xs">
              <div className="size-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Columns3 className="size-5" />
              </div>
              <h3 className="font-semibold text-foreground text-base">Tablero Kanban Visual</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mueve candidatos entre etapas (Nuevo, En Revisión, Entrevista, Oferta, Contratado) con un solo clic.
              </p>
            </Card>

            <Card className="border-border bg-card p-6 space-y-3 rounded-xl shadow-xs">
              <div className="size-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <ArrowLeftRight className="size-5" />
              </div>
              <h3 className="font-semibold text-foreground text-base">Comparador Lado a Lado</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Selecciona y compara hasta 3 candidatos cara a cara para debatir en comité con datos estructurados.
              </p>
            </Card>

            <Card className="border-border bg-card p-6 space-y-3 rounded-xl shadow-xs">
              <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Download className="size-5" />
              </div>
              <h3 className="font-semibold text-foreground text-base">Exportación a CSV</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Descarga tus rankings de candidatos formateados listos para Excel o integración con tu ERP de nómina.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="py-20 border-t border-border/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Cómo funciona HAIRE
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Tres pasos simples para optimizar tu proceso de reclutamiento de principio a fin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center space-y-3 p-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand text-brand-foreground font-bold text-lg shadow-sm">
                1
              </div>
              <h4 className="font-semibold text-foreground text-base">Crea la vacante</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Define el puesto, años de experiencia requeridos y habilidades indispensables y opcionales.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 p-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand text-brand-foreground font-bold text-lg shadow-sm">
                2
              </div>
              <h4 className="font-semibold text-foreground text-base">Sube los CVs en PDF</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Arrastra los documentos en lote. La IA extrae el perfil y evalúa la compatibilidad sin sesgos.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 p-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand text-brand-foreground font-bold text-lg shadow-sm">
                3
              </div>
              <h4 className="font-semibold text-foreground text-base">Gestiona y Contrata</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Revisa el podio de recomendación, añade notas privadas y mueve a los postulantes por el pipeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 border-t border-border/60 bg-brand/5 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl font-bold text-foreground">
            Comienza a reclutar de forma inteligente hoy
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Únete a los equipos de selección que ahorran más de 15 horas por semana en lectura de currículums.
          </p>
          <div className="pt-2 flex justify-center">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-brand text-brand-foreground hover:bg-brand/90 font-semibold gap-2 shadow-md",
              )}
            >
              Crear cuenta gratis
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo />
            <span>— © 2026 HAIRE Inc. Todos los derechos reservados.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Registrarse
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastTipo = "success" | "error" | "info"

export interface ToastItem {
  id: string
  tipo: ToastTipo
  mensaje: string
}

interface ToastContextType {
  toast: (tipo: ToastTipo, mensaje: string) => void
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((tipo: ToastTipo, mensaje: string) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { id, tipo, mensaje }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-lg border px-4 py-3 shadow-xl transition-all duration-200 text-sm bg-card border-border backdrop-blur-sm",
              t.tipo === "success" && "border-emerald-500/40 shadow-emerald-500/5",
              t.tipo === "error" && "border-red-500/40 shadow-red-500/5",
              t.tipo === "info" && "border-blue-500/40 shadow-blue-500/5",
            )}
          >
            {t.tipo === "success" && <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-500" />}
            {t.tipo === "error" && <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-500" />}
            {t.tipo === "info" && <Info className="size-4 shrink-0 mt-0.5 text-blue-500" />}
            <span className="flex-1 text-foreground text-xs leading-relaxed">{t.mensaje}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-muted-foreground hover:text-foreground shrink-0 ml-1 p-0.5"
              aria-label="Cerrar notificación"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

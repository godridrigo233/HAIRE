import type { ReactNode } from "react"
import { AppShell } from "@/components/haire/app-shell"
import { ToastProvider } from "@/components/haire/toast"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
    </ToastProvider>
  )
}

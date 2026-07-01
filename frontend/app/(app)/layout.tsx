import type { ReactNode } from "react"
import { AppShell } from "@/components/haire/app-shell"

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}

// Manejo del token JWT y del usuario autenticado (client-side, localStorage).

const TOKEN_KEY = "haire_token"
const USER_KEY = "haire_user"

export interface UsuarioSesion {
  id_usuario: string
  nombres: string
  apellidos: string
  correo: string
  rol: string | null
}

export function guardarSesion(token: string, usuario: UsuarioSesion) {
  if (typeof window === "undefined") return
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(usuario))
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getUsuario(): UsuarioSesion | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UsuarioSesion
  } catch {
    return null
  }
}

export function cerrarSesion() {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function iniciales(u: UsuarioSesion): string {
  return `${u.nombres?.[0] ?? ""}${u.apellidos?.[0] ?? ""}`.toUpperCase() || "U"
}

// Datos simulados para la demo de Haire.
// Estructura alineada con el esquema de la base de datos (Supabase).

export type EstadoVacante = "activa" | "cerrada"

export interface Requerimiento {
  nombre: string
  obligatoria: boolean
}

export interface Vacante {
  id: string
  titulo: string
  descripcion: string
  experienciaMinima: number
  estado: EstadoVacante
  fechaCreacion: string // ISO
  requerimientos: Requerimiento[]
  candidatos: number
}

export interface HabilidadEvaluada {
  nombre: string
  cumple: boolean
  obligatoria: boolean
}

export interface Candidato {
  id: string
  vacanteId: string
  nombre: string
  correo: string
  telefono: string | null
  porcentaje: number
  esRecomendado: boolean
  justificacion: string
  // Habilidades requeridas por la vacante vs detectadas en el CV
  requeridas: HabilidadEvaluada[]
  // Habilidades detectadas que NO eran requisito
  adicionales: string[]
}

export const usuarioActual = {
  nombres: "Rodrigo",
  apellidos: "Gómez Fernández",
  correo: "rodrigo@haire.com",
  rol: "reclutador" as const,
  iniciales: "RG",
  empresa: "Haire Tech S.A.C.",
}

// Credenciales de la demo (login simulado)
export const CREDENCIALES_DEMO = {
  correo: "rodrigo@haire.com",
  password: "haire2026",
}

export const vacantes: Vacante[] = [
  {
    id: "vac-001",
    titulo: "Desarrollador Frontend Senior",
    descripcion:
      "Buscamos un desarrollador frontend con sólida experiencia en React y TypeScript para liderar el desarrollo de nuestra nueva plataforma SaaS. Trabajará junto al equipo de producto y diseño.",
    experienciaMinima: 4,
    estado: "activa",
    fechaCreacion: "2026-05-02",
    candidatos: 18,
    requerimientos: [
      { nombre: "React", obligatoria: true },
      { nombre: "TypeScript", obligatoria: true },
      { nombre: "JavaScript", obligatoria: true },
      { nombre: "Node.js", obligatoria: false },
      { nombre: "Git", obligatoria: false },
    ],
  },
  {
    id: "vac-002",
    titulo: "Ingeniero de Datos",
    descripcion:
      "Responsable del diseño y mantenimiento de pipelines de datos, modelado en PostgreSQL y despliegue en la nube. Colaboración estrecha con el área de analítica.",
    experienciaMinima: 3,
    estado: "activa",
    fechaCreacion: "2026-05-08",
    candidatos: 24,
    requerimientos: [
      { nombre: "Python", obligatoria: true },
      { nombre: "SQL", obligatoria: true },
      { nombre: "PostgreSQL", obligatoria: true },
      { nombre: "AWS", obligatoria: false },
      { nombre: "Docker", obligatoria: false },
    ],
  },
  {
    id: "vac-003",
    titulo: "Backend Developer (FastAPI)",
    descripcion:
      "Desarrollo de APIs REST de alto rendimiento con FastAPI, integración con bases de datos relacionales y despliegue en contenedores.",
    experienciaMinima: 2,
    estado: "activa",
    fechaCreacion: "2026-05-14",
    candidatos: 11,
    requerimientos: [
      { nombre: "Python", obligatoria: true },
      { nombre: "FastAPI", obligatoria: true },
      { nombre: "PostgreSQL", obligatoria: false },
      { nombre: "Docker", obligatoria: false },
    ],
  },
  {
    id: "vac-004",
    titulo: "Product Manager Técnico",
    descripcion:
      "Definición de roadmap, priorización de features y coordinación entre negocio e ingeniería. Se valora perfil técnico previo.",
    experienciaMinima: 5,
    estado: "cerrada",
    fechaCreacion: "2026-04-21",
    candidatos: 9,
    requerimientos: [
      { nombre: "Liderazgo", obligatoria: true },
      { nombre: "Comunicación", obligatoria: true },
      { nombre: "SQL", obligatoria: false },
    ],
  },
]

// Candidatos por vacante (evaluaciones). Ordenables por porcentaje.
export const candidatos: Candidato[] = [
  // ---- vac-001: Frontend Senior ----
  {
    id: "cand-101",
    vacanteId: "vac-001",
    nombre: "Lucía Fernández Mora",
    correo: "lucia.fernandez@gmail.com",
    telefono: "+34 612 448 902",
    porcentaje: 94,
    esRecomendado: true,
    justificacion:
      "Lucía cumple con todos los requisitos obligatorios de la vacante y supera ampliamente los años de experiencia mínima solicitados. Su dominio de React y TypeScript está respaldado por proyectos liderados en productos SaaS similares, y aporta experiencia complementaria en Node.js que facilitaría la colaboración full-stack. Es la candidata con mayor alineación técnica y de seniority del conjunto evaluado.",
    requeridas: [
      { nombre: "React", cumple: true, obligatoria: true },
      { nombre: "TypeScript", cumple: true, obligatoria: true },
      { nombre: "JavaScript", cumple: true, obligatoria: true },
      { nombre: "Node.js", cumple: true, obligatoria: false },
      { nombre: "Git", cumple: true, obligatoria: false },
    ],
    adicionales: ["Next.js", "Testing (Jest)", "Figma", "GraphQL"],
  },
  {
    id: "cand-102",
    vacanteId: "vac-001",
    nombre: "Marcos Delgado Ruiz",
    correo: "marcos.delgado@outlook.com",
    telefono: "+34 655 210 774",
    porcentaje: 82,
    esRecomendado: false,
    justificacion:
      "Marcos domina React y JavaScript, aunque su experiencia con TypeScript es más reciente. Cumple los años de experiencia requeridos y muestra un buen perfil frontend general.",
    requeridas: [
      { nombre: "React", cumple: true, obligatoria: true },
      { nombre: "TypeScript", cumple: true, obligatoria: true },
      { nombre: "JavaScript", cumple: true, obligatoria: true },
      { nombre: "Node.js", cumple: false, obligatoria: false },
      { nombre: "Git", cumple: true, obligatoria: false },
    ],
    adicionales: ["Vue.js", "Sass", "Webpack"],
  },
  {
    id: "cand-103",
    vacanteId: "vac-001",
    nombre: "Andrea Salazar Peña",
    correo: "andrea.salazar@gmail.com",
    telefono: "+51 987 334 120",
    porcentaje: 68,
    esRecomendado: false,
    justificacion:
      "Andrea tiene buenas bases en JavaScript y React, pero no se detecta experiencia sólida en TypeScript, un requisito obligatorio. Podría encajar en un rol de menor seniority.",
    requeridas: [
      { nombre: "React", cumple: true, obligatoria: true },
      { nombre: "TypeScript", cumple: false, obligatoria: true },
      { nombre: "JavaScript", cumple: true, obligatoria: true },
      { nombre: "Node.js", cumple: false, obligatoria: false },
      { nombre: "Git", cumple: true, obligatoria: false },
    ],
    adicionales: ["HTML/CSS", "Bootstrap"],
  },
  {
    id: "cand-104",
    vacanteId: "vac-001",
    nombre: "Diego Ramírez Ortiz",
    correo: "diego.ramirez@gmail.com",
    telefono: null,
    porcentaje: 41,
    esRecomendado: false,
    justificacion:
      "El perfil de Diego está orientado a backend y no cumple varios requisitos obligatorios de frontend. La compatibilidad con la vacante es baja.",
    requeridas: [
      { nombre: "React", cumple: false, obligatoria: true },
      { nombre: "TypeScript", cumple: false, obligatoria: true },
      { nombre: "JavaScript", cumple: true, obligatoria: true },
      { nombre: "Node.js", cumple: true, obligatoria: false },
      { nombre: "Git", cumple: true, obligatoria: false },
    ],
    adicionales: ["Java", "Spring Boot", "MySQL"],
  },
  // ---- vac-002: Ingeniero de Datos ----
  {
    id: "cand-201",
    vacanteId: "vac-002",
    nombre: "Valeria Chávez Núñez",
    correo: "valeria.chavez@gmail.com",
    telefono: "+51 954 118 220",
    porcentaje: 91,
    esRecomendado: true,
    justificacion:
      "Valeria destaca por su dominio de Python, SQL y PostgreSQL, todos requisitos obligatorios de la vacante, además de experiencia comprobada en AWS y Docker. Ha diseñado pipelines de datos en producción y supera la experiencia mínima requerida, lo que la posiciona como la candidata más adecuada.",
    requeridas: [
      { nombre: "Python", cumple: true, obligatoria: true },
      { nombre: "SQL", cumple: true, obligatoria: true },
      { nombre: "PostgreSQL", cumple: true, obligatoria: true },
      { nombre: "AWS", cumple: true, obligatoria: false },
      { nombre: "Docker", cumple: true, obligatoria: false },
    ],
    adicionales: ["Airflow", "Spark", "dbt", "Terraform"],
  },
  {
    id: "cand-202",
    vacanteId: "vac-002",
    nombre: "Sebastián Torres Vega",
    correo: "sebastian.torres@hotmail.com",
    telefono: "+51 998 776 554",
    porcentaje: 76,
    esRecomendado: false,
    justificacion:
      "Sebastián cumple con Python y SQL, y tiene nociones de PostgreSQL. Le falta experiencia en herramientas de nube, aunque su base analítica es sólida.",
    requeridas: [
      { nombre: "Python", cumple: true, obligatoria: true },
      { nombre: "SQL", cumple: true, obligatoria: true },
      { nombre: "PostgreSQL", cumple: true, obligatoria: true },
      { nombre: "AWS", cumple: false, obligatoria: false },
      { nombre: "Docker", cumple: false, obligatoria: false },
    ],
    adicionales: ["Pandas", "Power BI"],
  },
  {
    id: "cand-203",
    vacanteId: "vac-002",
    nombre: "Camila Rojas Medina",
    correo: "camila.rojas@gmail.com",
    telefono: "+51 921 445 331",
    porcentaje: 58,
    esRecomendado: false,
    justificacion:
      "Camila maneja SQL correctamente pero su experiencia en Python es limitada. Cumple parcialmente los requisitos obligatorios.",
    requeridas: [
      { nombre: "Python", cumple: false, obligatoria: true },
      { nombre: "SQL", cumple: true, obligatoria: true },
      { nombre: "PostgreSQL", cumple: true, obligatoria: true },
      { nombre: "AWS", cumple: false, obligatoria: false },
      { nombre: "Docker", cumple: false, obligatoria: false },
    ],
    adicionales: ["Excel avanzado", "Tableau"],
  },
  // ---- vac-003: Backend FastAPI ----
  {
    id: "cand-301",
    vacanteId: "vac-003",
    nombre: "Javier Núñez Campos",
    correo: "javier.nunez@gmail.com",
    telefono: "+34 677 902 118",
    porcentaje: 88,
    esRecomendado: true,
    justificacion:
      "Javier cumple los requisitos obligatorios de Python y FastAPI con experiencia directa en APIs de alto rendimiento, y aporta conocimientos de PostgreSQL y Docker. Es el candidato con mejor ajuste técnico para el rol de backend.",
    requeridas: [
      { nombre: "Python", cumple: true, obligatoria: true },
      { nombre: "FastAPI", cumple: true, obligatoria: true },
      { nombre: "PostgreSQL", cumple: true, obligatoria: false },
      { nombre: "Docker", cumple: true, obligatoria: false },
    ],
    adicionales: ["Redis", "Celery", "pytest"],
  },
  {
    id: "cand-302",
    vacanteId: "vac-003",
    nombre: "Paula Herrera Lima",
    correo: "paula.herrera@gmail.com",
    telefono: null,
    porcentaje: 72,
    esRecomendado: false,
    justificacion:
      "Paula domina Python y tiene experiencia con FastAPI en proyectos personales. Le faltaría rodaje en despliegue con contenedores.",
    requeridas: [
      { nombre: "Python", cumple: true, obligatoria: true },
      { nombre: "FastAPI", cumple: true, obligatoria: true },
      { nombre: "PostgreSQL", cumple: true, obligatoria: false },
      { nombre: "Docker", cumple: false, obligatoria: false },
    ],
    adicionales: ["Flask", "MongoDB"],
  },
  {
    id: "cand-303",
    vacanteId: "vac-003",
    nombre: "Tomás Aguilar Reyes",
    correo: "tomas.aguilar@outlook.com",
    telefono: "+51 933 221 007",
    porcentaje: 44,
    esRecomendado: false,
    justificacion:
      "Tomás no cuenta con experiencia en FastAPI, requisito obligatorio, y su perfil se orienta más a scripting general. Compatibilidad baja.",
    requeridas: [
      { nombre: "Python", cumple: true, obligatoria: true },
      { nombre: "FastAPI", cumple: false, obligatoria: true },
      { nombre: "PostgreSQL", cumple: false, obligatoria: false },
      { nombre: "Docker", cumple: false, obligatoria: false },
    ],
    adicionales: ["Bash", "Automatización"],
  },
]

// ---- Helpers ----

export function getVacante(id: string): Vacante | undefined {
  return vacantes.find((v) => v.id === id)
}

export function getCandidatosDeVacante(vacanteId: string): Candidato[] {
  return candidatos
    .filter((c) => c.vacanteId === vacanteId)
    .sort((a, b) => b.porcentaje - a.porcentaje)
}

export function getCandidato(id: string): Candidato | undefined {
  return candidatos.find((c) => c.id === id)
}

export function getRecomendado(vacanteId: string): Candidato | undefined {
  const lista = getCandidatosDeVacante(vacanteId)
  return lista.find((c) => c.esRecomendado) ?? lista[0]
}

export const totalVacantesActivas = vacantes.filter(
  (v) => v.estado === "activa",
).length

export const totalPostulantes = vacantes.reduce(
  (acc, v) => acc + v.candidatos,
  0,
)

export function nivelColor(porcentaje: number): "success" | "warning" | "destructive" {
  if (porcentaje > 80) return "success"
  if (porcentaje >= 50) return "warning"
  return "destructive"
}

export function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

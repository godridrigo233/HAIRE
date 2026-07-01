# Haire

Plataforma de reclutamiento potenciada por IA: un reclutador crea una vacante
con requisitos, sube CVs en PDF, y un LLM (Groq) evalúa cada candidato contra
la vacante y genera un ranking con recomendación.

## Estructura del repo

```
haire/
├── frontend/   # Next.js 16 + React 19 + TailwindCSS 4 + shadcn/ui
├── backend/    # Vacío por ahora — próxima sesión: API en FastAPI (Python)
└── docs/       # Documentación de referencia
```

### `frontend/`

Funcional visualmente: las 8 páginas (login, dashboard, vacantes, vacantes/nueva,
vacantes/[id], cargar, rankings, candidatos/[id]) están armadas y navegables,
pero corren sobre datos simulados (`frontend/lib/mock-data.ts`). Todavía no hay
conexión a ningún backend ni autenticación real — eso es el siguiente paso.

### `backend/`

Vacío. Se construirá con FastAPI en la próxima sesión: subida de CVs,
extracción de texto de PDF, llamadas a Groq para scoring, y persistencia en
Supabase. Ver `docs/referencia-backend-viejo.md` para la lógica del prototipo
anterior en C# que debe reimplementarse.

## Levantar el frontend en local

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:3000`. Credenciales de la demo (login simulado) en
`frontend/lib/mock-data.ts`.

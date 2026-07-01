# Backend Haire — FastAPI

API del MVP de Haire (Bloque 2). Expone auth, gestión de vacantes, carga de CVs en
PDF y análisis de compatibilidad con IA (Groq), sobre la base de datos de Supabase.

## Requisitos

- Python 3.11 recomendado (funciona con 3.9+).
- Acceso al proyecto de Supabase (URL, service_role key y connection string de la BD).
- Una API key de Groq.

## Puesta en marcha (local)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # y rellenar los valores reales
uvicorn app.main:app --reload --port 8000
```

- Docs interactivas (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/

## Variables de entorno

Ver `.env.example`. Resumen:

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión directa a Postgres de Supabase (SQLAlchemy) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Subir PDFs al bucket `cv` (Storage) |
| `SUPABASE_BUCKET` | Nombre del bucket (por defecto `cv`) |
| `GROQ_API_KEY` / `GROQ_MODEL` | Análisis con IA |
| `JWT_SECRET` / `JWT_ALGORITHM` / `JWT_EXPIRE_MINUTES` | Firma de tokens |
| `AUTH_DEMO_PASSWORD` | Password compartida de login (interina, ver abajo) |
| `CORS_ORIGINS` | Orígenes del frontend permitidos |

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET`  | `/` | no | Health check |
| `POST` | `/auth/login` | no | Login → JWT |
| `POST` | `/vacantes` | sí | Crear vacante (con requerimientos) |
| `GET`  | `/vacantes` | sí | Listar vacantes del usuario |
| `GET`  | `/vacantes/{id}` | sí | Detalle de una vacante |
| `POST` | `/cv/upload` | sí | Subir un PDF (multipart) → extrae texto + Storage |
| `POST` | `/cv/{id}/analizar` | sí | Analiza el CV con Groq y persiste la evaluación |
| `GET`  | `/cv/{id}/scoring` | sí | Score determinista (sin IA) CV vs vacante |

Auth: enviar `Authorization: Bearer <token>` en los endpoints protegidos.

## Flujo del checkpoint hora 20 (por Postman/curl)

1. `POST /auth/login` con un correo que exista en `usuarios` + `AUTH_DEMO_PASSWORD`.
2. `POST /vacantes` con título, experiencia y requerimientos.
3. `POST /cv/upload` (form-data: `id_vacante`, `archivo`=PDF).
4. `POST /cv/{id_curriculum}/analizar` → JSON con habilidades detectadas + % real de Groq.

## Notas / decisiones (leer)

- **Login interino:** la tabla `usuarios` del esquema **no tiene columna de password**.
  Por eso el login valida que el correo exista en `usuarios` y que la password coincida
  con `AUTH_DEMO_PASSWORD`, y emite un JWT real. Para auth por-usuario real hace falta
  o una columna `password_hash` (cambio de esquema, requiere aprobación) o usar Supabase
  Auth. Está aislado en `app/security.py` y `app/routers/auth.py`.
- **Claves primarias:** los modelos asumen PKs enteras autogeneradas (IDENTITY/serial).
  Si en Supabase fueran UUID, ajustar los tipos en `app/models.py`.
- **Catálogo de habilidades:** al crear vacantes y al analizar CVs, las habilidades se
  buscan por nombre (case-insensitive) y se crean en `habilidades` si no existen
  (get-or-create), para mantener válidas las FKs de las tablas puente.
- **Storage:** el bucket `cv` es privado; `archivo_pdf_url` guarda una URL firmada
  temporal (7 días) en vez de una URL pública.
- **Concurrencia (10-30 CVs en paralelo):** el análisis actual es de a un CV por request.
  El procesamiento en lote con semáforo (rate limit de Groq) es parte del Bloque 3.

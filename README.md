# HAIRE — Reclutamiento Inteligente con IA

Plataforma integral de selección de personal impulsada por Inteligencia Artificial. Permite a los reclutadores gestionar vacantes, cargar currículums (CVs) en formato PDF y evaluarlos automáticamente mediante modelos de lenguaje (LLM en Groq), generando un ranking de compatibilidad con justificaciones técnicas detalladas y detección de habilidades.

---

## 🏗️ Arquitectura y Tecnologías

* **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Radix UI / Lucide Icons.
* **Backend**: FastAPI (Python 3.11+) + SQLAlchemy 2.0 + Pydantic v2 + Psycopg 3 + PyPDF + JWT Auth.
* **Base de Datos & Storage**: PostgreSQL en Supabase (Transaction Pooler) + Bucket privado en Supabase Storage.
* **Inteligencia Artificial**: Groq Cloud LPU con soporte y autodescubrimiento dinámico de modelos de alto rendimiento (`llama-3.3-70b-versatile`, `openai/gpt-oss-120b`, `qwen3.6-27b`).

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu computadora:

* **Python 3.10 o superior** (verificar con `python --version` o `py --version`)
* **Node.js 18 o superior** y **npm** (verificar con `node -v` y `npm -v`)
* **Git** (verificar con `git --version`)

---

## 🚀 Guía de Instalación y Ejecución en Local

### Paso 1: Clonar el Repositorio
Abre tu terminal y ejecuta:

```bash
git clone https://github.com/godridrigo233/HAIRE.git
cd HAIRE
```

---

### Paso 2: Configurar y Arrancar el Backend (Terminal 1)

1. Entra al directorio del backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias de Python:
   ```bash
   pip install -r requirements.txt
   ```

3. Crea el archivo de configuración `.env` a partir del archivo de ejemplo:
   * **En Windows (PowerShell / CMD):**
     ```bash
     copy .env.example .env
     ```
   * **En Linux / macOS:**
     ```bash
     cp .env.example .env
     ```

4. *(Opcional)* Si deseas habilitar la IA en local, abre el archivo `backend/.env` y coloca tu API Key de Groq en la variable `GROQ_API_KEY`:
   ```env
   GROQ_API_KEY=gsk_tu_clave_de_groq_aqui
   ```
   *(Obtén una clave gratuita en [console.groq.com/keys](https://console.groq.com/keys))*.

5. Inicia el servidor backend con Uvicorn:
   * **En Windows:**
     ```bash
     py -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
     ```
   * **En Linux / macOS:**
     ```bash
     python3 -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
     ```

> ✅ El backend estará disponible en: **`http://127.0.0.1:8000`** (Documentación interactiva Swagger en `http://127.0.0.1:8000/docs`).

---

### Paso 3: Configurar y Arrancar el Frontend (Terminal 2)

1. Abre una **segunda terminal** y navega al directorio del frontend:
   ```bash
   cd frontend
   ```

2. Instala los paquetes de Node.js:
   ```bash
   npm install
   ```

3. Asegúrate de que el archivo `.env.local` apunte al backend local:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```

4. Inicia el servidor de desarrollo de Next.js:
   ```bash
   npm run dev
   ```

> ✅ El frontend estará listo y accesible en: **`http://localhost:3000`**.

---

## 🔑 Credenciales de Prueba (Demo)

Para ingresar al sistema en `http://localhost:3000`:

* **Correo electrónico:** `rodrigo@haire.com`
* **Contraseña:** `haire2026`

*(También puedes crear un nuevo usuario desde el botón **"¿No tienes cuenta? Regístrate"**).*

---

## 🧪 Flujo de Pruebas y Uso del Sistema

1. **Panel de Control (Dashboard)**: Visualiza el estado global de procesos, vacantes activas y número de candidatos procesados.
2. **Crear Vacantes**:
   * Dirígete a **Vacantes** > **Nueva Vacante**.
   * Define el título del puesto, años de experiencia mínima y las habilidades técnicas requeridas (marcándolas como obligatorias o deseables).
3. **Carga y Evaluación de CVs con IA**:
   * Ve a **Cargar CV** y selecciona la vacante de destino.
   * Arrastra uno o varios archivos PDF (máximo 10MB por documento).
   * Haz clic en **"Iniciar Análisis de IA"**. El sistema validará que el archivo sea un CV real, extraerá texto y habilidades, y calculará la compatibilidad con el LLM.
4. **Rankings y Decisiones**:
   * Consulta el listado de candidatos ordenado por porcentaje de compatibilidad.
   * Visualiza al candidato con el sello **"Recomendado por la IA"**.
   * Haz clic en **"Ver detalle"** para revisar la justificación cualitativa de la IA, los datos de contacto extraídos y la comparativa de habilidades requeridas vs cumplidas.

---

## 🌐 Despliegue en la Nube (Producción)

* **Frontend**: [https://haire-tau.vercel.app](https://haire-tau.vercel.app) (Desplegado en Vercel)
* **Backend**: `https://haire-j0rx.onrender.com` (Desplegado en Render)
* **Base de Datos & Storage**: Supabase (AWS sa-east-1)

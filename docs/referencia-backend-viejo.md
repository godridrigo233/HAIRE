# Referencia: backend viejo en C# (.NET 8)

> Este documento es solo referencia histórica. El código C# fue eliminado del
> repo al migrar a un backend en Python (FastAPI). Sirve como especificación
> de qué debe reimplementar el nuevo backend, no como código a traducir línea
> por línea.

## Origen

- Carpeta: `backend/` (ASP.NET Core 8, proyecto `cubano.csproj`, namespace `CUBANO.Controllers`)
- Archivos: `Program.cs`, `Controllers/CvController.cs`, `appsettings.json`

## Librerías usadas

- `supabase-csharp` (1.1.1) — cliente de Supabase (Storage)
- `UglyToad.PdfPig` (0.1.9) — extracción de texto de archivos PDF
- ASP.NET Core (Microsoft.AspNetCore.Mvc) — framework web / controllers

## Endpoint existente

`POST /api/cv/upload`

Recibe un único archivo (`IFormFile archivoCv`, multipart/form-data).

## Paso a paso de la lógica (`CvController.UploadCvPdf`)

1. **Validaciones de negocio** antes de procesar nada:
   - Rechaza si no llegó archivo o el archivo está vacío.
   - Rechaza si `ContentType` no es `application/pdf`.
   - Rechaza si el tamaño supera 5MB.
2. **Carga a memoria**: copia el `IFormFile` a un `MemoryStream` y lo convierte a `byte[]`.
3. **Extracción de texto del PDF** (método auxiliar `ExtraerTextoDePdf`):
   - Abre el PDF en memoria con `PdfDocument.Open(pdfBytes)` (PdfPig).
   - Itera cada página (`documento.GetPages()`) y concatena `pagina.Text` en un `StringBuilder`.
   - Normaliza el texto final: colapsa todos los espacios/saltos de línea con una regex (`\s+` → un solo espacio) y hace `Trim()`. El objetivo declarado en el comentario original es dejar el texto "limpio" para que un LLM lo lea mejor después.
4. **Subida a Supabase Storage**:
   - Genera un nombre único: `{GUID}-{nombre original del archivo}`.
   - Sube los bytes al bucket `cv` (`_supabaseClient.Storage.From("cv").Upload(...)`).
   - Obtiene la URL pública del archivo subido (`GetPublicUrl`).
5. **Respuesta de éxito** (200 OK): JSON con `mensaje`, `urlStorage` (URL pública del PDF) y `texto` (solo los primeros 150 caracteres del texto extraído, como muestra de verificación).
6. **Manejo de errores**: cualquier excepción no controlada se captura y devuelve como 500 con `error` y `detalle` (el mensaje de la excepción).

## Configuración / arranque (`Program.cs`)

- Lee `Supabase:Url` y `Supabase:Key` desde `appsettings.json`.
- Crea un `Supabase.Client` como singleton inyectado en los controllers (`AddSingleton`).
- Habilita CORS permisivo (cualquier origen/header/método) para que el frontend pueda llamar a la API en desarrollo.
- Registra los controllers (`AddControllers` + `MapControllers`).
- **Bug conocido**: el test de conexión a Supabase (`InitializeAsync` + log de éxito/error) está escrito *después* de `app.Run()`, que es bloqueante — ese bloque de código nunca se ejecuta. El nuevo backend debe hacer esta verificación de conexión antes de levantar el servidor, no después.

## Qué debe reimplementar el nuevo backend (Python / FastAPI)

- Endpoint equivalente para subir un CV en PDF (validando tipo y tamaño de archivo).
- Extracción de texto del PDF en memoria (equivalente a PdfPig: por ejemplo `pypdf`, `pdfplumber` o `PyMuPDF`).
- Normalización del texto extraído (colapsar whitespace) antes de pasarlo al LLM (Groq).
- Subida del PDF original a Supabase Storage (bucket `cv`) y obtención de la URL pública.
- Las keys de Supabase deben leerse desde variables de entorno (`.env`), no quedar hardcodeadas — ver hallazgo de seguridad en `haire_audit_report.md` (`appsettings.json` tenía la anon key commiteada al repo).

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Supabase;
using Supabase.Storage; 
using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using UglyToad.PdfPig;

namespace CUBANO.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CvController : ControllerBase
    {
        private readonly Client _supabaseClient;

        // Recibimos la conexión de Supabase que configuramos en Program.cs
        public CvController(Client supabaseClient)
        {
            _supabaseClient = supabaseClient;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadCvPdf(IFormFile archivoCv)
        {
            // === VALIDACIONES DE NEGOCIO ===
            if (archivoCv == null || archivoCv.Length == 0)
                return BadRequest(new { error = "No se detectó ningún archivo." });

            if (archivoCv.ContentType != "application/pdf")
                return BadRequest(new { error = "Solo se aceptan archivos PDF." });

            if (archivoCv.Length > 5 * 1024 * 1024)
                return BadRequest(new { error = "El archivo supera el límite de 5MB." });

            try
            {
                // 1. Pasar el archivo a la memoria RAM
                using var memoryStream = new MemoryStream();
                await archivoCv.CopyToAsync(memoryStream);
                byte[] fileBytes = memoryStream.ToArray();

                // 2. Extraer el texto del PDF
                string textoExtraido = ExtraerTextoDePdf(fileBytes);

                // 3. Subir el archivo físico a Supabase Storage (al bucket 'cv')
                var nombreUnico = $"{Guid.NewGuid()}-{archivoCv.FileName}";
                await _supabaseClient.Storage.From("cv").Upload(fileBytes, nombreUnico);
                var urlPublica = _supabaseClient.Storage.From("cv").GetPublicUrl(nombreUnico);

                // 4. Devolver la respuesta de éxito
                return Ok(new 
                { 
                    mensaje = "Archivo procesado y subido correctamente.",
                    urlStorage = urlPublica,
                    // Mostramos solo los primeros 150 caracteres para comprobar que extrajo bien
                    texto = textoExtraido.Substring(0, Math.Min(textoExtraido.Length, 150)) + "..." 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error en el servidor", detalle = ex.Message });
            }
        }

        // === MÉTODO AUXILIAR DE EXTRACCIÓN ===
        private string ExtraerTextoDePdf(byte[] pdfBytes)
        {
            StringBuilder textoCompleto = new StringBuilder();
            
            using (PdfDocument documento = PdfDocument.Open(pdfBytes))
            {
                foreach (var pagina in documento.GetPages())
                {
                    textoCompleto.AppendLine(pagina.Text);
                }
            }
            
            // Limpiar saltos de línea para que la IA lo lea mejor después
            string textoLimpio = textoCompleto.ToString();
            textoLimpio = Regex.Replace(textoLimpio, @"\s+", " ");
            
            return textoLimpio.Trim();
        }
    }
}
using Supabase;

var builder = WebApplication.CreateBuilder(args);

// 1. Leer las llaves de Supabase desde appsettings.json
var supabaseUrl = builder.Configuration["Supabase:Url"];
var supabaseKey = builder.Configuration["Supabase:Key"];
var options = new SupabaseOptions { AutoConnectRealtime = true };

// 2. Inyectar Supabase para que esté disponible en todo el proyecto
builder.Services.AddSingleton(provider => new Client(supabaseUrl, supabaseKey, options));

// 3. Habilitar los Controladores
builder.Services.AddControllers();

// 4. Configurar CORS (VITAL para conectar con React)
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirReact", policy =>
    {
        policy.AllowAnyOrigin()   // Permite que cualquier frontend se conecte (ideal para desarrollo)
              .AllowAnyHeader()   // Permite enviar archivos
              .AllowAnyMethod();  // Permite POST, GET, etc.
    });
});

var app = builder.Build();

// 5. Activar CORS y mapear las rutas de la API
app.UseCors("PermitirReact");
app.MapControllers();

app.Run();
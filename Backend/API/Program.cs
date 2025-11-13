using API.DB;
using API.DB.DAOs;
using Microsoft.OpenApi.Models;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configuração do Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "API de Gerenciamento - ASMTasks",
        Version = "v1",
        Description = @"
Esta API gerencia entidades internas do sistema.

### Recursos disponíveis:
- **Cargos:** definição de funções/posições dentro da organização.
- **Colaboradores:** gerenciamento de usuários/funcionários.
- **Etapas:** controle de fases de desenvolvimento.
- **Prioridades:** definição de níveis de prioridade.
- **Setores:** organização de departamentos e responsáveis.
- **Clientes:** gerenciamento de clientes.

### Funcionalidades gerais:
- Criação (`POST`)
- Atualização (`PUT`)
- Inativação (`DELETE`)
- Reativação (`PUT /reativar`)
- Consulta (`GET`)
        "
    });

    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
        c.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
});

// Configurações gerais
builder.Services.AddControllers();

// Configura conexão
Environment.SetEnvironmentVariable("STRING_CONEXAO", builder.Configuration["StringConexao"]);

DBContext dbContext = new DBContext();
builder.Services.AddSingleton(dbContext);

builder.Services.AddScoped<EtapasDAO>();
builder.Services.AddScoped<PrioridadesDAO>();
builder.Services.AddScoped<SetoresDAO>();
builder.Services.AddScoped<CargosDAO>();
builder.Services.AddScoped<ColaboradoresDAO>();
builder.Services.AddScoped<ClientesDAO>();

var app = builder.Build();

// Swagger UI
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "API de Gerenciamento v1");
    c.RoutePrefix = "";
    c.DocumentTitle = "API de Gerenciamento ASMTasks - v1";
});

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
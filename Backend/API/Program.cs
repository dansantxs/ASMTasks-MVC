using API.DB;
using API.DB.DAOs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Reflection;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "API de Gerenciamento - ASMTasks",
        Version = "v1",
        Description = @"
Esta API gerencia entidades internas do sistema.

### Recursos disponiveis:
- **Cargos:** definicao de funcoes/posicoes dentro da organizacao.
- **Colaboradores:** gerenciamento de usuarios/funcionarios.
- **Etapas:** controle de fases de desenvolvimento.
- **Prioridades:** definicao de niveis de prioridade.
- **Setores:** organizacao de departamentos e responsaveis.
- **Clientes:** gerenciamento de clientes.
- **Atendimentos:** agenda de atendimentos com validacao de conflito de horario.

### Funcionalidades gerais:
- Criacao (`POST`)
- Atualizacao (`PUT`)
- Inativacao (`DELETE`)
- Reativacao (`PUT /reativar`)
- Consulta (`GET`)
        "
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Informe o token JWT no formato: Bearer {token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
        c.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
});

builder.Services.AddControllers();

Environment.SetEnvironmentVariable("STRING_CONEXAO", builder.Configuration["StringConexao"]);

var jwtKey = builder.Configuration["Jwt:Key"] ?? "ASMTasks.Jwt.Key.AlterarEmProducao.2026";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ASMTasks";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ASMTasks.Frontend";
var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.Zero
        };
    });

DBContext dbContext = new DBContext();
builder.Services.AddSingleton(dbContext);

builder.Services.AddScoped<EtapasDAO>();
builder.Services.AddScoped<PrioridadesDAO>();
builder.Services.AddScoped<SetoresDAO>();
builder.Services.AddScoped<CargosDAO>();
builder.Services.AddScoped<ColaboradoresDAO>();
builder.Services.AddScoped<ClientesDAO>();
builder.Services.AddScoped<AtendimentosDAO>();
builder.Services.AddScoped<UsuariosDAO>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "API de Gerenciamento v1");
    c.RoutePrefix = "";
    c.DocumentTitle = "API de Gerenciamento ASMTasks - v1";
});

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

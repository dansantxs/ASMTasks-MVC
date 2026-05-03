using API.DB;
using API.DB.DAOs;
using API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Reflection;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

var corsOrigens = builder.Configuration["CorsOrigens"]
    ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontend", politica =>
    {
        politica.WithOrigins(corsOrigens)
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

### Recursos disponíveis:
- **Cargos:** definição de funções/posições dentro da organização.
- **Colaboradores:** gerenciamento de usuários/funcionários.
- **Etapas:** controle de fases de desenvolvimento.
- **Prioridades:** definição de níveis de prioridade.
- **Setores:** organização de departamentos e responsáveis.
- **Clientes:** gerenciamento de clientes.
- **Atendimentos:** agenda de atendimentos com validação de conflito de horário.
- **Projetos:** cadastro de projetos com tarefas e dados de atribuição futura.

### Funcionalidades gerais:
- Criação (`POST`)
- Atualização (`PUT`)
- Inativação (`DELETE`)
- Reativação (`PUT /reativar`)
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

    var nomeArquivoXml = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var caminhoXml = Path.Combine(AppContext.BaseDirectory, nomeArquivoXml);
    if (File.Exists(caminhoXml))
        c.IncludeXmlComments(caminhoXml, includeControllerXmlComments: true);
});

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("login", limiterOptions =>
    {
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.PermitLimit = 10;
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 0;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

builder.Services.AddControllers();

var stringConexao = builder.Configuration["StringConexao"];
if (string.IsNullOrWhiteSpace(stringConexao))
    throw new InvalidOperationException(
        "StringConexao não configurada. Use 'dotnet user-secrets' em dev ou a variável de ambiente StringConexao em produção.");

Environment.SetEnvironmentVariable("STRING_CONEXAO", stringConexao);

var chaveJwt = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(chaveJwt))
    throw new InvalidOperationException(
        "Jwt:Key não configurada. Use 'dotnet user-secrets' em dev ou a variável de ambiente Jwt__Key em produção.");

var emissorJwt = builder.Configuration["Jwt:Issuer"] ?? "ASMTasks";
var audienciaJwt = builder.Configuration["Jwt:Audience"] ?? "ASMTasks.Frontend";
var chaveBytes = Encoding.UTF8.GetBytes(chaveJwt);

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
            ValidIssuer = emissorJwt,
            ValidAudience = audienciaJwt,
            IssuerSigningKey = new SymmetricSecurityKey(chaveBytes),
            ClockSkew = TimeSpan.Zero
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var cookie = context.Request.Cookies["asm_jwt"];
                if (!string.IsNullOrEmpty(cookie))
                    context.Token = cookie;
                return Task.CompletedTask;
            }
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
builder.Services.AddScoped<ProjetosDAO>();
builder.Services.AddScoped<UsuariosDAO>();
builder.Services.AddScoped<NiveisAcessoDAO>();
builder.Services.AddScoped<NotificacoesDAO>();
builder.Services.AddScoped<AtendimentoNotificacaoProcessor>();
builder.Services.AddHostedService<AtendimentoNotificacaoBackgroundService>();

var app = builder.Build();

app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("X-Permitted-Cross-Domain-Policies", "none");
    context.Response.Headers.Append("Content-Security-Policy",
        "default-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'");
    if (!app.Environment.IsDevelopment())
        context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    await next();
});

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "API de Gerenciamento v1");
    c.RoutePrefix = "";
    c.DocumentTitle = "API de Gerenciamento ASMTasks - v1";
});

app.UseCors("PermitirFrontend");

app.UseRateLimiter();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

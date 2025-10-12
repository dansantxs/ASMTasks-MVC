using API.DAOs;
using Microsoft.OpenApi.Models;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// Adiciona o serviço de CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000") // endereço do seu frontend
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Gerenciamento da API...",
        Version = "v1",
        Description = $@"<h3>Título <b>da API</b></h3>
                                      <p>
                                          Alguma descrição....
                                      </p>",
        Contact = new OpenApiContact
        {
            Name = "Suporte Unoeste",
            Email = string.Empty,
            Url = new Uri("https://www.unoeste.br"),
        },
    });

    // Set the comments path for the Swagger JSON and UI.
    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));
});

// Add services to the container.
builder.Services.AddControllers();

// Acessando o valor diretamente pelo builder.Configuration
Environment.SetEnvironmentVariable("STRING_CONEXAO", builder.Configuration["StringConexao"]);

DbContext dbContext = new DbContext();
builder.Services.AddSingleton(dbContext);

builder.Services.AddScoped<SetoresDAO>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
    c.RoutePrefix = ""; //habilitar a página inicial da API ser a doc.
    c.DocumentTitle = "Gerenciamento de Produtos - API V1";
});

// Usa o CORS (aplica a política "AllowFrontend")
app.UseCors("AllowFrontend");

// Configure the HTTP request pipeline.

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();

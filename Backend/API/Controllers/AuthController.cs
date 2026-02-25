using API.DB;
using API.DTOs.Auth;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly DBContext _dbContext;
        private readonly IConfiguration _configuration;

        public AuthController(DBContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _configuration = configuration;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var usuario = await Usuario.AutenticarAsync(_dbContext, request.Login, request.Senha);
            if (usuario == null)
                return Unauthorized(new { erro = "Login ou senha invalidos." });

            var jwtKey = _configuration["Jwt:Key"] ?? "ASMTasks.Jwt.Key.AlterarEmProducao.2026";
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? "ASMTasks";
            var jwtAudience = _configuration["Jwt:Audience"] ?? "ASMTasks.Frontend";
            var expirationMinutes = int.TryParse(_configuration["Jwt:ExpirationMinutes"], out var parsedExp) ? parsedExp : 120;

            var expiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes);
            var token = GerarToken(usuario, jwtKey, jwtIssuer, jwtAudience, expiresAt);

            return Ok(new LoginResponse
            {
                Token = token,
                ExpiraEm = expiresAt,
                UsuarioId = usuario.Id,
                ColaboradorId = usuario.ColaboradorId,
                ColaboradorNome = usuario.NomeColaborador,
                NivelAcesso = usuario.NivelAcesso
            });
        }

        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Me()
        {
            var usuarioIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(usuarioIdClaim, out var usuarioId))
                return Unauthorized(new { erro = "Token invalido." });

            var usuario = await Usuario.ObterPorIdAsync(_dbContext, usuarioId);
            if (usuario == null || !usuario.Ativo)
                return Unauthorized(new { erro = "Usuario invalido." });

            return Ok(new
            {
                usuarioId = usuario.Id,
                colaboradorId = usuario.ColaboradorId,
                colaboradorNome = usuario.NomeColaborador,
                login = usuario.Login,
                nivelAcesso = usuario.NivelAcesso
            });
        }

        [HttpPut("alterar-senha")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaRequest request)
        {
            var usuarioIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(usuarioIdClaim, out var usuarioId))
                return Unauthorized(new { erro = "Token invalido." });

            try
            {
                await Usuario.AlterarSenhaAsync(_dbContext, usuarioId, request.SenhaAtual, request.NovaSenha);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        [HttpPut("alterar-login")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> AlterarLogin([FromBody] AlterarLoginRequest request)
        {
            var usuarioIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(usuarioIdClaim, out var usuarioId))
                return Unauthorized(new { erro = "Token invalido." });

            try
            {
                await Usuario.AlterarLoginAsync(_dbContext, usuarioId, request.NovoLogin);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        private static string GerarToken(Usuario usuario, string jwtKey, string jwtIssuer, string jwtAudience, DateTime expiresAtUtc)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new("colaboradorId", usuario.ColaboradorId.ToString()),
                new("colaboradorNome", usuario.NomeColaborador),
                new("nivelAcesso", usuario.NivelAcesso),
                new(ClaimTypes.Name, usuario.Login)
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: expiresAtUtc,
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

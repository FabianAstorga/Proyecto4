using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using WebGIS.Server.Models;

namespace WebGIS.Server.Services;

public sealed class TokenService(IConfiguration configuration)
{
    public string CreateToken(Usuario usuario)
    {
        var options = configuration.GetSection("Jwt").Get<JwtOptions>()
            ?? throw new InvalidOperationException("Falta la configuración Jwt.");

        if (string.IsNullOrWhiteSpace(options.Key) || options.Key.Length < 32)
        {
            throw new InvalidOperationException(
                "Jwt:Key debe existir y tener al menos 32 caracteres.");
        }

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.IdUsuario.ToString()),
            new(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),
            new(ClaimTypes.Name, usuario.Nombre),
            new(ClaimTypes.Email, usuario.Email),
            new(ClaimTypes.Role, RoleDisplay(usuario.Rol)),
            new("rolCodigo", usuario.Rol),
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: options.Issuer,
            audience: options.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddHours(options.ExpiresHours),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string RoleDisplay(string codigo) =>
        codigo.ToUpperInvariant() switch
        {
            "OPERADOR" => "Operador",
            "DIRECTIVO" => "Directivo",
            "ADMIN" => "Admin",
            _ => codigo,
        };
}

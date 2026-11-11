using Microsoft.EntityFrameworkCore;
using WebGIS.Server.Data;
using WebGIS.Server.Dtos;
using WebGIS.Server.Models;

namespace WebGIS.Server.Services;

public sealed class AuthService(
    WebGisDbContext context,
    TokenService tokenService)
{
    public async Task<AuthResponse?> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(request.Email);

        var usuario = await context.Usuarios
            .FirstOrDefaultAsync(
                x => x.Email.ToLower() == email && x.Activo,
                cancellationToken);

        if (usuario is null ||
            !BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
        {
            return null;
        }

        usuario.UltimoAcceso = DateTimeOffset.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        return new AuthResponse(
            tokenService.CreateToken(usuario),
            ToResponse(usuario));
    }

    public async Task<AuthUserResponse?> GetUserAsync(
        long idUsuario,
        CancellationToken cancellationToken = default)
    {
        var usuario = await context.Usuarios
            .FirstOrDefaultAsync(
                x => x.IdUsuario == idUsuario && x.Activo,
                cancellationToken);

        return usuario is null ? null : ToResponse(usuario);
    }

    public static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();

    public static AuthUserResponse ToResponse(Usuario usuario) =>
        new(
            usuario.IdUsuario,
            usuario.Nombre,
            usuario.Email,
            TokenService.RoleDisplay(usuario.Rol),
            string.Empty);
}

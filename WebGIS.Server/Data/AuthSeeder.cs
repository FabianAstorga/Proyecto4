using Microsoft.EntityFrameworkCore;
using WebGIS.Server.Models;

namespace WebGIS.Server.Data;

public static class AuthSeeder
{
    public static async Task SeedAsync(
        WebGisDbContext context,
        IConfiguration configuration,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        if (!configuration.GetValue("Auth:SeedDemoUsers", false)) return;

        var password = configuration["Auth:DemoPassword"] ?? "Epa2026!";
        var seeds = new[]
        {
            (
                Email: "operador@epa.cl",
                Nombre: "Fabián Astorga Castillo",
                Rol: "Operador"
            ),
            (
                Email: "jefatura@epa.cl",
                Nombre: "Jorge Bernal Navarrete",
                Rol: "Directivo"
            ),
            (
                Email: "admin@epa.cl",
                Nombre: "Administrador del sistema",
                Rol: "Admin"
            ),
        };

        foreach (var seed in seeds)
        {
            var email = seed.Email.ToLowerInvariant();
            var usuario = await context.Usuarios
                .FirstOrDefaultAsync(x => x.Email.ToLower() == email, cancellationToken);

            if (usuario is null)
            {
                context.Usuarios.Add(new Usuario
                {
                    Nombre = seed.Nombre,
                    Email = email,
                    Rol = seed.Rol,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                    Activo = true,
                    FechaCreacion = DateTimeOffset.UtcNow,
                });
            }
            else
            {
                usuario.Rol = seed.Rol;
                if (usuario.PasswordHash.StartsWith(
                        "$2a$11$ejemplo",
                        StringComparison.Ordinal))
                {
                    usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
                }
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "Usuarios demo asegurados. Contraseña de desarrollo: {Password}",
            password);
    }
}

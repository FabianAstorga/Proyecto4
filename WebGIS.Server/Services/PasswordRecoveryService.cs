using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using WebGIS.Server.Data;

namespace WebGIS.Server.Services;

public sealed class PasswordRecoveryService(
    WebGisDbContext context,
    IMemoryCache cache,
    ILogger<PasswordRecoveryService> logger)
{
    private static readonly TimeSpan CodeLifetime = TimeSpan.FromMinutes(10);

    public async Task<string?> RequestCodeAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        var normalized = AuthService.NormalizeEmail(email);

        var exists = await context.Usuarios
            .AnyAsync(x => x.Email.ToLower() == normalized && x.Activo, cancellationToken);

        if (!exists) return null;

        var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        cache.Set(
            CacheKey(normalized),
            code,
            new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = CodeLifetime,
            });

        logger.LogInformation(
            "Código de recuperación generado para {Email}",
            normalized);

        return code;
    }

    public async Task<bool> ResetAsync(
        string email,
        string code,
        string newPassword,
        CancellationToken cancellationToken = default)
    {
        var normalized = AuthService.NormalizeEmail(email);

        if (!cache.TryGetValue<string>(CacheKey(normalized), out var storedCode) ||
            storedCode != code)
        {
            return false;
        }

        var usuario = await context.Usuarios
            .FirstOrDefaultAsync(
                x => x.Email.ToLower() == normalized && x.Activo,
                cancellationToken);

        if (usuario is null) return false;

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await context.SaveChangesAsync(cancellationToken);
        cache.Remove(CacheKey(normalized));

        return true;
    }

    private static string CacheKey(string email) => $"password-reset:{email}";
}

namespace WebGIS.Server.Models;

public sealed class Usuario
{
    public long IdUsuario { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
    public DateTimeOffset FechaCreacion { get; set; }
    public DateTimeOffset? UltimoAcceso { get; set; }
}

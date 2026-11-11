namespace WebGIS.Server.Models;

public sealed class Fotografia
{
    public long IdFoto { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public DateTimeOffset FechaCaptura { get; set; }
    public long IdVuelo { get; set; }

    public string? RutaRelativa { get; set; }
    public string? MimeType { get; set; }
    public long? TamanoBytes { get; set; }
    public int? AnchoPx { get; set; }
    public int? AltoPx { get; set; }
    public string? HashSha256 { get; set; }
    public DateTimeOffset FechaCarga { get; set; } = DateTimeOffset.UtcNow;

    public Vuelo? Vuelo { get; set; }
}

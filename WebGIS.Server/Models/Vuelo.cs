namespace WebGIS.Server.Models;

public sealed class Vuelo
{
    public long IdVuelo { get; set; }
    public string CodigoVuelo { get; set; } = string.Empty;
    public DateTimeOffset FechaInicio { get; set; }
    public string EstadoCarga { get; set; } = "RECIBIDO";
    public int TotalArchivos { get; set; }
    public long IdSector { get; set; }
    public long IdUsuario { get; set; }

    public Sector? Sector { get; set; }
    public Usuario? Usuario { get; set; }
    public ICollection<Fotografia> Fotografias { get; set; } = [];
}

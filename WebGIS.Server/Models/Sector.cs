namespace WebGIS.Server.Models;

public sealed class Sector
{
    public long IdSector { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public ICollection<Vuelo> Vuelos { get; set; } = [];
}

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WebGIS.Server.Dtos;

public sealed class CrearVueloRequest
{
    [FromForm(Name = "idSector")]
    public long IdSector { get; set; }

    [FromForm(Name = "archivos")]
    public List<IFormFile> Archivos { get; set; } = [];
}

public sealed record SectorDto(long IdSector, string Codigo);

public sealed record FotografiaDto(
    long IdFoto,
    string NombreArchivo,
    string? Url,
    string? MimeType,
    long? TamanoBytes,
    int? AnchoPx,
    int? AltoPx,
    DateTimeOffset FechaCaptura);

public sealed record FotografiaGaleriaDto(
    long IdFoto,
    string NombreArchivo,
    string Url,
    string? MimeType,
    long? TamanoBytes,
    int? AnchoPx,
    int? AltoPx,
    DateTimeOffset FechaCaptura,
    long IdVuelo,
    string CodigoVuelo,
    string SectorCodigo);

public sealed record CompararFotosRequest(
    long IdFotoA,
    long IdFotoB,
    string? Algoritmo = null);

public sealed record VueloResumenDto(
    long IdVuelo,
    string CodigoVuelo,
    DateTimeOffset FechaInicio,
    string EstadoCarga,
    int TotalArchivos,
    long IdSector,
    string SectorCodigo);

public sealed record VueloDetalleDto(
    long IdVuelo,
    string CodigoVuelo,
    DateTimeOffset FechaInicio,
    string EstadoCarga,
    int TotalArchivos,
    long IdSector,
    string SectorCodigo,
    IReadOnlyList<FotografiaDto> Fotografias);

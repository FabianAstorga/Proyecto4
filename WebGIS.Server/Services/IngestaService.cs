using System.Globalization;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using OpenCvSharp;
using WebGIS.Server.Data;
using WebGIS.Server.Dtos;
using WebGIS.Server.Models;

namespace WebGIS.Server.Services;

public sealed class IngestaService(
    WebGisDbContext db,
    IWebHostEnvironment environment,
    IConfiguration configuration,
    ILogger<IngestaService> logger)
{
    private static readonly HashSet<string> AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };

    private const int MaxArchivosPorLote = 50;

    public async Task<IReadOnlyList<SectorDto>> ListarSectoresAsync(
        CancellationToken cancellationToken)
    {
        return await db.Sectores
            .AsNoTracking()
            .OrderBy(x => x.Codigo)
            .Select(x => new SectorDto(x.IdSector, x.Codigo))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<VueloResumenDto>> ListarVuelosAsync(
        CancellationToken cancellationToken)
    {
        return await db.Vuelos
            .AsNoTracking()
            .Include(x => x.Sector)
            .Where(x => x.Fotografias.Any(f => f.RutaRelativa != null))
            .OrderByDescending(x => x.FechaInicio)
            .Select(x => new VueloResumenDto(
                x.IdVuelo,
                x.CodigoVuelo,
                x.FechaInicio,
                x.EstadoCarga,
                x.TotalArchivos,
                x.IdSector,
                x.Sector != null ? x.Sector.Codigo : string.Empty))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<FotografiaGaleriaDto>> ListarFotografiasAsync(
        long? idVuelo,
        CancellationToken cancellationToken)
    {
        var query = db.Fotografias
            .AsNoTracking()
            .Include(x => x.Vuelo)
            .ThenInclude(x => x!.Sector)
            .Where(x => x.RutaRelativa != null);

        if (idVuelo.HasValue)
        {
            query = query.Where(x => x.IdVuelo == idVuelo.Value);
        }

        var fotos = await query
            .OrderByDescending(x => x.FechaCarga)
            .ThenBy(x => x.IdFoto)
            .ToListAsync(cancellationToken);

        return fotos
            .Select(x => new FotografiaGaleriaDto(
                x.IdFoto,
                x.NombreArchivo,
                ConstruirUrl(x.RutaRelativa)!,
                x.MimeType,
                x.TamanoBytes,
                x.AnchoPx,
                x.AltoPx,
                x.FechaCaptura,
                x.IdVuelo,
                x.Vuelo?.CodigoVuelo ?? string.Empty,
                x.Vuelo?.Sector?.Codigo ?? string.Empty))
            .ToList();
    }

    public async Task<VueloDetalleDto?> ObtenerVueloAsync(
        long idVuelo,
        CancellationToken cancellationToken)
    {
        var vuelo = await db.Vuelos
            .AsNoTracking()
            .Include(x => x.Sector)
            .Include(x => x.Fotografias)
            .FirstOrDefaultAsync(x => x.IdVuelo == idVuelo, cancellationToken);

        return vuelo is null ? null : MapVuelo(vuelo);
    }

    public async Task<VueloDetalleDto> CrearVueloAsync(
        long idUsuario,
        long idSector,
        IReadOnlyList<IFormFile> archivos,
        CancellationToken cancellationToken)
    {
        if (archivos.Count == 0)
        {
            throw new IngestaValidacionException(
                "Debes adjuntar al menos una imagen para crear el lote.");
        }

        if (archivos.Count > MaxArchivosPorLote)
        {
            throw new IngestaValidacionException(
                $"El lote no puede superar los {MaxArchivosPorLote} archivos.");
        }

        var sectorExiste = await db.Sectores
            .AnyAsync(x => x.IdSector == idSector, cancellationToken);

        if (!sectorExiste)
        {
            throw new IngestaValidacionException("El sector seleccionado no existe.");
        }

        var maxBytes = Math.Max(
            1,
            configuration.GetValue<long?>("Storage:MaxFileSizeMb") ?? 25) *
            1024L * 1024L;

        var ahora = DateTimeOffset.UtcNow;
        var vuelo = new Vuelo
        {
            CodigoVuelo = CrearCodigoVuelo(),
            FechaInicio = ahora,
            EstadoCarga = "RECIBIDO",
            TotalArchivos = archivos.Count,
            IdSector = idSector,
            IdUsuario = idUsuario,
        };

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        string? carpetaVuelo = null;

        try
        {
            db.Vuelos.Add(vuelo);
            await db.SaveChangesAsync(cancellationToken);

            carpetaVuelo = Path.Combine(
                ObtenerRaizMedia(),
                "vuelos",
                vuelo.IdVuelo.ToString(CultureInfo.InvariantCulture));

            Directory.CreateDirectory(carpetaVuelo);

            foreach (var archivo in archivos)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (archivo.Length == 0)
                {
                    throw new IngestaValidacionException(
                        $"El archivo '{archivo.FileName}' está vacío.");
                }

                if (archivo.Length > maxBytes)
                {
                    throw new IngestaValidacionException(
                        $"El archivo '{archivo.FileName}' supera el tamaño máximo permitido.");
                }

                var extension = Path.GetExtension(archivo.FileName);
                if (!AllowedExtensions.Contains(extension))
                {
                    throw new IngestaValidacionException(
                        $"El archivo '{archivo.FileName}' no es una imagen JPG, PNG o WEBP.");
                }

                byte[] bytes;
                await using (var stream = archivo.OpenReadStream())
                using (var memory = new MemoryStream())
                {
                    await stream.CopyToAsync(memory, cancellationToken);
                    bytes = memory.ToArray();
                }

                using var imagen = Cv2.ImDecode(bytes, ImreadModes.Color);
                if (imagen.Empty())
                {
                    throw new IngestaValidacionException(
                        $"El archivo '{archivo.FileName}' no contiene una imagen válida.");
                }

                var nombreGuardado = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
                var rutaRelativa = $"vuelos/{vuelo.IdVuelo}/{nombreGuardado}";
                var rutaAbsoluta = Path.Combine(carpetaVuelo, nombreGuardado);

                await File.WriteAllBytesAsync(rutaAbsoluta, bytes, cancellationToken);

                db.Fotografias.Add(new Fotografia
                {
                    NombreArchivo = LimpiarNombre(archivo.FileName),
                    FechaCaptura = ahora,
                    IdVuelo = vuelo.IdVuelo,
                    RutaRelativa = rutaRelativa,
                    MimeType = ObtenerMime(extension, archivo.ContentType),
                    TamanoBytes = bytes.LongLength,
                    AnchoPx = imagen.Width,
                    AltoPx = imagen.Height,
                    HashSha256 = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant(),
                    FechaCarga = ahora,
                });
            }

            vuelo.EstadoCarga = "COMPLETADO";
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            logger.LogInformation(
                "Lote {CodigoVuelo} creado con {TotalArchivos} imágenes.",
                vuelo.CodigoVuelo,
                archivos.Count);

            var creado = await db.Vuelos
                .AsNoTracking()
                .Include(x => x.Sector)
                .Include(x => x.Fotografias)
                .FirstAsync(x => x.IdVuelo == vuelo.IdVuelo, cancellationToken);

            return MapVuelo(creado);
        }
        catch
        {
            await transaction.RollbackAsync(CancellationToken.None);

            if (carpetaVuelo is not null && Directory.Exists(carpetaVuelo))
            {
                try
                {
                    Directory.Delete(carpetaVuelo, recursive: true);
                }
                catch (Exception exception)
                {
                    logger.LogWarning(
                        exception,
                        "No fue posible limpiar la carpeta del lote {Carpeta}.",
                        carpetaVuelo);
                }
            }

            throw;
        }
    }

    private static VueloDetalleDto MapVuelo(Vuelo vuelo)
    {
        var fotos = vuelo.Fotografias
            .OrderBy(x => x.IdFoto)
            .Select(x => new FotografiaDto(
                x.IdFoto,
                x.NombreArchivo,
                ConstruirUrl(x.RutaRelativa),
                x.MimeType,
                x.TamanoBytes,
                x.AnchoPx,
                x.AltoPx,
                x.FechaCaptura))
            .ToList();

        return new VueloDetalleDto(
            vuelo.IdVuelo,
            vuelo.CodigoVuelo,
            vuelo.FechaInicio,
            vuelo.EstadoCarga,
            vuelo.TotalArchivos,
            vuelo.IdSector,
            vuelo.Sector?.Codigo ?? string.Empty,
            fotos);
    }

    private static string? ConstruirUrl(string? rutaRelativa) =>
        string.IsNullOrWhiteSpace(rutaRelativa)
            ? null
            : $"/media/{rutaRelativa.Replace('\\', '/').TrimStart('/')}";

    public string ObtenerRutaAbsolutaMedia(string rutaRelativa)
    {
        var root = Path.GetFullPath(ObtenerRaizMedia());
        var fullPath = Path.GetFullPath(Path.Combine(root, rutaRelativa));
        var rootWithSeparator = root.EndsWith(Path.DirectorySeparatorChar)
            ? root
            : $"{root}{Path.DirectorySeparatorChar}";

        if (!fullPath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase))
        {
            throw new IngestaValidacionException("La ruta del archivo no es válida.");
        }

        return fullPath;
    }

    private string ObtenerRaizMedia()
    {
        var configured = configuration["Storage:RootPath"] ?? "media";
        return Path.IsPathRooted(configured)
            ? configured
            : Path.Combine(environment.ContentRootPath, configured);
    }

    private static string CrearCodigoVuelo()
    {
        var sufijo = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
        return $"VUELO-{DateTime.UtcNow:yyyyMMdd-HHmmss}-{sufijo}";
    }

    private static string LimpiarNombre(string fileName)
    {
        var name = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(name))
        {
            return "imagen";
        }

        if (name.Length <= 255)
        {
            return name;
        }

        var extension = Path.GetExtension(name);
        var baseName = Path.GetFileNameWithoutExtension(name);
        var maxBaseLength = Math.Max(1, 255 - extension.Length);
        return $"{baseName[..Math.Min(baseName.Length, maxBaseLength)]}{extension}";
    }

    private static string ObtenerMime(string extension, string? contentType)
    {
        if (!string.IsNullOrWhiteSpace(contentType) &&
            contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return contentType;
        }

        return extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => "application/octet-stream",
        };
    }
}

public sealed class IngestaValidacionException(string message) : Exception(message);

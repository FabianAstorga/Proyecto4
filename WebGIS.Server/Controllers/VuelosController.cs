using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebGIS.Server.Dtos;
using WebGIS.Server.Services;

namespace WebGIS.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/vuelos")]
public sealed class VuelosController(IngestaService ingestaService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<VueloResumenDto>>> Listar(
        CancellationToken cancellationToken)
    {
        return Ok(await ingestaService.ListarVuelosAsync(cancellationToken));
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<VueloDetalleDto>> Obtener(
        long id,
        CancellationToken cancellationToken)
    {
        var vuelo = await ingestaService.ObtenerVueloAsync(id, cancellationToken);
        return vuelo is null ? NotFound() : Ok(vuelo);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(250_000_000)]
    public async Task<ActionResult<VueloDetalleDto>> Crear(
        [FromForm] CrearVueloRequest request,
        CancellationToken cancellationToken)
    {
        if (!long.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out var idUsuario))
        {
            return Unauthorized();
        }

        try
        {
            var vuelo = await ingestaService.CrearVueloAsync(
                idUsuario,
                request.IdSector,
                request.Archivos ?? [],
                cancellationToken);

            return CreatedAtAction(nameof(Obtener), new { id = vuelo.IdVuelo }, vuelo);
        }
        catch (IngestaValidacionException exception)
        {
            return BadRequest(new { detail = exception.Message });
        }
    }
}

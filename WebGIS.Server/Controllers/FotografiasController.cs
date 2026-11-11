using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebGIS.Server.Dtos;
using WebGIS.Server.Services;

namespace WebGIS.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/fotografias")]
public sealed class FotografiasController(IngestaService ingestaService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<FotografiaGaleriaDto>>> Listar(
        [FromQuery] long? idVuelo,
        CancellationToken cancellationToken)
    {
        return Ok(await ingestaService.ListarFotografiasAsync(idVuelo, cancellationToken));
    }
}

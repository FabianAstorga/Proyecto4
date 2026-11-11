using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebGIS.Server.Dtos;
using WebGIS.Server.Services;

namespace WebGIS.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/sectores")]
public sealed class SectoresController(IngestaService ingestaService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SectorDto>>> Listar(
        CancellationToken cancellationToken)
    {
        return Ok(await ingestaService.ListarSectoresAsync(cancellationToken));
    }
}

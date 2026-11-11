using Microsoft.AspNetCore.SignalR;
using WebGIS.Server.Hubs;

namespace WebGIS.Server.Services;

public sealed class ReportesWorker(
    ReportesQueue queue,
    IHubContext<ReportesHub> hub,
    ILogger<ReportesWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var evento in queue.ReadAllAsync(stoppingToken))
        {
            logger.LogInformation(
                "Informe {IdInforme} actualizado a {Estado}",
                evento.IdInforme,
                evento.Estado);

            await hub.Clients.All.SendAsync(
                "ReporteActualizado",
                evento,
                stoppingToken);
        }
    }
}

using Microsoft.AspNetCore.SignalR;

namespace WebGIS.Server.Hubs;

/// <summary>
/// Canal en tiempo real para avisar a la interfaz cuando un informe cambia
/// de estado: GENERANDO, LISTO o ERROR.
/// </summary>
public sealed class ReportesHub : Hub
{
}

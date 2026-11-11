using System.Threading.Channels;

namespace WebGIS.Server.Services;

public sealed record ReporteEvento(
    long IdInforme,
    string Estado,
    string? Numero = null);

public sealed class ReportesQueue
{
    private readonly Channel<ReporteEvento> _channel =
        Channel.CreateUnbounded<ReporteEvento>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false,
        });

    public ValueTask EnqueueAsync(ReporteEvento evento, CancellationToken cancellationToken = default) =>
        _channel.Writer.WriteAsync(evento, cancellationToken);

    public IAsyncEnumerable<ReporteEvento> ReadAllAsync(CancellationToken cancellationToken) =>
        _channel.Reader.ReadAllAsync(cancellationToken);
}

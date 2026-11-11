namespace WebGIS.Server.Services;

public sealed class JwtOptions
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "WebGIS.EPA";
    public string Audience { get; set; } = "WebGIS.Frontend";
    public int ExpiresHours { get; set; } = 8;
}

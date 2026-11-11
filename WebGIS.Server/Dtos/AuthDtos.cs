namespace WebGIS.Server.Dtos;

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthUserResponse(
    long Id,
    string Nombre,
    string Email,
    string Rol,
    string Unidad);

public sealed record AuthResponse(string Token, AuthUserResponse User);

public sealed record RecoverRequest(string Email);

public sealed record RecoverConfirmRequest(string Email, string Code, string NewPassword);

public sealed record RecoverResponse(string Message, string? DemoCode = null);

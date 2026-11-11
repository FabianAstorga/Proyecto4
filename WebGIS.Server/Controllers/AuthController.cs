using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebGIS.Server.Dtos;
using WebGIS.Server.Services;

namespace WebGIS.Server.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    AuthService authService,
    PasswordRecoveryService recoveryService,
    IHostEnvironment environment) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { detail = "Ingresa tu correo y contraseña." });
        }

        AuthResponse? response;
        try
        {
            response = await authService.LoginAsync(request, cancellationToken);
        }
        catch (Exception exception)
        {
            return Unauthorized(new
            {
                detail = "No fue posible validar las credenciales.",
                debug = environment.IsDevelopment() ? exception.Message : null,
            });
        }

        if (response is null)
        {
            return Unauthorized(new { detail = "Correo o contraseña incorrectos." });
        }

        return Ok(response);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthUserResponse>> Me(CancellationToken cancellationToken)
    {
        if (!long.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out var idUsuario))
        {
            return Unauthorized();
        }

        var user = await authService.GetUserAsync(idUsuario, cancellationToken);
        return user is null ? Unauthorized() : Ok(user);
    }

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout() => NoContent();

    [AllowAnonymous]
    [HttpPost("recover/request")]
    public async Task<ActionResult<RecoverResponse>> RequestRecovery(
        [FromBody] RecoverRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { detail = "Ingresa tu correo institucional." });
        }

        var code = await recoveryService.RequestCodeAsync(
            request.Email,
            cancellationToken);

        return Accepted(new RecoverResponse(
            "Si el correo existe, enviamos un código de recuperación.",
            environment.IsDevelopment() ? code : null));
    }

    [AllowAnonymous]
    [HttpPost("recover/confirm")]
    public async Task<IActionResult> ConfirmRecovery(
        [FromBody] RecoverConfirmRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Code) ||
            string.IsNullOrWhiteSpace(request.NewPassword) ||
            request.NewPassword.Length < 8)
        {
            return BadRequest(new
            {
                detail = "Correo, código y una contraseña de al menos 8 caracteres son obligatorios.",
            });
        }

        var updated = await recoveryService.ResetAsync(
            request.Email,
            request.Code.Trim(),
            request.NewPassword,
            cancellationToken);

        return updated
            ? NoContent()
            : BadRequest(new { detail = "El código es inválido o expiró." });
    }
}

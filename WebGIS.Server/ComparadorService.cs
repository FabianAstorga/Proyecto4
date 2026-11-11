using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenCvSharp;
using WebGIS.Server.Data;
using WebGIS.Server.Dtos;
using WebGIS.Server.Services;

namespace WebGIS.Server;

public sealed record ResultadoComparacion(byte[] ImagenPng, int CambiosDetectados);

public sealed class ComparadorService
{
    private const double DiffThreshold = 65;
    private const double RatioLow = 0.72;
    private const double RatioHigh = 1.35;
    private const int BlurKernel = 7;
    private const int MinArea = 120;
    private const double MinSolidity = 0.35;
    private const int GroupDistance = 85;

    public Task<ResultadoComparacion> ProcesarAsync(
        Stream imagenA,
        Stream imagenB,
        string? algoritmo = null,
        CancellationToken cancellationToken = default) =>
        Task.Run(
            () => Procesar(imagenA, imagenB, algoritmo, cancellationToken),
            cancellationToken);

    private static ResultadoComparacion Procesar(
        Stream streamA,
        Stream streamB,
        string? algoritmo,
        CancellationToken cancellationToken)
    {
        using var memoryA = new MemoryStream();
        using var memoryB = new MemoryStream();
        streamA.CopyTo(memoryA);
        streamB.CopyTo(memoryB);

        using var imgA = Cv2.ImDecode(memoryA.ToArray(), ImreadModes.Color)
            ?? throw new ArgumentException("No fue posible decodificar la imagen A.");
        using var imgB = Cv2.ImDecode(memoryB.ToArray(), ImreadModes.Color)
            ?? throw new ArgumentException("No fue posible decodificar la imagen B.");

        cancellationToken.ThrowIfCancellationRequested();

        if (imgB.Width != imgA.Width || imgB.Height != imgA.Height)
        {
            Cv2.Resize(
                imgB,
                imgB,
                new Size(imgA.Width, imgA.Height),
                interpolation: InterpolationFlags.Area);
        }

        return NormalizarAlgoritmo(algoritmo) switch
        {
            "ratio" => ProcesarRatio(imgA, imgB, cancellationToken),
            "hibrido" => ProcesarHibrido(imgA, imgB, cancellationToken),
            _ => ProcesarEscalaGrises(imgA, imgB, cancellationToken),
        };
    }

    private static string NormalizarAlgoritmo(string? algoritmo) =>
        (algoritmo ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "ratio" => "ratio",
            "hibrido" or "hybrid" => "hibrido",
            _ => "precision",
        };

    private static ResultadoComparacion ProcesarEscalaGrises(
        Mat imgA,
        Mat imgB,
        CancellationToken cancellationToken)
    {

        using var grayA = new Mat();
        using var grayB = new Mat();
        Cv2.CvtColor(imgA, grayA, ColorConversionCodes.BGR2GRAY);
        Cv2.CvtColor(imgB, grayB, ColorConversionCodes.BGR2GRAY);

        var kernelSize = BlurKernel > 1
            ? (BlurKernel % 2 == 0 ? BlurKernel + 1 : BlurKernel)
            : 0;

        using var blurA = new Mat();
        using var blurB = new Mat();

        if (kernelSize > 1)
        {
            Cv2.GaussianBlur(grayA, blurA, new Size(kernelSize, kernelSize), 0);
            Cv2.GaussianBlur(grayB, blurB, new Size(kernelSize, kernelSize), 0);
        }
        else
        {
            grayA.CopyTo(blurA);
            grayB.CopyTo(blurB);
        }

        using var diffAbs = new Mat();
        using var maskDiff = new Mat();
        Cv2.Absdiff(blurA, blurB, diffAbs);
        Cv2.Threshold(diffAbs, maskDiff, DiffThreshold, 255, ThresholdTypes.Binary);

        using var floatA = new Mat();
        using var floatB = new Mat();
        blurA.ConvertTo(floatA, MatType.CV_32FC1);
        blurB.ConvertTo(floatB, MatType.CV_32FC1);

        using var epsilon = new Mat(floatA.Size(), MatType.CV_32FC1, Scalar.All(1e-5));
        Cv2.Add(floatA, epsilon, floatA);
        Cv2.Add(floatB, epsilon, floatB);

        using var ratioMap = new Mat();
        Cv2.Divide(floatA, floatB, ratioMap);

        using var low = new Mat(ratioMap.Size(), MatType.CV_32FC1, Scalar.All(RatioLow));
        using var high = new Mat(ratioMap.Size(), MatType.CV_32FC1, Scalar.All(RatioHigh));
        using var maskLow = new Mat();
        using var maskHigh = new Mat();
        using var maskRatio = new Mat();
        Cv2.Compare(ratioMap, low, maskLow, CmpTypes.LT);
        Cv2.Compare(ratioMap, high, maskHigh, CmpTypes.GT);
        Cv2.BitwiseOr(maskLow, maskHigh, maskRatio);

        using var maskIntersection = new Mat();
        Cv2.BitwiseAnd(maskDiff, maskRatio, maskIntersection);

        using var kernelOpen = Cv2.GetStructuringElement(
            MorphShapes.Ellipse,
            new Size(5, 5));
        using var kernelClose = Cv2.GetStructuringElement(
            MorphShapes.Ellipse,
            new Size(9, 9));
        using var maskOpened = new Mat();
        using var maskClean = new Mat();
        Cv2.MorphologyEx(maskIntersection, maskOpened, MorphTypes.Open, kernelOpen);
        Cv2.MorphologyEx(maskOpened, maskClean, MorphTypes.Close, kernelClose);

        Cv2.FindContours(
            maskClean,
            out Point[][] contours,
            out _,
            RetrievalModes.External,
            ContourApproximationModes.ApproxSimple);

        var candidates = new List<Circulo>();

        foreach (var contour in contours)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var area = Cv2.ContourArea(contour);
            if (area < MinArea) continue;

            var hull = Cv2.ConvexHull(contour);
            var hullArea = Cv2.ContourArea(hull);
            var solidity = hullArea > 0 ? area / hullArea : 0;
            if (solidity < MinSolidity) continue;

            Cv2.MinEnclosingCircle(contour, out Point2f center, out float radius);
            var margin = Math.Max((int)radius + 10, 18);
            candidates.Add(new Circulo((int)center.X, (int)center.Y, margin));
        }

        var circulosFinales = AgruparCirculos(candidates, GroupDistance, true);
        return CrearResultado(imgB, circulosFinales);
    }

    private static ResultadoComparacion ProcesarRatio(
        Mat imgA,
        Mat imgB,
        CancellationToken cancellationToken)
    {
        using var grayA = new Mat();
        using var grayB = new Mat();
        Cv2.CvtColor(imgA, grayA, ColorConversionCodes.BGR2GRAY);
        Cv2.CvtColor(imgB, grayB, ColorConversionCodes.BGR2GRAY);

        using var maskRatio = CrearMascaraRatio(grayA, grayB, 0.82, 1.18);
        using var kernel = Cv2.GetStructuringElement(MorphShapes.Rect, new Size(3, 3));
        using var maskClean = new Mat();
        Cv2.MorphologyEx(maskRatio, maskClean, MorphTypes.Open, kernel);

        var circles = ObtenerCirculos(maskClean, cancellationToken, minArea: 40);
        return CrearResultado(imgB, circles);
    }

    private static ResultadoComparacion ProcesarHibrido(
        Mat imgA,
        Mat imgB,
        CancellationToken cancellationToken)
    {
        using var grayA = new Mat();
        using var grayB = new Mat();
        Cv2.CvtColor(imgA, grayA, ColorConversionCodes.BGR2GRAY);
        Cv2.CvtColor(imgB, grayB, ColorConversionCodes.BGR2GRAY);

        using var diffAbs = new Mat();
        using var maskDiff = new Mat();
        Cv2.Absdiff(grayA, grayB, diffAbs);
        Cv2.Threshold(diffAbs, maskDiff, 40, 255, ThresholdTypes.Binary);

        using var maskRatio = CrearMascaraRatio(grayA, grayB, 0.82, 1.18);
        using var kernel = Cv2.GetStructuringElement(MorphShapes.Rect, new Size(3, 3));
        using var diffClean = new Mat();
        using var ratioClean = new Mat();
        Cv2.MorphologyEx(maskDiff, diffClean, MorphTypes.Open, kernel);
        Cv2.MorphologyEx(maskRatio, ratioClean, MorphTypes.Open, kernel);

        using var intersection = new Mat();
        using var union = new Mat();
        Cv2.BitwiseAnd(diffClean, ratioClean, intersection);
        Cv2.BitwiseOr(diffClean, ratioClean, union);

        Cv2.FindContours(
            union,
            out Point[][] contours,
            out _,
            RetrievalModes.External,
            ContourApproximationModes.ApproxSimple);

        var circles = new List<Circulo>();

        foreach (var contour in contours)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (Cv2.ContourArea(contour) < 40) continue;

            using var roiMask = new Mat(union.Size(), MatType.CV_8UC1, Scalar.All(0));
            Cv2.DrawContours(
                roiMask,
                new[] { (IEnumerable<Point>)contour },
                -1,
                Scalar.All(255),
                -1);

            using var intersectionRoi = new Mat();
            using var unionRoi = new Mat();
            Cv2.BitwiseAnd(intersection, roiMask, intersectionRoi);
            Cv2.BitwiseAnd(union, roiMask, unionRoi);

            var pixelsIntersection = Cv2.CountNonZero(intersectionRoi);
            var pixelsUnion = Cv2.CountNonZero(unionRoi);
            var overlapRatio = pixelsIntersection / (pixelsUnion + 1e-5);

            if (overlapRatio < 0.40) continue;

            Cv2.MinEnclosingCircle(contour, out Point2f center, out float radius);
            circles.Add(new Circulo(
                (int)center.X,
                (int)center.Y,
                Math.Max((int)radius + 8, 15)));
        }

        return CrearResultado(imgB, circles);
    }

    private static Mat CrearMascaraRatio(
        Mat grayA,
        Mat grayB,
        double ratioLow,
        double ratioHigh)
    {
        using var floatA = new Mat();
        using var floatB = new Mat();
        grayA.ConvertTo(floatA, MatType.CV_32FC1);
        grayB.ConvertTo(floatB, MatType.CV_32FC1);

        using var epsilon = new Mat(floatA.Size(), MatType.CV_32FC1, Scalar.All(1e-5));
        Cv2.Add(floatA, epsilon, floatA);
        Cv2.Add(floatB, epsilon, floatB);

        using var ratioMap = new Mat();
        Cv2.Divide(floatA, floatB, ratioMap);

        using var low = new Mat(ratioMap.Size(), MatType.CV_32FC1, Scalar.All(ratioLow));
        using var high = new Mat(ratioMap.Size(), MatType.CV_32FC1, Scalar.All(ratioHigh));
        using var maskLow = new Mat();
        using var maskHigh = new Mat();
        var maskRatio = new Mat();
        Cv2.Compare(ratioMap, low, maskLow, CmpTypes.LT);
        Cv2.Compare(ratioMap, high, maskHigh, CmpTypes.GT);
        Cv2.BitwiseOr(maskLow, maskHigh, maskRatio);

        return maskRatio;
    }

    private static List<Circulo> ObtenerCirculos(
        Mat mask,
        CancellationToken cancellationToken,
        int minArea)
    {
        Cv2.FindContours(
            mask,
            out Point[][] contours,
            out _,
            RetrievalModes.External,
            ContourApproximationModes.ApproxSimple);

        var circles = new List<Circulo>();

        foreach (var contour in contours)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (Cv2.ContourArea(contour) < minArea) continue;

            Cv2.MinEnclosingCircle(contour, out Point2f center, out float radius);
            circles.Add(new Circulo(
                (int)center.X,
                (int)center.Y,
                Math.Max((int)radius + 8, 15)));
        }

        return circles;
    }

    private static ResultadoComparacion CrearResultado(
        Mat imagenBase,
        IReadOnlyList<Circulo> circles)
    {
        using var marked = imagenBase.Clone();

        foreach (var circle in circles)
        {
            var center = new Point(circle.X, circle.Y);
            Cv2.Circle(marked, center, circle.Radius, new Scalar(0, 0, 255), 2, LineTypes.AntiAlias);
            Cv2.Circle(marked, center, 2, new Scalar(0, 0, 255), -1, LineTypes.AntiAlias);
        }

        if (!Cv2.ImEncode(".png", marked, out var png))
            throw new InvalidOperationException("No fue posible generar la imagen de resultado.");

        return new ResultadoComparacion(png, circles.Count);
    }

    private static List<Circulo> AgruparCirculos(
        IReadOnlyList<Circulo> circles,
        int maxDistance,
        bool evaluateOverlap)
    {
        if (circles.Count == 0) return [];

        var visited = new bool[circles.Count];
        var grouped = new List<Circulo>();

        for (var i = 0; i < circles.Count; i++)
        {
            if (visited[i]) continue;

            var cluster = new List<Circulo> { circles[i] };
            visited[i] = true;

            for (var index = 0; index < cluster.Count; index++)
            {
                var current = cluster[index];

                for (var j = 0; j < circles.Count; j++)
                {
                    if (visited[j]) continue;

                    var candidate = circles[j];
                    var distance = Math.Sqrt(
                        Math.Pow(current.X - candidate.X, 2) +
                        Math.Pow(current.Y - candidate.Y, 2));

                    var near = distance <= maxDistance;
                    var overlapping = evaluateOverlap &&
                        distance <= current.Radius + candidate.Radius;

                    if (!near && !overlapping) continue;

                    cluster.Add(candidate);
                    visited[j] = true;
                }
            }

            if (cluster.Count == 1)
            {
                grouped.Add(cluster[0]);
                continue;
            }

            var points = new List<Point2f>(cluster.Count * 4);
            foreach (var circle in cluster)
            {
                points.Add(new Point2f(circle.X + circle.Radius, circle.Y));
                points.Add(new Point2f(circle.X - circle.Radius, circle.Y));
                points.Add(new Point2f(circle.X, circle.Y + circle.Radius));
                points.Add(new Point2f(circle.X, circle.Y - circle.Radius));
            }

            using var pointsMat = Mat.FromArray(points.ToArray());
            Cv2.MinEnclosingCircle(pointsMat, out Point2f center, out float radius);
            grouped.Add(new Circulo(
                (int)center.X,
                (int)center.Y,
                (int)radius + 12));
        }

        return grouped;
    }

    private readonly record struct Circulo(int X, int Y, int Radius);
}

public static class ComparadorEndpoints
{
    public static IEndpointRouteBuilder MapComparadorEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost(
                "/api/comparador/procesar",
                async (
                    IFormFile imagenA,
                    IFormFile imagenB,
                    [FromForm] string? algoritmo,
                    ComparadorService servicio,
                    HttpContext context,
                    CancellationToken cancellationToken) =>
                {
                    if (imagenA.Length == 0 || imagenB.Length == 0)
                    {
                        return Results.BadRequest(new
                        {
                            detail = "Debes enviar las imágenes A y B.",
                        });
                    }

                    try
                    {
                        await using var streamA = imagenA.OpenReadStream();
                        await using var streamB = imagenB.OpenReadStream();

                        var result = await servicio.ProcesarAsync(
                            streamA,
                            streamB,
                            algoritmo,
                            cancellationToken);

                        context.Response.Headers["X-Cambios-Detectados"] =
                            result.CambiosDetectados.ToString(CultureInfo.InvariantCulture);

                        return Results.File(
                            result.ImagenPng,
                            "image/png",
                            "deteccion-cambios.png");
                    }
                    catch (ArgumentException exception)
                    {
                        return Results.BadRequest(new { detail = exception.Message });
                    }
                    catch (Exception exception)
                    {
                        return Results.Problem(
                            title: "No fue posible procesar las imágenes.",
                            detail: exception.Message,
                            statusCode: StatusCodes.Status500InternalServerError);
                    }
                })
            .DisableAntiforgery()
            .WithName("ProcesarComparacion")
            .WithTags("Comparador");

        app.MapPost(
                "/api/comparador/procesar-fotos",
                async (
                    CompararFotosRequest request,
                    WebGisDbContext db,
                    ComparadorService servicio,
                    IngestaService ingestaService,
                    HttpContext context,
                    CancellationToken cancellationToken) =>
                {
                    if (request.IdFotoA == request.IdFotoB)
                    {
                        return Results.BadRequest(new
                        {
                            detail = "Debes seleccionar dos fotografías distintas.",
                        });
                    }

                    var fotos = await db.Fotografias
                        .AsNoTracking()
                        .Where(foto =>
                            foto.IdFoto == request.IdFotoA ||
                            foto.IdFoto == request.IdFotoB)
                        .ToListAsync(cancellationToken);

                    var fotoA = fotos.FirstOrDefault(foto => foto.IdFoto == request.IdFotoA);
                    var fotoB = fotos.FirstOrDefault(foto => foto.IdFoto == request.IdFotoB);

                    if (fotoA is null || fotoB is null)
                    {
                        return Results.NotFound(new
                        {
                            detail = "Una de las fotografías seleccionadas no existe.",
                        });
                    }

                    if (string.IsNullOrWhiteSpace(fotoA.RutaRelativa) ||
                        string.IsNullOrWhiteSpace(fotoB.RutaRelativa))
                    {
                        return Results.BadRequest(new
                        {
                            detail = "Una de las fotografías no tiene archivo asociado.",
                        });
                    }

                    try
                    {
                        var rutaA = ingestaService.ObtenerRutaAbsolutaMedia(fotoA.RutaRelativa);
                        var rutaB = ingestaService.ObtenerRutaAbsolutaMedia(fotoB.RutaRelativa);

                        if (!File.Exists(rutaA) || !File.Exists(rutaB))
                        {
                            return Results.NotFound(new
                            {
                                detail = "No se encontró el archivo físico de una de las fotografías.",
                            });
                        }

                        await using var streamA = File.OpenRead(rutaA);
                        await using var streamB = File.OpenRead(rutaB);

                        var result = await servicio.ProcesarAsync(
                            streamA,
                            streamB,
                            request.Algoritmo,
                            cancellationToken);

                        context.Response.Headers["X-Cambios-Detectados"] =
                            result.CambiosDetectados.ToString(CultureInfo.InvariantCulture);

                        return Results.File(
                            result.ImagenPng,
                            "image/png",
                            "deteccion-cambios.png");
                    }
                    catch (IngestaValidacionException exception)
                    {
                        return Results.BadRequest(new { detail = exception.Message });
                    }
                    catch (FileNotFoundException)
                    {
                        return Results.NotFound(new
                        {
                            detail = "No se encontró el archivo físico de una de las fotografías.",
                        });
                    }
                    catch (ArgumentException exception)
                    {
                        return Results.BadRequest(new { detail = exception.Message });
                    }
                    catch (Exception exception)
                    {
                        return Results.Problem(
                            title: "No fue posible procesar las fotografías.",
                            detail: exception.Message,
                            statusCode: StatusCodes.Status500InternalServerError);
                    }
                })
            .RequireAuthorization()
            .WithName("ProcesarComparacionFotos")
            .WithTags("Comparador");

        return app;
    }
}

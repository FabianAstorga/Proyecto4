# WebGIS EPA / ZEAP

Solución base para la plataforma WebGIS de monitoreo e inspección geoespacial de la
Empresa Portuaria Arica (EPA) y la ZEAP.

## Estructura

| Proyecto | Rol |
|---|---|
| `frontend/` | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| `WebGIS.Server/` | API ASP.NET Core (.NET 10) |
| `WebGIS.AppHost/` | Orquestación Aspire (servidor + frontend) |
| `WebGIS.slnx` | Solución de Visual Studio |

El frontend incluye los tres artefactos del avance:

- `/login`: portal con carrusel y acceso institucional.
- `/comparador`: selección de lugar/fechas y cortina temporal A/B.
- `/reportes/nuevo`: asistente de reporte ejecutivo con vista A4.

## Ejecutar

### Visual Studio / Aspire

1. Abrir `WebGIS.slnx`.
2. Seleccionar `WebGIS.AppHost` como proyecto de inicio.
3. Ejecutar con `F5`.
4. Abrir la URL del frontend o del panel de Aspire que aparece en pantalla.

> La primera vez, si no existe `frontend/node_modules`, ejecutar `npm install` dentro de
> `frontend`. En esta máquina ya quedó instalado.

También desde terminal:

```powershell
cd C:\Users\fabia\source\repos\WebGIS
dotnet run --project WebGIS.AppHost
```

### Solo frontend

```powershell
cd C:\Users\fabia\source\repos\WebGIS\frontend
npm install
npm run dev
```

El frontend funciona con mocks (`VITE_USE_MOCK=true`), por lo que no requiere backend para
recorrer los tres artefactos. La URL por defecto es `http://localhost:5173`.

## Backend

- La API se implementa en `WebGIS.Server`.
- En desarrollo, Vite redirige `/api` al servidor mediante el proxy de `vite.config.ts`.
- El frontend usa rutas relativas `/api/...`; no hay una URL de backend hardcodeada.
- El fallback de SPA para React Router ya está configurado en `WebGIS.Server/Program.cs`.
- Al publicar, el AppHost copia el build del frontend a `wwwroot`
  (`PublishWithContainerFiles`).

## Documentación del frontend

- `frontend/README.md`: stack, rutas, contratos de API y estructura.
- `frontend/docs/GUION-DEMOSTRACION.md`: guion para presentar los tres artefactos.
- `frontend/docs/screenshots/`: capturas de referencia.

## Estado

Los artefactos de interfaz están construidos y verificados con `npm run lint` y
`npm run build`. La autenticación, la persistencia PostgreSQL/PostGIS, la carga y extracción
EXIF y la generación de PDF en servidor quedan para las siguientes iteraciones.

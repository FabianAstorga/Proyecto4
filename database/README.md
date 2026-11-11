# Base de datos EPA WebGIS

Modelo relacional PostgreSQL/PostGIS para el sistema EPA/ZEAP.

## Componentes

- `schema.sql`: crea el esquema `epa` con las 9 tablas del modelo entregado.
- `datos-prueba.sql`: datos de demostración.

## Instancia local

Para desarrollo se está usando una instancia PostgreSQL 18 en el puerto **5433**,
con PostGIS 3.7. Esto evita depender de la instancia del servicio de Windows que
no tiene PostGIS instalado.

- Data directory: `C:\Users\fabia\AppData\Local\EPA\pgdata`
- Base: `epa_webgis`
- Usuario: `postgres`
- Contraseña: `postgres` (autenticación local `trust`)
- Cadena de conexión usada por el backend:

```text
Host=localhost;Port=5433;Database=epa_webgis;Username=postgres;Password=postgres
```

## Iniciar / detener

```powershell
.\start-postgres.ps1
.\stop-postgres.ps1
```

## Crear desde cero

```powershell
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
& $psql -h localhost -p 5433 -U postgres -d postgres -c 'CREATE DATABASE epa_webgis;'
& $psql -h localhost -p 5433 -U postgres -d epa_webgis -v ON_ERROR_STOP=1 -f .\schema.sql
& $psql -h localhost -p 5433 -U postgres -d epa_webgis -v ON_ERROR_STOP=1 -f .\datos-prueba.sql
```

## Usuarios demo

El backend crea/actualiza estos usuarios en desarrollo:

```text
operador@epa.cl  / Epa2026!
jefatura@epa.cl  / Epa2026!
admin@epa.cl     / Epa2026!
```

Las contraseñas se almacenan con **BCrypt**.

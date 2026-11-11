$ErrorActionPreference = 'Stop'

$bin = 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe'
$data = 'C:\Users\fabia\AppData\Local\EPA\pgdata'
$postgisLib = 'C:\ProgramData\EPA\postgis\lib'

if (-not (Test-Path $data)) {
    throw "No existe el data directory de PostgreSQL: $data"
}

$env:PATH = "$postgisLib;$env:PATH"

& $bin -D $data -l "$data\server.log" -o '-p 5433' start

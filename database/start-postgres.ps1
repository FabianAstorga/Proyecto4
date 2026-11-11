$ErrorActionPreference = 'Stop'

$data = 'C:\Users\fabia\AppData\Local\EPA\pgdata'
$bin = 'C:\Program Files\PostgreSQL\18\bin'
$postgres = Join-Path $bin 'postgres.exe'
$isReady = Join-Path $bin 'pg_isready.exe'
$postgisLib = 'C:\ProgramData\EPA\postgis\lib'

if (-not (Test-Path $data)) {
    throw "No existe el data directory de PostgreSQL: $data"
}

$listening = Get-NetTCPConnection -LocalPort 5433 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    Write-Host 'PostgreSQL ya esta escuchando en el puerto 5433.'
    exit 0
}

$pidFile = Join-Path $data 'postmaster.pid'
if (Test-Path $pidFile) {
    $pidValue = Get-Content $pidFile -First 1
    if (-not (Get-Process -Id $pidValue -ErrorAction SilentlyContinue)) {
        Remove-Item $pidFile -Force
    }
}

$env:PATH = "$postgisLib;$env:PATH"
$outLog = Join-Path $env:TEMP 'epa-postgres.out.log'
$errLog = Join-Path $env:TEMP 'epa-postgres.err.log'

Start-Process -FilePath $postgres `
    -ArgumentList @('-D', $data, '-p', '5433') `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -WindowStyle Hidden

for ($i = 0; $i -lt 40; $i++) {
    & $isReady -h localhost -p 5433 -q
    if ($LASTEXITCODE -eq 0) {
        Write-Host 'PostgreSQL iniciado en el puerto 5433.'
        exit 0
    }
    Start-Sleep -Milliseconds 500
}

throw "PostgreSQL no inicio. Revisa $errLog"

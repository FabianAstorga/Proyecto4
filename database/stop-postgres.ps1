$ErrorActionPreference = 'Stop'

$bin = 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe'
$data = 'C:\Users\fabia\AppData\Local\EPA\pgdata'

& $bin -D $data stop -m fast

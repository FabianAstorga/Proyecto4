import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Columns2,
  FileImage,
  HardDrive,
  ImagePlus,
  Loader2,
  Ruler,
} from 'lucide-react';
import { ModuloButton } from '@/components/ModuloButton';
import { ModuloHeader } from '@/components/ModuloHeader';
import {
  ingestaService,
  type FotografiaDetalle,
  type VueloDetalle,
} from '@/services/ingesta.service';

const formatBytes = (bytes: number | null) => {
  if (bytes === null) return 'No disponible';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const getDimensions = (foto: FotografiaDetalle) =>
  foto.anchoPx && foto.altoPx
    ? `${foto.anchoPx} × ${foto.altoPx} px`
    : 'No disponible';

export const IngestaDetalle = () => {
  const { idVuelo } = useParams<{ idVuelo: string }>();
  const navigate = useNavigate();

  const [vuelo, setVuelo] = useState<VueloDetalle | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const id = Number(idVuelo);

    if (!Number.isFinite(id) || id <= 0) {
      setError('El identificador del lote no es válido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    ingestaService
      .obtenerVuelo(id)
      .then((detalle) => {
        if (!active) return;
        setVuelo(detalle);
        setSelectedId(detalle.fotografias[0]?.idFoto ?? null);
      })
      .catch((exception: unknown) => {
        if (!active) return;
        setError(
          exception instanceof Error
            ? exception.message
            : 'No fue posible cargar el lote.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [idVuelo]);

  const seleccionada =
    vuelo?.fotografias.find((foto) => foto.idFoto === selectedId) ??
    vuelo?.fotografias[0];

  return (
    <div className="min-h-full bg-white/95">
      <ModuloHeader
        icon={ImagePlus}
        title="Detalle del lote"
        subtitle="Revisa las imágenes incorporadas y sus metadatos antes de continuar con la comparación."
      />

      <div className="p-4 md:p-6">
        {loading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-[#0F766E]" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em]">
              Cargando lote…
            </p>
          </div>
        ) : error || !vuelo ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 border border-slate-200 bg-slate-50 p-8 text-center">
            <ImagePlus className="h-8 w-8 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">
              {error ?? 'No se encontró el lote solicitado.'}
            </p>
            <ModuloButton
              variant="secondary"
              onClick={() => navigate('/ingesta')}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a ingesta
            </ModuloButton>
          </div>
        ) : vuelo.fotografias.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 border border-slate-200 bg-slate-50 p-8 text-center">
            <ImagePlus className="h-8 w-8 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">
              Este lote no tiene imágenes cargadas.
            </p>
            <ModuloButton
              variant="secondary"
              onClick={() => navigate('/ingesta')}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a ingesta
            </ModuloButton>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0 border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Imágenes del lote
                </p>
                <p className="mt-1 text-sm font-black text-[#003B5C]">
                  {vuelo.fotografias.length}{' '}
                  {vuelo.fotografias.length === 1 ? 'archivo' : 'archivos'}
                </p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {vuelo.codigoVuelo} · {vuelo.sectorCodigo}
                </p>
              </header>

              <ul className="max-h-[380px] divide-y divide-slate-100 overflow-y-auto">
                {vuelo.fotografias.map((foto, index) => {
                  const active = foto.idFoto === seleccionada?.idFoto;
                  return (
                    <li key={foto.idFoto}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(foto.idFoto)}
                        className={
                          active
                            ? 'flex w-full items-center gap-3 bg-[#003B5C]/5 px-3 py-3 text-left'
                            : 'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50'
                        }
                      >
                        {foto.url ? (
                          <img
                            src={foto.url}
                            alt={foto.nombreArchivo}
                            className="h-12 w-12 shrink-0 border border-slate-200 object-cover"
                          />
                        ) : (
                          <span className="grid h-12 w-12 shrink-0 place-items-center border border-slate-200 bg-slate-50 text-slate-400">
                            <FileImage className="h-5 w-5" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-black uppercase tracking-wide text-[#003B5C]">
                            {foto.nombreArchivo}
                          </p>
                          <p className="mt-1 text-[9px] font-medium text-slate-500">
                            {formatBytes(foto.tamanoBytes)} ·{' '}
                            {foto.mimeType ?? 'imagen'} · Orden {index + 1}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <aside className="border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Metadatos
                </p>
                <p className="mt-1 truncate text-sm font-black text-[#003B5C]">
                  {seleccionada?.nombreArchivo}
                </p>
              </div>

              {seleccionada && (
                <div className="p-4">
                  <div className="overflow-hidden border border-slate-200 bg-slate-50">
                    {seleccionada.url ? (
                      <img
                        src={seleccionada.url}
                        alt={seleccionada.nombreArchivo}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-full flex-col items-center justify-center gap-2 text-slate-400">
                        <FileImage className="h-7 w-7" />
                        <p className="text-[9px] font-black uppercase tracking-[0.14em]">
                          Archivo no disponible
                        </p>
                      </div>
                    )}
                  </div>

                  <dl className="mt-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <FileImage className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
                      <div className="min-w-0">
                        <dt className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                          Archivo
                        </dt>
                        <dd className="mt-0.5 break-all text-[10px] font-semibold text-slate-600">
                          {seleccionada.nombreArchivo}
                        </dd>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Ruler className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
                      <div>
                        <dt className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                          Dimensiones
                        </dt>
                        <dd className="mt-0.5 text-[10px] font-semibold text-slate-600">
                          {getDimensions(seleccionada)}
                        </dd>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <HardDrive className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
                      <div>
                        <dt className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                          Tamaño
                        </dt>
                        <dd className="mt-0.5 text-[10px] font-semibold text-slate-600">
                          {formatBytes(seleccionada.tamanoBytes)}
                        </dd>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
                      <div>
                        <dt className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                          Fecha de captura
                        </dt>
                        <dd className="mt-0.5 text-[10px] font-semibold text-slate-600">
                          {formatDate(seleccionada.fechaCaptura)}
                        </dd>
                      </div>
                    </div>
                  </dl>

                  <div className="mt-5 flex flex-col gap-2">
                    <ModuloButton
                      variant="secondary"
                      onClick={() => navigate('/ingesta')}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver a ingesta
                    </ModuloButton>
                    <ModuloButton
                      onClick={() =>
                        navigate(`/comparador?idVuelo=${vuelo.idVuelo}`)
                      }
                    >
                      <Columns2 className="h-4 w-4" />
                      Ir al comparador
                    </ModuloButton>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

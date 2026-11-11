import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Columns2,
  FileDown,
  FilePlus2,
  Images,
  Layers,
  Loader2,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-react';
import { ModuloButton } from '@/components/ModuloButton';
import { ModuloHeader } from '@/components/ModuloHeader';
import { Cortina, ImpresionComparacion } from '@/components/Comparador';
import { getSector } from '@/mocks/data';
import {
  compararFotografias,
  type AlgoritmoComparador,
} from '@/services/comparison.service';
import {
  ingestaService,
  type FotografiaGaleria,
  type VueloResumen,
} from '@/services/ingesta.service';
import type { Capture, SectorId } from '@/types';
import { saveComparisonSelection } from '@/utils/reportStorage';
import { cn } from '@/utils/format';

type ComparadorModo = 'lote' | 'imagenes' | 'zona';
type Paso = 1 | 2 | 3;

const ALGORITMOS: Array<{
  value: AlgoritmoComparador;
  label: string;
  description: string;
}> = [
  {
    value: 'precision',
    label: 'Escala de Grises',
    description: 'Diferencia + ratio con agrupación de círculos.',
  },
  {
    value: 'ratio',
    label: 'Ratio',
    description: 'División de imagen A sobre imagen B.',
  },
  {
    value: 'hibrido',
    label: 'Híbrido',
    description: 'Diferencia + ratio con validación de consenso.',
  },
];

const PASOS: Array<{ numero: Paso; label: string }> = [
  { numero: 1, label: 'Origen' },
  { numero: 2, label: 'Imágenes A y B' },
  { numero: 3, label: 'Comparación' },
];

const SECTOR_IDS: Record<string, SectorId> = {
  'ZEAP-C': 'zeap-c',
  'PATIO-NORTE': 'patio-norte',
  'PATIO-SUR': 'patio-sur',
  'MUELLE-1': 'muelle-1',
  'ACCESO-VIAL': 'acceso-vial',
};

const obtenerSectorId = (codigo: string): SectorId =>
  SECTOR_IDS[codigo.toUpperCase()] ?? 'zeap-c';

const crearCaptura = (foto: FotografiaGaleria): Capture => {
  const fecha = new Date(foto.fechaCaptura);

  return {
    id: `foto-${foto.idFoto}`,
    sectorId: obtenerSectorId(foto.sectorCodigo),
    fecha: Number.isNaN(fecha.getTime())
      ? foto.fechaCaptura.slice(0, 10)
      : fecha.toISOString().slice(0, 10),
    hora: Number.isNaN(fecha.getTime())
      ? '00:00'
      : fecha.toTimeString().slice(0, 5),
    altitud: 0,
    gimbal: 0,
    lat: 0,
    lng: 0,
    archivo: foto.nombreArchivo,
    src: foto.url,
    vuelo: foto.codigoVuelo,
    operador: 'Operador EPA',
  };
};

const formatearBytes = (bytes: number | null) => {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatearDimensiones = (foto: FotografiaGaleria) =>
  foto.anchoPx && foto.altoPx ? `${foto.anchoPx}×${foto.altoPx}` : '—';

export const Comparador = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryIdVuelo = searchParams.get('idVuelo');

  const [paso, setPaso] = useState<Paso>(1);
  const [modo, setModo] = useState<ComparadorModo>('lote');
  const [algoritmo, setAlgoritmo] = useState<AlgoritmoComparador>('precision');
  const [vuelos, setVuelos] = useState<VueloResumen[]>([]);
  const [fotos, setFotos] = useState<FotografiaGaleria[]>([]);
  const [idVuelo, setIdVuelo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [fotoA, setFotoA] = useState<FotografiaGaleria | null>(null);
  const [fotoB, setFotoB] = useState<FotografiaGaleria | null>(null);
  const [urlProcesada, setUrlProcesada] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [errorProceso, setErrorProceso] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      ingestaService.listarVuelos(),
      ingestaService.listarFotografias(),
    ])
      .then(([lotes, todasLasFotos]) => {
        if (!active) return;

        setVuelos(lotes);
        setFotos(todasLasFotos);

        const queryId = Number(queryIdVuelo);
        const inicial =
          lotes.find((lote) => lote.idVuelo === queryId) ?? lotes[0];

        setIdVuelo(inicial ? String(inicial.idVuelo) : '');
      })
      .catch((exception: unknown) => {
        if (!active) return;
        setErrorCarga(
          exception instanceof Error
            ? exception.message
            : 'No fue posible cargar los lotes y fotografías.',
        );
      })
      .finally(() => {
        if (active) setCargando(false);
      });

    return () => {
      active = false;
    };
  }, [queryIdVuelo]);

  const fotosFiltradas = useMemo(() => {
    if (modo !== 'lote') return fotos;
    const seleccionado = Number(idVuelo);
    return fotos.filter((foto) => foto.idVuelo === seleccionado);
  }, [fotos, idVuelo, modo]);

  const vueloSeleccionado = vuelos.find(
    (vuelo) => vuelo.idVuelo === Number(idVuelo),
  );

  const lotesConFotos = new Set(fotos.map((foto) => foto.idVuelo)).size;

  const sectorId = fotoA
    ? obtenerSectorId(fotoA.sectorCodigo)
    : fotoB
      ? obtenerSectorId(fotoB.sectorCodigo)
      : vueloSeleccionado
        ? obtenerSectorId(vueloSeleccionado.sectorCodigo)
        : '';

  const sector = sectorId ? getSector(sectorId) : undefined;

  const capturaA = fotoA ? crearCaptura(fotoA) : null;
  const capturaProcesada: Capture | null =
    capturaA && urlProcesada
      ? {
          ...capturaA,
          id: 'deteccion-cambios',
          archivo: 'Detección de cambios',
          src: urlProcesada,
        }
      : null;
  const comparacion =
    capturaA && capturaProcesada
      ? { captureA: capturaA, captureB: capturaProcesada }
      : null;

  useEffect(
    () => () => {
      if (urlProcesada) URL.revokeObjectURL(urlProcesada);
    },
    [urlProcesada],
  );

  useEffect(() => {
    if (paso !== 3 || !fotoA || !fotoB) {
      setUrlProcesada(null);
      setErrorProceso(null);
      setProcesando(false);
      return;
    }

    const controller = new AbortController();
    setUrlProcesada(null);
    setErrorProceso(null);
    setProcesando(true);

    compararFotografias(fotoA.idFoto, fotoB.idFoto, algoritmo, controller.signal)
      .then(({ imagen }) => {
        if (controller.signal.aborted) return;
        setUrlProcesada(URL.createObjectURL(imagen));
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setErrorProceso(
          error instanceof Error
            ? error.message
            : 'No fue posible procesar las imágenes.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setProcesando(false);
      });

    return () => controller.abort();
  }, [paso, fotoA, fotoB, algoritmo]);

  const cambiarModo = (next: ComparadorModo) => {
    setModo(next);
    setPaso(1);
    setFotoA(null);
    setFotoB(null);
  };

  const cambiarVuelo = (value: string) => {
    setIdVuelo(value);
    setFotoA(null);
    setFotoB(null);
  };

  const seleccionarFoto = (slot: 'A' | 'B', foto: FotografiaGaleria) => {
    if (slot === 'A') {
      setFotoA((actual) => (actual?.idFoto === foto.idFoto ? null : foto));
      if (fotoB?.idFoto === foto.idFoto) setFotoB(null);
    } else {
      setFotoB((actual) => (actual?.idFoto === foto.idFoto ? null : foto));
      if (fotoA?.idFoto === foto.idFoto) setFotoA(null);
    }
  };

  const incluirEnReporte = () => {
    if (!comparacion || !capturaA || !capturaProcesada || !sectorId) return;
    saveComparisonSelection({
      sectorId,
      captureAId: capturaA.id,
      captureBId: capturaProcesada.id,
      captureADate: capturaA.fecha,
      captureBDate: capturaProcesada.fecha,
    });
    navigate('/reportes/nuevo', { state: { fromComparator: true } });
  };

  const puedeContinuar =
    modo === 'lote'
      ? Boolean(idVuelo) && fotosFiltradas.length > 0
      : modo === 'imagenes'
        ? fotos.length > 0
        : false;

  const sinDatos = !cargando && fotos.length === 0;

  return (
    <>
      <div className="min-h-full bg-white/95">
        <ModuloHeader
          icon={Columns2}
          title={
            <>
              Comparador <span className="text-[#7DD3FC]">visual</span>
            </>
          }
          subtitle="Selecciona un lote o fotografías ya cargadas para contrastarlas y revisar los cambios detectados."
        />

        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            {PASOS.map((item, index) => {
              const activo = paso === item.numero;
              const completado = paso > item.numero;

              return (
                <div key={item.numero} className="flex flex-1 items-center gap-2">
                  <span
                    className={cn(
                      'grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-black',
                      activo
                        ? 'bg-[#003B5C] text-white'
                        : completado
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-slate-200 text-slate-500',
                    )}
                  >
                    {completado ? <Check className="h-3.5 w-3.5" /> : item.numero}
                  </span>
                  <span
                    className={cn(
                      'hidden text-[9px] font-black uppercase tracking-[0.14em] sm:block',
                      activo
                        ? 'text-[#003B5C]'
                        : completado
                          ? 'text-[#0F766E]'
                          : 'text-slate-400',
                    )}
                  >
                    {item.label}
                  </span>
                  {index < PASOS.length - 1 && (
                    <span
                      className={cn(
                        'mx-1 h-px flex-1',
                        paso > item.numero ? 'bg-[#0F766E]/30' : 'bg-slate-200',
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 md:p-6">
          {paso === 1 && (
            <section className="border border-slate-200 bg-white shadow-sm">
              <header className="flex items-center gap-4 border-b border-slate-200 px-4 py-4 md:px-6">
                <span className="grid h-10 w-10 shrink-0 place-items-center bg-[#002855] text-sm font-black text-white">
                  01
                </span>
                <div>
                  <h2 className="text-xl font-black uppercase leading-none tracking-tighter text-[#002855] md:text-2xl">
                    Selecciona el origen
                  </h2>
                  <p className="mt-1 text-[10px] font-medium text-slate-500">
                    Elige si compararás un lote completo, imágenes sueltas o una zona.
                  </p>
                </div>
              </header>

              <div className="space-y-5 p-4 md:p-6">
                <div className="grid gap-2 sm:grid-cols-3">
                  <ModoBoton
                    active={modo === 'lote'}
                    icon={Layers}
                    label="Por lote"
                    onClick={() => cambiarModo('lote')}
                  />
                  <ModoBoton
                    active={modo === 'imagenes'}
                    icon={Images}
                    label="Por imagen"
                    onClick={() => cambiarModo('imagenes')}
                  />
                  <ModoBoton
                    active={modo === 'zona'}
                    icon={MapPin}
                    label="Por zona"
                    hint="Pronto"
                    onClick={() => cambiarModo('zona')}
                  />
                </div>

                <div className="border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Método de comparación
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {ALGORITMOS.map((opcion) => (
                      <OpcionAlgoritmo
                        key={opcion.value}
                        active={algoritmo === opcion.value}
                        label={opcion.label}
                        description={opcion.description}
                        value={opcion.value}
                        onChange={setAlgoritmo}
                      />
                    ))}
                  </div>
                </div>

                {modo === 'lote' && (
                  <div className="flex flex-col gap-3 border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Lote de ingesta
                      </p>
                      <p className="mt-1 text-[10px] font-medium text-slate-400">
                        {vueloSeleccionado
                          ? `${vueloSeleccionado.totalArchivos} imágenes`
                          : 'Selecciona un lote cargado'}
                      </p>
                    </div>
                    <select
                      value={idVuelo}
                      onChange={(event) => cambiarVuelo(event.target.value)}
                      disabled={cargando || vuelos.length === 0}
                      className="min-w-[280px] border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-[#003B5C] outline-none transition-colors focus:border-[#0F766E] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {vuelos.length === 0 && (
                        <option value="">Sin lotes con imágenes</option>
                      )}
                      {vuelos.map((vuelo) => (
                        <option key={vuelo.idVuelo} value={vuelo.idVuelo}>
                          {vuelo.codigoVuelo} · {vuelo.sectorCodigo}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {modo === 'imagenes' && (
                  <div className="border border-sky-200 bg-sky-50 px-4 py-3 text-[10px] font-medium leading-relaxed text-sky-800">
                    Se mostrarán todas las fotografías almacenadas en el sistema,
                    combinando todos los lotes. Actualmente hay {fotos.length}{' '}
                    imágenes en {lotesConFotos} lotes.
                  </div>
                )}

                {modo === 'zona' && (
                  <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                    <MapPin className="h-7 w-7 text-slate-400" />
                    <p className="text-sm font-black text-slate-600">
                      Comparación por zona
                    </p>
                    <p className="max-w-md text-[11px] font-medium text-slate-500">
                      Estará disponible cuando las fotografías tengan coordenadas
                      geográficas y podamos filtrarlas con PostGIS.
                    </p>
                  </div>
                )}

                {errorCarga && (
                  <div
                    role="alert"
                    className="border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
                  >
                    {errorCarga}
                  </div>
                )}
              </div>

              <footer className="flex justify-end border-t border-slate-200 px-4 py-3 md:px-6">
                <ModuloButton
                  onClick={() => setPaso(2)}
                  disabled={!puedeContinuar}
                >
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </ModuloButton>
              </footer>
            </section>
          )}

          {paso === 2 && (
            <section className="border border-slate-200 bg-white shadow-sm">
              <header className="flex items-center gap-4 border-b border-slate-200 px-4 py-4 md:px-6">
                <span className="grid h-10 w-10 shrink-0 place-items-center bg-[#002855] text-sm font-black text-white">
                  02
                </span>
                <div>
                  <h2 className="text-xl font-black uppercase leading-none tracking-tighter text-[#002855] md:text-2xl">
                    Elige las imágenes A y B
                  </h2>
                  <p className="mt-1 text-[10px] font-medium text-slate-500">
                    Usa los botones de cada fila para asignar una imagen a cada lado.
                  </p>
                </div>
              </header>

              <div className="p-4 md:p-6">
                {modo === 'imagenes' && (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border border-sky-200 bg-sky-50 px-3 py-2.5">
                    <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-sky-800">
                      <Images className="h-3.5 w-3.5" />
                      Todas las imágenes del sistema
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-sky-700/70">
                      {fotos.length} imágenes · {lotesConFotos} lotes
                    </span>
                  </div>
                )}

                <div className="mb-4 grid gap-2 sm:grid-cols-2">
                  <ResumenSeleccion
                    slot="A"
                    foto={fotoA}
                    onClear={() => setFotoA(null)}
                  />
                  <ResumenSeleccion
                    slot="B"
                    foto={fotoB}
                    onClear={() => setFotoB(null)}
                  />
                </div>

                {cargando ? (
                  <div className="flex min-h-[140px] items-center justify-center gap-3 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-[#0F766E]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.16em]">
                      Cargando fotografías…
                    </span>
                  </div>
                ) : sinDatos ? (
                  <div className="flex min-h-[140px] flex-col items-center justify-center gap-3 border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                    <Images className="h-7 w-7 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-600">
                      Todavía no hay fotografías cargadas.
                    </p>
                    <ModuloButton
                      variant="secondary"
                      onClick={() => navigate('/ingesta')}
                    >
                      <FilePlus2 className="h-4 w-4" />
                      Ir a ingesta
                    </ModuloButton>
                  </div>
                ) : fotosFiltradas.length === 0 ? (
                  <div className="flex min-h-[140px] flex-col items-center justify-center gap-3 border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                    <Layers className="h-7 w-7 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-600">
                      Este lote no tiene fotografías disponibles.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 border border-slate-200 bg-white">
                    {fotosFiltradas.map((foto, index) => {
                      const esA = fotoA?.idFoto === foto.idFoto;
                      const esB = fotoB?.idFoto === foto.idFoto;

                      return (
                        <li
                          key={foto.idFoto}
                          className={cn(
                            'flex flex-wrap items-center gap-3 px-3 py-3 transition-colors sm:flex-nowrap',
                            esA
                              ? 'bg-blue-50/80'
                              : esB
                                ? 'bg-amber-50/70'
                                : 'hover:bg-slate-50',
                          )}
                        >
                          <span className="w-5 shrink-0 text-center font-mono text-[9px] font-bold text-slate-400">
                            {String(index + 1).padStart(2, '0')}
                          </span>

                          <div className="relative shrink-0 overflow-hidden border border-slate-200 bg-slate-100">
                            <img
                              src={foto.url}
                              alt={foto.nombreArchivo}
                              className="h-14 w-20 object-cover"
                            />
                            {esA && (
                              <span className="absolute left-0 top-0 bg-blue-600 px-1.5 py-0.5 text-[8px] font-black text-white shadow">
                                A
                              </span>
                            )}
                            {esB && (
                              <span className="absolute right-0 top-0 bg-[#ffd700] px-1.5 py-0.5 text-[8px] font-black text-[#001a35] shadow">
                                B
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-[11px] font-black uppercase tracking-wide text-[#003B5C]"
                              title={foto.nombreArchivo}
                            >
                              {foto.nombreArchivo}
                            </p>
                            <p className="mt-1 truncate text-[9px] font-medium text-slate-400">
                              {foto.codigoVuelo} · {formatearBytes(foto.tamanoBytes)} ·{' '}
                              {formatearDimensiones(foto)}
                            </p>
                          </div>

                          <div className="ml-auto flex shrink-0 items-center gap-1.5">
                            <SelectorFotoBoton
                              active={esA}
                              label="A"
                              tone="A"
                              onClick={() => seleccionarFoto('A', foto)}
                            />
                            <SelectorFotoBoton
                              active={esB}
                              label="B"
                              tone="B"
                              onClick={() => seleccionarFoto('B', foto)}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 md:px-6">
                <ModuloButton variant="secondary" onClick={() => setPaso(1)}>
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </ModuloButton>
                <ModuloButton
                  onClick={() => setPaso(3)}
                  disabled={!fotoA || !fotoB}
                >
                  Aplicar comparación
                  <ArrowRight className="h-4 w-4" />
                </ModuloButton>
              </footer>
            </section>
          )}

          {paso === 3 && (
            <section className="border border-slate-200 bg-white shadow-sm">
              <div className="space-y-5 p-4 md:p-6">
                <div className="grid gap-2 sm:grid-cols-2">
                  <ResumenSeleccion
                    slot="A"
                    foto={fotoA}
                    onClear={() => {
                      setFotoA(null);
                      setPaso(2);
                    }}
                  />
                  <ResumenSeleccion
                    slot="B"
                    foto={fotoB}
                    onClear={() => {
                      setFotoB(null);
                      setPaso(2);
                    }}
                  />
                </div>

                {procesando && (
                  <div className="flex items-center gap-3 border border-sky-200 bg-sky-50 px-4 py-3 text-sky-800">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.16em]">
                      Procesando imágenes y detectando cambios…
                    </p>
                  </div>
                )}

                {errorProceso && (
                  <div
                    role="alert"
                    className="border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
                  >
                    {errorProceso}
                  </div>
                )}

                {comparacion && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="space-y-3"
                  >
                    <div className="border border-white/10 bg-[#001a35] p-2 shadow-2xl md:p-3">
                      <Cortina
                        key={`${comparacion.captureA.id}-${comparacion.captureB.id}`}
                        captureA={comparacion.captureA}
                        captureB={comparacion.captureB}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={incluirEnReporte}
                        disabled={!sectorId}
                        title="Ingresar en reporte"
                        aria-label="Ingresar en reporte"
                        className="grid h-10 w-10 place-items-center border border-[#003B5C] bg-[#003B5C] text-white transition-colors hover:bg-[#002B45] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FilePlus2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        title="Exportar incidencia a PDF"
                        aria-label="Exportar incidencia a PDF"
                        className="grid h-10 w-10 place-items-center border border-slate-200 bg-white text-slate-500 transition-colors hover:border-[#0F766E]/40 hover:text-[#0F766E]"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/reportes/nuevo')}
                        title="Ir a reportes"
                        aria-label="Ir a reportes"
                        className="grid h-10 w-10 place-items-center border border-slate-200 bg-white text-slate-500 transition-colors hover:border-[#0F766E]/40 hover:text-[#0F766E]"
                      >
                        <ClipboardList className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 md:px-6">
                <ModuloButton variant="secondary" onClick={() => setPaso(2)}>
                  <ArrowLeft className="h-4 w-4" />
                  Volver a selección
                </ModuloButton>
                <ModuloButton
                  variant="secondary"
                  onClick={() => {
                    setFotoA(null);
                    setFotoB(null);
                    setPaso(1);
                  }}
                >
                  Cambiar origen
                </ModuloButton>
              </footer>
            </section>
          )}
        </div>
      </div>

      {comparacion && (
        <ImpresionComparacion
          sectorName={sector?.nombre ?? vueloSeleccionado?.sectorCodigo ?? 'Sector EPA'}
          captureA={comparacion.captureA}
          captureB={comparacion.captureB}
        />
      )}
    </>
  );
};

const OpcionAlgoritmo = ({
  active,
  label,
  description,
  value,
  onChange,
}: {
  active: boolean;
  label: string;
  description: string;
  value: AlgoritmoComparador;
  onChange: (value: AlgoritmoComparador) => void;
}) => (
  <label
    className={cn(
      'flex cursor-pointer items-start gap-2.5 border p-3 transition-colors',
      active
        ? 'border-[#003B5C] bg-[#003B5C] text-white'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
    )}
  >
    <input
      type="radio"
      name="algoritmo-comparacion"
      value={value}
      checked={active}
      onChange={() => onChange(value)}
      className="sr-only"
    />
    <span
      className={cn(
        'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border',
        active ? 'border-white bg-white' : 'border-slate-300 bg-white',
      )}
    >
      {active && <span className="h-2 w-2 rounded-full bg-[#003B5C]" />}
    </span>
    <span className="min-w-0">
      <span className="block text-[10px] font-black uppercase tracking-[0.14em]">
        {label}
      </span>
      <span
        className={cn(
          'mt-1 block text-[9px] font-medium leading-relaxed',
          active ? 'text-white/65' : 'text-slate-400',
        )}
      >
        {description}
      </span>
    </span>
  </label>
);

const ModoBoton = ({
  active,
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  icon: typeof Layers;
  label: string;
  hint?: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex items-center justify-between gap-3 border px-4 py-3 text-left transition-colors',
      active
        ? 'border-[#003B5C] bg-[#003B5C] text-white'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
    )}
  >
    <span className="flex items-center gap-2.5">
      <Icon className="h-4 w-4" />
      <span className="text-[10px] font-black uppercase tracking-[0.16em]">
        {label}
      </span>
    </span>
    {hint && (
      <span
        className={cn(
          'border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider',
          active
            ? 'border-white/20 text-white/70'
            : 'border-slate-200 text-slate-400',
        )}
      >
        {hint}
      </span>
    )}
  </button>
);

const SelectorFotoBoton = ({
  active,
  label,
  tone,
  onClick,
}: {
  active: boolean;
  label: string;
  tone: 'A' | 'B';
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'border px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] transition-colors',
      active
        ? tone === 'A'
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-amber-400 bg-[#ffd700] text-[#001a35]'
        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
    )}
  >
    {active ? `Quitar ${label}` : `Usar ${label}`}
  </button>
);

const ResumenSeleccion = ({
  slot,
  foto,
  onClear,
}: {
  slot: 'A' | 'B';
  foto: FotografiaGaleria | null;
  onClear: () => void;
}) => (
  <div
    className={cn(
      'flex items-center gap-3 border px-3 py-2',
      foto
        ? slot === 'A'
          ? 'border-blue-200 bg-blue-50/60'
          : 'border-amber-200 bg-amber-50/60'
        : 'border-slate-200 bg-slate-50',
    )}
  >
    <span
      className={cn(
        'grid h-7 w-7 shrink-0 place-items-center text-[10px] font-black',
        slot === 'A'
          ? 'bg-blue-600 text-white'
          : 'bg-[#ffd700] text-[#001a35]',
      )}
    >
      {slot}
    </span>

    {foto ? (
      <img
        src={foto.url}
        alt={`Imagen ${slot}`}
        className="h-10 w-14 shrink-0 border border-slate-200 object-cover"
      />
    ) : (
      <span className="grid h-10 w-14 shrink-0 place-items-center border border-slate-200 bg-white text-slate-300">
        <Images className="h-4 w-4" />
      </span>
    )}

    <div className="min-w-0 flex-1">
      <p className="truncate text-[10px] font-black uppercase tracking-wide text-[#003B5C]">
        {foto?.nombreArchivo ?? `Sin imagen ${slot}`}
      </p>
      <p className="mt-0.5 truncate text-[9px] font-medium text-slate-400">
        {foto ? `${foto.codigoVuelo} · ${formatearBytes(foto.tamanoBytes)}` : 'Pendiente de seleccionar'}
      </p>
    </div>

    {foto && (
      <button
        type="button"
        onClick={onClear}
        aria-label={`Quitar imagen ${slot}`}
        className="grid h-6 w-6 shrink-0 place-items-center text-slate-400 transition-colors hover:text-red-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

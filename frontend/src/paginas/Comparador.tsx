import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Columns2,
  FileDown,
  FilePlus2,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { ModuloButton } from '@/components/ModuloButton';
import { ModuloHeader } from '@/components/ModuloHeader';
import {
  Cortina,
  ImpresionComparacion,
  SelectorCaptura,
  SelectorLugar,
} from '@/components/Comparador';
import { getSector } from '@/mocks/data';
import { processComparison } from '@/services/comparison.service';
import type { Capture, SectorId } from '@/types';
import { saveComparisonSelection } from '@/utils/reportStorage';

export const Comparador = () => {
  const navigate = useNavigate();

  const [sectorId, setSectorId] = useState<SectorId | ''>('');
  const [captureA, setCaptureA] = useState<Capture | null>(null);
  const [captureB, setCaptureB] = useState<Capture | null>(null);
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [changeCount, setChangeCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  const sector = sectorId ? getSector(sectorId) : undefined;

  const processedCapture: Capture | null =
    captureA && processedUrl
      ? {
          ...captureA,
          id: 'deteccion-cambios',
          archivo: 'Detección de cambios',
          src: processedUrl,
        }
      : null;

  const comparison =
    captureA && processedCapture
      ? { captureA, captureB: processedCapture }
      : null;

  useEffect(
    () => () => {
      if (captureA) URL.revokeObjectURL(captureA.src);
    },
    [captureA],
  );

  useEffect(
    () => () => {
      if (captureB) URL.revokeObjectURL(captureB.src);
    },
    [captureB],
  );

  useEffect(
    () => () => {
      if (processedUrl) URL.revokeObjectURL(processedUrl);
    },
    [processedUrl],
  );

  useEffect(() => {
    if (!fileA || !fileB) {
      setProcessedUrl(null);
      setChangeCount(0);
      setProcessError(null);
      setProcessing(false);
      return;
    }

    const controller = new AbortController();
    setProcessedUrl(null);
    setChangeCount(0);
    setProcessError(null);
    setProcessing(true);

    processComparison(fileA, fileB, controller.signal)
      .then(({ image, changes }) => {
        if (controller.signal.aborted) return;
        setProcessedUrl(URL.createObjectURL(image));
        setChangeCount(changes);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setProcessError(
          error instanceof Error
            ? error.message
            : 'No fue posible procesar las imágenes.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setProcessing(false);
      });

    return () => controller.abort();
  }, [fileA, fileB]);

  const changeSector = (value: SectorId | '') => {
    setSectorId(value);
  };

  const loadImage = (slot: 'A' | 'B', file: File) => {
    if (!file.type.startsWith('image/')) return;

    const now = new Date();
    const capture: Capture = {
      id: `carga-${slot}-${now.getTime()}`,
      sectorId: sectorId || 'patio-norte',
      fecha: now.toISOString().slice(0, 10),
      hora: now.toTimeString().slice(0, 5),
      altitud: 0,
      gimbal: 0,
      lat: 0,
      lng: 0,
      archivo: file.name,
      src: URL.createObjectURL(file),
      vuelo: 'Carga local',
      operador: 'Carga local',
    };

    if (slot === 'A') {
      setCaptureA(capture);
      setFileA(file);
    } else {
      setCaptureB(capture);
      setFileB(file);
    }
  };

  const clearImage = (slot: 'A' | 'B') => {
    if (slot === 'A') {
      setCaptureA(null);
      setFileA(null);
    } else {
      setCaptureB(null);
      setFileB(null);
    }
  };

  const includeInReport = () => {
    if (!comparison || !captureA || !captureB || !sectorId) return;
    saveComparisonSelection({
      sectorId,
      captureAId: captureA.id,
      captureBId: captureB.id,
      captureADate: captureA.fecha,
      captureBDate: captureB.fecha,
    });
    navigate('/reportes/nuevo', { state: { fromComparator: true } });
  };

  return (
    <>
      <div className="min-h-full bg-white/95">
        <ModuloHeader
          icon={Columns2}
          eyebrow="Módulo de inspección"
          title={
            <>
              Comparador <span className="text-[#7DD3FC]">visual</span>
            </>
          }
          subtitle="Selecciona un lugar y carga dos imágenes desde tu computador para contrastarlas y revisar los cambios."
        />

        <div className="space-y-6 p-4 md:p-6">
          <section className="border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center gap-4 border-b border-slate-200 px-4 py-4 md:px-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center bg-[#002855] text-sm font-black text-white">
              01
            </span>
            <h2 className="text-xl font-black uppercase leading-none tracking-tighter text-[#002855] md:text-2xl">
              Escoge lugar y carga las imágenes
            </h2>
          </header>

          <div className="space-y-5 p-4 md:p-6">
            <div className="max-w-md">
              <span className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                <MapPin className="h-3 w-3 text-slate-300" />
                Lugar
              </span>
              <SelectorLugar value={sectorId} onChange={changeSector} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SelectorCaptura
                slot="A"
                label="Imagen A"
                capture={captureA}
                onFileSelected={(file) => loadImage('A', file)}
                onClear={() => clearImage('A')}
              />
              <SelectorCaptura
                slot="B"
                label="Imagen B"
                capture={captureB}
                onFileSelected={(file) => loadImage('B', file)}
                onClear={() => clearImage('B')}
              />
            </div>

            {processing && (
              <div className="flex items-center gap-3 border border-sky-200 bg-sky-50 px-4 py-3 text-sky-800">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em]">
                  Procesando imágenes y detectando cambios…
                </p>
              </div>
            )}

            {processError && (
              <div
                role="alert"
                className="border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
              >
                {processError}
              </div>
            )}
          </div>
        </section>

        {comparison && (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                Imagen A original vs. detección de cambios
              </p>
              <span className="border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
                {changeCount} cambios detectados
              </span>
            </div>

            <div className="border border-white/10 bg-[#001a35] p-2 shadow-2xl md:p-3">
              <Cortina
                key={`${comparison.captureA.id}-${comparison.captureB.id}`}
                captureA={comparison.captureA}
                captureB={comparison.captureB}
              />
            </div>

            <div className="grid gap-2 border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-3">
              <ModuloButton
                onClick={includeInReport}
                disabled={!sectorId}
                className="w-full"
              >
                <FilePlus2 className="h-4 w-4" />
                Ingresar en reporte
              </ModuloButton>
              <ModuloButton
                variant="secondary"
                onClick={() => window.print()}
                className="w-full"
              >
                <FileDown className="h-4 w-4" />
                Exportar incidencia a PDF
              </ModuloButton>
              <ModuloButton
                variant="secondary"
                onClick={() => navigate('/reportes/nuevo')}
                className="w-full"
              >
                <ClipboardList className="h-4 w-4" />
                Ir a reportes
              </ModuloButton>
            </div>
          </motion.section>
        )}
        </div>
      </div>

      {comparison && (
        <ImpresionComparacion
          sectorName={sector?.nombre ?? 'Sector EPA'}
          captureA={comparison.captureA}
          captureB={comparison.captureB}
        />
      )}
    </>
  );
};

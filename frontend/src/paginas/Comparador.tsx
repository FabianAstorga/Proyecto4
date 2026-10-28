import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  ClipboardList,
  FileDown,
  FilePlus2,
  MapPin,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import {
  Cortina,
  ImpresionComparacion,
  SelectorCaptura,
  SelectorLugar,
} from '@/components/Comparador';
import { CAPTURES, getSector } from '@/mocks/data';
import type { Capture, SectorId } from '@/types';
import { saveComparisonSelection } from '@/utils/reportStorage';

const HEADER_IMAGES = CAPTURES.filter((capture) =>
  capture.id.endsWith('-b'),
).map((capture) => capture.src);

const DATE_INPUT =
  'w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-[#002855] focus:bg-white focus:ring-2 focus:ring-blue-100';

export const Comparador = () => {
  const navigate = useNavigate();

  const [sectorId, setSectorId] = useState<SectorId | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [captureADate, setCaptureADate] = useState('');
  const [captureBDate, setCaptureBDate] = useState('');

  const sector = sectorId ? getSector(sectorId) : undefined;
  const rangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);
  const datesComplete = Boolean(fromDate && toDate && !rangeInvalid);
  const baseReady = Boolean(sectorId && datesComplete);

  const sectorCaptures = useMemo(
    () =>
      sectorId
        ? CAPTURES.filter((capture) => capture.sectorId === sectorId)
        : [],
    [sectorId],
  );

  const buildCapture = (
    variant: 'A' | 'B',
    date: string,
  ): Capture | undefined => {
    if (!sectorId || !date || sectorCaptures.length === 0) return undefined;
    const base =
      (variant === 'A' ? sectorCaptures[0] : sectorCaptures[1]) ??
      sectorCaptures[0];

    return {
      ...base,
      id: `${variant}-${date}`,
      fecha: date,
      archivo: `${sectorId}_${variant}_${date}.JPG`,
    };
  };

  const captureA = buildCapture('A', captureADate);
  const captureB = buildCapture('B', captureBDate);

  const comparison =
    captureA && captureB && captureADate < captureBDate
      ? { captureA, captureB }
      : null;

  const changeSector = (value: SectorId | '') => {
    setSectorId(value);
    setCaptureADate('');
    setCaptureBDate('');
  };

  const changeFromDate = (value: string) => {
    setFromDate(value);
    setCaptureADate('');
    setCaptureBDate('');
  };

  const changeToDate = (value: string) => {
    setToDate(value);
    setCaptureADate('');
    setCaptureBDate('');
  };

  const changeADate = (value: string) => {
    setCaptureADate(value);
    if (value && captureBDate && value >= captureBDate) {
      setCaptureBDate('');
    }
  };

  const changeBDate = (value: string) => {
    setCaptureBDate(value);
    if (value && captureADate && value <= captureADate) {
      setCaptureADate('');
    }
  };

  const includeInReport = () => {
    if (!comparison || !sectorId || sectorCaptures.length === 0) return;
    saveComparisonSelection({
      sectorId,
      captureAId: sectorCaptures[0].id,
      captureBId: (sectorCaptures[1] ?? sectorCaptures[0]).id,
      captureADate,
      captureBDate,
    });
    navigate('/reportes/nuevo', { state: { fromComparator: true } });
  };

  return (
    <>
      <PageHeader
        title="Comparador"
        accent="temporal"
        description="Selecciona un lugar y un rango de fechas para contrastar dos capturas del mismo sector y revisar los cambios."
        carouselImages={HEADER_IMAGES}
      />

      <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-7 md:px-8 md:py-9">
        <section className="border border-slate-200 bg-white shadow-xl">
          <header className="flex items-center gap-4 border-b border-slate-200 px-4 py-4 md:px-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center bg-[#002855] text-sm font-black text-white">
              01
            </span>
            <h2 className="text-xl font-black uppercase leading-none tracking-tighter text-[#002855] md:text-2xl">
              Escoge lugar y fecha
            </h2>
          </header>

          <div className="space-y-5 p-4 md:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                  <MapPin className="h-3 w-3 text-slate-300" />
                  Lugar
                </span>
                <SelectorLugar value={sectorId} onChange={changeSector} />
              </div>

              <div>
                <span className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                  <CalendarDays className="h-3 w-3 text-slate-300" />
                  Rango de fechas
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-slate-400">
                      Desde
                    </span>
                    <input
                      type="date"
                      value={fromDate}
                      max={toDate || undefined}
                      onChange={(event) => changeFromDate(event.target.value)}
                      className={DATE_INPUT}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-slate-400">
                      Hasta
                    </span>
                    <input
                      type="date"
                      value={toDate}
                      min={fromDate || undefined}
                      onChange={(event) => changeToDate(event.target.value)}
                      className={DATE_INPUT}
                    />
                  </label>
                </div>
                {rangeInvalid && (
                  <p className="mt-2 text-[9px] font-medium text-red-600">
                    La fecha desde debe ser anterior a la fecha hasta.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SelectorCaptura
                slot="A"
                label="Fecha anterior"
                date={captureADate}
                onChange={changeADate}
                capture={captureA}
                enabled={baseReady}
                min={fromDate || undefined}
                max={captureBDate || toDate || undefined}
              />
              <SelectorCaptura
                slot="B"
                label="Fecha posterior"
                date={captureBDate}
                onChange={changeBDate}
                capture={captureB}
                enabled={baseReady}
                min={captureADate || fromDate || undefined}
                max={toDate || undefined}
              />
            </div>
          </div>
        </section>

        {comparison && (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-3"
          >
            <div className="border border-white/10 bg-[#001a35] p-2 shadow-2xl md:p-3">
              <Cortina
                key={`${comparison.captureA.id}-${comparison.captureB.id}`}
                captureA={comparison.captureA}
                captureB={comparison.captureB}
              />
            </div>

            <div className="grid gap-2 border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-3">
              <button
                type="button"
                onClick={includeInReport}
                className="flex items-center justify-center gap-2 bg-[#003385] px-4 py-3.5 text-[9px] font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#002a66]"
              >
                <FilePlus2 className="h-4 w-4" />
                Ingresar en reporte
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-3.5 text-[9px] font-black uppercase tracking-[0.16em] text-slate-600 transition-colors hover:border-slate-300 hover:text-[#002855]"
              >
                <FileDown className="h-4 w-4" />
                Exportar incidencia a PDF
              </button>
              <button
                type="button"
                onClick={() => navigate('/reportes/nuevo')}
                className="flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-3.5 text-[9px] font-black uppercase tracking-[0.16em] text-slate-600 transition-colors hover:border-slate-300 hover:text-[#002855]"
              >
                <ClipboardList className="h-4 w-4" />
                Ir a reportes
              </button>
            </div>
          </motion.section>
        )}
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

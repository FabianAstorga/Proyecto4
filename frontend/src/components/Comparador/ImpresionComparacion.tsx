import type { Capture } from '@/types';
import { cn, formatDateShort } from '@/utils/format';

export const ImpresionComparacion = ({
  sectorName,
  captureA,
  captureB,
}: {
  sectorName: string;
  captureA: Capture;
  captureB: Capture;
}) => (
  <div
    id="comparison-print-area"
    className="comparison-print print-exact bg-white p-[14mm] text-slate-900"
  >
    <header className="flex items-start justify-between gap-6 border-b-4 border-[#002855] pb-4">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.24em] text-blue-700">
          EPA WebGIS
        </p>
        <h1 className="mt-1 text-2xl font-black uppercase tracking-tighter text-[#002855]">
          Comparación temporal
        </h1>
      </div>
      <div className="text-right">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
          {sectorName}
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-slate-400">
          {formatDateShort(captureA.fecha)} — {formatDateShort(captureB.fecha)}
        </p>
      </div>
    </header>

    <div className="mt-6 grid grid-cols-2 gap-4">
      {[
        { capture: captureA, label: 'A', hint: 'Fecha anterior' },
        { capture: captureB, label: 'B', hint: 'Fecha posterior' },
      ].map(({ capture, label, hint }) => (
        <figure key={label} className="border border-slate-200">
          <div className="relative aspect-[16/9]">
            <img
              src={capture.src}
              alt={`Captura ${label}`}
              className="h-full w-full object-cover"
            />
            <span
              className={cn(
                'absolute left-2 top-2 grid h-5 w-5 place-items-center text-[8px] font-black',
                label === 'A'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#ffd700] text-[#001a35]',
              )}
            >
              {label}
            </span>
          </div>
          <figcaption className="flex items-center justify-between gap-2 px-2 py-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
              {hint}
            </span>
            <span className="font-mono text-[8px] font-bold text-slate-500">
              {formatDateShort(capture.fecha)}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>

    <footer className="mt-8 border-t border-slate-200 pt-3 text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400">
      Documento generado desde el prototipo EPA WebGIS
    </footer>
  </div>
);


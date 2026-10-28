import { Image as ImageIcon } from 'lucide-react';
import type { Capture } from '@/types';
import { cn, formatDateShort } from '@/utils/format';

interface CaptureSlotProps {
  slot: 'A' | 'B';
  label: string;
  date: string;
  onChange: (value: string) => void;
  capture?: Capture;
  enabled: boolean;
  min?: string;
  max?: string;
}

export const SelectorCaptura = ({
  slot,
  label,
  date,
  onChange,
  capture,
  enabled,
  min,
  max,
}: CaptureSlotProps) => (
  <article className="overflow-hidden border border-slate-200 bg-white shadow-sm">
    <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'grid h-6 w-6 place-items-center text-[10px] font-black',
            slot === 'A'
              ? 'bg-blue-600 text-white'
              : 'bg-[#ffd700] text-[#001a35]',
          )}
        >
          {slot}
        </span>
        <span className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-400">
          {label}
        </span>
      </div>
    </header>

    <div className="border-b border-slate-100 p-3">
      <input
        type="date"
        value={date}
        min={min}
        max={max}
        disabled={!enabled}
        onChange={(event) => onChange(event.target.value)}
        aria-label={`Seleccionar ${label.toLowerCase()} de la comparación`}
        className="w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-[#002855] focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>

    <div className="relative h-48 bg-slate-50 sm:h-56 lg:h-64">
      {capture ? (
        <img
          src={capture.src}
          alt={`Captura ${slot}, ${formatDateShort(capture.fecha)}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-2 flex items-center justify-center border border-dashed border-slate-200 bg-slate-50/70">
          <ImageIcon className="h-6 w-6 text-slate-300" />
        </div>
      )}
    </div>
  </article>
);


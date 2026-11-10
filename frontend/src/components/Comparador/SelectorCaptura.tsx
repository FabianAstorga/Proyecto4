import { useRef } from 'react';
import { ImagePlus, RefreshCw, X } from 'lucide-react';
import type { Capture } from '@/types';
import { cn } from '@/utils/format';

interface CaptureSlotProps {
  slot: 'A' | 'B';
  label: string;
  capture: Capture | null;
  onFileSelected: (file: File) => void;
  onClear: () => void;
}

export const SelectorCaptura = ({
  slot,
  label,
  capture,
  onFileSelected,
  onClear,
}: CaptureSlotProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
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

        {capture && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Quitar ${label.toLowerCase()}`}
            className="grid h-6 w-6 place-items-center text-slate-400 transition-colors hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </header>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
          event.target.value = '';
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative block h-52 w-full overflow-hidden bg-slate-50 text-left sm:h-60 lg:h-64"
      >
        {capture ? (
          <>
            <img
              src={capture.src}
              alt={label}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/65 to-transparent px-3 pb-3 pt-8 text-[9px] font-black uppercase tracking-[0.16em] text-white">
              <RefreshCw className="h-3.5 w-3.5" />
              Cambiar imagen
            </span>
          </>
        ) : (
          <span className="absolute inset-2 flex flex-col items-center justify-center gap-3 border border-dashed border-slate-200 bg-white/60 transition-colors group-hover:border-blue-300 group-hover:bg-blue-50/40">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Seleccionar imagen
            </span>
          </span>
        )}
      </button>

      <div className="border-t border-slate-100 px-3 py-2">
        <p
          className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400"
          title={capture?.archivo}
        >
          {capture?.archivo ?? 'Sin imagen'}
        </p>
      </div>
    </article>
  );
};

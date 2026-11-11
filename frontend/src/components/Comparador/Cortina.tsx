import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { GripVertical } from 'lucide-react';
import type { Capture } from '@/types';
import { cn } from '@/utils/format';

export interface MarcadorCortina {
  id: string;
  x: number;
  y: number;
  label: string;
  color?: string;
}

interface CortinaProps {
  captureA: Capture;
  captureB: Capture;
  markers?: MarcadorCortina[];
  className?: string;
}

export const Cortina = ({
  captureA,
  captureB,
  markers = [],
  className,
}: CortinaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const element = containerRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updateFromClientX(event.clientX);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateFromClientX(event.clientX);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 2;
    let next = position;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next -= step;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next += step;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 100;
    else return;

    event.preventDefault();
    setPosition(Math.min(100, Math.max(0, next)));
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        ref={containerRef}
        role="group"
        aria-label="Comparador temporal de fotografías aéreas"
        className={cn(
          'curtain-stage group relative aspect-[16/9] w-full touch-none select-none overflow-hidden bg-slate-800',
          dragging ? 'cursor-grabbing' : 'cursor-ew-resize',
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={captureB.src}
          alt={`Captura B, ${captureB.archivo}`}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {markers.map((marker) => (
          <div
            key={marker.id}
            className="pointer-events-none absolute z-[3] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500/40" />
              <span
                className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: marker.color ?? '#ef4444' }}
              >
                <span className="h-1 w-1 rounded-full bg-white" />
              </span>
            </span>
            <span className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap border border-white/15 bg-[#001a35]/90 px-1.5 py-0.5 font-mono text-[8px] font-bold text-white shadow-lg">
              {marker.label}
            </span>
          </div>
        ))}

        <div
          className="absolute inset-0 z-[4] will-change-[clip-path]"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img
            src={captureA.src}
            alt={`Captura A, ${captureA.archivo}`}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[7] flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent p-3 md:p-4">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center bg-blue-600 text-[10px] font-black text-white shadow-lg">
              A
            </span>
            <div className="max-w-[10rem] border border-white/15 bg-[#001a35]/75 px-2 py-1 backdrop-blur-sm">
              <p className="truncate text-[9px] font-black uppercase tracking-widest text-white">
                {captureA.archivo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="max-w-[10rem] border border-white/15 bg-[#001a35]/75 px-2 py-1 text-right backdrop-blur-sm">
              <p className="truncate text-[9px] font-black uppercase tracking-widest text-white">
                {captureB.archivo}
              </p>
            </div>
            <span className="grid h-6 w-6 place-items-center bg-[#ffd700] text-[10px] font-black text-[#001a35] shadow-lg">
              B
            </span>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 z-[8]"
          style={{ left: `${position}%` }}
        >
          <div className="absolute inset-y-0 -left-px w-0.5 bg-white shadow-[0_0_18px_rgba(0,0,0,0.8)]" />
          <div
            role="slider"
            tabIndex={0}
            aria-label="Posición de la cortina de comparación"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            aria-valuetext={`${Math.round(position)} por ciento de la captura A visible`}
            onKeyDown={handleKeyDown}
            className="pointer-events-auto absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border-2 border-white bg-[#002855]/95 text-white shadow-[0_10px_35px_rgba(0,0,0,0.55)] outline-none transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-blue-400/50 md:h-14 md:w-14"
          >
            <GripVertical className="h-5 w-5" />
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap border border-white/10 bg-[#001a35]/85 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
              {Math.round(position)}%
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

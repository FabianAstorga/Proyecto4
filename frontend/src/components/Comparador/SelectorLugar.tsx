import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, MapPin } from 'lucide-react';
import { SECTORS, getSector } from '@/mocks/data';
import type { SectorId } from '@/types';
import { cn } from '@/utils/format';

const PLACE_BUTTON =
  'flex w-full items-center justify-between gap-3 border border-slate-200 bg-slate-50 px-4 py-3.5 text-left outline-none transition-all focus:border-[#002855] focus:bg-white focus:ring-2 focus:ring-blue-100';


interface PlaceSelectProps {
  value: SectorId | '';
  onChange: (value: SectorId | '') => void;
}

export const SelectorLugar = ({ value, onChange }: PlaceSelectProps) => {
  const [open, setOpen] = useState(false);
  const selected = value ? getSector(value) : undefined;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={PLACE_BUTTON}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
          <span
            className={cn(
              'truncate text-sm',
              selected
                ? 'font-semibold text-slate-800'
                : 'font-medium text-slate-400',
            )}
          >
            {selected?.nombre ?? 'Selecciona un lugar'}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-slate-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-label="Cerrar lista de lugares"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-20 cursor-default"
            />
            <motion.ul
              initial={{ opacity: 0, y: -6, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.99 }}
              transition={{ duration: 0.16 }}
              role="listbox"
              aria-label="Lugares"
              className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-2xl"
            >
              {SECTORS.map((sector) => {
                const active = sector.id === value;
                return (
                  <li key={sector.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(sector.id);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                        active
                          ? 'bg-[#002855] text-white'
                          : 'text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: sector.color }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-black uppercase tracking-wide">
                          {sector.nombre}
                        </span>
                        <span
                          className={cn(
                            'mt-0.5 block font-mono text-[8px] uppercase tracking-wider',
                            active ? 'text-blue-200/70' : 'text-slate-400',
                          )}
                        >
                          {sector.superficie}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};


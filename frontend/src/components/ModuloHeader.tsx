import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/format';

interface ModuloHeaderProps {
  icon: LucideIcon;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

/**
 * Cabecera común de los módulos. Mantiene el mismo tamaño de título,
 * subtítulo y bloqueo visual en Home, Ingesta, Comparador e Informes.
 */
export const ModuloHeader = ({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  actions,
  meta,
  className,
}: ModuloHeaderProps) => (
  <header
    className={cn(
      'border-b border-white/10 bg-[#003B5C] px-5 py-5 text-white md:px-8 md:py-6',
      className,
    )}
  >
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center border border-white/15 bg-white/10">
          <Icon className="h-5 w-5 text-[#7DD3FC]" />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#7DD3FC]">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-black uppercase tracking-tighter md:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-white/60">
            {subtitle}
          </p>
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {actions}
        </div>
      )}
    </div>

    {meta && (
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
        {meta}
      </div>
    )}
  </header>
);

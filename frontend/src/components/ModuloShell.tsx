import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/format';

interface ModuloShellProps {
  children: ReactNode;
  cardClassName?: string;
  closing?: boolean;
}

/**
 * Marco visual de los módulos: degradado animado EPA/ZEAP y una tarjeta
 * central transparente. El fondo de cada página cubre la tarjeta; así, al
 * deslizar entre módulos, el hueco entre ambas muestra el degradado y no una
 * franja blanca.
 */
export const ModuloShell = ({
  children,
  cardClassName,
  closing = false,
}: ModuloShellProps) => (
  <section className="module-gradient relative min-h-screen overflow-hidden">
    <div
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.16),transparent_45%)]"
      aria-hidden="true"
    />

    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] items-center justify-center px-4 pb-10 pt-24 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={
          closing
            ? { x: '-115%', opacity: 0 }
            : { x: 0, opacity: 1, y: 0 }
        }
        transition={
          closing
            ? { duration: 0.45, ease: 'easeInOut' }
            : { duration: 0.4, ease: 'easeOut' }
        }
        className={cn(
          'w-full overflow-hidden rounded-sm bg-transparent shadow-[0_40px_100px_rgba(0,0,0,0.5)]',
          cardClassName,
        )}
      >
        {children}
      </motion.div>
    </div>
  </section>
);

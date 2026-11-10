import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { ModuloShell } from './ModuloShell';
import { Navbar } from './Navbar';

const MODULE_ORDER = ['/inicio', '/ingesta', '/comparador', '/reportes/nuevo'];

const getDirection = (from: string, to: string) => {
  const fromIndex = MODULE_ORDER.indexOf(from);
  const toIndex = MODULE_ORDER.indexOf(to);

  if (fromIndex === -1 || toIndex === -1) return 1;
  return toIndex >= fromIndex ? 1 : -1;
};

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
  }),
  center: { x: 0 },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
  }),
};

export const Layout = () => {
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const direction = useRef(1);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const onLogoutStart = () => setClosing(true);
    window.addEventListener('epa:logout-start', onLogoutStart);
    return () => window.removeEventListener('epa:logout-start', onLogoutStart);
  }, []);

  if (previousPath.current !== location.pathname) {
    direction.current = getDirection(previousPath.current, location.pathname);
    previousPath.current = location.pathname;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="min-h-screen">
        <ModuloShell
          closing={closing}
          cardClassName="h-[calc(100vh-9rem)] min-h-[560px] max-h-[860px] max-w-6xl"
        >
          <div className="relative h-full overflow-hidden">
            <AnimatePresence initial={false} custom={direction.current} mode="sync">
              <motion.div
                key={location.pathname}
                custom={direction.current}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="absolute inset-0 overflow-y-auto will-change-transform"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </ModuloShell>
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-center px-5 py-5 md:px-8">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
            Empresa Portuaria Arica · Prototipo
          </p>
        </div>
      </footer>
    </div>
  );
};

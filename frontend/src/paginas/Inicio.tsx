import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Camera,
  Columns2,
  FileText,
  ImagePlus,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { FLIGHTS, SECTORS } from '@/mocks/data';
import { cn } from '@/utils/format';

interface Accion {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  accent: string;
}

const ACCIONES: Accion[] = [
  {
    id: 'comparador',
    label: 'Comparador',
    icon: Columns2,
    path: '/comparador',
    accent: 'bg-gradient-to-br from-[#0284C7] to-[#38BDF8]',
  },
  {
    id: 'informes',
    label: 'Informes',
    icon: FileText,
    path: '/reportes/nuevo',
    accent: 'bg-gradient-to-br from-[#0F766E] to-[#34D399]',
  },
  {
    id: 'imagenes',
    label: 'Ingresar Imágenes',
    icon: ImagePlus,
    accent: 'bg-gradient-to-br from-[#0284C7] via-[#34D399] to-[#FDE68A]',
  },
];

export const Inicio = () => {
  const navigate = useNavigate();

  const [informesCreados] = useState(
    () => 9 + Number(localStorage.getItem('epa_report_counter') ?? '0'),
  );

  const fotosIngresadas = FLIGHTS.reduce(
    (total, flight) => total + flight.fotos,
    0,
  );

  const contadores = [
    {
      icon: FileText,
      value: informesCreados,
      label: 'Informes creados',
    },
    {
      icon: Camera,
      value: fotosIngresadas,
      label: 'Fotos ingresadas',
    },
    {
      icon: MapPin,
      value: SECTORS.length,
      label: 'Sectores monitoreados',
    },
  ];

  return (
    <section className="home-gradient relative min-h-screen overflow-hidden text-[#003B5C]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,255,255,0.78),transparent_42%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-5 pb-16 pt-28 md:px-8 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mx-auto w-full max-w-4xl text-center"
        >
          <h1 className="text-balance text-5xl font-black uppercase leading-[0.88] tracking-tighter text-[#003B5C] sm:text-6xl lg:text-7xl">
            Panel de control
          </h1>
        </motion.div>

        <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3">
          {ACCIONES.map((accion, index) => {
            const Icon = accion.icon;
            const enabled = Boolean(accion.path);

            return (
              <motion.button
                key={accion.id}
                type="button"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 + index * 0.07 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  if (accion.path) navigate(accion.path);
                }}
                aria-disabled={!enabled}
                title={enabled ? accion.label : `${accion.label} — próximamente`}
                className={cn(
                  'group relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden border border-white/70 bg-white/55 p-8 text-center shadow-[0_18px_50px_-24px_rgba(0,40,70,0.42)] backdrop-blur-xl transition-colors hover:bg-white/80',
                  enabled ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <div
                  className={cn(
                    'grid h-16 w-16 place-items-center text-white shadow-lg',
                    accion.accent,
                  )}
                >
                  <Icon className="h-8 w-8" />
                </div>

                <h2 className="mt-8 text-3xl font-black uppercase tracking-tighter text-[#003B5C] md:text-4xl">
                  {accion.label}
                </h2>

                <ArrowUpRight className="mt-6 h-5 w-5 text-[#003B5C]/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#0F766E]" />
              </motion.button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-3">
          {contadores.map((contador, index) => {
            const Icon = contador.icon;

            return (
              <motion.div
                key={contador.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.08 }}
                className="flex items-center justify-center gap-4 rounded-full border border-white/70 bg-white/55 px-6 py-5 shadow-[0_18px_50px_-24px_rgba(0,40,70,0.42)] backdrop-blur-xl"
              >
                <Icon className="h-5 w-5 shrink-0 text-[#0F766E]" />
                <p className="font-mono text-4xl font-black leading-none tracking-tighter text-[#003B5C] tabular-nums md:text-5xl">
                  {contador.value.toLocaleString('es-CL')}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0F766E]">
                  {contador.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

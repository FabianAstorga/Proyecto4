import { useState } from 'react';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { Camera, FileText, LayoutDashboard, MapPin } from 'lucide-react';
import { ModuloHeader } from '@/components/ModuloHeader';
import { FLIGHTS, SECTORS } from '@/mocks/data';

const PASOS = [
  {
    numero: '01',
    titulo: 'Ingesta',
    detalles: [
      'Selecciona el lote de imágenes del dron.',
      'Revisa las miniaturas cargadas.',
      'Confirma el lote con Ingresar.',
    ],
  },
  {
    numero: '02',
    titulo: 'Comparación',
    detalles: [
      'Elige el lugar de inspección.',
      'Carga las imágenes A y B.',
      'Desliza la cortina y revisa la detección.',
    ],
  },
  {
    numero: '03',
    titulo: 'Informe',
    detalles: [
      'Completa los datos del informe.',
      'Selecciona los hallazgos y evidencias.',
      'Genera y descarga el PDF ejecutivo.',
    ],
  },
];

export const Inicio = () => {
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
    <div className="min-h-full bg-white/95">
      <ModuloHeader
        icon={LayoutDashboard}
        eyebrow="Centro de operaciones"
        title="Panel de control"
        subtitle="Accede a los módulos de ingesta, comparación y reportería del sistema EPA/ZEAP."
      />

      <div className="p-6 md:p-8">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="border border-slate-200 bg-slate-50 p-5 md:p-6"
        >
          <h2 className="text-xl font-black uppercase tracking-tighter text-[#003B5C] md:text-2xl">
            ¿Cómo ingresar imágenes y generar un informe?
          </h2>
          <p className="mt-2 max-w-3xl text-xs font-medium leading-relaxed text-slate-500">
            Usa la barra superior para moverte entre los módulos y sigue este
            recorrido.
          </p>

          <ol className="mt-5 grid gap-3 md:grid-cols-3">
            {PASOS.map((paso) => (
              <li
                key={paso.numero}
                className="flex gap-3 border border-slate-200 bg-white p-3.5 shadow-sm"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center bg-[#003B5C] font-mono text-[9px] font-black text-white">
                  {paso.numero}
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#003B5C]">
                    {paso.titulo}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {paso.detalles.map((detalle) => (
                      <li
                        key={detalle}
                        className="flex items-start gap-2 text-[10px] font-medium leading-relaxed text-slate-500"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#0F766E]" />
                        <span>{detalle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </motion.section>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {contadores.map((contador, index) => {
            const Icon = contador.icon;

            return (
              <motion.div
                key={contador.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.12 + index * 0.07 }}
                className="flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-[#0F766E]" />
                <NumberFlow
                  value={contador.value}
                  locales="es-CL"
                  className="font-mono text-2xl font-black leading-none tracking-tighter text-[#003B5C] tabular-nums sm:text-3xl"
                />
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#0F766E]">
                  {contador.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

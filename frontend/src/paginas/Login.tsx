import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Layers3,
  Lock,
  Mail,
  MapPin,
  RefreshCw,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import type { Role } from '@/types';
import { cn } from '@/utils/format';
import { ui } from '@/utils/SwalService';

interface MarcaProps {
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

const SIZES = {
  sm: { box: 'h-9 w-9', title: 'text-base', sub: 'text-[7px]' },
  md: { box: 'h-11 w-11', title: 'text-xl', sub: 'text-[8px]' },
  lg: { box: 'h-14 w-14', title: 'text-2xl', sub: 'text-[9px]' },
};

/** Identidad propia del prototipo: sin logos ni material de terceros. */
const Marca = ({
  tone = 'light',
  size = 'md',
  showSubtitle = true,
  className,
}: MarcaProps) => {
  const s = SIZES[size];
  const isLight = tone === 'light';

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      <div
        className={cn(
          'relative grid shrink-0 place-items-center overflow-hidden border shadow-lg',
          s.box,
          isLight ? 'border-white/20' : 'border-[#003B5C]/15',
        )}
        style={{ backgroundColor: '#003B5C' }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" className="h-full w-full">
          <rect width="64" height="64" fill="#003B5C" />
          <rect x="0" y="52" width="64" height="12" fill="#0F766E" />
          <path
            d="M14 14v32M14 17h30l-5 6H14"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
          />
          <path d="M41 23v9" stroke="#7DD3FC" strokeWidth="2.5" />
          <circle cx="41" cy="35" r="3" fill="none" stroke="#34D399" strokeWidth="2.5" />
          <rect x="12" y="42" width="12" height="5" fill="#ffffff" />
          <rect x="27" y="42" width="12" height="5" fill="#7DD3FC" />
          <rect x="20" y="49" width="20" height="5" fill="#34D399" />
        </svg>
      </div>

      <div className="min-w-0 leading-none">
        <div
          className={cn(
            'flex items-baseline gap-1.5 font-black uppercase tracking-tighter',
            s.title,
            isLight ? 'text-white' : 'text-[#003B5C]',
          )}
        >
          EPA
          <span className={isLight ? 'text-[#7DD3FC]' : 'text-[#0284C7]'}>WebGIS</span>
        </div>
        {showSubtitle && (
          <p
            className={cn(
              'mt-1 font-bold uppercase tracking-[0.22em]',
              s.sub,
              isLight ? 'text-white/45' : 'text-slate-400',
            )}
          >
            Empresa Portuaria Arica
          </p>
        )}
      </div>
    </div>
  );
};

interface ReporteDemo {
  id: string;
  titulo: string;
  sector: string;
  fecha: string;
  tipo: string;
  estado: 'Pendiente' | 'En Gestión' | 'Resuelto';
  hallazgos: number;
  imagen: string;
}

const REPORTES: ReporteDemo[] = [
  { id: 'INF-EPA-2026-001', titulo: 'Inspección operativa — Patio Norte', sector: 'Patio Norte', fecha: '14 SEP 2026', tipo: 'Inspección periódica', estado: 'Pendiente', hallazgos: 2, imagen: '/mock/aerial-patio-norte-b.svg' },
  { id: 'INF-EPA-2026-002', titulo: 'Estado de pavimentos — Acceso Vial', sector: 'Acceso Vial', fecha: '14 SEP 2026', tipo: 'Consolidado mensual', estado: 'En Gestión', hallazgos: 1, imagen: '/mock/aerial-acceso-vial-b.svg' },
  { id: 'INF-EPA-2026-003', titulo: 'Ocupación de bermas — ZEAP Sector C', sector: 'ZEAP Sector C', fecha: '14 SEP 2026', tipo: 'Incidencia crítica', estado: 'Pendiente', hallazgos: 3, imagen: '/mock/aerial-zeap-c-b.svg' },
  { id: 'INF-EPA-2026-004', titulo: 'Operación de atraque — Muelle 1', sector: 'Muelle 1', fecha: '10 SEP 2026', tipo: 'Inspección periódica', estado: 'Resuelto', hallazgos: 1, imagen: '/mock/aerial-muelle-1-b.svg' },
  { id: 'INF-EPA-2026-005', titulo: 'Circulación y residuos — Patio Sur', sector: 'Patio Sur', fecha: '12 SEP 2026', tipo: 'Consolidado mensual', estado: 'En Gestión', hallazgos: 2, imagen: '/mock/aerial-patio-sur-b.svg' },
];

const ESTADO_CLASES: Record<ReporteDemo['estado'], string> = {
  Pendiente: 'bg-red-50 text-red-700',
  'En Gestión': 'bg-amber-50 text-amber-800',
  Resuelto: 'bg-emerald-50 text-emerald-700',
};

const ReporteCard = ({ reporte, active }: { reporte: ReporteDemo; active: boolean }) => (
  <motion.article
    animate={{ scale: active ? 1 : 0.96, opacity: active ? 1 : 0.6 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
    className="group relative flex h-full flex-col overflow-hidden border border-white/10 bg-white shadow-2xl"
  >
    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#38BDF8] to-[#34D399]" />
    <div className="relative h-40 shrink-0 overflow-hidden bg-slate-100 md:h-48">
      <img src={reporte.imagen} alt={reporte.titulo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#003B5C]/55 to-transparent" />
      <span className="absolute left-0 top-0 bg-[#003B5C] px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-white">{reporte.tipo}</span>
      <span className={cn('absolute right-0 top-0 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest', ESTADO_CLASES[reporte.estado])}>{reporte.estado}</span>
    </div>
    <div className="flex flex-1 flex-col p-5 md:p-6">
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
        <FileText className="h-3.5 w-3.5 text-[#0EA5E9]" />
        {reporte.id}
      </div>
      <h3 className="mt-2 line-clamp-2 text-xl font-black uppercase leading-tight tracking-tighter text-[#003B5C]">{reporte.titulo}</h3>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#0EA5E9]" />{reporte.sector}</span>
        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[#0EA5E9]" />{reporte.fecha}</span>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{reporte.hallazgos} hallazgos
        </span>
        <Layers3 className="h-4 w-4 text-slate-300 transition-colors group-hover:text-[#0EA5E9]" />
      </div>
    </div>
  </motion.article>
);

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CL', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('es-CL', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const INPUT =
  'w-full border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-[#002855] focus:bg-white focus:ring-2 focus:ring-blue-100';

type Mode = 'login' | 'recover';

export const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [demoCode, setDemoCode] = useState('');

  const emailRef = useRef<HTMLInputElement>(null);
  const recoveryEmailRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isReportsSection, setIsReportsSection] = useState(false);

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null;
    return state?.from?.pathname ?? '/inicio';
  }, [location.state]);

  const dateLabel = useMemo(
    () => DATE_FORMATTER.format(now).toUpperCase(),
    [now],
  );
  const timeLabel = useMemo(() => TIME_FORMATTER.format(now), [now]);

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoginOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLoginOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    if (mode === 'login') {
      emailRef.current?.focus();
    } else {
      recoveryEmailRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isLoginOpen, mode]);

  const [reportsEmblaRef, reportsEmblaApi] = useEmblaCarousel(
    { loop: true, align: 'center', duration: 20 },
    [
      Autoplay({
        delay: 3500,
        stopOnInteraction: false,
        stopOnMouseEnter: false,
        stopOnFocusIn: false,
      }),
    ],
  );
  const [reportIndex, setReportIndex] = useState(0);

  const onReportSelect = useCallback(() => {
    if (reportsEmblaApi) setReportIndex(reportsEmblaApi.selectedScrollSnap());
  }, [reportsEmblaApi]);

  useEffect(() => {
    if (!reportsEmblaApi) return;
    onReportSelect();
    reportsEmblaApi.on('select', onReportSelect).on('reInit', onReportSelect);
    return () => {
      reportsEmblaApi.off('select', onReportSelect).off('reInit', onReportSelect);
    };
  }, [reportsEmblaApi, onReportSelect]);

  const handlePanelScroll = () => {
    const node = scrollRef.current;
    if (!node) return;
    const next = node.scrollTop > node.clientHeight * 0.5;
    setIsReportsSection((previous) => (previous === next ? previous : next));
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
    setMode('login');
    setError(null);
    setRecoverySent(false);
    setRecoveryCode('');
    setNewPassword('');
  };

  const toggleLogin = () => {
    if (isLoginOpen) closeLogin();
    else {
      setError(null);
      setIsLoginOpen(true);
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({
        email: email.trim(),
        password,
        rol: 'Operador' as Role,
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setMode('login');
    setError(null);
    setRecoverySent(false);
    setRecoveryCode('');
    setNewPassword('');
  };

  const handleSendCode = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authService.requestPasswordReset(email);
      setRecoverySent(true);
      setDemoCode(result.demoCode ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible enviar el código.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.confirmPasswordReset({
        email,
        code: recoveryCode,
        newPassword,
      });
      ui.exito('Contraseña actualizada', 'Ya puedes ingresar con tu nueva contraseña.');
      handleBackToLogin();
      setPassword('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No fue posible actualizar la contraseña.',
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 overflow-hidden bg-[#002B45] text-white">
      <div
        ref={scrollRef}
        onScroll={handlePanelScroll}
        aria-hidden={isLoginOpen}
        className={cn(
          'no-scrollbar h-full overflow-y-auto overflow-x-hidden overscroll-y-contain snap-y snap-mandatory scroll-smooth',
          isLoginOpen && 'overflow-hidden',
        )}
      >
        {/* Portada: imagen fija con movimiento lento de cámara */}
        <section className="relative h-screen w-full snap-start snap-always overflow-hidden">
          <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            <img
              src="/hero-puerto-2.jpg"
              alt=""
              className="hero-camera h-full w-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-[#002B45]/25" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#00456E]/40 via-transparent to-[#0F766E]/35" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-3/5 bg-gradient-to-t from-[#002B45] via-[#003B5C]/55 to-transparent" />
          <div className="blueprint-grid pointer-events-none absolute inset-0 z-[1] opacity-10" />

          <div className="relative z-10 flex h-full items-end px-5 pb-8 pt-32 md:px-8 md:pb-12">
            <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="max-w-4xl"
              >
                <h1 className="text-balance text-4xl font-black uppercase leading-[0.9] tracking-tighter text-white sm:text-6xl lg:text-7xl">
                  Monitoreo e
                  <br />
                  inspección
                  <br />
                  <span className="bg-gradient-to-r from-[#7DD3FC] via-[#38BDF8] to-[#34D399] bg-clip-text text-transparent">
                    geoespacial
                  </span>
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
                className="shrink-0 text-left md:text-right"
              >
                <p className="font-mono text-3xl font-black leading-none tracking-tighter text-white tabular-nums md:text-5xl">
                  {timeLabel}
                </p>
                <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.28em] text-white/55">
                  {dateLabel}
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Reportes: carrusel horizontal dentro de la segunda sección */}
        <section className="reports-gradient relative h-screen w-full snap-start snap-always overflow-hidden">
          <div className="relative z-10 flex h-full flex-col justify-center px-5 pb-10 pt-24 md:px-8">
            <div className="mx-auto w-full max-w-[1500px]">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.24em] text-[#0F766E]">
                    <FileText className="h-3 w-3" />
                    Reportes recientes
                  </p>
                  <h2 className="mt-2 text-3xl font-black uppercase leading-none tracking-tighter text-[#003B5C] md:text-5xl">
                    Últimos <span className="text-[#0F766E]">reportes</span>
                  </h2>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => reportsEmblaApi?.scrollPrev()}
                    aria-label="Reporte anterior"
                    className="grid h-9 w-9 place-items-center border border-[#003B5C]/15 bg-white/60 text-[#003B5C] transition-colors hover:bg-white hover:text-[#0F766E]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => reportsEmblaApi?.scrollNext()}
                    aria-label="Reporte siguiente"
                    className="grid h-9 w-9 place-items-center border border-[#003B5C]/15 bg-white/60 text-[#003B5C] transition-colors hover:bg-white hover:text-[#0F766E]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="embla overflow-visible" ref={reportsEmblaRef}>
                <div className="flex h-[390px] touch-pan-y items-center md:h-[430px]">
                  {REPORTES.map((reporte, index) => (
                    <div
                      key={reporte.id}
                      className="min-w-0 flex-[0_0_90%] px-2 md:flex-[0_0_42%] lg:flex-[0_0_35%]"
                    >
                      <ReporteCard reporte={reporte} active={index === reportIndex} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {!isLoginOpen && !isReportsSection && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-30 h-40 bg-gradient-to-b from-[#002B45]/80 to-transparent"
          aria-hidden="true"
        />
      )}

      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-5 py-5 md:px-8">
          <Marca
            tone={isLoginOpen || isReportsSection ? 'dark' : 'light'}
            size="md"
            showSubtitle={false}
          />

          <button
            type="button"
            onClick={toggleLogin}
            aria-expanded={isLoginOpen}
            aria-controls="login-panel"
            className={cn(
              'flex items-center gap-2 border px-4 py-2.5 text-xs font-bold transition-all',
              isLoginOpen
                ? 'border-[#003B5C]/15 bg-[#003B5C] text-white hover:bg-[#002B45]'
                : isReportsSection
                  ? 'border-[#003B5C]/20 bg-white/70 text-[#003B5C] backdrop-blur-md hover:bg-white'
                  : 'border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20',
            )}
          >
            {isLoginOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <UserRound className="h-4 w-4" />
            )}
            {isLoginOpen ? 'Cerrar' : 'Acceder'}
          </button>
        </div>
      </header>

      {/* Slider lateral de acceso: ocupa toda la pantalla */}
      <AnimatePresence>
        {isLoginOpen && (
          <motion.div
            id="login-panel"
            role="dialog"
            aria-modal="true"
            aria-label={mode === 'login' ? 'Iniciar sesión' : 'Recuperar acceso'}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
            className="login-gradient fixed inset-0 z-40 overflow-y-auto"
          >
            <div
              className="dot-grid pointer-events-none absolute inset-0 opacity-20"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.55),transparent_58%)]"
              aria-hidden="true"
            />

            <div className="relative flex min-h-full items-center justify-center px-5 pb-12 pt-28">
              <div className="w-full max-w-sm">
                <AnimatePresence mode="wait">
                  {mode === 'login' ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h2 className="text-3xl font-black tracking-tighter text-[#002855] md:text-4xl">
                        Iniciar sesión
                      </h2>

                      <form onSubmit={handleLogin} className="mt-8 space-y-4">
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            ref={emailRef}
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Correo electrónico"
                            aria-label="Correo electrónico"
                            className={INPUT}
                            required
                          />
                        </div>

                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Contraseña"
                            aria-label="Contraseña"
                            className={cn(INPUT, 'pr-11')}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-[#002855]"
                            aria-label={
                              showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              role="alert"
                              className="text-sm font-medium leading-relaxed text-red-600"
                            >
                              {error}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        <button
                          type="submit"
                          disabled={loading}
                          className="flex w-full items-center justify-center gap-2 bg-[#003385] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#002a66] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            'Ingresar'
                          )}
                        </button>

                        <div className="pt-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setMode('recover');
                              setError(null);
                            }}
                            className="text-sm font-medium text-slate-500 transition-colors hover:text-[#002855]"
                          >
                            ¿Olvidaste tu contraseña?
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="recover"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h2 className="text-3xl font-black tracking-tighter text-[#002855] md:text-4xl">
                        Recuperar acceso
                      </h2>

                      {!recoverySent ? (
                        <form onSubmit={handleSendCode} className="mt-8 space-y-4">
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              ref={recoveryEmailRef}
                              type="email"
                              autoComplete="email"
                              value={email}
                              onChange={(event) => setEmail(event.target.value)}
                              placeholder="Correo electrónico"
                              aria-label="Correo electrónico"
                              className={INPUT}
                              required
                            />
                          </div>

                          <AnimatePresence>
                            {error && (
                              <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                role="alert"
                                className="text-sm font-medium leading-relaxed text-red-600"
                              >
                                {error}
                              </motion.p>
                            )}
                          </AnimatePresence>

                          <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 bg-[#003385] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#002a66] disabled:opacity-60"
                          >
                            {loading ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              'Enviar código'
                            )}
                          </button>

                          <div className="pt-2 text-center">
                            <button
                              type="button"
                              onClick={handleBackToLogin}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-[#002855]"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" />
                              Volver
                            </button>
                          </div>
                        </form>
                      ) : (
                        <form onSubmit={handleRecovery} className="mt-8 space-y-4">
                          <div className="relative">
                            <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={recoveryCode}
                              onChange={(event) => setRecoveryCode(event.target.value)}
                              placeholder="Código de verificación"
                              aria-label="Código de verificación"
                              className={INPUT}
                              required
                            />
                          </div>

                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(event) => setNewPassword(event.target.value)}
                              placeholder="Nueva contraseña"
                              aria-label="Nueva contraseña"
                              className={INPUT}
                              required
                            />
                          </div>

                          {demoCode && (
                            <p className="text-xs font-medium text-slate-400">
                              Código demo:{' '}
                              <span className="font-mono font-bold text-[#002855]">
                                {demoCode}
                              </span>
                            </p>
                          )}

                          <AnimatePresence>
                            {error && (
                              <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                role="alert"
                                className="text-sm font-medium leading-relaxed text-red-600"
                              >
                                {error}
                              </motion.p>
                            )}
                          </AnimatePresence>

                          <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 bg-[#003385] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#002a66] disabled:opacity-60"
                          >
                            {loading ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              'Actualizar contraseña'
                            )}
                          </button>

                          <div className="pt-2 text-center">
                            <button
                              type="button"
                              onClick={handleBackToLogin}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-[#002855]"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" />
                              Volver
                            </button>
                          </div>
                        </form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

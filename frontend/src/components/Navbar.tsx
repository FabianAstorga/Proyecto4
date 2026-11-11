import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Columns2,
  FileText,
  Home,
  ImagePlus,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn, roleLabel } from '@/utils/format';
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
            'flex items-baseline gap-1.5 font-black uppercase tracking-tighter transition-colors',
            s.title,
            isLight
              ? 'text-[#7DD3FC] group-hover:text-white'
              : 'text-[#003B5C]',
          )}
        >
          EPA
          <span
            className={
              isLight
                ? 'text-[#34D399] transition-colors group-hover:text-white'
                : 'text-[#0284C7]'
            }
          >
            WebGIS
          </span>
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


const NAV_ITEMS = [
  {
    id: 'ingesta',
    label: 'Ingesta',
    path: '/ingesta',
    icon: ImagePlus,
  },
  {
    id: 'comparador',
    label: 'Comparador',
    path: '/comparador',
    icon: Columns2,
  },
  {
    id: 'reportes',
    label: 'Informes',
    path: '/reportes/nuevo',
    icon: FileText,
  },
  {
    id: 'inicio',
    label: 'Inicio',
    path: '/inicio',
    icon: Home,
  },
];

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    window.dispatchEvent(new Event('epa:logout-start'));
    await new Promise((resolve) => window.setTimeout(resolve, 480));
    await logout();
    navigate('/login', { replace: true });
  };

  
  return (
<header className="fixed inset-x-0 top-0 z-[100] h-16">
        <div className="absolute inset-0 rounded-b-2xl border-b border-white/5 bg-[#002B45]/95 backdrop-blur-md" />
        <div
          className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[#7DD3FC]/50 to-transparent"
          aria-hidden="true"
        />

        <div className="relative mx-auto flex h-full w-full max-w-[1500px] items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex h-full items-center gap-6">
            <button
              type="button"
              onClick={() => navigate('/inicio')}
              className="group shrink-0 [&>div>div:last-child]:hidden sm:[&>div>div:last-child]:block"
              aria-label="Ir al panel de control"
              title="Ir al panel de control"
            >
              <Marca tone="light" size="sm" showSubtitle={false} />
            </button>

            <nav className="ml-1 flex h-12 items-center gap-1 rounded-2xl border border-white/5 bg-white/[0.04] p-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    aria-label={item.label}
                    title={item.label}
                    className={cn(
                      'relative flex items-center gap-2 whitespace-nowrap rounded-xl px-2.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors sm:px-3',
                      active
                        ? 'text-white'
                        : 'text-white/55 hover:bg-white/[0.04] hover:text-white',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="epa-nav-pill"
                        className="absolute inset-0 rounded-xl border border-white/10 bg-[#003B5C] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                      />
                    )}
                    <span className="relative flex items-center gap-2">
                      <Icon
                        className={cn('h-3.5 w-3.5', active ? 'text-[#7DD3FC]' : '')}
                      />
                      <span className="hidden sm:inline">{item.label}</span>
                    </span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <div className="hidden items-center gap-3 border-l border-white/10 pl-4 md:flex">
              <div className="leading-none">
                <p className="text-[10px] font-black uppercase tracking-widest text-white">
                  {user?.nombre ?? 'Invitado'}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.16em] text-[#7DD3FC]/70">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  {roleLabel(user?.rol)} · EPA
                </p>
              </div>
            </div>

            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Cuenta"
                title="Cuenta"
                className="grid h-8 w-8 place-items-center bg-transparent text-white/60 transition-colors hover:text-white"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Settings className="h-4 w-4" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    className="absolute right-0 top-full w-64 origin-top-right rounded-b-2xl rounded-tl-2xl border border-[#7DD3FC]/20 bg-[#003B5C] p-2 text-white shadow-2xl"
                    role="menu"
                  >
                    <span className="absolute -top-1 right-3 h-2 w-2 rotate-45 border-l border-t border-[#7DD3FC]/20 bg-[#003B5C]" />
                    <div className="border-b border-white/10 px-3 py-3">
                      <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#7DD3FC]">
                        <UserRound className="h-3 w-3" /> Sesión activa
                      </p>
                      <p className="mt-2 text-xs font-black uppercase tracking-tight text-white">
                        {user?.nombre}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] font-medium text-white/60">
                        {user?.email}
                      </p>
                      <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-white/40">
                        {user?.unidad}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/10"
                      role="menuitem"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Cerrar sesión
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 lg:hidden"
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-x-0 top-16 rounded-b-2xl border-b border-white/10 bg-[#002B45] p-4 shadow-2xl lg:hidden"
            >
              <div className="mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white">
                  {user?.nombre ?? 'Invitado'}
                </p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-[#7DD3FC]">
                  {roleLabel(user?.rol)} · EPA
                </p>
              </div>
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname.startsWith(item.path);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        navigate(item.path);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest',
                        active
                          ? 'border-white/10 bg-[#003B5C] text-white'
                          : 'border-transparent text-white/60 hover:bg-white/[0.04]',
                      )}
                    >
                      <Icon className="h-4 w-4 text-[#7DD3FC]" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
  );
};

import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout = () => (
  <div className="min-h-screen bg-slate-100">
    <Navbar />
    <main className="min-h-screen">
      <Outlet />
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
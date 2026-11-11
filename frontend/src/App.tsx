import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { RutaProtegida } from '@/components/RutaProtegida';
import { Login } from '@/paginas/Login';
import { Inicio } from '@/paginas/Inicio';
import { Ingesta } from '@/paginas/Ingesta';
import { IngestaDetalle } from '@/paginas/IngestaDetalle';
import { Comparador } from '@/paginas/Comparador';
import { CrearReporte } from '@/paginas/CrearReporte';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

const App = () => (
  <>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/ingesta" element={<Ingesta />} />
          <Route path="/ingesta/detalle/:idVuelo" element={<IngestaDetalle />} />
          <Route path="/comparador" element={<Comparador />} />
          <Route path="/reportes/nuevo" element={<CrearReporte />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </>
);

export default App;

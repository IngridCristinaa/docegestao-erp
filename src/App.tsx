import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErpLayout } from './components/layout/ErpLayout';
import { LandingPage } from './pages/LandingPage';
import { LojaDigitalPage } from './pages/LojaDigitalPage';
import { DashboardExecutivoPage } from './pages/erp/DashboardExecutivoPage';
import { BiSimuladorPage } from './pages/erp/BiSimuladorPage';
import { ComercialPdvPage } from './pages/erp/ComercialPdvPage';
import { ProducaoPcpPage } from './pages/erp/ProducaoPcpPage';
import { FichasTecnicasPage } from './pages/erp/FichasTecnicasPage';
import { QualidadeBpfPage } from './pages/erp/QualidadeBpfPage';
import { RecursosHumanosPage } from './pages/erp/RecursosHumanosPage';
import { ModuloCorporativoUnificadoPage } from './pages/erp/ModuloCorporativoUnificadoPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Áreas Públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/loja" element={<LojaDigitalPage />} />

          {/* Área Integrada do ERP */}
          <Route path="/erp" element={<ErpLayout />}>
            <Route index element={<Navigate to="/erp/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardExecutivoPage />} />
            <Route path="bi" element={<BiSimuladorPage />} />
            <Route path="comercial" element={<ComercialPdvPage />} />
            <Route path="producao" element={<ProducaoPcpPage />} />
            <Route path="fichas-tecnicas" element={<FichasTecnicasPage />} />
            <Route path="qualidade" element={<QualidadeBpfPage />} />
            <Route path="rh" element={<RecursosHumanosPage />} />
            <Route path=":modulo" element={<ModuloCorporativoUnificadoPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
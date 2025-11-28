import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthLayout } from '@/layout/AuthLayout'
import { AppShell } from '@/layout/AppShell'
import { ProtectedRoute, PermissionGuard, FirstAllowedRoute } from '@/layout/RouteGuards'
import { LoginPage } from '@/pages/login/LoginPage'
import { ResetPasswordPage } from '@/pages/reset-password/ResetPasswordPage'
import { SetPasswordPage } from '@/pages/set-password/SetPasswordPage'
import { AuthCallbackPage } from '@/pages/auth-callback/AuthCallbackPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ConfiguracionPage } from '@/pages/configuracion/ConfiguracionPage'
import { SupervisionPage } from '@/pages/supervision/SupervisionPage'
import MargenFinancieroPage from '@/pages/margen-financiero'
import RentabilidadOperativaPage from '@/pages/rentabilidad-operativa'
import IndiceRenovacionCreditosPage from '@/pages/indice-renovacion-creditos'
import ColocacionPage from '@/pages/colocacion'
import RentabilidadPage from '@/pages/rentabilidad'
import RotacionPersonalPage from '@/pages/rotacion-personal'
import EscalabilidadPage from '@/pages/escalabilidad'
import PosicionamientoMarcaPage from '@/pages/posicionamiento-marca'
import InnovacionIncrementalPage from '@/pages/innovacion-incremental'
import SatisfaccionClientePage from '@/pages/satisfaccion-cliente'
import CumplimientoRegulatorioPage from '@/pages/cumplimiento-regulatorio'
import GestionRiesgosPage from '@/pages/gestion-riesgos'
import GobiernoCorporativoPage from '@/pages/gobierno-corporativo'
import { useAuthStore } from '@/store/auth'
import { usePermissionsStore } from '@/store/permissions'

function App() {
  const initialize = useAuthStore((state) => state.initialize)
  const profile = useAuthStore((state) => state.profile)
  const fetchPermissions = usePermissionsStore((state) => state.fetchForUser)

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    if (profile?.user_id) {
      void fetchPermissions(profile.user_id)
    }
  }, [fetchPermissions, profile?.user_id])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<FirstAllowedRoute />} />
            <Route path="/dashboard" element={<PermissionGuard viewId="dashboard"><DashboardPage /></PermissionGuard>} />
            <Route path="/configuracion" element={<PermissionGuard viewId="configuracion"><ConfiguracionPage /></PermissionGuard>} />
            <Route path="/supervision" element={<PermissionGuard viewId="supervision"><SupervisionPage /></PermissionGuard>} />

            <Route path="/margen-financiero" element={<PermissionGuard viewId="margen-financiero"><MargenFinancieroPage /></PermissionGuard>} />
            <Route path="/rentabilidad-operativa" element={<PermissionGuard viewId="rentabilidad-operativa"><RentabilidadOperativaPage /></PermissionGuard>} />
            <Route path="/indice-renovacion-creditos" element={<PermissionGuard viewId="indice-renovacion-creditos"><IndiceRenovacionCreditosPage /></PermissionGuard>} />
            <Route path="/colocacion" element={<PermissionGuard viewId="colocacion"><ColocacionPage /></PermissionGuard>} />
            <Route path="/rentabilidad" element={<PermissionGuard viewId="rentabilidad"><RentabilidadPage /></PermissionGuard>} />
            <Route path="/rotacion-personal" element={<PermissionGuard viewId="rotacion-personal"><RotacionPersonalPage /></PermissionGuard>} />
            <Route path="/escalabilidad" element={<PermissionGuard viewId="escalabilidad"><EscalabilidadPage /></PermissionGuard>} />
            <Route path="/posicionamiento-marca" element={<PermissionGuard viewId="posicionamiento-marca"><PosicionamientoMarcaPage /></PermissionGuard>} />
            <Route path="/innovacion-incremental" element={<PermissionGuard viewId="innovacion-incremental"><InnovacionIncrementalPage /></PermissionGuard>} />
            <Route path="/satisfaccion-cliente" element={<PermissionGuard viewId="satisfaccion-cliente"><SatisfaccionClientePage /></PermissionGuard>} />
            <Route path="/cumplimiento-regulatorio" element={<PermissionGuard viewId="cumplimiento-regulatorio"><CumplimientoRegulatorioPage /></PermissionGuard>} />
            <Route path="/gestion-riesgos" element={<PermissionGuard viewId="gestion-riesgos"><GestionRiesgosPage /></PermissionGuard>} />
            <Route path="/gobierno-corporativo" element={<PermissionGuard viewId="gobierno-corporativo"><GobiernoCorporativoPage /></PermissionGuard>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

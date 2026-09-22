import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserRole } from "@petcare/types";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { VerifyEmailPage } from "../features/auth/pages/VerifyEmailPage";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";
import { RequireRole } from "../features/auth/components/RequireRole";
import { PetsListPage } from "../features/pets/pages/PetsListPage";
import { PetFormPage } from "../features/pets/pages/PetFormPage";
import { PetDetailPage } from "../features/pets/pages/PetDetailPage";
import { PartnerRegisterPage } from "../features/partners/pages/PartnerRegisterPage";
import { PartnerRegistrationsPage } from "../features/admin/pages/PartnerRegistrationsPage";
import { HospitalProfilePage } from "../features/hospital/pages/HospitalProfilePage";
import { AppLayout } from "./layout/AppLayout";
import { DashboardRedirect } from "./DashboardRedirect";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/partner/register" element={<PartnerRegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardRedirect />} />
            <Route path="/pets" element={<PetsListPage />} />
            <Route path="/pets/new" element={<PetFormPage />} />
            <Route path="/pets/:petId" element={<PetDetailPage />} />
            <Route path="/pets/:petId/edit" element={<PetFormPage />} />
            <Route
              path="/admin/partner-registrations"
              element={
                <RequireRole role={UserRole.ADMIN}>
                  <PartnerRegistrationsPage />
                </RequireRole>
              }
            />
            <Route
              path="/hospital/profile"
              element={
                <RequireRole role={UserRole.HOSPITAL_OWNER}>
                  <HospitalProfilePage />
                </RequireRole>
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

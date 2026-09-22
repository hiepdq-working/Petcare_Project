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
import { HospitalFinderPage } from "../features/hospital/pages/HospitalFinderPage";
import { HospitalDetailPage } from "../features/hospital/pages/HospitalDetailPage";
import { VetsManagementPage } from "../features/vets/pages/VetsManagementPage";
import { VetProfilePage } from "../features/vets/pages/VetProfilePage";
import { ServicesManagementPage } from "../features/services/pages/ServicesManagementPage";
import { BookHospitalSearchPage } from "../features/appointments/pages/BookHospitalSearchPage";
import { BookAppointmentPage } from "../features/appointments/pages/BookAppointmentPage";
import { MyAppointmentsPage } from "../features/appointments/pages/MyAppointmentsPage";
import { HospitalAppointmentsPage } from "../features/appointments/pages/HospitalAppointmentsPage";
import { PetTimelinePage } from "../features/medical-records/pages/PetTimelinePage";
import { MedicalRecordDetailPage } from "../features/medical-records/pages/MedicalRecordDetailPage";
import { VetMedicalRecordsPage } from "../features/medical-records/pages/VetMedicalRecordsPage";
import { CreateMedicalRecordPage } from "../features/medical-records/pages/CreateMedicalRecordPage";
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
        <Route path="/hospitals/nearby" element={<HospitalFinderPage />} />
        <Route path="/hospitals/:id" element={<HospitalDetailPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardRedirect />} />
            <Route path="/pets" element={<PetsListPage />} />
            <Route path="/pets/new" element={<PetFormPage />} />
            <Route path="/pets/:petId" element={<PetDetailPage />} />
            <Route path="/pets/:petId/edit" element={<PetFormPage />} />
            <Route
              path="/pets/:petId/book"
              element={
                <RequireRole role={UserRole.PET_OWNER}>
                  <BookHospitalSearchPage />
                </RequireRole>
              }
            />
            <Route
              path="/pets/:petId/book/:hospitalId"
              element={
                <RequireRole role={UserRole.PET_OWNER}>
                  <BookAppointmentPage />
                </RequireRole>
              }
            />
            <Route
              path="/appointments"
              element={
                <RequireRole role={UserRole.PET_OWNER}>
                  <MyAppointmentsPage />
                </RequireRole>
              }
            />
            <Route
              path="/pets/:petId/timeline"
              element={
                <RequireRole role={UserRole.PET_OWNER}>
                  <PetTimelinePage />
                </RequireRole>
              }
            />
            <Route
              path="/medical-records/:id"
              element={
                <RequireRole role={[UserRole.PET_OWNER, UserRole.VET]}>
                  <MedicalRecordDetailPage />
                </RequireRole>
              }
            />
            <Route
              path="/vet/medical-records"
              element={
                <RequireRole role={UserRole.VET}>
                  <VetMedicalRecordsPage />
                </RequireRole>
              }
            />
            <Route
              path="/vet/medical-records/new"
              element={
                <RequireRole role={UserRole.VET}>
                  <CreateMedicalRecordPage />
                </RequireRole>
              }
            />
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
            <Route
              path="/hospital/vets"
              element={
                <RequireRole role={UserRole.HOSPITAL_OWNER}>
                  <VetsManagementPage />
                </RequireRole>
              }
            />
            <Route
              path="/hospital/services"
              element={
                <RequireRole role={UserRole.HOSPITAL_OWNER}>
                  <ServicesManagementPage />
                </RequireRole>
              }
            />
            <Route
              path="/hospital/appointments"
              element={
                <RequireRole role={UserRole.HOSPITAL_OWNER}>
                  <HospitalAppointmentsPage />
                </RequireRole>
              }
            />
            <Route
              path="/vet/profile"
              element={
                <RequireRole role={UserRole.VET}>
                  <VetProfilePage />
                </RequireRole>
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

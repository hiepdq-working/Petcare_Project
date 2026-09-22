import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { partnersApi } from "../api/partners.api";
import { DocumentUploader } from "../components/DocumentUploader";
import { extractErrorMessage } from "../../../shared/api/client";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";

interface FormState {
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  businessLicense: string | undefined;
  vetCertificate: string | undefined;
}

const emptyForm: FormState = {
  shopName: "",
  ownerName: "",
  phone: "",
  email: "",
  address: "",
  businessLicense: undefined,
  vetCertificate: undefined,
};

// Public — no login required, since the applicant has no account yet.
// Admin manually vets every submission — including the uploaded business
// license — before an account is created (see Admin > Duyệt phòng khám).
export function PartnerRegisterPage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const mutation = useMutation({
    mutationFn: () =>
      partnersApi.submit({
        ...form,
        businessLicense: form.businessLicense!,
      }),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  if (mutation.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-brand-900">Đăng ký thành công</h1>
          <p className="mt-2 text-brand-700/80">{mutation.data.message}</p>
          <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-brand-700">
            Quay lại trang đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white">🐾</div>
          <span className="text-lg font-bold text-brand-900">PetCare</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-900">Đăng ký phòng khám đối tác</h1>
        <p className="mt-1 text-sm text-brand-700/80">
          Điền thông tin bên dưới, đội ngũ PetCare sẽ liên hệ sau khi duyệt hồ sơ.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}
          <TextField
            label="Tên phòng khám"
            required
            value={form.shopName}
            onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
          />
          <TextField
            label="Tên chủ phòng khám"
            required
            value={form.ownerName}
            onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
          />
          <TextField
            label="Số điện thoại"
            required
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <TextField
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <TextField
            label="Địa chỉ"
            required
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
          <DocumentUploader
            label="Giấy đăng ký kinh doanh"
            required
            value={form.businessLicense}
            onChange={(url) => setForm((f) => ({ ...f, businessLicense: url }))}
          />
          <DocumentUploader
            label="Giấy chứng nhận đủ điều kiện hành nghề thú y (không bắt buộc)"
            value={form.vetCertificate}
            onChange={(url) => setForm((f) => ({ ...f, vetCertificate: url }))}
          />
          <Button type="submit" loading={mutation.isPending} disabled={!form.businessLicense}>
            Gửi đăng ký
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-brand-700/80">
          <Link to="/login" className="font-semibold text-brand-700">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import { partnersApi } from "../api/partners.api";
import { DocumentUploader } from "../components/DocumentUploader";
import { extractErrorMessage } from "../../../shared/api/client";
import { TextField } from "../../../shared/components/TextField";
import { Button } from "../../../shared/components/Button";
import { Alert } from "../../../shared/components/Alert";
import { AuthLayout } from "../../auth/components/AuthLayout";

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
      <AuthLayout title="Đăng ký thành công">
        <p className="text-brand-700/80">{mutation.data.message}</p>
        <Link to="/login" className="text-sm font-semibold text-brand-700">
          Quay lại trang đăng nhập
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Đăng ký phòng khám đối tác"
      subtitle="Điền thông tin bên dưới, đội ngũ PetCare sẽ liên hệ sau khi duyệt hồ sơ."
      footer={
        <Link to="/login" className="font-semibold text-brand-700">
          Quay lại đăng nhập
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}

        <div>
          <p className="mb-1.5 text-sm font-medium text-brand-900">Loại hình kinh doanh</p>
          {/* Only Phòng khám thú y is a real feature today — Cửa hàng thú
              cưng/Spa thú cưng aren't built yet, so there's nothing to add
              them as a second/third selectable tile. */}
          <div className="flex items-center gap-3 rounded-xl border-2 border-brand-600 bg-brand-50 px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-700">
              <Stethoscope size={18} />
            </span>
            <div>
              <p className="font-semibold text-brand-900">Phòng khám thú y</p>
              <p className="text-xs text-brand-700/70">Khám, điều trị & chăm sóc thú y</p>
            </div>
          </div>
        </div>

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
    </AuthLayout>
  );
}

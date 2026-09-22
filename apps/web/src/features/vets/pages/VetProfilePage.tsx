import { useQuery } from "@tanstack/react-query";
import { vetsApi } from "../api/vets.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";

// First slice of the Vet role — just their own profile. Once Appointment
// and Medical Record exist, this page grows into "lịch khám của tôi" and
// "danh sách pet mình đã từng khám" per the earlier product decision.
export function VetProfilePage() {
  const query = useQuery({ queryKey: ["vets", "me"], queryFn: vetsApi.getMyProfile });

  if (query.isLoading) {
    return <p className="mx-auto max-w-xl px-4 py-8 text-brand-700">Đang tải...</p>;
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Alert message={extractErrorMessage(query.error)} />
      </div>
    );
  }

  const vet = query.data;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">Hồ sơ bác sĩ</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl">
            {vet.avatar ? (
              <img src={vet.avatar} alt={vet.name} className="h-full w-full object-cover" />
            ) : (
              "🩺"
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-brand-900">{vet.name}</p>
            <p className="text-sm text-brand-700/80">{vet.email}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-brand-700/70">Chuyên khoa</dt>
            <dd className="font-medium text-brand-900">{vet.specialty ?? "Chưa cập nhật"}</dd>
          </div>
          <div>
            <dt className="text-brand-700/70">Kinh nghiệm</dt>
            <dd className="font-medium text-brand-900">
              {vet.experience !== null ? `${vet.experience} năm` : "Chưa cập nhật"}
            </dd>
          </div>
          <div>
            <dt className="text-brand-700/70">Số chứng chỉ hành nghề</dt>
            <dd className="font-medium text-brand-900">{vet.licenseNumber ?? "Chưa cập nhật"}</dd>
          </div>
        </dl>

        <p className="mt-6 text-center text-sm text-brand-700/60">
          Lịch khám và danh sách thú cưng đã khám sẽ hiển thị ở đây khi tính năng Đặt lịch khám hoàn thành.
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partnersApi } from "../../partners/api/partners.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";

const TABS = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Đã từ chối" },
] as const;

export function PartnerRegistrationsPage() {
  const [status, setStatus] = useState<string>("PENDING");
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["partner-registrations", status], queryFn: () => partnersApi.list(status) });

  const approveMutation = useMutation({
    mutationFn: (id: string) => partnersApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner-registrations"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => partnersApi.reject(id, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner-registrations"] }),
  });

  function handleReject(id: string) {
    const reason = window.prompt("Lý do từ chối (không bắt buộc):") ?? undefined;
    rejectMutation.mutate({ id, reason: reason || undefined });
  }

  const activeError = approveMutation.error ?? rejectMutation.error;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">Duyệt phòng khám đối tác</h1>

      <div className="mb-6 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              status === tab.value ? "bg-brand-700 text-white" : "bg-white text-brand-700 hover:bg-brand-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeError ? (
        <div className="mb-4">
          <Alert message={extractErrorMessage(activeError)} />
        </div>
      ) : null}

      {query.isLoading ? <p className="text-brand-700">Đang tải...</p> : null}

      {query.data?.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-brand-700/80 shadow-sm">
          Không có hồ sơ nào ở mục này.
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {query.data?.map((registration) => (
          <div key={registration.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-brand-900">{registration.shopName}</p>
                <p className="text-sm text-brand-700/80">
                  Chủ phòng khám: {registration.ownerName} · {registration.phone}
                </p>
                <p className="text-sm text-brand-700/80">{registration.email}</p>
                <p className="text-sm text-brand-700/80">{registration.address}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  {registration.businessLicense ? (
                    <a
                      href={registration.businessLicense}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      Xem giấy đăng ký kinh doanh
                    </a>
                  ) : (
                    <span className="text-red-500">Chưa có giấy đăng ký kinh doanh</span>
                  )}
                  {registration.vetCertificate ? (
                    <a
                      href={registration.vetCertificate}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      Xem giấy chứng nhận hành nghề thú y
                    </a>
                  ) : null}
                </div>
              </div>
              <span className="whitespace-nowrap rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {registration.status}
              </span>
            </div>

            {registration.status === "PENDING" ? (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => approveMutation.mutate(registration.id)}
                  disabled={approveMutation.isPending}
                  className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  Duyệt
                </button>
                <button
                  onClick={() => handleReject(registration.id)}
                  disabled={rejectMutation.isPending}
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  Từ chối
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

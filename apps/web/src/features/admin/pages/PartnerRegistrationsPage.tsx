import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partnersApi } from "../../partners/api/partners.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { Badge, type BadgeTone } from "../../../shared/components/Badge";
import { PillTabs } from "../../../shared/components/PillTabs";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

const STATUS_TONE: Record<string, BadgeTone> = { PENDING: "amber", APPROVED: "green", REJECTED: "red" };
const STATUS_LABEL: Record<string, string> = { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Đã từ chối" };

const TABS = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Đã từ chối" },
] as const;

export function PartnerRegistrationsPage() {
  const [status, setStatus] = useState<(typeof TABS)[number]["value"]>("PENDING");
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
      <h1 className="mb-6 font-display text-2xl font-semibold text-brand-900">Duyệt phòng khám đối tác</h1>

      <div className="mb-6">
        <PillTabs tabs={[...TABS]} value={status} onChange={setStatus} />
      </div>

      {activeError ? (
        <div className="mb-4">
          <Alert message={extractErrorMessage(activeError)} />
        </div>
      ) : null}

      {query.isLoading ? <LoadingState /> : null}

      {!query.isLoading && query.data?.length === 0 ? (
        <EmptyState title="Không có hồ sơ nào ở mục này" />
      ) : null}

      <div className="flex flex-col gap-3">
        {query.data?.map((registration) => (
          <Card key={registration.id} className="p-5">
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
              <Badge tone={STATUS_TONE[registration.status] ?? "neutral"}>
                {STATUS_LABEL[registration.status] ?? registration.status}
              </Badge>
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
          </Card>
        ))}
      </div>
    </div>
  );
}

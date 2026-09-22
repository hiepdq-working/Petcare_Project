import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { medicalRecordsApi } from "../api/medical-records.api";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Card } from "../../../shared/components/Card";
import { EmptyState } from "../../../shared/components/EmptyState";
import { LoadingState } from "../../../shared/components/LoadingState";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

export function VetMedicalRecordsPage() {
  const query = useQuery({ queryKey: ["medical-records", "mine"], queryFn: medicalRecordsApi.listMine });

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold text-brand-900">Hồ sơ bệnh án đã lập</h1>

      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <Alert message={extractErrorMessage(query.error)} /> : null}
      {!query.isLoading && query.data?.length === 0 ? (
        <EmptyState
          title="Bạn chưa lập hồ sơ bệnh án nào"
          description="Hãy tạo từ danh sách lịch hẹn ở trang hồ sơ bác sĩ."
        />
      ) : null}

      <div className="flex flex-col gap-3">
        {query.data?.map((record) => (
          <Link key={record.id} to={`/medical-records/${record.id}`} className="block transition hover:opacity-80">
            <Card className="p-5">
              <p className="font-semibold text-brand-900">
                {record.petName} · {record.currentVersion?.diagnosis ?? "Chưa có chẩn đoán"}
              </p>
              <p className="text-sm text-brand-700/80">{formatDateTime(record.recordDate)}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

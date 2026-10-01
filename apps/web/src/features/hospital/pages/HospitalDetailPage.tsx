import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UserRole } from "@petcare/types";
import { Phone, MessageCircle } from "lucide-react";
import { hospitalApi } from "../api/hospital.api";
import { servicesApi } from "../../services/api/services.api";
import { vetsApi } from "../../vets/api/vets.api";
import { petsApi } from "../../pets/api/pets.api";
import { appointmentsApi } from "../../appointments/api/appointments.api";
import { HospitalReviewsSection } from "../../reviews/components/HospitalReviewsSection";
import { chatApi } from "../../chat/api/chat.api";
import { useAuthStore } from "../../auth/store";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { Badge } from "../../../shared/components/Badge";
import { PillTabs } from "../../../shared/components/PillTabs";
import { LoadingState } from "../../../shared/components/LoadingState";

function formatPrice(price: number | null): string {
  if (price === null) return "Liên hệ";
  return `${price.toLocaleString("vi-VN")} đ`;
}

type TabValue = "services" | "booking" | "reviews";
const TABS: { value: TabValue; label: string }[] = [
  { value: "services", label: "Dịch vụ" },
  { value: "booking", label: "Đặt lịch" },
  { value: "reviews", label: "Đánh giá" },
];

// Public — reachable from search results without an account. Only the
// "Đặt lịch"/"Nhắn tin" actions require being logged in as a Pet Owner,
// matching the product decision that browsing never needs an account but
// interacting does.
export function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const petIdFromQuery = searchParams.get("petId") ?? undefined;
  const navigate = useNavigate();
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<TabValue>(petIdFromQuery ? "booking" : "services");

  const hospitalQuery = useQuery({ queryKey: ["hospitals", id], queryFn: () => hospitalApi.getPublicById(id!) });
  const servicesQuery = useQuery({
    queryKey: ["services", "hospital", id],
    queryFn: () => servicesApi.listPublicByHospital(id!),
  });

  const messageMutation = useMutation({
    mutationFn: () => chatApi.startWithHospital(id!),
    onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
  });

  if (hospitalQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <LoadingState />
      </div>
    );
  }

  if (hospitalQuery.isError || !hospitalQuery.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Alert message={extractErrorMessage(hospitalQuery.error)} />
      </div>
    );
  }

  const hospital = hospitalQuery.data;
  const canBook = authStatus === "authenticated" && user?.role === UserRole.PET_OWNER;

  return (
    <div className="min-h-screen bg-app-gradient">
      <header className="border-b border-brand-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/hospitals/nearby" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-lg">🐾</span>
            <span className="font-display text-lg font-semibold text-brand-900">PetCare</span>
          </Link>
          {authStatus !== "authenticated" ? (
            <Link to="/login" className="text-sm font-semibold text-brand-700">
              Đăng nhập
            </Link>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card className="overflow-hidden">
          <div className="aspect-[3/1] w-full bg-brand-100">
            {hospital.cover ? (
              <img src={hospital.cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl">🏥</div>
            )}
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-100">
                {hospital.logo ? (
                  <img src={hospital.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">🏥</div>
                )}
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-brand-900">{hospital.name}</h1>
                {hospital.address ? <p className="text-sm text-brand-700/80">{hospital.address}</p> : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {hospital.isEmergency ? <Badge tone="red">Cấp cứu 24/7</Badge> : null}
              {hospital.phone ? (
                <a
                  href={`tel:${hospital.phone}`}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                >
                  <Phone size={12} /> {hospital.phone}
                </a>
              ) : null}
            </div>

            {hospital.description ? <p className="mt-4 text-brand-700/90">{hospital.description}</p> : null}

            {canBook ? (
              <div className="mt-6">
                {messageMutation.isError ? (
                  <div className="mb-3">
                    <Alert message={extractErrorMessage(messageMutation.error)} />
                  </div>
                ) : null}
                <div className="flex gap-3">
                  <Button fullWidth={false} onClick={() => setTab("booking")}>
                    Đặt lịch khám
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth={false}
                    onClick={() => messageMutation.mutate()}
                    loading={messageMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle size={16} /> Nhắn tin
                  </Button>
                </div>
              </div>
            ) : null}

            {authStatus === "guest" ? (
              <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm text-brand-700">
                Bạn cần đăng nhập để đặt lịch hoặc nhắn tin.{" "}
                <Link to="/login" className="font-semibold hover:underline">
                  Đăng nhập
                </Link>{" "}
                hoặc{" "}
                <Link to="/register" className="font-semibold hover:underline">
                  đăng ký
                </Link>
                .
              </div>
            ) : null}
          </div>
        </Card>

        <div className="mt-6">
          <PillTabs tabs={TABS} value={tab} onChange={setTab} />
        </div>

        <div className="mt-4">
          {tab === "services" ? (
            <>
              {servicesQuery.data?.length === 0 ? (
                <p className="text-brand-700/70">Phòng khám chưa cập nhật dịch vụ.</p>
              ) : null}
              <div className="flex flex-col gap-3">
                {servicesQuery.data?.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-brand-900">{item.name}</p>
                        {item.description ? <p className="text-sm text-brand-700/80">{item.description}</p> : null}
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-brand-700">
                        <p className="font-semibold">{formatPrice(item.price)}</p>
                        {item.duration ? <p className="text-brand-700/70">{item.duration} phút</p> : null}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : null}

          {tab === "booking" ? (
            canBook ? (
              <InlineBookingForm hospitalId={hospital.id} initialPetId={petIdFromQuery} />
            ) : (
              <Card className="p-6 text-center text-sm text-brand-700/80">
                {authStatus === "guest" ? (
                  <>
                    Bạn cần{" "}
                    <Link to="/login" className="font-semibold text-brand-700 hover:underline">
                      đăng nhập
                    </Link>{" "}
                    bằng tài khoản chủ nuôi để đặt lịch.
                  </>
                ) : (
                  "Chỉ chủ nuôi thú cưng mới có thể đặt lịch khám."
                )}
              </Card>
            )
          ) : null}

          {tab === "reviews" ? <HospitalReviewsSection hospitalId={hospital.id} /> : null}
        </div>
      </div>
    </div>
  );
}

function InlineBookingForm({ hospitalId, initialPetId }: { hospitalId: string; initialPetId?: string }) {
  const navigate = useNavigate();
  const petsQuery = useQuery({ queryKey: ["pets"], queryFn: petsApi.list });
  const servicesQuery = useQuery({
    queryKey: ["services", "hospital", hospitalId],
    queryFn: () => servicesApi.listPublicByHospital(hospitalId),
  });
  const vetsQuery = useQuery({
    queryKey: ["vets", "hospital", hospitalId],
    queryFn: () => vetsApi.listPublicByHospital(hospitalId),
  });

  const [petId, setPetId] = useState(initialPetId ?? "");
  const [serviceId, setServiceId] = useState("");
  const [vetId, setVetId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      appointmentsApi.create({
        petId,
        hospitalId,
        serviceId,
        vetId: vetId || undefined,
        dateTime,
        notes: notes || undefined,
      }),
    onSuccess: () => navigate("/appointments"),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  if (!petsQuery.isLoading && petsQuery.data?.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-brand-700/80">
        Bạn chưa có hồ sơ thú cưng nào.{" "}
        <Link to="/pets/new" className="font-semibold text-brand-700 hover:underline">
          Thêm hồ sơ thú cưng
        </Link>{" "}
        trước khi đặt lịch.
      </Card>
    );
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
      {mutation.isError ? <Alert message={extractErrorMessage(mutation.error)} /> : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pet" className="text-sm font-medium text-brand-900">
          Thú cưng
        </label>
        <select
          id="pet"
          required
          value={petId}
          onChange={(e) => setPetId(e.target.value)}
          className="rounded-xl border border-brand-200 bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
        >
          <option value="" disabled>
            -- Chọn thú cưng --
          </option>
          {petsQuery.data?.map((pet) => (
            <option key={pet.id} value={pet.id}>
              {pet.name} · {pet.species}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="service" className="text-sm font-medium text-brand-900">
          Dịch vụ
        </label>
        <select
          id="service"
          required
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="rounded-xl border border-brand-200 bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
        >
          <option value="" disabled>
            -- Chọn dịch vụ --
          </option>
          {servicesQuery.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.price ? ` — ${item.price.toLocaleString("vi-VN")}đ` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="vet" className="text-sm font-medium text-brand-900">
          Bác sĩ mong muốn (không bắt buộc)
        </label>
        <select
          id="vet"
          value={vetId}
          onChange={(e) => setVetId(e.target.value)}
          className="rounded-xl border border-brand-200 bg-white px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
        >
          <option value="">-- Để phòng khám sắp xếp --</option>
          {vetsQuery.data?.map((vet) => (
            <option key={vet.id} value={vet.id}>
              {vet.name}
              {vet.specialty ? ` (${vet.specialty})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="dateTime" className="text-sm font-medium text-brand-900">
          Thời gian mong muốn
        </label>
        <input
          id="dateTime"
          type="datetime-local"
          required
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="rounded-xl border border-brand-200 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-brand-900">
          Ghi chú cho phòng khám (không bắt buộc)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl border border-brand-200 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <Button type="submit" loading={mutation.isPending} disabled={!petId || !serviceId || !dateTime}>
        Đặt lịch hẹn
      </Button>
    </Card>
  );
}

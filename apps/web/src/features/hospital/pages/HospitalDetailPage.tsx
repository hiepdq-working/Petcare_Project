import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UserRole } from "@petcare/types";
import { hospitalApi } from "../api/hospital.api";
import { servicesApi } from "../../services/api/services.api";
import { petsApi } from "../../pets/api/pets.api";
import { HospitalReviewsSection } from "../../reviews/components/HospitalReviewsSection";
import { chatApi } from "../../chat/api/chat.api";
import { useAuthStore } from "../../auth/store";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Button } from "../../../shared/components/Button";

function formatPrice(price: number | null): string {
  if (price === null) return "Liên hệ";
  return `${price.toLocaleString("vi-VN")} đ`;
}

// Public — reachable from search results without an account. The
// "Liên hệ đặt lịch" action below is the one place that requires being
// logged in as a Pet Owner, matching the product decision that browsing
// never needs an account but interacting does.
export function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const petIdFromQuery = searchParams.get("petId") ?? undefined;
  const navigate = useNavigate();
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const [showPetPicker, setShowPetPicker] = useState(false);

  const hospitalQuery = useQuery({ queryKey: ["hospitals", id], queryFn: () => hospitalApi.getPublicById(id!) });
  const servicesQuery = useQuery({
    queryKey: ["services", "hospital", id],
    queryFn: () => servicesApi.listPublicByHospital(id!),
  });
  const myPetsQuery = useQuery({
    queryKey: ["pets"],
    queryFn: petsApi.list,
    enabled: showPetPicker,
  });

  const messageMutation = useMutation({
    mutationFn: () => chatApi.startWithHospital(id!),
    onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
  });

  function handleBookClick() {
    if (petIdFromQuery) {
      navigate(`/pets/${petIdFromQuery}/book/${id}`);
      return;
    }
    setShowPetPicker(true);
  }

  if (hospitalQuery.isLoading) {
    return <p className="mx-auto max-w-2xl px-4 py-8 text-brand-700">Đang tải...</p>;
  }

  if (hospitalQuery.isError || !hospitalQuery.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Alert message={extractErrorMessage(hospitalQuery.error)} />
      </div>
    );
  }

  const hospital = hospitalQuery.data;

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/hospitals/nearby" className="text-lg font-bold text-brand-900">
            🐾 PetCare
          </Link>
          {authStatus !== "authenticated" ? (
            <Link to="/login" className="text-sm font-semibold text-brand-700">
              Đăng nhập
            </Link>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
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
                <h1 className="text-xl font-bold text-brand-900">{hospital.name}</h1>
                {hospital.address ? <p className="text-sm text-brand-700/80">{hospital.address}</p> : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {hospital.isEmergency ? (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                  Cấp cứu 24/7
                </span>
              ) : null}
              {hospital.phone ? (
                <a href={`tel:${hospital.phone}`} className="text-xs font-semibold text-brand-700 hover:underline">
                  📞 {hospital.phone}
                </a>
              ) : null}
            </div>

            {hospital.description ? <p className="mt-4 text-brand-700/90">{hospital.description}</p> : null}

            {authStatus === "authenticated" && user?.role === UserRole.PET_OWNER ? (
              <div className="mt-6">
                {messageMutation.isError ? (
                  <div className="mb-3">
                    <Alert message={extractErrorMessage(messageMutation.error)} />
                  </div>
                ) : null}
                <div className="flex gap-3">
                  <Button onClick={handleBookClick}>Liên hệ đặt lịch</Button>
                  <Button
                    variant="ghost"
                    onClick={() => messageMutation.mutate()}
                    loading={messageMutation.isPending}
                  >
                    💬 Nhắn tin
                  </Button>
                </div>
                {showPetPicker ? (
                  <div className="mt-3 rounded-xl border border-brand-200 p-4">
                    <p className="mb-2 text-sm font-medium text-brand-900">Chọn thú cưng cần khám:</p>
                    {myPetsQuery.isLoading ? <p className="text-sm text-brand-700">Đang tải...</p> : null}
                    {myPetsQuery.data?.length === 0 ? (
                      <p className="text-sm text-brand-700/80">
                        Bạn chưa có hồ sơ thú cưng nào.{" "}
                        <Link to="/pets/new" className="font-semibold text-brand-700 hover:underline">
                          Thêm ngay
                        </Link>
                      </p>
                    ) : null}
                    <div className="flex flex-col gap-2">
                      {myPetsQuery.data?.map((pet) => (
                        <button
                          key={pet.id}
                          onClick={() => navigate(`/pets/${pet.id}/book/${id}`)}
                          className="rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-50"
                        >
                          {pet.name} · {pet.species}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {authStatus === "guest" ? (
              <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm text-brand-700">
                Bạn cần đăng nhập để liên hệ đặt lịch.{" "}
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
        </div>

        <h2 className="mb-3 mt-8 text-lg font-bold text-brand-900">Dịch vụ</h2>
        {servicesQuery.data?.length === 0 ? (
          <p className="text-brand-700/70">Phòng khám chưa cập nhật dịch vụ.</p>
        ) : null}
        <div className="flex flex-col gap-3">
          {servicesQuery.data?.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
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
            </div>
          ))}
        </div>

        <HospitalReviewsSection hospitalId={hospital.id} />
      </div>
    </div>
  );
}

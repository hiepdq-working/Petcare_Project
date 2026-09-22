import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole } from "@petcare/types";
import { reviewsApi } from "../api/reviews.api";
import { StarRating } from "./StarRating";
import { useAuthStore } from "../../auth/store";
import { extractErrorMessage } from "../../../shared/api/client";
import { Alert } from "../../../shared/components/Alert";
import { Button } from "../../../shared/components/Button";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function HospitalReviewsSection({ hospitalId }: { hospitalId: string }) {
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const query = useQuery({
    queryKey: ["reviews", "hospital", hospitalId],
    queryFn: () => reviewsApi.listByHospital(hospitalId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["reviews", "hospital", hospitalId] });

  const myReview = query.data?.reviews.find((r) => r.userId === user?.id) ?? null;

  const createMutation = useMutation({
    mutationFn: () => reviewsApi.create({ hospitalId, rating, comment: comment || undefined }),
    onSuccess: () => {
      invalidate();
      setEditing(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => reviewsApi.update(myReview!.id, { rating, comment: comment || undefined }),
    onSuccess: () => {
      invalidate();
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => reviewsApi.remove(myReview!.id),
    onSuccess: invalidate,
  });

  function startEditing() {
    setRating(myReview?.rating ?? 0);
    setComment(myReview?.comment ?? "");
    setEditing(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (myReview) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  function handleDelete() {
    if (window.confirm("Xoá đánh giá của bạn?")) {
      deleteMutation.mutate();
    }
  }

  const mutationError = createMutation.error ?? updateMutation.error;

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-900">Đánh giá</h2>
        {query.data && query.data.totalCount > 0 ? (
          <div className="flex items-center gap-1.5 text-sm text-brand-700">
            <StarRating value={query.data.averageRating} />
            <span className="font-semibold">{query.data.averageRating}</span>
            <span className="text-brand-700/60">({query.data.totalCount})</span>
          </div>
        ) : null}
      </div>

      {authStatus === "authenticated" && user?.role === UserRole.PET_OWNER ? (
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          {!editing ? (
            <div className="flex items-center justify-between">
              {myReview ? (
                <div>
                  <StarRating value={myReview.rating} />
                  {myReview.comment ? <p className="mt-1 text-sm text-brand-900">{myReview.comment}</p> : null}
                </div>
              ) : (
                <p className="text-sm text-brand-700/80">Bạn đã khám tại đây? Hãy để lại đánh giá.</p>
              )}
              <div className="flex shrink-0 gap-3">
                <button onClick={startEditing} className="text-sm font-semibold text-brand-700 hover:underline">
                  {myReview ? "Chỉnh sửa" : "Viết đánh giá"}
                </button>
                {myReview ? (
                  <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">
                    Xoá
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {mutationError ? <Alert message={extractErrorMessage(mutationError)} /> : null}
              <StarRating value={rating} onChange={setRating} size="lg" />
              <textarea
                rows={2}
                placeholder="Cảm nhận của bạn về phòng khám..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="rounded-xl border border-brand-200 px-4 py-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
              />
              <div className="flex gap-3">
                <Button
                  type="submit"
                  loading={createMutation.isPending || updateMutation.isPending}
                  disabled={rating === 0}
                >
                  Gửi đánh giá
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  Huỷ
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {query.isLoading ? <p className="text-brand-700">Đang tải...</p> : null}
      {query.data?.reviews.length === 0 ? (
        <p className="text-brand-700/70">Chưa có đánh giá nào cho phòng khám này.</p>
      ) : null}

      <div className="flex flex-col gap-3">
        {query.data?.reviews
          .filter((r) => r.userId !== user?.id)
          .map((review) => (
            <div key={review.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-base">
                  {review.userAvatar ? (
                    <img src={review.userAvatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    "🙂"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-900">{review.userName}</p>
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} />
                    <span className="text-xs text-brand-700/60">{formatDate(review.createdAt)}</span>
                  </div>
                </div>
              </div>
              {review.comment ? <p className="mt-2 text-sm text-brand-900">{review.comment}</p> : null}
            </div>
          ))}
      </div>

      {authStatus === "guest" ? (
        <p className="mt-3 text-sm text-brand-700/70">
          <Link to="/login" className="font-semibold hover:underline">
            Đăng nhập
          </Link>{" "}
          để viết đánh giá sau khi hoàn thành lịch khám.
        </p>
      ) : null}
    </div>
  );
}

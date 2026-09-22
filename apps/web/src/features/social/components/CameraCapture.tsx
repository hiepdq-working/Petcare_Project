import { useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

type FacingMode = "user" | "environment";
type Status = "starting" | "live" | "error";

// A warm, slightly saturated, softly brightened look — flattering on both
// pet fur and skin tones without an obviously fake color cast. Applied to
// the live preview and baked into the captured frame via the same filter
// on the capture canvas, so what the user sees is exactly what gets saved.
const FLATTERING_FILTER = "brightness(1.08) contrast(1.06) saturate(1.22) sepia(0.06)";

// Pet Owner posts are camera-only by design (see PostService) — this
// component is the only way a Pet Owner's photo enters the app, there is
// no file-picker fallback.
export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [status, setStatus] = useState<Status>("starting");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setStatus("starting");
      setError(null);
      stopStream();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("live");
      } catch {
        if (!cancelled) {
          setError("Không thể truy cập camera. Vui lòng cấp quyền camera cho trình duyệt và thử lại.");
          setStatus("error");
        }
      }
    }

    function stopStream() {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facingMode, retryCount]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || status !== "live") return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.filter = FLATTERING_FILTER;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <div className="relative flex w-full max-w-md flex-1 items-center justify-center overflow-hidden">
        {status === "error" ? (
          <div className="flex flex-col items-center gap-4 px-6 text-center text-white">
            <p>{error}</p>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="rounded-xl bg-white/20 px-4 py-2 font-semibold hover:bg-white/30"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              filter: FLATTERING_FILTER,
              transform: facingMode === "user" ? "scaleX(-1)" : undefined,
            }}
            className="h-full w-full object-cover"
          />
        )}
        {status === "starting" ? (
          <p className="absolute text-sm text-white/80">Đang mở camera...</p>
        ) : null}
      </div>

      <div className="flex w-full max-w-md items-center justify-between px-8 py-6">
        <button onClick={onClose} className="text-sm font-semibold text-white/80 hover:text-white">
          Huỷ
        </button>

        <button
          onClick={handleCapture}
          disabled={status !== "live"}
          className="h-16 w-16 rounded-full border-4 border-white bg-white/30 disabled:opacity-40"
          aria-label="Chụp ảnh"
        />

        <button
          onClick={() => setFacingMode((f) => (f === "user" ? "environment" : "user"))}
          className="text-sm font-semibold text-white/80 hover:text-white"
        >
          🔄 Đổi camera
        </button>
      </div>
    </div>
  );
}

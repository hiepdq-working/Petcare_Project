# PetCare

Nền tảng chăm sóc thú cưng: tìm phòng khám gần nhất, đặt lịch khám, hồ sơ bệnh án, sổ tiêm phòng, bảng tin cộng đồng, nhắn tin real-time giữa chủ nuôi và phòng khám.

Monorepo pnpm: `apps/api` (NestJS + Prisma/PostgreSQL), `apps/web` (React + Vite), `packages/types` + `packages/constants` (dùng chung giữa api/web).

## Chạy nhanh bằng Docker (khuyến nghị)

Yêu cầu: đã cài Docker Desktop (hoặc Docker Engine + Compose).

```bash
docker compose up -d --build
```

Lần đầu chạy sẽ build 2 image (`api`, `web`) và khởi động cả 3 service (`postgres`, `api`, `web`). API tự áp dụng migration khi container khởi động (`prisma migrate deploy`), không cần chạy tay.

Sau khi 3 container đã chạy (`docker compose ps` thấy `healthy`/`running`):

```bash
docker compose exec api node prisma/seed.js
```

để tạo sẵn 4 tài khoản mẫu (Admin/Hospital/Vet/Pet Owner) — chi tiết đăng nhập ở [docs/LOGIN_GUIDE.md](docs/LOGIN_GUIDE.md).

Mở trình duyệt:
- Web: http://localhost:5173
- API: http://localhost:4000/api

Dừng và giữ lại dữ liệu:

```bash
docker compose down
```

Dừng và xoá luôn dữ liệu (Postgres volume, file upload):

```bash
docker compose down -v
```

Cấu hình tuỳ chọn (không bắt buộc để chạy thử) đặt trong file `.env` ở thư mục gốc — xem [.env.example](.env.example): khoá bí mật JWT riêng, `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` để gửi email thật (dùng được cả Gmail/Outlook cá nhân với App Password), `GOOGLE_CLIENT_ID` để bật đăng nhập Google.

## Chạy local không dùng Docker (phát triển)

Yêu cầu: Node.js ≥ 20, pnpm 12.5.1 (`corepack enable`), PostgreSQL 16 có extension `cube`/`earthdistance`.

```bash
pnpm install
pnpm --filter @petcare/api prisma:generate
pnpm --filter @petcare/api prisma:migrate
pnpm dev:api    # http://localhost:4000
pnpm dev:web    # http://localhost:5173
```

## Ứng dụng Android (Expo)

Yêu cầu: Docker stack đang chạy (API ở `localhost:4000`), Android SDK + một emulator (hoặc điện thoại Android cài Expo Go).

```bash
pnpm install
pnpm --filter ./packages/* build                 # types/constants cho mobile import
adb reverse tcp:4000 tcp:4000                    # emulator gọi được API và tải được ảnh upload
pnpm --filter @petcare/mobile start --android    # Expo tự cài Expo Go lên emulator
```

- Điện thoại thật (Android hoặc iPhone, cùng Wi‑Fi): chạy `pnpm --filter @petcare/mobile lan-url` để lấy IP, đặt `API_PUBLIC_URL=http://<IP>:4000` trong `.env` gốc (ảnh upload trả về URL tuyệt đối) và `EXPO_PUBLIC_API_URL=http://<IP>:4000/api` khi chạy `pnpm --filter @petcare/mobile start`, rồi quét mã QR bằng Expo Go.
- File cài đặt phát hành (APK/AAB/iOS): cấu hình sẵn trong `apps/mobile/eas.json`; các bước build ở [docs/HUONG_DAN_SU_DUNG.md](docs/HUONG_DAN_SU_DUNG.md) mục 7.
- Đăng nhập thử bằng tài khoản Pet Owner mẫu trong [docs/LOGIN_GUIDE.md](docs/LOGIN_GUIDE.md).

## Tài liệu

- [docs/HUONG_DAN_SU_DUNG.md](docs/HUONG_DAN_SU_DUNG.md) — hướng dẫn chạy thử trên MacBook (web + mobile Android) và giải thích ứng dụng của từng tính năng theo từng vai trò
- [FEATURES.md](FEATURES.md) — danh sách chi tiết mọi tính năng, theo đúng thứ tự đã triển khai
- [docs/LOGIN_GUIDE.md](docs/LOGIN_GUIDE.md) — cách đăng nhập thử từng vai trò (Admin, Hospital, Vet, Pet Owner), cả bằng tài khoản mẫu lẫn luồng đăng ký/duyệt thật

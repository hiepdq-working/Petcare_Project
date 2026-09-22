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

Cấu hình tuỳ chọn (không bắt buộc để chạy thử) đặt trong file `.env` ở thư mục gốc — xem [.env.example](.env.example): khoá bí mật JWT riêng, `RESEND_API_KEY` để gửi email thật, `GOOGLE_CLIENT_ID` để bật đăng nhập Google.

## Chạy local không dùng Docker (phát triển)

Yêu cầu: Node.js ≥ 20, pnpm 12.5.1 (`corepack enable`), PostgreSQL 16 có extension `cube`/`earthdistance`.

```bash
pnpm install
pnpm --filter @petcare/api prisma:generate
pnpm --filter @petcare/api prisma:migrate
pnpm dev:api    # http://localhost:4000
pnpm dev:web    # http://localhost:5173
```

## Tài liệu

- [FEATURES.md](FEATURES.md) — danh sách chi tiết mọi tính năng, theo đúng thứ tự đã triển khai
- [docs/LOGIN_GUIDE.md](docs/LOGIN_GUIDE.md) — cách đăng nhập thử từng vai trò (Admin, Hospital, Vet, Pet Owner), cả bằng tài khoản mẫu lẫn luồng đăng ký/duyệt thật

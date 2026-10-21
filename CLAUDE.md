# PetCare — ghi chú cho Claude (tự động nạp ở mỗi phiên)

Người dùng viết và đọc **tiếng Việt** → luôn trả lời bằng tiếng Việt. Dự án: nền tảng chăm sóc thú cưng (web + app Android/iOS), repo `hiepdq-working/Petcare_Project`, nhánh `main`.

## Đọc trước khi làm gì đó
- `FEATURES.md` — danh sách tính năng **đang có** (nguồn sự thật) và mục "Chưa triển khai".
- `docs/HUONG_DAN_SU_DUNG.md` — cách chạy web/mobile trên MacBook, tài khoản mẫu, kịch bản thử.
- `docs/LOGIN_GUIDE.md` — đăng nhập theo từng vai trò. `git log --oneline` cho lịch sử từng đợt.

## Quy tắc làm việc người dùng đã chốt
1. **Cập nhật `FEATURES.md` chủ động** trong cùng commit với mọi thay đổi ảnh hưởng tính năng/hành vi (kể cả chuyển mục khỏi "Chưa triển khai"). Tài liệu hướng dẫn/README cũng cập nhật nếu liên quan.
2. **Chỉ `git push` khi người dùng nói** ("push", "commit rồi push"). Commit theo từng phần thì được. Kết thúc commit bằng dòng `Co-Authored-By:` theo hướng dẫn của phiên.
3. Việc lớn → **vào Plan Mode trước** (EnterPlanMode), khảo sát, hỏi những quyết định thuộc về người dùng, rồi mới code.
4. **Kiểm chứng thật** trước khi báo xong: web trong trình duyệt, mobile trên emulator (ảnh chụp bằng `adb`), API bằng `curl`. Nói rõ cái gì chưa kiểm chứng được. Không báo "xong" khi chưa chạy.
5. Dọn dữ liệu thử sau khi test (xoá bài/lịch/user thử qua psql) và khôi phục trạng thái mẫu.
6. Bảo mật: **không bao giờ lưu, lặp lại hay dùng mật khẩu/khoá** người dùng dán vào chat (từng có mật khẩu Gmail bị dán — đừng dùng). Thông tin đăng nhập thật (SMTP, Google, Expo, Apple) do người dùng tự nhập vào `.env`/công cụ của họ.
7. Chạy `pnpm check` (typecheck cả 5 package + jest API) trước khi commit mã.

## Kiến trúc nhanh
pnpm monorepo: `apps/api` (NestJS + Prisma/PostgreSQL; Controller→Service→Repository, Zod validator, phản hồi `{success,data,message}`, JWT 15' + refresh token xoay vòng, Socket.IO), `apps/web` (React+Vite+Tailwind+React Query+Zustand), `apps/mobile` (Expo SDK 58 / RN 0.88 / expo-router, **chỉ vai Pet Owner**), `packages/types` + `packages/constants`.
5 vai trò: PET_OWNER, HOSPITAL_OWNER, HOSPITAL_STAFF (Lễ tân/Điều dưỡng), VET, ADMIN. Mobile gửi header `X-Client: mobile` để nhận refresh token trong body.
Migration: API tự `prisma migrate deploy` khi khởi động; tạo migration mới bằng `prisma migrate dev` từ `apps/api` với `DATABASE_URL=postgresql://petcare:petcare_dev_password@localhost:5433/petcare?schema=public`.

## Chạy / build (macOS, Docker Desktop)
- `docker compose up -d` (postgres 5433, api 4000, web 5173). **Không có bind mount** → sau khi sửa code API/web: `docker compose build api web && docker compose up -d api web`, rồi hard-refresh trình duyệt. Seed: `docker compose exec api node prisma/seed.js`. Mật khẩu mẫu trong `docs/LOGIN_GUIDE.md`.
- Docker CLI có thể không nằm trong PATH: `export PATH=$PATH:/Applications/Docker.app/Contents/Resources/bin`. Docker Desktop hay tắt — kiểm tra `docker info` trước.
- Mobile: emulator `Medium_Phone_API_36.1`, `adb reverse tcp:4000 tcp:4000` + `tcp:8081`, chạy Metro bằng `./node_modules/.bin/expo start --android --port 8081` trong `apps/mobile` (`npx expo` từng chạy sai). Mở app: `exp://localhost:8081?...`. Tắt Wi‑Fi emulator thì phải dùng `localhost`, không dùng IP LAN. Ảnh chụp emulator 1080×2400, hiển thị 900×2000 → nhân 1,2 khi tap bằng `adb shell input tap`. Hộp thoại quyền vị trí: chọn "Don't allow".
- Web `tsc`: `apps/web/tsconfig.json` có `paths` ép `react` về `@types/react` 18 (mobile dùng 19) — đừng xoá.

## Trạng thái hiện tại (cập nhật lần cuối: 2026-10-21, HEAD `a88d457`, đã push)
**Đã xong:** toàn bộ web (Pet Owner, Hospital Owner, Vet, nhân viên Lễ tân/Điều dưỡng với quyền theo vị trí + hộp thư dùng chung, Admin; khuyến mãi, nhóm, yêu thích/đã lưu, nhắc lịch 24h, màu thương hiệu phòng khám); mobile Android M1–M3 (xem `FEATURES.md` mục 25); cấu hình iOS + phát hành (M4); tài liệu hướng dẫn.

**Chưa chạy thật / chưa kiểm thử:** *chưa từng build* APK/AAB/IPA; bản iOS **chưa thử trên iPhone** (người dùng có iPhone để thử bằng Expo Go; không có tài khoản Apple Developer; Mac chỉ còn ~5 GB trống, chưa có Xcode đầy đủ; Docker build cache ~14 GB có thể dọn). API cho bản build dự kiến = IP LAN của Mac.

**Đang tạm gác (hỏi người dùng khi quay lại):** xác thực email + OTP quên mật khẩu + điều khoản + email thông báo hàng loạt. Câu hỏi còn mở: dùng App Password Gmail hay SMTP khác/hoãn gửi thật; OTP thay hay song song link đặt lại mật khẩu (**lưu ý:** lời mời bác sĩ/nhân viên/admin đang dùng link đặt lại mật khẩu, không được làm hỏng); ai nhận email hàng loạt (tài khoản seed là `@petcare.local` giả).

**Bị chặn vì cần người dùng cung cấp:** push notification khi app đóng (dự án Firebase + `google-services.json` + development build; Expo Go Android không nhận push từ xa), đăng nhập Google (OAuth client ID), deep link đặt lại mật khẩu/xác thực email (gắn với phần email ở trên).

**Chưa làm ở đâu cả:** hiển thị màu thương hiệu trên thẻ phòng khám ở trang tìm kiếm, đăng video, đa ngôn ngữ, gọi thoại/video (cần TURN), Shop, các vai Hospital/Vet/Admin/nhân viên trên mobile, thông báo đẩy.

## Gợi ý khi người dùng quay lại
Hỏi người dùng muốn tiếp tục việc nào ở danh sách trên; nếu họ đã có tài khoản Expo/Firebase/Google/Apple thì mở khoá các mục tương ứng. Trước khi code lớn: `git status`, `git log -5`, đọc lại `FEATURES.md` để khỏi làm trùng.

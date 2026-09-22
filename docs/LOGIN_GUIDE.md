# Hướng dẫn đăng nhập theo từng vai trò

PetCare có 4 vai trò: **Pet Owner** (chủ nuôi), **Hospital Owner** (phòng khám), **Vet** (bác sĩ), **Admin**. Mỗi vai trò thấy một giao diện và bộ chức năng khác nhau sau khi đăng nhập.

## Cách nhanh nhất: dùng tài khoản mẫu (seed data)

Sau khi chạy `docker compose up -d` lần đầu, hãy tạo sẵn 4 tài khoản mẫu — mỗi vai trò một tài khoản, cùng mật khẩu:

```bash
docker compose exec api node prisma/seed.js
```

Lệnh này chạy an toàn nhiều lần (idempotent) — chạy lại không tạo trùng, chỉ bổ sung phần còn thiếu.

Mật khẩu chung cho cả 4 tài khoản: **`ChangeMe123!`**

| Vai trò | Email | Ghi chú |
|---|---|---|
| Admin | `admin@petcare.local` | Toàn quyền quản trị hệ thống |
| Hospital Owner | `hospital@petcare.local` | Kèm sẵn 1 phòng khám mẫu "PetCare Demo Clinic" tại Q.1, TP.HCM + 1 dịch vụ "Khám tổng quát" |
| Vet | `vet@petcare.local` | Đã gắn vào phòng khám mẫu ở trên, chuyên khoa "Nội tổng quát" |
| Pet Owner | `owner@petcare.local` | Kèm sẵn 1 thú cưng mẫu tên "Miu" |

Truy cập `http://localhost:5173`, chọn **Đăng nhập**, nhập email + mật khẩu ở trên. Đăng nhập xong nên vào **Cài đặt tài khoản** đổi sang mật khẩu riêng nếu định dùng lâu dài.

> Các tài khoản này chỉ nên dùng để dùng thử (demo/dev). Đừng seed chúng vào môi trường production thật.

## Luồng thật ngoài đời (không qua seed)

Nếu muốn kiểm thử đúng luồng nghiệp vụ thật thay vì đi tắt bằng seed:

### Pet Owner
Tự do đăng ký, không cần ai duyệt.
1. Vào trang **Đăng ký**, chọn vai trò "Chủ nuôi thú cưng", nhập email/mật khẩu (hoặc đăng nhập bằng Google nếu đã cấu hình `GOOGLE_CLIENT_ID`)
2. Xác thực email qua liên kết được gửi tới hộp thư (ở môi trường dev không cấu hình `RESEND_API_KEY`, liên kết này được in ra log của container `api` thay vì gửi email thật — xem bằng `docker compose logs api`)
3. Đăng nhập, vào **Hồ sơ thú cưng** để thêm thú cưng

### Hospital Owner
Không tự đăng ký trực tiếp — phải được Admin duyệt.
1. Vào trang **Đăng ký đối tác** (Partner Registration), điền thông tin phòng khám và tải lên **giấy phép kinh doanh**
2. Đăng nhập bằng tài khoản Admin (xem bên dưới) → vào mục **Duyệt đối tác** → xem hồ sơ + giấy phép → **Duyệt**
3. Hệ thống tự tạo tài khoản Hospital Owner và gửi email chứa liên kết đặt mật khẩu lần đầu tới email đã đăng ký (ở dev: xem liên kết trong log container `api`)
4. Mở liên kết, đặt mật khẩu, sau đó đăng nhập bình thường

### Vet
Không tự đăng ký — phải được chính Hospital Owner của phòng khám mời.
1. Đăng nhập bằng tài khoản Hospital Owner đã có ở trên → vào **Quản lý bác sĩ** → **Mời bác sĩ**, nhập tên + email bác sĩ
2. Hệ thống tạo tài khoản Vet và gửi email liên kết đặt mật khẩu lần đầu tới email đó (ở dev: xem log container `api`)
3. Mở liên kết, đặt mật khẩu, đăng nhập bằng email đó

### Admin
Không có giao diện tự đăng ký cho Admin (đúng như thiết kế — tài khoản Admin không nên tạo được từ bên ngoài). Có hai cách hợp lệ để có tài khoản Admin:
- Dùng tài khoản Admin đã tạo sẵn từ seed (`admin@petcare.local` / `ChangeMe123!`, xem phần trên)
- Hoặc tạo thủ công trong database, ví dụ qua Prisma Studio:
  ```bash
  docker compose exec api npx prisma studio
  ```
  rồi thêm bản ghi vào bảng `User` với `role = ADMIN` (mật khẩu phải là chuỗi đã băm bằng bcrypt, không lưu plain text).

## Xem liên kết email ở môi trường Docker (dev)

`docker-compose.yml` chạy API với `NODE_ENV=development` và không cấu hình `RESEND_API_KEY`, nên mọi email (xác thực tài khoản, mời bác sĩ, mời phòng khám, quên mật khẩu) đều được in ra console thay vì gửi thật:

```bash
docker compose logs -f api
```

Tìm dòng có chứa liên kết (`http://localhost:5173/...`) ngay sau khi thực hiện hành động tương ứng.

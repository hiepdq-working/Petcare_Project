# Hướng dẫn chạy thử và sử dụng PetCare (Web + Mobile) trên MacBook

Tài liệu này dành cho người muốn **chạy PetCare trên máy Mac của mình** và **hiểu từng tính năng dùng để làm gì**. Gồm:

1. [PetCare là gì, ai dùng gì](#1-petcare-là-gì-ai-dùng-gì)
2. [Chuẩn bị máy Mac](#2-chuẩn-bị-máy-mac)
3. [Chạy bản web](#3-chạy-bản-web)
4. [Tài khoản mẫu](#4-tài-khoản-mẫu-để-đăng-nhập-thử)
5. [Hướng dẫn dùng bản web theo từng vai trò](#5-hướng-dẫn-dùng-bản-web-theo-từng-vai-trò)
6. [Chạy bản mobile trên MacBook (Android và iPhone)](#6-chạy-bản-mobile-trên-macbook-android-và-iphone)
7. [Tạo file cài đặt phát hành (APK / AAB / iOS)](#7-tạo-file-cài-đặt-phát-hành-apk--aab--ios)
8. [Hướng dẫn dùng bản mobile](#8-hướng-dẫn-dùng-bản-mobile-chủ-nuôi)
9. [Kịch bản thử từ đầu đến cuối (khoảng 15 phút)](#9-kịch-bản-thử-từ-đầu-đến-cuối-khoảng-15-phút)
10. [Xử lý sự cố thường gặp](#10-xử-lý-sự-cố-thường-gặp)
11. [Những gì chưa có](#11-những-gì-chưa-có)

> Các lệnh bên dưới chạy trong **Terminal** (hoặc terminal tích hợp của VS Code), tại thư mục gốc dự án `Petcare_Project`, trừ khi có ghi chú khác.

---

## 1. PetCare là gì, ai dùng gì

PetCare là nền tảng chăm sóc thú cưng kết nối **chủ nuôi** với **phòng khám thú y**: tìm phòng khám gần nhất, đặt lịch, lưu hồ sơ bệnh án và sổ tiêm phòng của thú cưng, nhắn tin với phòng khám, và chia sẻ khoảnh khắc trên bảng tin cộng đồng.

Có **5 loại tài khoản**, mỗi loại thấy một giao diện khác nhau:

| Vai trò | Là ai | Dùng để làm gì | Có trên |
|---|---|---|---|
| **Pet Owner** (Chủ nuôi) | Người nuôi thú cưng | Quản lý hồ sơ thú cưng, tìm và đặt lịch khám, xem hồ sơ bệnh án/tiêm phòng, nhắn tin, đăng bài | **Web + Mobile** |
| **Hospital Owner** (Chủ phòng khám) | Người điều hành phòng khám | Quản lý hồ sơ phòng khám, dịch vụ, đội ngũ, lịch khám, nhắn tin, đăng bài/khuyến mãi | Web |
| **Vet** (Bác sĩ) | Bác sĩ của phòng khám | Xem lịch khám được giao, lập hồ sơ bệnh án, ghi nhận tiêm phòng | Web |
| **Hospital Staff** (Nhân viên: Lễ tân / Điều dưỡng) | Nhân viên phòng khám | Lễ tân xử lý lịch hẹn + trả lời tin nhắn; Điều dưỡng chuyển trạng thái khám + xem hồ sơ bệnh án | Web |
| **Admin** | Quản trị hệ thống | Duyệt phòng khám đăng ký, quản lý người dùng/phòng khám, kiểm duyệt bảng tin | Web |

**Bản mobile (Android) chỉ dành cho Pet Owner** — đây là người dùng cuối cần thao tác mọi lúc mọi nơi. Các vai trò còn lại làm việc trên máy tính nên dùng web.

Hệ thống gồm 3 phần chạy cùng nhau:

```
Trình duyệt (web, cổng 5173) ─┐
                              ├──► API NestJS (cổng 4000) ──► PostgreSQL (cổng 5433)
App Android (Expo Go) ────────┘
```

---

## 2. Chuẩn bị máy Mac

### Để chạy bản web (bắt buộc)

| Cần có | Ghi chú |
|---|---|
| **Docker Desktop** | Tải ở docker.com, cài xong **mở ứng dụng Docker** và chờ biểu tượng cá voi ở thanh menu báo "running". Đây là thứ duy nhất cần để chạy web. |
| Trình duyệt (Chrome/Safari) | Để mở web. Khi đăng bài, trình duyệt sẽ xin quyền dùng **camera** (xem mục 5.1). |

### Để chạy bản mobile (thêm)

| Cần có | Ghi chú |
|---|---|
| **Node.js 22** | Khuyến nghị cài qua `nvm`. Kiểm tra: `node -v` |
| **pnpm 12.5.1** | `corepack enable` (đi kèm Node) rồi `pnpm -v` |
| **Android Studio** | Cài kèm Android SDK và tạo **một máy ảo (emulator)**. Máy bạn đang có máy ảo tên `Medium_Phone_API_36.1`. Xem danh sách: `~/Library/Android/sdk/emulator/emulator -list-avds` |
| Dung lượng trống | Nên còn **≥ 10 GB** (Docker + Android emulator khá nặng). Xem: `df -h /` |

Thêm Android vào PATH để gõ được `adb` và `emulator` (làm một lần, dán vào `~/.zshrc` rồi mở Terminal mới):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
```

> Nếu lệnh `docker` báo "command not found" trong VS Code, hãy thêm `export PATH=$PATH:$HOME/.docker/bin` vào `~/.zshrc`, hoặc mở bằng Terminal của macOS.

---

## 3. Chạy bản web

### Lần đầu tiên

```bash
# 1. Bật Docker Desktop trước, rồi:
docker compose up -d --build

# 2. Chờ ~1–3 phút cho 3 container chạy, kiểm tra:
docker compose ps

# 3. Tạo 4 tài khoản mẫu + phòng khám mẫu + thú cưng mẫu (chỉ cần 1 lần):
docker compose exec api node prisma/seed.js
```

Sau đó mở:

| Địa chỉ | Là gì |
|---|---|
| http://localhost:5173 | **Trang web PetCare** |
| http://localhost:4000/api | API (bạn thường không cần mở trực tiếp) |

### Các lệnh dùng hằng ngày

| Việc cần làm | Lệnh |
|---|---|
| Bật lại sau khi tắt máy | Mở Docker Desktop, rồi `docker compose up -d` |
| Xem trạng thái | `docker compose ps` |
| Xem log (rất hữu ích — email giả được in ra đây) | `docker compose logs -f api` |
| Dừng nhưng **giữ** dữ liệu | `docker compose down` |
| Dừng và **xoá sạch** dữ liệu (làm lại từ đầu) | `docker compose down -v` (sau đó phải chạy lại lệnh seed ở trên) |
| Sau khi **sửa code** web/API, áp dụng thay đổi | `docker compose build api web && docker compose up -d api web` |

### Email chạy thế nào khi thử trên máy?

Máy bạn chưa cấu hình dịch vụ gửi mail thật, nên **mọi email** (xác thực tài khoản, mời bác sĩ/nhân viên, quên mật khẩu, duyệt đối tác) **không được gửi đi mà chỉ in ra log**. Khi một thao tác cần "bấm liên kết trong email", làm như sau:

```bash
docker compose logs -f api
```

rồi tìm dòng chứa liên kết dạng `http://localhost:5173/...` (ví dụ `reset-password?token=...`) và dán vào trình duyệt. Đây là cách thử đúng luồng mời bác sĩ, nhân viên, đăng ký đối tác mà không cần email thật.

---

## 4. Tài khoản mẫu để đăng nhập thử

Sau khi chạy lệnh seed, dùng mật khẩu chung **`ChangeMe123!`**:

| Vai trò | Email | Có sẵn gì |
|---|---|---|
| Admin | `admin@petcare.local` | Toàn quyền quản trị |
| Hospital Owner | `hospital@petcare.local` | Phòng khám **"PetCare Demo Clinic"** (Q.1, TP.HCM) + dịch vụ "Khám tổng quát" |
| Vet | `vet@petcare.local` | Bác sĩ "BS. Demo" thuộc phòng khám mẫu |
| Pet Owner | `owner@petcare.local` | Thú cưng mẫu tên **"Miu"** |

Đăng nhập tại http://localhost:5173 → **Đăng nhập**. Nên mở **mỗi vai trò ở một cửa sổ trình duyệt riêng** (dùng cửa sổ ẩn danh cho vai trò thứ hai) để xem tương tác giữa các bên cùng lúc.

Tài khoản **Lễ tân / Điều dưỡng** không có sẵn: bạn tự tạo bằng chức năng "Thêm nhân viên" của Hospital Owner (xem mục 5.2).

---

## 5. Hướng dẫn dùng bản web theo từng vai trò

Với mỗi tính năng, cột "Dùng để" giải thích **ứng dụng thực tế** của nó.

### 5.1. Pet Owner (chủ nuôi) — đăng nhập `owner@petcare.local`

Giao diện giống mạng xã hội: thanh trên cùng (trang chủ, tìm phòng khám, tin nhắn, thông báo, menu tài khoản), thanh điều hướng dưới (**Trang chủ · Khám phá · Tin nhắn · Tài khoản**) và **cột phải** (trên màn hình rộng) hiện khuyến mãi, bài mới của phòng khám và lối tắt.

| Tính năng | Cách dùng | Dùng để |
|---|---|---|
| **Tài khoản** (trang cá nhân) | Thanh dưới → **Tài khoản** | Xem lịch hẹn sắp tới, danh sách thú cưng, và "Khoảnh khắc đáng yêu" (ảnh đã đăng). Đây là trung tâm điều khiển của chủ nuôi. |
| **Hồ sơ thú cưng** | Tài khoản → **Thêm thú cưng**; bấm vào một bé để xem/sửa/xoá | Lưu thông tin từng bé: tên, loài, giống, ngày sinh, cân nặng, ảnh, ghi chú. Mọi dữ liệu y tế khác đều gắn vào hồ sơ này. |
| **Digital Life** (dòng thời gian) | Vào một thú cưng → **Dòng thời gian** | Xem toàn bộ lịch sử của bé theo tháng: lịch khám, hồ sơ bệnh án, tiêm phòng, bài đăng. Giống "nhật ký sức khoẻ" trọn đời. |
| **Sổ tiêm phòng** | Vào thú cưng → **Sổ tiêm phòng** → **+ Thêm mũi tiêm** | Tự ghi vắc-xin, ngày tiêm, ngày cần tiêm nhắc lại. Bác sĩ cũng có thể ghi giúp. Không bỏ sót mũi tiêm. |
| **Tìm phòng khám gần nhất** | **Khám phá** (hoặc biểu tượng bản đồ trên thanh trên) | Tìm phòng khám theo bán kính 5/10/20/50 km quanh vị trí bạn hoặc điểm bạn chọn trên bản đồ. Không cần đăng nhập vẫn tìm được. |
| **Trang phòng khám** | Bấm vào một phòng khám | Xem giới thiệu, địa chỉ, số điện thoại, giờ cấp cứu 24/7, với 3 tab: **Dịch vụ** (bảng giá), **Đặt lịch**, **Đánh giá**. Trang được tô màu theo thương hiệu riêng của phòng khám. |
| **Đặt lịch khám** | Trang phòng khám → tab **Đặt lịch** → chọn thú cưng, dịch vụ, (tuỳ chọn) bác sĩ, ngày giờ | Hẹn khám không cần gọi điện. **Hãy chọn bác sĩ "BS. Demo"** nếu muốn bác sĩ thấy lịch này ở tài khoản của họ. |
| **Lịch hẹn của tôi** | Tài khoản → lịch sắp tới / menu | Theo dõi trạng thái: *Chờ xác nhận → Đã xác nhận → Đang khám → Hoàn thành*. Có nút **Huỷ** khi chưa khám. Còn tối đa 24 giờ sẽ được **nhắc tự động** bằng thông báo. |
| **Hồ sơ bệnh án** | Từ Digital Life hoặc thông báo, bấm vào mục "Hồ sơ" | Xem chẩn đoán, điều trị, kết luận, tệp đính kèm (xét nghiệm, X-quang) mà bác sĩ lập. Bạn **chỉ xem**, không sửa; hồ sơ lưu mọi lần chỉnh sửa nên không thể bị ghi đè âm thầm. |
| **Đánh giá phòng khám** | Trang phòng khám → tab **Đánh giá** | Chấm 1–5 sao và nhận xét **sau khi đã hoàn thành** một lần khám tại đó (chống đánh giá ảo). Mỗi phòng khám đánh giá 1 lần, đánh giá lại sẽ sửa bản cũ. |
| **Yêu thích phòng khám** | Biểu tượng trái tim ở danh sách / trang phòng khám; xem ở cột phải → **Phòng khám yêu thích** | Lưu các phòng khám hay dùng; chỉ những phòng khám bạn yêu thích mới báo bạn khi có khuyến mãi mới. |
| **Bảng tin** | **Trang chủ** | Xem bài của cộng đồng và phòng khám; lọc theo từng bé ở hàng thú cưng phía trên. |
| **Đăng bài** | Nút **+** (giữa thanh dưới) | Chia sẻ khoảnh khắc. **Bắt buộc chụp ảnh trực tiếp bằng camera** (không chọn ảnh có sẵn), tối đa 1 ảnh/bài, có thể gắn thẻ thú cưng. Trình duyệt sẽ hỏi quyền camera — chọn **Cho phép** (Mac dùng camera FaceTime). Bài gắn thẻ bé sẽ tự xuất hiện trong Digital Life của bé. |
| **Thích / Bình luận / Lưu** | Dưới mỗi bài | Tương tác với bài viết; **Lưu** để xem lại ở **Bài viết đã lưu**. |
| **Nhóm cộng đồng** | Cột phải → **Nhóm** | Lập hoặc tham gia nhóm (ví dụ "Hội chủ mèo Q.1"); bài trong nhóm chỉ thành viên thấy và không lẫn vào bảng tin chung. |
| **Nhắn tin** | Trang phòng khám → **Nhắn tin**, hoặc mục **Tin nhắn** | Hỏi nhanh phòng khám, gửi kèm 1 ảnh. Tin tới **ngay lập tức**, không cần tải lại. |
| **Thông báo** | Biểu tượng chuông | Báo lịch hẹn được xác nhận, tin nhắn mới, nhắc lịch, khuyến mãi. Bấm vào thông báo sẽ đưa đến đúng nơi. |
| **Cài đặt** | Menu avatar → **Cài đặt** | Sửa họ tên, số điện thoại, ảnh đại diện; đổi mật khẩu. |

### 5.2. Hospital Owner (chủ phòng khám) — đăng nhập `hospital@petcare.local`

Giao diện **sidebar** bên trái: **Tổng quan · Lịch khám · Hồ sơ bệnh án · Đội ngũ · Dịch vụ · Bảng tin · Tin nhắn · Cài đặt**.

| Tính năng | Cách dùng | Dùng để |
|---|---|---|
| **Tổng quan** | Sidebar → Tổng quan | Bảng điều khiển: lịch hẹn hôm nay, đội ngũ bác sĩ, trạng thái hoạt động. |
| **Chỉnh sửa hồ sơ phòng khám** | Tổng quan → **Chỉnh sửa hồ sơ phòng khám** | Cập nhật tên, mô tả, logo, ảnh bìa, địa chỉ, SĐT, cờ **cấp cứu 24/7**; **chọn vị trí trên bản đồ** (để chủ nuôi tìm thấy bạn); chọn **màu thương hiệu** (cả khu làm việc và trang công khai đổi theo màu này); bật/tắt **thông báo** "lịch hẹn mới" và "tin nhắn mới". |
| **Dịch vụ** | Sidebar → Dịch vụ | Tạo/sửa/xoá dịch vụ (tên, mô tả, giá, thời lượng). Đây là danh sách chủ nuôi nhìn thấy và chọn khi đặt lịch. |
| **Đội ngũ** | Sidebar → Đội ngũ → **Thêm bác sĩ / Thêm nhân viên** | Mời **bác sĩ**, **điều dưỡng**, **lễ tân** bằng email. Hệ thống tạo tài khoản và gửi liên kết đặt mật khẩu (trên máy bạn: lấy liên kết trong `docker compose logs -f api`). Có thể **tạm ngưng** hoặc đổi vị trí nhân viên; nhân viên bị tạm ngưng không đăng nhập được nữa. |
| **Lịch khám** | Sidebar → Lịch khám | Hàng đợi lịch hẹn, có thanh chọn ngày. Các nút theo trạng thái: **Xác nhận / Huỷ**, rồi **Bắt đầu khám**, rồi **Hoàn thành**. Chỉ phòng khám (và nhân viên được phân quyền) mới đổi được trạng thái; bác sĩ chỉ được báo. |
| **Hồ sơ bệnh án** | Sidebar → Hồ sơ bệnh án | Xem tất cả hồ sơ của phòng khám, thống kê theo trạng thái *Đang điều trị / Tái khám / Hoàn tất*; chỉ xem, không sửa (việc lập/sửa thuộc bác sĩ). |
| **Bảng tin & Khuyến mãi** | Sidebar → Bảng tin | Đăng bài giới thiệu (tối đa 5 ảnh, gắn thẻ bác sĩ, có nút xem vị trí). Tick **"Đăng khuyến mãi"** để đăng ưu đãi có tiêu đề, mức giảm, ngày bắt đầu/kết thúc: khuyến mãi còn hiệu lực sẽ hiện nổi bật cho chủ nuôi và **chỉ những người đã yêu thích phòng khám nhận thông báo**. |
| **Tin nhắn** | Sidebar → Tin nhắn | Trả lời khách. Lễ tân trong đội ngũ cũng thấy và trả lời được **cùng một hộp thư**. |

### 5.3. Vet (bác sĩ) — đăng nhập `vet@petcare.local`

Sidebar: **Lịch khám của tôi · Hồ sơ bệnh án · Cài đặt**.

| Tính năng | Cách dùng | Dùng để |
|---|---|---|
| **Lịch khám của tôi** | Sidebar → Lịch khám của tôi | Xem các lịch hẹn **được giao cho bạn** (chủ nuôi đã chọn bạn khi đặt). Bạn không được xác nhận/từ chối lịch; việc đó thuộc phòng khám. |
| **Lập hồ sơ bệnh án** | Trong thẻ lịch hẹn (khi lịch đã *Đã xác nhận / Đang khám / Hoàn thành*) → **Lập hồ sơ bệnh án** | Ghi triệu chứng, nguyên nhân, chẩn đoán, điều trị, kết luận. Chỉ bác sĩ của phòng khám **đã từng khám** thú cưng đó mới lập được (chống hồ sơ giả). |
| **Sửa hồ sơ & đổi trạng thái** | Hồ sơ bệnh án → chọn hồ sơ | Mỗi lần sửa tạo **phiên bản mới** (không ghi đè, giữ lịch sử); đổi trạng thái *Đang điều trị / Tái khám / Hoàn tất*; đính kèm ảnh/PDF xét nghiệm. |
| **Ghi nhận tiêm phòng** | Trong thẻ lịch hẹn → **Ghi nhận tiêm phòng** | Ghi mũi tiêm vào sổ tiêm của thú cưng, chủ nuôi thấy ngay. |

### 5.4. Nhân viên phòng khám — Lễ tân và Điều dưỡng

Cách tạo: đăng nhập Hospital Owner → **Đội ngũ → Thêm nhân viên**, chọn vị trí → lấy liên kết đặt mật khẩu trong log (`docker compose logs -f api`) → mở liên kết, đặt mật khẩu → đăng nhập bằng email vừa tạo.

| Vị trí | Thấy gì | Làm được gì | Dùng để |
|---|---|---|---|
| **Lễ tân** | Lịch khám, Tin nhắn | **Xác nhận / Huỷ** lịch; xem và **trả lời tin nhắn** của khách (hộp thư chung với chủ phòng khám, khách thấy tin dưới tên phòng khám) | Người ở quầy tiếp nhận: duyệt lịch và chăm sóc khách. |
| **Điều dưỡng** | Lịch khám, Hồ sơ bệnh án | **Bắt đầu khám / Hoàn thành** lịch; **xem** hồ sơ bệnh án (không sửa) | Người hỗ trợ khám: cập nhật tiến độ ca khám, tra cứu hồ sơ. |

Cả hai **không** sửa được hồ sơ phòng khám, dịch vụ hay đội ngũ, và lễ tân **không** xem được hồ sơ bệnh án (thông tin y tế chỉ cho người cần).

### 5.5. Admin — đăng nhập `admin@petcare.local`

Sidebar: **Duyệt đối tác · Phòng khám · Người dùng · Bảng tin**.

| Tính năng | Dùng để |
|---|---|
| **Duyệt đối tác** | Phòng khám mới nộp đơn tại trang **Đăng ký đối tác** (kèm giấy phép kinh doanh). Admin xem hồ sơ + giấy phép rồi **Duyệt/Từ chối**. Khi duyệt, hệ thống tự tạo tài khoản Hospital Owner và gửi liên kết đặt mật khẩu (xem trong log). Mục đích: chỉ phòng khám thật mới vào hệ thống. |
| **Phòng khám** | Xem/tạo/sửa, **vô hiệu hoá** phòng khám (không xoá hẳn để giữ lịch sử lịch hẹn/hồ sơ). |
| **Người dùng** | Xem/tạo (mời qua email), đổi vai trò/trạng thái, vô hiệu hoá người dùng (không tự khoá chính mình). |
| **Bảng tin** | Kiểm duyệt: xem mọi bài và xoá bài vi phạm. |

> Admin không có trang tự đăng ký (cố ý, để không ai tự tạo được quyền quản trị) — dùng tài khoản seed.

---

## 6. Chạy bản mobile trên MacBook (Android và iPhone)

Ứng dụng mobile chạy bằng **Expo Go** trong **máy ảo Android** hoặc trên **điện thoại thật (Android/iPhone)**. Không cần build file cài đặt để thử; muốn có file cài đặt thì xem [mục 7](#7-tạo-file-cài-đặt-phát-hành-apk--aab--ios).

### Chuẩn bị một lần

```bash
pnpm install                      # cài thư viện cho cả dự án
pnpm --filter ./packages/* build  # build các gói dùng chung cho mobile
```

### Mỗi lần chạy (làm theo thứ tự)

**Bước 1 — Bật web/API** (mục 3). Mobile gọi cùng API ở cổng 4000, nên `docker compose up -d` phải đang chạy.

**Bước 2 — Bật máy ảo Android** (một Terminal riêng, để nguyên đó):

```bash
emulator -avd Medium_Phone_API_36.1
```

Chờ máy ảo lên màn hình chính. (Tên máy ảo khác nhau tuỳ máy; xem bằng `emulator -list-avds`.)

**Bước 3 — Cho máy ảo thấy API trên Mac** (máy ảo coi `localhost` là chính nó, nên cần "bắc cầu" cổng):

```bash
adb reverse tcp:4000 tcp:4000   # để app gọi API và tải được ảnh đã upload
adb reverse tcp:8081 tcp:8081   # để app tải mã từ máy Mac
```

> Phải chạy lại 2 lệnh này **mỗi lần khởi động lại máy ảo**.

**Bước 4 — Chạy app** (Terminal khác, để nguyên đó vì đây là máy chủ phát triển Metro):

```bash
pnpm --filter @petcare/mobile start --android
```

Lần đầu Expo tự cài **Expo Go** vào máy ảo rồi mở app PetCare. Đợi bundle xong (vài chục giây). Khi bạn sửa code, app tự cập nhật.

**Bước 5 — Đăng nhập** bằng `owner@petcare.local` / `ChangeMe123!`.

### Mẹo khi dùng máy ảo

| Việc | Cách làm |
|---|---|
| **Vị trí (GPS)** | Hộp thoại xin quyền vị trí hiện ra khi vào **Khám phá**. Nếu **Không cho phép**, app dùng TP.HCM mặc định (phòng khám mẫu ở đó nên thấy ngay). Nếu **cho phép**, máy ảo mặc định ở California nên sẽ không có phòng khám nào gần — hãy đặt vị trí máy ảo: nút `…` bên cạnh máy ảo → **Location** → nhập `10.7769, 106.7009` → Set Location. |
| **Camera** | Máy ảo dùng camera ảo (hình phòng giả), đủ để thử chụp bài đăng. |
| **Mở menu nhà phát triển / tải lại app** | Trong Terminal đang chạy Metro, nhấn `r` để tải lại; hoặc `adb shell input keyevent 82` để mở menu. |
| **Mở lại app sau khi đóng** | `adb shell am start -a android.intent.action.VIEW -d "exp://localhost:8081"` |
| **Tắt mạng để thử chế độ offline** | `adb shell svc wifi disable` và `adb shell svc data disable` (bật lại bằng `enable`). Lưu ý: nếu mở app lúc đó, hãy dùng địa chỉ `exp://localhost:8081` ở trên thay vì địa chỉ IP. |

### Chạy trên điện thoại thật bằng Expo Go (Android hoặc iPhone)

Cách này không cần Xcode hay Android Studio. Điện thoại và Mac phải **cùng một mạng Wi‑Fi**.

1. Cài **Expo Go** trên điện thoại (Google Play hoặc App Store). Nếu app báo phiên bản không tương thích, hãy cập nhật Expo Go lên bản mới nhất.
2. Lấy địa chỉ IP của Mac:
   ```bash
   pnpm --filter @petcare/mobile lan-url
   ```
   Lệnh in ra IP LAN (ví dụ `192.168.1.20`) cùng hai giá trị cần dùng bên dưới.
3. Cho API biết địa chỉ công khai để **ảnh đã upload hiện được trên điện thoại**: tạo file `.env` ở **thư mục gốc dự án** (cạnh `docker-compose.yml`), thêm một dòng:
   ```
   API_PUBLIC_URL=http://192.168.1.20:4000
   ```
   rồi áp dụng: `docker compose up -d api`. (Dùng IP của bạn thay cho `192.168.1.20`.)
4. Chạy app, truyền địa chỉ API (không dùng `adb reverse`, không thêm `--android`):
   ```bash
   EXPO_PUBLIC_API_URL=http://192.168.1.20:4000/api pnpm --filter @petcare/mobile start
   ```
5. Quét mã QR hiện trong Terminal: **Android** mở Expo Go → *Scan QR code*; **iPhone** mở ứng dụng **Camera** quét mã, bấm thông báo để mở Expo Go.
6. Lần đầu, điện thoại sẽ hỏi quyền: **Mạng cục bộ** (iPhone), **Camera**, **Vị trí** — chọn Cho phép. Nếu macOS hỏi cho phép kết nối đến `node`/Docker thì chọn **Allow**. Nếu không kết nối được, kiểm tra Tường lửa: Cài đặt hệ thống → Mạng → Tường lửa.

Khác biệt nhỏ trên iPhone: bộ chọn ngày/giờ khi đặt lịch hiện dạng **bảng trượt từ dưới lên** (nút *Huỷ / Xong*) thay vì hộp thoại của Android. Các tính năng còn lại giống hệt.

> Máy ảo Android đã được kiểm thử đầy đủ. **Điện thoại thật và iPhone chưa được kiểm thử** trong dự án này; nếu gặp lỗi, hãy ghi lại màn hình và thông báo lỗi để sửa.

### Chạy và dùng trên iPhone (chi tiết)

Bản iOS dùng **cùng mã nguồn** với bản Android, nên mọi tính năng ở [mục 8](#8-hướng-dẫn-dùng-bản-mobile-chủ-nuôi) đều có. Phần này nói riêng những gì **khác trên iPhone**.

**Cách chạy nhanh nhất (không cần Xcode):**

1. iPhone cùng Wi‑Fi với Mac → cài **Expo Go** từ **App Store**.
2. Làm các bước 2–4 ở phần "Chạy trên điện thoại thật" ngay phía trên (lấy IP, đặt `API_PUBLIC_URL`, chạy `pnpm --filter @petcare/mobile start` kèm `EXPO_PUBLIC_API_URL`).
3. Mở ứng dụng **Camera** của iPhone, hướng vào mã QR trong Terminal → bấm thông báo **"Mở trong Expo Go"**. Lần đầu app tải mã mất vài chục giây.
4. Khi iPhone hỏi **"Expo Go muốn tìm và kết nối với các thiết bị trên mạng cục bộ"** → chọn **Cho phép** (nếu lỡ từ chối: Cài đặt → Expo Go → bật **Mạng cục bộ**).
5. Đăng nhập `owner@petcare.local` / `ChangeMe123!` rồi dùng như mục 8.

**Dùng trên iPhone khác Android ở đâu:**

| Việc | Trên iPhone |
|---|---|
| **Quay lại** | Vuốt từ mép trái màn hình sang phải (hoặc bấm mũi tên ở góc trên). |
| **Chọn ngày/giờ** (đặt lịch, ngày sinh thú cưng, ngày tiêm) | Hiện một **bảng trượt từ dưới lên** có lịch; chọn xong bấm **Xong** (hoặc **Huỷ**). Android thì hiện hộp thoại riêng cho ngày rồi đến giờ. |
| **Xin quyền** (camera, ảnh, vị trí, mạng cục bộ) | iPhone hỏi bằng hộp thoại của hệ thống. Khi chạy qua Expo Go, hộp thoại ghi tên *Expo Go*; chỉ khi cài bản phát hành riêng (mục 7) mới hiện câu tiếng Việt của PetCare. Nếu từ chối: Cài đặt → Expo Go (hoặc PetCare) → bật lại quyền. |
| **Mở tệp đính kèm hồ sơ (PDF)** | App tải tệp rồi mở **bảng Chia sẻ** của iPhone: chọn *Lưu vào Tệp*, mở bằng ứng dụng khác, hoặc AirDrop. Ảnh thì xem ngay trong app. |
| **Mở menu nhà phát triển / tải lại app** | **Lắc** iPhone (hoặc nhấn `r` trong Terminal đang chạy Metro). |
| **Tai thỏ / thanh Home** | App tự chừa vùng an toàn; bàn phím đẩy khung nhập tin nhắn lên. |
| **Thông báo đẩy khi tắt app** | Chưa có (cả hai nền tảng) — thông báo chỉ hiện trong app, tức thời khi đang mở. |

**Danh sách nên thử trên iPhone** (vì tôi chưa có iPhone để kiểm thử, hãy báo lại nếu mục nào lỗi):

1. Đăng nhập, tắt hẳn app rồi mở lại: vẫn còn đăng nhập.
2. **Khám phá**: cho phép vị trí → thấy phòng khám; tab **Bản đồ** hiện ghim, chạm điểm khác để tìm quanh đó. (iPhone ở Việt Nam sẽ ra vị trí thật; ở nơi khác sẽ không có phòng khám nào gần — chọn **Không cho phép** để dùng TP.HCM mặc định.)
3. **Đặt lịch** từ trang phòng khám: bảng chọn ngày giờ hiện đúng, đặt xong thấy ở **Lịch hẹn**.
4. **Đăng bài** bằng camera: chụp, chú thích, đăng; bài xuất hiện ở Trang chủ.
5. **Nhắn tin**: gửi chữ và ảnh; trên web (đăng nhập `hospital@petcare.local`) trả lời, tin tới ngay trên iPhone.
6. **Hồ sơ bệnh án**: mở ảnh/PDF đính kèm (cần bác sĩ đã lập hồ sơ và đính kèm tệp).
7. Tắt Wi‑Fi của iPhone: banner "Không có mạng" hiện, bảng tin đã tải vẫn xem được.

**Muốn chạy trên iPhone ảo (iOS Simulator) ngay trên Mac:**

- Cần cài **Xcode** từ App Store (rất nặng: cần **≥ 25 GB trống**, máy bạn hiện chưa đủ) rồi mở Xcode một lần để chấp nhận điều khoản và cài thành phần iOS Simulator.
- Chạy: `pnpm --filter @petcare/mobile ios` — Expo tự mở Simulator và cài Expo Go.
- Trên Simulator **không cần** lấy IP hay đặt `API_PUBLIC_URL`: Simulator dùng chung mạng với Mac nên `localhost:4000` chạy thẳng (không cần `adb reverse`).
- Simulator không có camera thật nên chức năng chụp ảnh (đăng bài, ảnh thú cưng) có thể báo lỗi hoặc không mở được; chọn ảnh từ thư viện của Simulator thì được. Muốn thử camera hãy dùng iPhone thật.

**Cài PetCare lên iPhone như một ứng dụng thật (không cần Expo Go):** cần tài khoản Apple Developer — xem [mục 7](#7-tạo-file-cài-đặt-phát-hành-apk--aab--ios).

**Lỗi hay gặp riêng trên iPhone:**

| Hiện tượng | Cách xử lý |
|---|---|
| Quét QR nhưng báo *"Project is incompatible with this version of Expo Go"* | Cập nhật Expo Go trong App Store lên bản mới nhất. |
| Màn hình đỏ *"Could not connect to the development server"* | iPhone không thấy Mac: kiểm tra cùng Wi‑Fi, đã cho phép **Mạng cục bộ** cho Expo Go, Tường lửa macOS không chặn `node`, và không dùng Wi‑Fi "khách" cách ly thiết bị. Thử mở `http://<IP>:8081` bằng Safari trên iPhone. |
| Vào được app nhưng báo *"Không kết nối được máy chủ"* | Quên `EXPO_PUBLIC_API_URL=http://<IP>:4000/api` khi chạy `start`, hoặc API chưa chạy (`docker compose ps`). |
| Ảnh đã upload không hiện | `API_PUBLIC_URL` trong `.env` vẫn là `localhost` — đổi thành `http://<IP>:4000` rồi `docker compose up -d api`. |
| Mạng đổi (đổi Wi‑Fi) thì app mất kết nối | IP của Mac đã đổi: chạy lại `lan-url`, cập nhật `.env`, `docker compose up -d api` và khởi động lại `start` với IP mới. |

---

## 7. Tạo file cài đặt phát hành (APK / AAB / iOS)

Để cài PetCare lên điện thoại **không cần Expo Go**, bạn tạo file cài đặt. Phần cấu hình đã được chuẩn bị sẵn trong dự án (tên ứng dụng **PetCare**, mã `vn.petcare.app`, phiên bản `1.0.0`, icon dấu chân, màn hình khởi động, các câu xin quyền camera/ảnh/vị trí bằng tiếng Việt, cho phép kết nối HTTP tới IP trong mạng nội bộ). Bạn chỉ cần chạy lệnh build.

### 7.1. Các loại file

| File | Dùng để | Cần gì |
|---|---|---|
| **APK** (Android) | Cài trực tiếp lên điện thoại Android để dùng/thử/nộp bài | Không cần tài khoản cửa hàng |
| **AAB** (Android) | Đăng lên Google Play | Tài khoản Google Play Developer (25 USD, trả một lần) |
| **IPA** (iOS) | Cài lên iPhone (TestFlight / App Store / cài trực tiếp) | Tài khoản **Apple Developer (99 USD/năm)** |
| **Bản cho iOS Simulator** | Chạy trên máy ảo iPhone của Mac | Xcode đầy đủ (cần ≥ 25 GB trống) |

> Không có tài khoản Apple Developer thì **không thể** tạo file iOS cài lên iPhone thật — hãy dùng Expo Go (mục 6).

### 7.2. Điều cần biết trước khi build

- **Địa chỉ API được "đóng cứng" vào file cài đặt lúc build.** Vì API của bạn đang chạy trên Mac, hãy dùng IP LAN của Mac (lấy bằng `pnpm --filter @petcare/mobile lan-url`). Hệ quả: điện thoại phải **cùng Wi‑Fi với Mac**, Mac phải **đang bật** và Docker đang chạy; nếu IP của Mac đổi thì phải **build lại** (hoặc đặt IP cố định trong router).
- Trong file `.env` ở thư mục gốc phải có `API_PUBLIC_URL=http://<IP>:4000` (mục 6, bước 3) để ảnh hiện được.
- Kết nối dùng HTTP (không mã hoá) — phù hợp demo/nộp bài, **không** phù hợp phát hành công khai. Để phát hành thật cần một máy chủ API có HTTPS.
- Muốn đổi icon: sửa script rồi chạy `python3 apps/mobile/scripts/generate-icons.py` (cần `pip install pillow`).

### 7.3. Cách A (khuyến nghị): Expo EAS Build trên cloud

Expo build giúp trên máy chủ của họ — **không tốn dung lượng máy bạn** (máy bạn hiện chỉ còn ít chỗ trống) và làm được cả Android lẫn iOS. Gói miễn phí có giới hạn số lượt build mỗi tháng và phải xếp hàng chờ; mỗi lần build mất vài chục phút.

1. Tạo tài khoản miễn phí tại **expo.dev**.
2. Đăng nhập trong Terminal (bạn tự nhập tài khoản — đừng gửi mật khẩu cho ai):
   ```bash
   cd apps/mobile
   npx eas-cli login
   ```
3. Liên kết dự án với tài khoản (chạy một lần; lệnh sẽ ghi `projectId` vào `app.json`, hãy commit lại):
   ```bash
   npx eas-cli init
   ```
4. Đặt địa chỉ API cho bản build: mở `apps/mobile/eas.json`, sửa dòng `"EXPO_PUBLIC_API_URL": "http://192.168.1.100:4000/api"` thành IP Mac của bạn (từ lệnh `lan-url`).
5. **Android APK** (cài thẳng):
   ```bash
   pnpm --filter @petcare/mobile build:android:apk
   ```
   Khi xong, Expo hiện liên kết/QR để tải file `.apk`. Chép vào điện thoại Android, mở file và bật *Cho phép cài ứng dụng từ nguồn này*.
6. **Android AAB** (đăng Google Play): `pnpm --filter @petcare/mobile build:android:aab`. EAS tự tạo và lưu **khoá ký (keystore)** — hãy sao lưu bằng `npx eas-cli credentials`; mất khoá thì không thể cập nhật app đã đăng.
7. **iOS** (cần tài khoản Apple Developer): `pnpm --filter @petcare/mobile build:ios`. Lần đầu EAS hỏi đăng nhập Apple ID và tạo chứng chỉ; để cài lên iPhone của bạn cần đăng ký thiết bị bằng `npx eas-cli device:create` trước. Đăng lên TestFlight/App Store dùng `npx eas-cli build --platform ios --profile production` rồi `npx eas-cli submit --platform ios`.
8. **Bản cho iOS Simulator** (không cần tài khoản Apple, nhưng cần Xcode): `pnpm --filter @petcare/mobile build:ios:simulator`, tải file về, giải nén và kéo ứng dụng `.app` vào cửa sổ Simulator.

### 7.4. Cách B: build Android ngay trên Mac (không cần tài khoản Expo)

Nặng hơn: cần **≥ 10 GB trống**. Hiện Docker đang giữ ~14 GB "build cache" có thể xoá an toàn (chỉ làm các lần build Docker sau chậm hơn một chút):

```bash
docker builder prune          # xem dung lượng trống trước/sau bằng: df -h /
```

Cài thêm trong **Android Studio → Settings → Android SDK → SDK Tools**: *Android SDK Command-line Tools* và *NDK (Side by side)*. Sau đó:

```bash
cd apps/mobile
EXPO_PUBLIC_API_URL=http://<IP>:4000/api npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
```

File APK nằm ở `apps/mobile/android/app/build/outputs/apk/release/app-release.apk` (thư mục `android/` được bỏ qua trong git, có thể xoá sau khi build). APK này ký bằng khoá thử nghiệm của mẫu Expo nên **cài trực tiếp được nhưng chưa dùng để đăng Google Play**; muốn đăng Play hãy dùng Cách A (EAS tạo khoá ký giúp).

> Cách B và toàn bộ phần iOS ở mục này **chưa được tôi chạy thử trên máy bạn** (thiếu dung lượng/Xcode/tài khoản). Tôi đã kiểm tra: cấu hình hợp lệ (`expo-doctor` đạt 20/20), mã biên dịch được cho cả Android và iOS, và các tệp cấu hình native sinh ra đúng (mã ứng dụng, quyền, HTTP nội bộ). Nếu build lỗi, hãy gửi lại nội dung lỗi.

### 7.5. Kiểm tra sau khi cài

1. Mở app → đăng nhập `owner@petcare.local` → bảng tin hiện ra và **ảnh hiện đầy đủ** (nếu ảnh trống: kiểm tra `API_PUBLIC_URL` trong `.env`).
2. Vào **Khám phá** → hộp thoại xin vị trí bằng tiếng Việt → thấy phòng khám.
3. Đặt thử một lịch hẹn (kiểm tra bộ chọn ngày giờ), thử chụp ảnh đăng bài (kiểm tra quyền camera).
4. Tắt Wi‑Fi: banner "Không có mạng" hiện ra, bảng tin vẫn xem được.

---

## 8. Hướng dẫn dùng bản mobile (chủ nuôi)

Áp dụng cho cả Android và iPhone (những điểm khác nhau trên iPhone nằm ở [mục 6](#chạy-và-dùng-trên-iphone-chi-tiết)).

Dưới thanh điều hướng có 4 tab: **Trang chủ · Khám phá · Tin nhắn · Tài khoản**. Biểu tượng chuông (thông báo, có số chưa đọc) nằm ở đầu mỗi tab.

| Màn hình / tính năng | Cách dùng | Dùng để |
|---|---|---|
| **Đăng nhập / Đăng ký / Quên mật khẩu** | Màn hình đầu tiên | Vào app. Đăng nhập được **giữ lại**: tắt app mở lại vẫn không phải đăng nhập (mã phiên lưu trong kho khoá an toàn của điện thoại). Đăng ký cần xác thực email (liên kết nằm trong log của API — xem mục 3). |
| **Trang chủ = Bảng tin** | Tab Trang chủ | Xem bài viết cộng đồng và phòng khám. Hàng thú cưng ở trên để **lọc theo từng bé**. Kéo xuống cuối để tải thêm bài cũ (tải từng trang cho nhanh), kéo từ trên xuống để làm mới. Banner **khuyến mãi** của phòng khám hiện ở đầu. |
| **Đăng bài** | Nút **+** ở đầu Trang chủ | Mở camera, chụp ảnh, viết chú thích, chọn gắn thẻ thú cưng (và có thể đăng vào một nhóm). Giống web: chỉ ảnh chụp trực tiếp. |
| **Thích / Lưu / Bình luận** | Dưới mỗi bài | Thích và Lưu **hiện ngay** (nếu mất mạng sẽ tự hoàn lại và báo lỗi). Bấm bình luận để vào chi tiết bài, trả lời bình luận, xoá bình luận của mình. |
| **Khám phá** | Tab Khám phá | Tìm phòng khám gần bạn. Có 2 chế độ: **Danh sách** (kèm khoảng cách, bấm để gọi điện hoặc mở bản đồ) và **Bản đồ** (xem vòng bán kính + ghim các phòng khám; **chạm ghim** để xem nhanh; **chạm điểm bất kỳ** để tìm phòng khám quanh điểm đó). Chọn bán kính 5/10/20/50 km và tìm theo tên. |
| **Trang phòng khám** | Bấm vào một phòng khám | Giống web: tab **Dịch vụ / Đặt lịch / Đánh giá**, trái tim yêu thích, nút **Nhắn tin**, màu theo thương hiệu phòng khám. |
| **Đặt lịch** | Tab Đặt lịch trong trang phòng khám | Chọn thú cưng → dịch vụ → (tuỳ chọn) bác sĩ → ngày giờ → **Đặt lịch hẹn**. Nếu bạn vào từ **trang thú cưng → Đặt lịch khám** thì bé đó được **chọn sẵn**. |
| **Đánh giá** | Tab Đánh giá | Chấm sao + nhận xét (sau khi đã hoàn thành một lần khám). Có thể **sửa** hoặc **xoá** đánh giá của mình ngay tại đó. |
| **Tin nhắn** | Tab Tin nhắn | Danh sách cuộc trò chuyện (có số tin chưa đọc). Vào trò chuyện để gửi chữ và ảnh; tin mới tới **tức thời** không cần làm mới. |
| **Tài khoản** | Tab Tài khoản | Lịch hẹn sắp tới, banner khuyến mãi, 4 lối tắt (**Lịch hẹn / Yêu thích / Đã lưu / Nhóm**), danh sách thú cưng, và "Khoảnh khắc đáng yêu" (ảnh bạn đã đăng). Biểu tượng bánh răng → **Cài đặt**. |
| **Hồ sơ thú cưng** | Tài khoản → bấm một bé | Xem/sửa/xoá hồ sơ; từ đây vào: **Digital Life** (thống kê, dải ảnh, dòng thời gian theo tháng), **Sổ tiêm phòng** (xem + thêm mũi), **Hồ sơ bệnh án** (danh sách theo bé), **Đặt lịch khám**. |
| **Chi tiết hồ sơ bệnh án** | Hồ sơ bệnh án → chọn một hồ sơ | Xem chẩn đoán/điều trị, trạng thái, **lịch sử chỉnh sửa** các phiên bản. **Tệp đính kèm**: ảnh mở ngay trong app, PDF/tài liệu được tải về rồi mở bằng bảng chia sẻ của điện thoại. |
| **Lịch hẹn** | Tài khoản → Lịch hẹn | Xem trạng thái và **huỷ** lịch khi còn Chờ xác nhận/Đã xác nhận. |
| **Yêu thích / Đã lưu / Nhóm** | Lối tắt ở tab Tài khoản | Phòng khám yêu thích; bài viết đã lưu; tạo/tham gia/rời nhóm và đăng bài trong nhóm. |
| **Thông báo** | Biểu tượng chuông | Xem thông báo, bấm để tới đúng lịch hẹn / cuộc trò chuyện / bài viết. Cập nhật tức thời. |
| **Chế độ offline** | Tự động | Khi mất mạng, hiện thông báo "Không có mạng"; **mở app vẫn vào được** và xem bảng tin, thú cưng, lịch hẹn đã tải trước đó. Hồ sơ bệnh án, tin nhắn, thông báo **không lưu offline** vì là dữ liệu nhạy cảm. Có mạng lại thì tự đồng bộ. Đăng xuất sẽ xoá dữ liệu đã lưu. |
| **Cài đặt** | Tài khoản → ⚙️ | Sửa họ tên, SĐT, ảnh đại diện; đổi mật khẩu; **Đăng xuất**. |

---

## 9. Kịch bản thử từ đầu đến cuối (khoảng 15 phút)

Kịch bản này cho thấy cả hệ thống làm việc cùng nhau. Dùng 3 cửa sổ: **(A)** web Pet Owner, **(B)** web Hospital Owner (cửa sổ ẩn danh), **(C)** app mobile (Pet Owner).

1. **Đặt lịch từ mobile.** (C) Đăng nhập `owner@petcare.local` → **Khám phá** → **PetCare Demo Clinic** → tab **Đặt lịch** → chọn Miu, "Khám tổng quát", **BS. Demo**, ngày giờ trong tương lai → **Đặt lịch hẹn**.
2. **Phòng khám nhận lịch.** (B) Đăng nhập `hospital@petcare.local` → chuông có thông báo "Có lịch hẹn mới" → **Lịch khám** → **Xác nhận**.
3. **Chủ nuôi nhận tin real-time.** (C) Chuông thông báo "Lịch hẹn của Miu đã được xác nhận" hiện ra không cần làm mới.
4. **Khám.** (B) Lịch khám → **Bắt đầu khám** → **Hoàn thành**.
5. **Bác sĩ lập hồ sơ.** Cửa sổ ẩn danh khác đăng nhập `vet@petcare.local` → **Lịch khám của tôi** → ở lịch của Miu bấm **Lập hồ sơ bệnh án**, điền chẩn đoán → lưu. Bấm **Ghi nhận tiêm phòng** để thêm một mũi tiêm.
6. **Chủ nuôi xem kết quả.** (C) **Tài khoản → Miu → Hồ sơ bệnh án** để xem hồ sơ vừa lập; **Sổ tiêm phòng** thấy mũi tiêm; **Digital Life** thấy cả hai sự kiện.
7. **Đánh giá.** (C) Vào trang phòng khám → tab **Đánh giá** → chấm 5 sao (đã hoàn thành lịch nên được phép) → thử **Sửa** rồi **Xoá**.
8. **Chat real-time.** (C) Trang phòng khám → **Nhắn tin** → gửi "Xin chào". (B) **Tin nhắn** → thấy ngay → trả lời; (C) nhận tức thời.
9. **Khuyến mãi.** (B) **Bảng tin** → tick **Đăng khuyến mãi**, điền tiêu đề, mức giảm, ngày kết thúc → đăng. (C) Trước đó hãy bấm trái tim yêu thích phòng khám; bạn sẽ nhận thông báo khuyến mãi và thấy banner ở Trang chủ.
10. **Nhân viên.** (B) **Đội ngũ → Thêm nhân viên** (Lễ tân) → lấy liên kết trong `docker compose logs api` → đặt mật khẩu → đăng nhập bằng tài khoản mới ở cửa sổ khác: chỉ thấy **Lịch khám** và **Tin nhắn**.

Dọn dữ liệu thử khi cần làm lại từ đầu: `docker compose down -v`, rồi `docker compose up -d` và chạy lại lệnh seed.

---

## 10. Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân & cách xử lý |
|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop chưa chạy. Mở ứng dụng Docker, chờ báo "running", rồi chạy lại lệnh. |
| Web mở lên trắng/không đăng nhập được | `docker compose ps` xem cả 3 container có `running` không; `docker compose logs api` xem lỗi. Nếu vừa `down -v` thì cần chạy lại **lệnh seed** để có tài khoản. |
| Cổng bị chiếm (`port is already allocated`) | Có chương trình khác dùng 5173/4000. Tắt chương trình đó hoặc đổi cổng trong `docker-compose.yml`. (Postgres đã dùng 5433 để tránh trùng với Postgres cài sẵn.) |
| Không thấy liên kết email | Email chỉ được in ra log: `docker compose logs -f api`, thực hiện lại thao tác rồi tìm dòng `http://localhost:5173/...`. |
| Mobile: ảnh không hiện / app báo "Không kết nối được máy chủ" | Chưa chạy `adb reverse tcp:4000 tcp:4000`, hoặc API chưa chạy (`docker compose ps`). Chạy lại lệnh ở bước 3 (mỗi lần khởi động lại máy ảo phải chạy lại). |
| Mobile: màn hình xanh "Something went wrong" | Expo Go không tải được mã từ Mac. Kiểm tra Metro còn chạy (Terminal bước 4), chạy `adb reverse tcp:8081 tcp:8081`, rồi mở lại bằng `exp://localhost:8081`. Thường gặp sau khi tắt Wi‑Fi của máy ảo. |
| Mobile: `adb: command not found` | Chưa thêm Android vào PATH — xem mục 2. |
| Mobile: Khám phá không có phòng khám nào | Bạn đã cho phép vị trí nhưng máy ảo đang ở California. Đặt vị trí máy ảo thành `10.7769, 106.7009` (xem mục 6) hoặc chọn **Không cho phép**; hoặc chuyển sang **Bản đồ** và chạm vào khu vực TP.HCM. |
| Mobile: không đánh giá được | Cần có một lịch hẹn **Hoàn thành** tại phòng khám đó (xem kịch bản mục 9, bước 4). |
| Web: đăng bài báo lỗi camera | Trình duyệt đã chặn camera. Bấm biểu tượng ổ khoá cạnh địa chỉ → cho phép **Camera**; kiểm tra macOS: Cài đặt hệ thống → Quyền riêng tư & Bảo mật → Camera → bật cho trình duyệt. |
| iPhone/điện thoại thật: không kết nối được máy chủ | Chưa cùng Wi‑Fi với Mac; sai IP; Tường lửa macOS chặn (cho phép `node`/Docker); hoặc quên bước 3–4 ở mục 6 (`API_PUBLIC_URL` và `EXPO_PUBLIC_API_URL`). Thử mở `http://<IP>:4000/api` bằng trình duyệt của điện thoại để kiểm tra. |
| Điện thoại thật: ảnh không hiện | `API_PUBLIC_URL` trong `.env` vẫn là `localhost`. Đặt thành `http://<IP>:4000` rồi `docker compose up -d api`. |
| File APK cài xong nhưng không đăng nhập được | IP trong lúc build khác IP hiện tại của Mac, Mac đang tắt/ngủ, hoặc điện thoại khác mạng. Kiểm tra IP bằng `lan-url`, nếu đổi thì build lại. |
| Bản đồ mobile trắng | Cần Internet để tải ô bản đồ OpenStreetMap; kiểm tra mạng của máy ảo. |
| Sửa code nhưng web không đổi | Web chạy từ bản build trong Docker: `docker compose build api web && docker compose up -d api web`. (App mobile tự cập nhật, không cần.) |
| Hết dung lượng đĩa khi build | `docker system prune` (xoá cache build không dùng); xem `df -h /`. |

---

## 11. Những gì chưa có

Để bạn không tìm nhầm: các mục sau **chưa** làm hoặc cần chuẩn bị thêm.

- **Gửi email thật**, mã OTP, nội dung điều khoản sử dụng: tạm gác — hiện email chỉ in ra log.
- **Mobile:** thông báo đẩy khi app đóng (cần Firebase), đăng nhập Google (cần Google client ID), và các vai trò Hospital/Vet/Admin/nhân viên (dùng web). **iOS và file cài đặt phát hành:** mã và cấu hình đã sẵn sàng (mục 6, 7) nhưng **chưa được chạy thử trên iPhone/chưa tạo file thật** vì cần iPhone/tài khoản Apple Developer/tài khoản Expo của bạn.
- **Gọi thoại/video** (cần máy chủ TURN), **đa ngôn ngữ** (hiện chỉ tiếng Việt), **Shop** (cửa hàng thú cưng).
- Danh sách đầy đủ và chi tiết kỹ thuật từng tính năng: [FEATURES.md](../FEATURES.md). Cách đăng nhập từng vai trò theo luồng thật: [LOGIN_GUIDE.md](LOGIN_GUIDE.md).

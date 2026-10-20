# Danh sách tính năng PetCare

Liệt kê theo đúng thứ tự đã triển khai (vertical slice — mỗi tính năng đi từ database → backend → frontend → kiểm thử thật trên trình duyệt trước khi sang tính năng kế tiếp).

## 1. Xác thực & tài khoản (Auth)
- Đăng ký bằng email/mật khẩu, xác thực email qua liên kết (token hết hạn sau 24h)
- Đăng nhập bằng Google (tuỳ chọn, cần cấu hình `GOOGLE_CLIENT_ID`)
- Access token JWT (15 phút) + refresh token đối lập lưu trong cookie `httpOnly`, xoay vòng mỗi lần dùng
- Quên mật khẩu / đặt lại mật khẩu qua email

## 2. Hồ sơ thú cưng (Pet Profile)
- Pet Owner tạo/sửa/xoá hồ sơ thú cưng (tên, loài, giống, ngày sinh, cân nặng, ảnh đại diện, ghi chú)

## 3. Admin duyệt phòng khám (Partner Registration)
- Phòng khám nộp đơn đăng ký đối tác kèm **giấy phép kinh doanh** (upload file, endpoint public có giới hạn tần suất theo IP)
- Admin xem hồ sơ + giấy phép, duyệt hoặc từ chối
- Khi duyệt: hệ thống tự tạo tài khoản Hospital Owner, gửi email đặt mật khẩu lần đầu (mô hình "mời qua liên kết đặt lại mật khẩu", không dùng mật khẩu mặc định)

## 4. Hồ sơ phòng khám (Hospital Profile)
- Hospital Owner cập nhật thông tin: tên, mô tả, logo, ảnh bìa, địa chỉ, số điện thoại, email, hỗ trợ cấp cứu 24/7
- Chọn vị trí trên bản đồ thật (Leaflet + OpenStreetMap, không cần API key)

## 5. Tìm phòng khám gần nhất (Geo-search) — tính năng chủ lực
- Pet Owner tìm phòng khám theo bán kính từ vị trí hiện tại hoặc vị trí chọn trên bản đồ
- Truy vấn khoảng cách thật bằng PostgreSQL (`cube` + `earthdistance`), có chỉ mục GiST để tối ưu tốc độ
- Không cần đăng nhập để tìm kiếm

## 6. Quản lý bác sĩ (Vet Management)
- Hospital Owner mời bác sĩ (email đặt mật khẩu lần đầu, giống mô hình mời phòng khám)
- Bác sĩ có tài khoản riêng (vai trò VET), đăng nhập độc lập, phạm vi giới hạn trong phòng khám của mình
- **Điều dưỡng / Lễ tân** (model `HospitalStaff`, vai trò `HOSPITAL_STAFF`): mời qua email theo cùng mô hình với bác sĩ, tạm ngưng/kích hoạt lại, đổi vị trí
- Trang "Đội ngũ" của Hospital Owner gộp Bác sĩ + Điều dưỡng + Lễ tân, có tab lọc theo vai trò

## 7. Quản lý dịch vụ (Service Management)
- Hospital Owner tạo/sửa/xoá dịch vụ (tên, mô tả, giá, thời lượng)
- Danh sách dịch vụ hiển thị công khai trên trang chi tiết phòng khám

## 8. Đặt lịch khám (Appointment Booking)
- Pet Owner: chọn thú cưng → tìm phòng khám qua bản đồ → xem hồ sơ hoặc liên hệ đặt lịch → chọn dịch vụ, có thể chọn bác sĩ mong muốn (không bắt buộc)
- Kiểm tra trùng lịch: 1 bác sĩ không thể có 2 lịch hẹn cùng khung giờ (chỉ áp dụng khi có chọn bác sĩ cụ thể)
- Quy trình trạng thái: Chờ xác nhận → Đã xác nhận → Đang khám → Hoàn thành (hoặc Đã huỷ ở bất kỳ bước nào trước Hoàn thành)
- Chỉ **Hospital** được xác nhận/từ chối/đổi trạng thái; **Vet** chỉ nhận thông báo, không có quyền quyết định
- Pet Owner có thể tự huỷ lịch khi đang ở trạng thái Chờ xác nhận/Đã xác nhận

## 9. Hồ sơ bệnh án (Medical Record)
- Chỉ Vet thuộc phòng khám **đã từng khám** cho thú cưng đó (có lịch hẹn Đã xác nhận/Đang khám/Hoàn thành) mới được lập hồ sơ — chặn hồ sơ bệnh án giả mạo
- Lưu lịch sử phiên bản đầy đủ (mỗi lần sửa tạo bản ghi mới, không ghi đè) — triệu chứng, nguyên nhân, chẩn đoán, điều trị, kết luận, ghi chú
- Đính kèm file (ảnh/PDF) — kết quả xét nghiệm, phim X-quang...
- Pet Owner chỉ xem được hồ sơ của thú cưng mình
- **Trạng thái hồ sơ**: Đang điều trị / Tái khám / Hoàn tất (mặc định Đang điều trị) — Vet của phòng khám đổi được ngay trên trang chi tiết
- Hospital Owner có trang "Hồ sơ bệnh án" xem toàn bộ hồ sơ của phòng khám: thẻ thống kê theo trạng thái, tab lọc, bấm vào để xem chi tiết (chỉ xem, không sửa)

## 10. Dòng thời gian thú cưng (Pet Timeline)
- Đọc trực tiếp từ bảng `PetEvent` — trục thời gian trung tâm được thiết kế từ đầu dự án nhưng đến bước này mới thật sự có dữ liệu
- Hiển thị mọi sự kiện của thú cưng theo thời gian: lịch hẹn, hồ sơ bệnh án, tiêm phòng, bài đăng mạng xã hội — nhấn vào từng mục để xem chi tiết

## 11. Sổ tiêm phòng (Vaccination)
- Cả Pet Owner (tự khai báo) lẫn Vet (nếu phòng khám đã từng khám cho thú cưng) đều ghi nhận được mũi tiêm
- Ghi tên vắc-xin, ngày tiêm, ngày tái chủng (không bắt buộc), ghi chú — hiển thị luôn trên Pet Timeline

## 12. Bảng tin cộng đồng (Social Feed)
- Pet Owner đăng bài: **bắt buộc chụp ảnh trực tiếp bằng camera** (không cho chọn file có sẵn — giống cơ chế Locket), giới hạn 1 ảnh/bài, có tông màu ấm được áp trực tiếp lên ảnh chụp
- Hospital cũng đăng được bài (tối đa 5 ảnh tải lên), có thể gắn thẻ 1 bác sĩ của phòng khám, tự động kèm nút "Xem vị trí trên bản đồ" trỏ đến toạ độ thật của phòng khám
- Thích/bỏ thích, bình luận, trả lời bình luận (1 cấp), chỉ được xoá nội dung do chính mình tạo
- Bình luận/bài viết của Hospital có nhãn "🏥 Phòng khám" để phân biệt phản hồi chính thức
- Gắn thẻ thú cưng vào bài viết sẽ tự động xuất hiện trên Pet Timeline của thú cưng đó

## 13. Đánh giá phòng khám (Review)
- Chỉ Pet Owner **đã hoàn thành** ít nhất 1 lịch khám tại phòng khám mới được đánh giá (1–5 sao + nhận xét)
- Mỗi người chỉ đánh giá 1 lần/phòng khám — đánh giá lại sẽ sửa đánh giá cũ
- Hiển thị điểm trung bình + số lượng đánh giá ngay trên trang chi tiết phòng khám

## 14. Nhắn tin (Chat)
- Pet Owner nhắn tin cho phòng khám từ trang chi tiết phòng khám; Hospital trả lời tự do trong cuộc trò chuyện đã có
- Mỗi tin nhắn gửi kèm tối đa 1 ảnh
- Gửi tin nhắn tự động tạo thông báo cho người nhận
- Phòng khám bật/tắt thật được thông báo "lịch hẹn mới/huỷ lịch" và "tin nhắn mới" (lưu ở hồ sơ phòng khám). Chỉ chặn thông báo phía phòng khám/bác sĩ — thông báo của chủ nuôi về lịch hẹn của chính họ không bao giờ bị chặn

## 15. Real-time (WebSocket)
- Thông báo và tin nhắn đẩy tức thời qua Socket.IO thay vì polling định kỳ — xác thực socket bằng cùng JWT access token đang dùng cho REST API
- *Gọi thoại/video: đã thiết kế sẵn kênh signaling nhưng tạm hoãn triển khai vì cần máy chủ TURN thật (Twilio/Xirsys hoặc tự host coturn) để hoạt động ổn định qua mọi loại mạng.*

## 16. Cài đặt tài khoản (Settings)
- Cập nhật thông tin cá nhân: họ tên, số điện thoại, ảnh đại diện
- Đổi mật khẩu (tài khoản có mật khẩu) hoặc đặt mật khẩu lần đầu (tài khoản chỉ đăng nhập bằng Google)

## 17. Đóng gói Docker
- `docker-compose.yml` khởi chạy đầy đủ Postgres + API (NestJS) + Web (React, build tĩnh qua Nginx) chỉ với 1 lệnh
- Script seed dữ liệu mẫu cho cả 4 vai trò — xem `docs/LOGIN_GUIDE.md`

## 18. Gửi email (SMTP)
- Dùng SMTP thường qua nodemailer (đã bỏ Resend) — chạy được với Gmail/Outlook cá nhân bằng App Password, cấu hình `SMTP_HOST/SMTP_USER/SMTP_PASS` trong `.env` (xem `.env.example`)
- Chưa cấu hình SMTP thì ở môi trường dev, nội dung email chỉ được log ra console của container API (không gửi thật)

## 19. Quản trị hệ thống (Admin CRUD)
- Quản lý phòng khám: xem, tạo, sửa, vô hiệu hoá/kích hoạt lại (xoá mềm bằng trạng thái `INACTIVE` để không mất lịch sử lịch hẹn/hồ sơ)
- Quản lý người dùng: xem, tạo (mời qua email đặt mật khẩu), sửa vai trò/trạng thái, vô hiệu hoá (xoá mềm; không tự vô hiệu hoá chính mình)
- Kiểm duyệt bảng tin: xem mọi bài viết và xoá bài vi phạm
- Duyệt giấy phép kinh doanh của phòng khám đăng ký đối tác (xem mục 3)

## 20. Giao diện PetConnect & trải nghiệm Pet Owner
- Thiết kế lại toàn bộ app theo bộ mockup PetConnect (giữ tên thương hiệu "PetCare"): bảng màu xanh mint/teal, font Fraunces + Inter, bộ component dùng chung (`Card`, `Badge`, `StatCard`, `PillTabs`, `EmptyState`...)
- Hai kiểu khung giao diện theo vai trò: Pet Owner dùng thanh điều hướng dưới + cột phải; Hospital Owner/Vet/Admin dùng sidebar làm việc
- Đăng nhập dạng chia đôi (banner gradient + hoạ tiết chân thú | form)
- Header kiểu Facebook cho Pet Owner: icon trang chủ, tìm phòng khám, icon bản đồ, tin nhắn, thông báo, menu avatar
- Điều hướng Pet Owner: Trang chủ = bảng tin, Khám phá = tìm phòng khám, Tin nhắn, Tài khoản = trang cá nhân (hero + thú cưng + "Khoảnh khắc đáng yêu" Ảnh/Video)
- Bảng tin có hàng thú cưng của chính mình để lọc bài theo từng bé; cột phải hiển thị bài mới của các phòng khám (mục chưa có tính năng như "Phòng khám yêu thích/Bài viết đã lưu/Nhóm" gắn nhãn "Sắp ra mắt")
- Trang chi tiết phòng khám chia tab Dịch vụ / Đặt lịch / Đánh giá, đặt lịch ngay trong tab
- Đăng ký đối tác hiển thị thẻ loại hình "Phòng khám thú y"
- Lịch khám của phòng khám có thanh chọn ngày (◀ ngày ▶)
- Dòng thời gian thú cưng "Digital Life": thẻ thống kê, dải ảnh, timeline dọc nhóm theo tháng

## 21. Màu thương hiệu theo từng phòng khám
- Hospital Owner chọn 1 màu thương hiệu trong "Chỉnh sửa hồ sơ phòng khám" (có nút khôi phục màu mặc định)
- Thang màu `brand` của Tailwind chạy bằng CSS variables; một màu được sinh thành đủ 10 sắc độ (giữ nguyên độ sáng từng bậc để chữ vẫn dễ đọc)
- Áp dụng cho: toàn bộ khu làm việc của Hospital Owner, khu làm việc của Vet thuộc phòng khám đó, và trang công khai của phòng khám. Các trang khác (bảng tin, Admin, đăng nhập...) giữ màu mặc định

---

## Chưa triển khai (nằm ngoài phạm vi các đợt vừa qua)
- Xác thực email hoàn chỉnh: nội dung điều khoản sử dụng, mã OTP qua email cho quên mật khẩu, gửi lại email xác thực (đang tạm gác, chưa làm)
- Bản mobile (`apps/mobile` hiện chỉ là thư mục trống, đang lên kế hoạch)
- Gọi thoại/video thật (cần hạ tầng TURN server)
- Đa ngôn ngữ (toàn app đang hardcode tiếng Việt, chưa có hạ tầng i18n)
- Đánh giá/nhắn tin cho Shop (schema đã thiết kế đa hình sẵn nhưng tính năng Shop chưa được xây)
- Đăng nhập riêng cho vai trò Điều dưỡng/Lễ tân đã có tài khoản, nhưng chưa có màn hình làm việc riêng cho họ (hiện chỉ thấy khung trống "đang được xây dựng")

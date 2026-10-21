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
- **Nhắc lịch tự động**: lịch ở trạng thái Đã xác nhận sẽ được nhắc **1 lần** khi còn tối đa 24 giờ (thông báo trong app, kèm giờ theo múi giờ Việt Nam) cho chủ nuôi và bác sĩ được chỉ định. Máy chủ quét mỗi 5 phút; lịch Chờ xác nhận/đã huỷ hoặc còn xa hơn 24 giờ không được nhắc, và chạy nhiều bản API cũng không gửi trùng. Nhắc lịch không bị chặn bởi công tắc "lịch hẹn mới" của phòng khám
- Giờ đặt lịch được lưu đúng múi giờ người dùng chọn (trước đây giờ nhập trên form bị lệch 7 tiếng; các lịch tạo trước bản sửa vẫn giữ giờ cũ)

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
- Hospital có thể đăng bài **loại "Khuyến mãi"** (tiêu đề, mức giảm, ngày bắt đầu/kết thúc) — xem mục 23
- Thích/bỏ thích, bình luận, trả lời bình luận (1 cấp), chỉ được xoá nội dung do chính mình tạo
- Bình luận/bài viết của Hospital có nhãn "🏥 Phòng khám" để phân biệt phản hồi chính thức
- Gắn thẻ thú cưng vào bài viết sẽ tự động xuất hiện trên Pet Timeline của thú cưng đó
- Pet Owner có thể **lưu** bài viết (nút 🔖 dưới mỗi bài) và xem lại ở trang "Bài viết đã lưu" — xem mục 22

## 13. Đánh giá phòng khám (Review)
- Chỉ Pet Owner **đã hoàn thành** ít nhất 1 lịch khám tại phòng khám mới được đánh giá (1–5 sao + nhận xét)
- Mỗi người chỉ đánh giá 1 lần/phòng khám — đánh giá lại sẽ sửa đánh giá cũ
- Hiển thị điểm trung bình + số lượng đánh giá ngay trên trang chi tiết phòng khám

## 14. Nhắn tin (Chat)
- Pet Owner nhắn tin cho phòng khám từ trang chi tiết phòng khám; Hospital trả lời tự do trong cuộc trò chuyện đã có
- Mỗi tin nhắn gửi kèm tối đa 1 ảnh
- Gửi tin nhắn tự động tạo thông báo cho người nhận
- Bấm vào thông báo trên chuông sẽ đánh dấu đã đọc và chuyển tới đúng trang (lịch hẹn theo vai trò, cuộc trò chuyện, bài viết)
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
- Bảng tin có hàng thú cưng của chính mình để lọc bài theo từng bé; cột phải hiển thị khuyến mãi đang diễn ra, bài mới của các phòng khám và lối tắt tới "Phòng khám yêu thích" / "Bài viết đã lưu" / "Nhóm" (kèm số lượng)
- Trang chi tiết phòng khám chia tab Dịch vụ / Đặt lịch / Đánh giá, đặt lịch ngay trong tab
- Đăng ký đối tác hiển thị thẻ loại hình "Phòng khám thú y"
- Lịch khám của phòng khám có thanh chọn ngày (◀ ngày ▶)
- Dòng thời gian thú cưng "Digital Life": thẻ thống kê, dải ảnh, timeline dọc nhóm theo tháng

## 21. Màu thương hiệu theo từng phòng khám
- Hospital Owner chọn 1 màu thương hiệu trong "Chỉnh sửa hồ sơ phòng khám" (có nút khôi phục màu mặc định)
- Thang màu `brand` của Tailwind chạy bằng CSS variables; một màu được sinh thành đủ 10 sắc độ (giữ nguyên độ sáng từng bậc để chữ vẫn dễ đọc)
- Áp dụng cho: toàn bộ khu làm việc của Hospital Owner, khu làm việc của Vet thuộc phòng khám đó, và trang công khai của phòng khám. Các trang khác (bảng tin, Admin, đăng nhập...) giữ màu mặc định

## 22. Yêu thích phòng khám & Bài viết đã lưu
- Pet Owner bấm biểu tượng trái tim ở danh sách tìm phòng khám hoặc đầu trang chi tiết phòng khám để yêu thích/bỏ yêu thích (chỉ hiện khi đã đăng nhập là Pet Owner, các trang này vẫn xem được công khai)
- Trang "Phòng khám yêu thích" (`/favorites`) liệt kê các phòng khám đang hoạt động đã yêu thích
- Nút Lưu 🔖 trên mỗi bài viết; trang "Bài viết đã lưu" (`/saved`) hiển thị theo thứ tự mới lưu nhất, bài bị xoá sẽ tự biến mất khỏi danh sách
- Hospital Owner/Admin không có chức năng yêu thích hay lưu bài

## 23. Khuyến mãi của phòng khám
- Trong ô đăng bài, Hospital Owner tick "Đăng khuyến mãi" và nhập tiêu đề (bắt buộc), mức giảm (vd "Giảm 20%"), ngày bắt đầu (không bắt buộc) và ngày kết thúc (bắt buộc, phải ở tương lai). Khuyến mãi vẫn là một bài đăng bình thường nên có thích/bình luận/lưu và Admin kiểm duyệt/xoá như mọi bài viết; Pet Owner không đăng được khuyến mãi
- Banner "Khuyến mãi từ phòng khám" ở trang Tài khoản và mục "Khuyến mãi" ở cột phải chỉ hiện khuyến mãi **đang còn hiệu lực** (đã bắt đầu, chưa kết thúc), ưu tiên phòng khám đã yêu thích rồi đến khuyến mãi sắp hết hạn; hết hạn tự ẩn, không có khuyến mãi thật thì không hiện gì
- Khi phòng khám đăng khuyến mãi, những người đã yêu thích phòng khám đó nhận thông báo; bấm vào thông báo mở thẳng bài khuyến mãi

## 24. Nhóm cộng đồng (Groups)
- Pet Owner tạo nhóm công khai (tên, mô tả, ảnh bìa); người tạo tự động là thành viên và là chủ nhóm
- Trang "Nhóm" có tab "Nhóm của tôi" và "Khám phá"; ai cũng tham gia/rời nhóm được (chủ nhóm không rời được nhóm của mình)
- Chỉ thành viên mới xem và đăng bài trong nhóm (đăng bằng ô chụp ảnh camera như bảng tin); Hospital Owner không đăng bài vào nhóm
- Bài trong nhóm **không** xuất hiện ở bảng tin chung, chỉ ở trang nhóm; trên bài có nhãn tên nhóm bấm được
- Chủ nhóm xoá được mọi bài trong nhóm, thành viên khác chỉ xoá bài của chính mình. Chưa có duyệt thành viên, nhóm riêng tư hay xoá nhóm

## 25. Ứng dụng Android (React Native + Expo)
- `apps/mobile`: ứng dụng cho **Pet Owner**, viết bằng TypeScript, dùng chung kiểu dữ liệu `@petcare/types` với web; giao diện theo cùng bảng màu teal và font Fraunces/Inter. Chạy bằng Expo Go (xem README). Bốn tab như web: Trang chủ (bảng tin), Khám phá, Tin nhắn, Tài khoản
- Đăng nhập, đăng ký, quên mật khẩu; phiên được giữ lại sau khi tắt app (refresh token lưu trong kho khoá của hệ điều hành, tự xoay vòng); đăng xuất
- **Bảng tin:** xem bài, lọc theo từng thú cưng, thích/lưu/bình luận (có trả lời), xoá bài của mình; đăng bài chỉ bằng camera (1 ảnh, gắn thẻ thú cưng) giống web; banner và thẻ khuyến mãi của phòng khám
- **Tin nhắn real-time:** danh sách cuộc trò chuyện kèm số chưa đọc, chat văn bản và ảnh, nút "Nhắn tin" ở trang phòng khám; tin mới tới ngay qua Socket.IO (tự lấy token mới khi token hết hạn, tự nối lại khi mở lại app)
- **Thông báo:** chuông kèm số chưa đọc ở đầu mỗi tab, màn hình danh sách, bấm vào để đến đúng nơi (lịch hẹn, cuộc trò chuyện, bài viết); cập nhật real-time, gồm cả nhắc lịch 24h
- **Yêu thích phòng khám, bài viết đã lưu, nhóm:** trái tim ở trang phòng khám, trang Phòng khám yêu thích, trang Bài viết đã lưu, danh sách/tạo/tham gia/rời nhóm và đăng bài trong nhóm
- Tài khoản: lịch hẹn sắp tới, banner khuyến mãi, lối tắt (Lịch hẹn / Yêu thích / Đã lưu / Nhóm), thú cưng, "Khoảnh khắc đáng yêu" (ảnh đã đăng); Cài đặt (sửa hồ sơ + ảnh đại diện, đổi mật khẩu)
- Thú cưng: thêm/sửa/xoá (chọn ảnh hoặc chụp ảnh), Digital Life (thống kê, dải ảnh, dòng thời gian theo tháng), sổ tiêm phòng (xem + thêm), xem hồ sơ bệnh án kèm trạng thái
- Khám phá: tìm phòng khám theo vị trí hiện tại (không cấp quyền hoặc không có GPS thì dùng TP.HCM), bán kính 5–50 km, tìm theo tên, mở bản đồ/gọi điện; chi tiết phòng khám với tab Dịch vụ / Đặt lịch / Đánh giá, áp dụng màu thương hiệu của phòng khám
- Lịch hẹn: danh sách và huỷ lịch; giờ đặt lịch lưu đúng múi giờ
- Backend: client gửi header `X-Client: mobile` thì `POST /auth/login|google|refresh` trả thêm `refreshToken` trong body (không đặt cookie), `/auth/refresh` và `/auth/logout` nhận token từ body; web vẫn chỉ dùng cookie httpOnly
- **Chưa có trên mobile:** thiết lập thông báo/màu thương hiệu của phòng khám, push notification khi app đóng, đăng nhập Google, bản iOS. Hospital Owner, Vet, Admin tiếp tục dùng web

---

## 26. Không gian làm việc của nhân viên phòng khám (Lễ tân / Điều dưỡng)
- Nhân viên đăng nhập vào sidebar riêng, áp màu thương hiệu của phòng khám; endpoint `GET /hospital-staff/me` trả vị trí + phòng khám. Quyền **phân theo vị trí**, cùng một bảng (`STAFF_APPOINTMENT_TRANSITIONS` trong `@petcare/types`) được API kiểm tra và web dùng để ẩn/hiện nút
- **Lễ tân:** hàng đợi lịch hẹn (xác nhận / huỷ) và **hộp thư dùng chung** của phòng khám: xem và trả lời tin của khách; tin trả lời lưu dưới tên chủ phòng khám (khách thấy một giọng "phòng khám"), cập nhật real-time cho chủ và các lễ tân khác
- **Điều dưỡng:** hàng đợi lịch hẹn (bắt đầu khám / hoàn tất) và xem hồ sơ bệnh án của phòng khám ở chế độ chỉ đọc; không có hộp thư. Lễ tân không xem được hồ sơ bệnh án
- Không ai trong nhân viên sửa được hồ sơ phòng khám, dịch vụ hay đội ngũ (chỉ chủ phòng khám)
- Thông báo lịch hẹn mới / khách huỷ và tin nhắn mới gửi thêm cho nhân viên đang hoạt động (tin nhắn chỉ tới lễ tân), vẫn theo công tắc thông báo của phòng khám
- Sửa lỗ hổng: nhân viên bị chủ "tạm ngưng" giờ bị chặn đăng nhập (trước đây chỉ đổi trạng thái hiển thị) và mất quyền truy cập ngay cả khi đang đăng nhập
- Mobile chưa hỗ trợ vai trò này (chỉ Pet Owner)

## Chưa triển khai (nằm ngoài phạm vi các đợt vừa qua)
- Xác thực email hoàn chỉnh: nội dung điều khoản sử dụng, mã OTP qua email cho quên mật khẩu, gửi lại email xác thực (đang tạm gác, chưa làm)
- Mobile: push notification khi app đóng (FCM), đăng nhập Google, bản iOS, build APK/AAB phát hành, và các vai trò Hospital/Vet/Admin trên mobile
- Gọi thoại/video thật (cần hạ tầng TURN server)
- Đa ngôn ngữ (toàn app đang hardcode tiếng Việt, chưa có hạ tầng i18n)
- Đánh giá/nhắn tin cho Shop (schema đã thiết kế đa hình sẵn nhưng tính năng Shop chưa được xây)

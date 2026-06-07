# Hệ Thống Quản Lý Sân Bóng Mini (Pitch Manager)

Hệ thống quản lý sân bóng toàn diện được phát triển bằng **Next.js 15** (App Router), **Tailwind CSS v4**, và **Supabase** (PostgreSQL). Cung cấp nền tảng web hiện đại, tốc độ cao giúp các chủ sân bóng mini tối ưu hóa quy trình đặt lịch, thanh toán, và quản lý doanh thu một cách dễ dàng.

## 🚀 Tính Năng Nổi Bật

### 👨‍💻 Dành cho Khách hàng (Customer)
*   **Trang chủ thu hút:** Giao diện đặt sân hiện đại (Dark/Light mode) với đầy đủ thông tin về bảng giá và ưu đãi.
*   **Đặt sân trực tuyến:** Lựa chọn sân, khung giờ thi đấu. Hệ thống tự động kiểm tra trùng lịch (Real-time).
*   **Quản lý lịch đặt:** Theo dõi danh sách các sân đã đặt, trạng thái duyệt, lịch sử thanh toán.
*   **Check-in bằng QR Code:** Khách hàng nhận được mã QR Code đại diện cho lịch đặt sân. Trình mã này cho nhân viên để check-in vào sân mà không cần thủ tục rườm rà.
*   **Xác nhận qua Email:** Tự động gửi Email hóa đơn kèm mã QR Code khi khách hàng đặt sân thành công.

### 👑 Dành cho Quản lý / Nhân viên (Admin & Staff)
*   **Dashboard Thống Kê:** Trực quan hóa doanh thu theo từng tháng bằng biểu đồ. Tổng hợp các số liệu như tổng số booking, sân đang hoạt động, lượng khách hàng.
*   **Quản lý Sân bóng:** Thêm, sửa, xóa các sân bóng (Sân 5, Sân 7, Sân 11) cùng mức giá linh hoạt.
*   **Quản lý Lịch Đặt:** Phê duyệt lịch đặt, thay đổi trạng thái thành "Hoàn tất" hoặc "Đã hủy".
*   **Check-in khách hàng:** Chức năng đọc mã QR hoặc nhập mã thủ công để check-in. Hệ thống tự động cập nhật trạng thái thanh toán thành công khi khách hàng có mặt.
*   **Quản lý Doanh Thu / Thanh toán:** Xem chi tiết dòng tiền, lịch sử thanh toán.
*   **Export ra Excel:** Xuất báo cáo chi tiết về doanh thu, khách hàng, booking ra file Excel dễ dàng để nộp báo cáo.

---

## 🛠 Công Nghệ Sử Dụng

*   **Framework:** Next.js 15 (React 19)
*   **Styling:** Tailwind CSS v4, shadcn/ui, Lucide Icons
*   **Backend & Database:** Supabase (Cơ sở dữ liệu PostgreSQL mạnh mẽ)
*   **Authentication:** JWT (JSON Web Tokens) với HTTP-only cookies
*   **Thư viện khác:** Recharts (vẽ biểu đồ), qrcode.react, nodemailer (gửi email), xlsx.

---

## 💻 Hướng Dẫn Cài Đặt (Local Development)

### 1. Yêu cầu hệ thống
*   Node.js phiên bản >= 18.x
*   NPM hoặc Yarn

### 2. Các bước cài đặt
**Bước 1:** Clone mã nguồn về máy:
```bash
git clone https://github.com/NAT100306/Quan-li-san-bong.git
cd Quan-li-san-bong
```

**Bước 2:** Cài đặt các gói phụ thuộc (Dependencies):
```bash
npm install
```

**Bước 3:** Cấu hình biến môi trường:
Tạo một file `.env` ở thư mục gốc của dự án và điền các thông số Supabase của bạn:
```env
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_SUPABASE_ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"

JWT_SECRET="super-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Cấu hình Email (Tuỳ chọn)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Quản Lý Sân Bóng <noreply@localhost>"
```

**Bước 4:** Chạy ứng dụng:
```bash
npm run dev
```
Truy cập `http://localhost:3000` trên trình duyệt để sử dụng.

---

## 🌐 Hướng Dẫn Triển Khai (Deploy lên Vercel)

Dự án này được tối ưu để triển khai trực tiếp lên Vercel (đã gỡ bỏ Prisma Runtime dependency để tối ưu tốc độ và không bị lỗi kết nối IPv6).

1. Truy cập Vercel và chọn **Import Project** từ repository GitHub của bạn.
2. Tại phần **Environment Variables**, hãy thêm đúng 5 biến bắt buộc sau (chỉ copy giá trị từ file `.env` cục bộ):
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY`
   * `JWT_SECRET`
   * `NEXT_PUBLIC_APP_URL` (Sửa thành tên miền Vercel cấp cho bạn, ví dụ: `https://ten-ung-dung.vercel.app`)
3. Bấm **Deploy** và chờ đợi Vercel hoàn tất quá trình build.

---
*Phát triển bởi đội ngũ đam mê công nghệ.*

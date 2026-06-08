# Báo Cáo Dự Án: Hệ Thống Quản Lý Sân Bóng Mini

> **Môn học:** Kỹ thuật phần mềm  
> **Nhóm:** NAT100306  
> **Repository:** https://github.com/NAT100306/Quan-li-san-bong  
> **Demo:** https://quan-li-san-bongv1.vercel.app  

---

## 1. Phân Tích Yêu Cầu

### 1.1 Yêu Cầu Chức Năng

#### Nhóm người dùng

| Vai trò | Mô tả |
|---|---|
| **ADMIN** | Quản trị viên, toàn quyền hệ thống |
| **STAFF** | Nhân viên, quản lý booking và check-in |
| **CUSTOMER** | Khách hàng, đặt sân và xem lịch |

#### Yêu cầu chức năng theo vai trò

**Khách hàng (CUSTOMER):**
- UC-01: Đăng ký tài khoản bằng email + mật khẩu
- UC-02: Đăng nhập / đăng xuất
- UC-03: Xem danh sách sân bóng (tên, loại, giá/giờ, trạng thái)
- UC-04: Đặt sân trực tuyến (chọn sân + khung giờ, hệ thống tự kiểm tra trùng lịch)
- UC-05: Xem danh sách lịch đặt cá nhân + trạng thái
- UC-06: Nhận QR Code check-in sau khi đặt sân thành công
- UC-07: Nhận email xác nhận tự động kèm hóa đơn và QR Code

**Nhân viên / Admin (STAFF & ADMIN):**
- UC-08: Xem dashboard tổng quan (doanh thu, số booking, sân hoạt động, khách hàng)
- UC-09: Quản lý danh sách đặt sân (lọc, tìm kiếm, thay đổi trạng thái)
- UC-10: Phê duyệt / hủy lịch đặt
- UC-11: Check-in khách hàng bằng cách quét QR Code hoặc nhập mã thủ công
- UC-12: Quản lý thanh toán (xem chi tiết, cập nhật trạng thái)
- UC-13: Xem báo cáo doanh thu theo tháng/năm
- UC-14: Xuất báo cáo ra file Excel

**Chỉ ADMIN:**
- UC-15: Quản lý sân bóng (thêm, sửa, xóa sân)
- UC-16: Quản lý tài khoản người dùng

### 1.2 Yêu Cầu Phi Chức Năng

| Loại | Yêu cầu |
|---|---|
| **Hiệu năng** | Trang tải < 3s trên kết nối trung bình; API response < 500ms |
| **Bảo mật** | JWT HTTP-only cookie; bcrypt salt 10 cho mật khẩu; phân quyền middleware |
| **Khả dụng** | Deploy Vercel (99.9% uptime SLA); Supabase PostgreSQL managed |
| **Khả năng mở rộng** | Stateless API (Next.js serverless); DB quan hệ chuẩn hóa |
| **Giao diện** | Responsive (mobile/tablet/desktop); Dark/Light mode |
| **Dữ liệu** | Supabase PostgreSQL; dữ liệu nhạy cảm không lưu plaintext |

---

## 2. Thiết Kế Hệ Thống

### 2.1 Kiến Trúc Tổng Quan

```
[Browser] ←→ [Next.js App — Vercel]
                ├── Middleware (proxy.ts) — Route Guard
                ├── App Router Pages — UI/UX (React 19)
                ├── API Routes — Business Logic
                └── Lib — JWT · Supabase Client · Email
                        ↓
               [Supabase PostgreSQL]    [Gmail SMTP]
```

Hệ thống theo mô hình **Full-stack Monolithic** với Next.js App Router:
- **Presentation Layer:** React Server/Client Components
- **Application Layer:** Next.js API Routes (serverless functions)
- **Data Layer:** Supabase PostgreSQL qua Prisma ORM schema

### 2.2 Cấu Trúc Thư Mục

```
src/
├── app/
│   ├── page.tsx              # Landing page (trang chủ)
│   ├── layout.tsx            # Root layout
│   ├── providers.tsx         # Theme Provider
│   ├── login/                # Trang đăng nhập
│   ├── register/             # Trang đăng ký
│   ├── admin/                # Khu vực Admin
│   │   ├── page.tsx          # Dashboard
│   │   ├── layout.tsx        # Admin layout + sidebar
│   │   ├── bookings/         # Quản lý đặt sân
│   │   ├── checkin/          # Check-in QR
│   │   ├── customers/        # Quản lý khách hàng
│   │   └── pitches/          # Quản lý sân bóng
│   ├── customer/
│   │   └── bookings/         # Lịch đặt của khách hàng
│   └── api/
│       ├── auth/             # Đăng nhập, đăng ký, me, logout
│       ├── bookings/         # CRUD + check-in
│       ├── pitches/          # CRUD sân
│       ├── payments/         # CRUD thanh toán
│       ├── customers/        # Xem khách hàng
│       ├── dashboard/        # Thống kê tổng hợp
│       └── reports/          # Báo cáo + xuất Excel
├── components/
│   ├── layout/               # Sidebar, navbar
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── jwt.ts                # Ký/xác thực JWT, hash mật khẩu
│   ├── supabase.ts           # Supabase client (anon + admin)
│   ├── email.ts              # Gửi email qua Nodemailer
│   └── utils.ts              # cn() className utility
└── proxy.ts                  # Next.js Middleware (route guard)
```

### 2.3 Sơ Đồ ERD (Entity Relationship)

Xem chi tiết tại: [docs/uml.md — Class Diagram](./uml.md)

```
User ──< Booking >── Pitch
              │
              └──< Payment
```

**Quan hệ:**
- `User` 1-N `Booking` (với tư cách customer)
- `User` 1-N `Booking` (với tư cách staff xử lý)
- `Pitch` 1-N `Booking`
- `Booking` 1-N `Payment`

---

## 3. Kiến Trúc & Design Patterns

### 3.1 MVC (Model-View-Controller)

| Tầng | Áp dụng trong dự án |
|---|---|
| **Model** | Prisma Schema → Supabase PostgreSQL (`User`, `Pitch`, `Booking`, `Payment`) |
| **View** | React Server/Client Components trong `src/app/**/page.tsx` |
| **Controller** | Next.js API Routes trong `src/app/api/**/route.ts` |

### 3.2 Middleware Pattern

`src/proxy.ts` implements middleware function xử lý **authentication & authorization** trước khi request đến page:

```typescript
export function proxy(request: NextRequest) {
  // 1. Decode JWT từ cookie
  // 2. Kiểm tra quyền truy cập theo route
  // 3. Redirect nếu không đủ quyền
}
```

- `/admin/*` → yêu cầu ADMIN hoặc STAFF
- `/customer/*` → yêu cầu đăng nhập
- `/login`, `/register` → redirect nếu đã đăng nhập

### 3.3 Repository Pattern (qua Supabase Client)

`src/lib/supabase.ts` tập trung hóa database access:

```typescript
// Public client (anon key) — cho frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (service role) — cho API routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false }
});
```

### 3.4 Provider Pattern

`src/app/providers.tsx` bọc toàn bộ app với `ThemeProvider` (next-themes), cho phép Dark/Light mode toàn cục mà không cần prop drilling.

### 3.5 Factory Pattern (ngầm định)

API Route handlers (`GET`, `POST`, `PUT`, `DELETE`) trong mỗi `route.ts` đóng vai trò factory tạo `NextResponse` với các status code và payload tương ứng.

---

## 4. Công Nghệ Sử Dụng

| Hạng mục | Công nghệ | Phiên bản |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.7 |
| UI Library | React | 19.2.4 |
| Database | Supabase (PostgreSQL) | managed |
| ORM Schema | Prisma | ^7.8.0 |
| Authentication | JWT (jsonwebtoken) + bcryptjs | ^9.0.3 |
| Styling | Tailwind CSS v4 + shadcn/ui | v4 |
| Icons | Lucide React | ^1.17.0 |
| Charts | Recharts | ^3.8.1 |
| QR Code | qrcode.react + html5-qrcode | ^4.2.0 |
| Email | Nodemailer | ^8.0.10 |
| Excel Export | xlsx | ^0.18.5 |
| Testing | Jest + @testing-library | latest |
| Deploy | Vercel | — |

---

## 5. Kiểm Thử Phần Mềm

### 5.1 Cấu hình

- **Framework:** Jest với `next/jest` transformer
- **Environment:** Node.js (cho lib tests), jsdom (cho component tests)
- **Thư mục test:** `__tests__/`

### 5.2 Test Cases

#### `__tests__/lib/jwt.test.ts` — 13 test cases

| Test | Mô tả |
|---|---|
| `signToken` — trả về string hợp lệ | Kiểm tra token không rỗng |
| `signToken` — có đúng 3 phần JWT | Kiểm tra format `header.payload.signature` |
| `signToken` — khác nhau theo role | Token ADMIN ≠ STAFF |
| `verifyToken` — decode đúng payload | id, email, role, name khớp |
| `verifyToken` — token không hợp lệ | Trả về null |
| `verifyToken` — chuỗi rỗng | Trả về null |
| `verifyToken` — token hết hạn | Trả về null sau 50ms |
| `hashPassword` — khác password gốc | Hash ≠ plaintext |
| `hashPassword` — khác nhau mỗi lần | bcrypt salt ngẫu nhiên |
| `hashPassword` — format bcrypt | Bắt đầu bằng `$2` |
| `comparePassword` — đúng password | Trả về true |
| `comparePassword` — sai password | Trả về false |
| `comparePassword` — password rỗng | Trả về false |

#### `__tests__/lib/utils.test.ts` — 9 test cases

| Test | Mô tả |
|---|---|
| Merge class names đơn giản | `cn('foo', 'bar')` → `'foo bar'` |
| Conditional truthy | `cn('base', true && 'active')` |
| Bỏ qua falsy | `null`, `undefined`, `false` bị loại bỏ |
| Tailwind conflict resolution | `cn('p-4', 'p-8')` → `'p-8'` |
| Text color conflict | `text-red-500` vs `text-blue-500` |
| Object syntax (clsx) | `{ 'font-bold': true }` |
| Array syntax (clsx) | `['flex', 'items-center']` |
| Không có argument | `cn()` → `''` |
| Multiple overrides | bg + text conflict |

#### `__tests__/middleware/proxy.test.ts` — 12 test cases

| Test | Mô tả |
|---|---|
| `/admin` — chưa đăng nhập | Redirect → `/login` |
| `/admin` — ADMIN token | Cho qua (next) |
| `/admin` — STAFF token | Cho qua (next) |
| `/admin` — CUSTOMER token | Redirect → `/customer/bookings` |
| `/admin` — token không hợp lệ | Redirect → `/login` |
| `/customer/bookings` — chưa đăng nhập | Redirect → `/login` |
| `/customer/bookings` — CUSTOMER token | Cho qua (next) |
| `/customer/bookings` — ADMIN token | Cho qua (next) |
| `/login` — ADMIN đã đăng nhập | Redirect → `/admin` |
| `/login` — CUSTOMER đã đăng nhập | Redirect → `/customer/bookings` |
| `/login` — chưa đăng nhập | Cho qua (next) |
| `/register` — STAFF đã đăng nhập | Redirect → `/admin` |

### 5.3 Kết quả chạy tests

```
Test Suites: 3 passed, 3 total
Tests:       34 passed, 34 total
Snapshots:   0 total
Time:        ~11s
```

**Lệnh chạy tests:**
```bash
npm test               # Chạy tất cả tests
npm run test:coverage  # Chạy tests + báo cáo coverage
```

---

## 6. Hướng Dẫn Cài Đặt & Chạy Dự Án

### 6.1 Yêu cầu hệ thống

- Node.js >= 18.x
- Tài khoản Supabase (miễn phí)
- Gmail App Password (nếu muốn gửi email)

### 6.2 Cài đặt Local

```bash
# 1. Clone repository
git clone https://github.com/NAT100306/Quan-li-san-bong.git
cd Quan-li-san-bong

# 2. Cài dependencies
npm install

# 3. Cấu hình .env
cp .env.example .env
# Điền các giá trị Supabase vào .env

# 4. Chạy development server
npm run dev
# Truy cập http://localhost:3000

# 5. Chạy tests
npm test
```

### 6.3 Tài khoản Demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@sanboong.com | Admin@123 |
| Customer | khach@example.com | Khach@123 |

### 6.4 Luồng Demo Chính

1. **Đặt sân (Customer):**
   - Đăng nhập → Trang chủ → Chọn sân → Chọn ngày/giờ → Xác nhận đặt → Nhận email + QR Code

2. **Check-in (Admin/Staff):**
   - Đăng nhập Admin → Menu Check-in → Quét QR Code → Hệ thống cập nhật trạng thái

3. **Xem báo cáo (Admin):**
   - Dashboard → Biểu đồ doanh thu theo tháng → Export Excel

---

## 7. GitHub & Quy Trình Phát Triển

- **Repository:** https://github.com/NAT100306/Quan-li-san-bong
- **Branch chính:** `main`
- **CI/CD:** Vercel tự động deploy khi push lên `main`
- **Dockerfile:** Có hỗ trợ deploy bằng Docker
- **`.gitignore`:** Loại trừ `.env`, `node_modules`, `.next`

---

## 8. Tài Liệu Đính Kèm

- [UML Diagrams](./uml.md) — Use Case, Class, Sequence, Architecture
- [README.md](../README.md) — Tổng quan và hướng dẫn cài đặt
- [Deployment Guide](../deployment_guide.md) — Hướng dẫn deploy
- **Test Files:**
  - [`__tests__/lib/jwt.test.ts`](../__tests__/lib/jwt.test.ts)
  - [`__tests__/lib/utils.test.ts`](../__tests__/lib/utils.test.ts)
  - [`__tests__/middleware/proxy.test.ts`](../__tests__/middleware/proxy.test.ts)

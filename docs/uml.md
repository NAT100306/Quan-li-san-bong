# UML Diagrams — Hệ thống Quản lý Sân Bóng

Tài liệu này chứa các biểu đồ UML mô tả thiết kế hệ thống Quản lý Sân Bóng Mini.

---

## 1. Use Case Diagram

```mermaid
graph TB
    subgraph Actors["Tác nhân"]
        KH[👤 Khách Hàng]
        NV[👔 Nhân Viên / Staff]
        QT[👑 Quản Trị / Admin]
    end

    subgraph UC_KH["Use Cases — Khách Hàng"]
        UC1([Đăng ký tài khoản])
        UC2([Đăng nhập])
        UC3([Xem danh sách sân bóng])
        UC4([Đặt sân trực tuyến])
        UC5([Xem lịch đặt của mình])
        UC6([Xem QR Code check-in])
        UC7([Nhận email xác nhận])
        UC8([Đăng xuất])
    end

    subgraph UC_NV["Use Cases — Nhân Viên"]
        UC9([Xem danh sách booking])
        UC10([Duyệt / Hủy booking])
        UC11([Check-in bằng QR Code])
        UC12([Xem dashboard thống kê])
        UC13([Quản lý thanh toán])
    end

    subgraph UC_QT["Use Cases — Quản Trị"]
        UC14([Quản lý sân bóng CRUD])
        UC15([Quản lý tài khoản người dùng])
        UC16([Xem báo cáo doanh thu])
        UC17([Xuất báo cáo Excel])
        UC18([Tất cả UC của Nhân Viên])
    end

    KH --> UC1
    KH --> UC2
    KH --> UC3
    KH --> UC4
    KH --> UC5
    KH --> UC6
    KH --> UC7
    KH --> UC8

    NV --> UC2
    NV --> UC9
    NV --> UC10
    NV --> UC11
    NV --> UC12
    NV --> UC13
    NV --> UC8

    QT --> UC14
    QT --> UC15
    QT --> UC16
    QT --> UC17
    QT --> UC18
    UC18 -.->|include| UC9
    UC18 -.->|include| UC10
    UC18 -.->|include| UC11

    UC4 -.->|include| UC7
```

---

## 2. Class Diagram

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String password
        +String name
        +String phone
        +Role role
        +DateTime createdAt
        +DateTime updatedAt
        +Booking[] bookings
        +Booking[] handledBookings
    }

    class Pitch {
        +String id
        +String name
        +PitchType type
        +Decimal pricePerHour
        +PitchStatus status
        +String description
        +DateTime createdAt
        +DateTime updatedAt
        +Booking[] bookings
    }

    class Booking {
        +String id
        +String pitchId
        +String customerId
        +String staffId
        +DateTime startTime
        +DateTime endTime
        +BookingStatus status
        +Decimal totalPrice
        +String checkInCode
        +Boolean checkInStatus
        +DateTime checkInAt
        +DateTime createdAt
        +DateTime updatedAt
        +Payment[] payments
    }

    class Payment {
        +String id
        +String bookingId
        +Decimal amount
        +PaymentMethod paymentMethod
        +PaymentStatus status
        +String transactionId
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Role {
        <<enumeration>>
        ADMIN
        STAFF
        CUSTOMER
    }

    class PitchType {
        <<enumeration>>
        MINI_5
        MINI_7
        STANDARD_11
    }

    class PitchStatus {
        <<enumeration>>
        ACTIVE
        MAINTENANCE
        INACTIVE
    }

    class BookingStatus {
        <<enumeration>>
        PENDING
        CONFIRMED
        CANCELLED
        COMPLETED
    }

    class PaymentMethod {
        <<enumeration>>
        CASH
        BANK_TRANSFER
        MOMO
        VNPAY
    }

    class PaymentStatus {
        <<enumeration>>
        PENDING
        COMPLETED
        FAILED
    }

    User "1" --> "*" Booking : places (CustomerBookings)
    User "1" --> "*" Booking : handles (StaffBookings)
    Pitch "1" --> "*" Booking : booked via
    Booking "1" --> "*" Payment : paid by
    User --> Role
    Pitch --> PitchType
    Pitch --> PitchStatus
    Booking --> BookingStatus
    Payment --> PaymentMethod
    Payment --> PaymentStatus
```

---

## 3. Sequence Diagram — Luồng Đặt Sân

```mermaid
sequenceDiagram
    actor KH as Khách Hàng
    participant UI as Trang Chủ (React)
    participant API as API Route /api/bookings
    participant Auth as Middleware JWT
    participant DB as Supabase (PostgreSQL)
    participant Mail as Email Service

    KH->>UI: Chọn sân + khung giờ
    UI->>API: POST /api/bookings {pitchId, startTime, endTime}
    API->>Auth: Kiểm tra token JWT từ cookie
    Auth-->>API: UserPayload {id, role}
    API->>DB: Kiểm tra trùng lịch (SELECT bookings)
    DB-->>API: Không trùng lịch
    API->>DB: Tính giá (pricePerHour × số giờ)
    API->>DB: INSERT booking (status=PENDING, checkInCode=uuid)
    DB-->>API: Booking created {id, checkInCode}
    API->>Mail: Gửi email xác nhận + QR Code
    Mail-->>KH: Email với QR Code check-in
    API-->>UI: 201 Created {booking}
    UI-->>KH: Hiển thị thông báo đặt sân thành công
```

---

## 4. Sequence Diagram — Luồng Check-in QR Code

```mermaid
sequenceDiagram
    actor NV as Nhân Viên
    participant UI as Trang Check-in (React)
    participant Cam as QR Scanner (html5-qrcode)
    participant API as API Route /api/bookings/[id]/checkin
    participant Auth as Middleware JWT
    participant DB as Supabase (PostgreSQL)

    NV->>UI: Mở trang Check-in
    UI->>Cam: Khởi động camera
    KH->>Cam: Quét QR Code từ điện thoại
    Cam-->>UI: checkInCode (UUID string)
    UI->>API: POST /api/bookings/checkin {checkInCode}
    API->>Auth: Kiểm tra quyền ADMIN/STAFF
    Auth-->>API: Authorized
    API->>DB: Tìm booking theo checkInCode
    DB-->>API: Booking {id, status, checkInStatus}
    API->>DB: UPDATE booking SET checkInStatus=true, checkInAt=now()
    API->>DB: UPDATE payment SET status=COMPLETED
    DB-->>API: Success
    API-->>UI: 200 OK {message: "Check-in thành công"}
    UI-->>NV: Hiển thị thông tin khách hàng đã check-in
```

---

## 5. Component Architecture Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend — Next.js App Router"]
        LP[Landing Page /]
        Login[/login]
        Register[/register]
        subgraph Admin["Admin Panel /admin"]
            Dashboard[Dashboard]
            Pitches[Quản lý Sân /admin/pitches]
            Bookings[Quản lý Đặt Sân /admin/bookings]
            Customers[Quản lý KH /admin/customers]
            CheckIn[Check-in /admin/checkin]
        end
        subgraph Customer["Customer Portal /customer"]
            MyBookings[Lịch đặt /customer/bookings]
        end
    end

    subgraph Middleware["Middleware Layer"]
        Proxy[proxy.ts — Route Guard JWT]
    end

    subgraph API["API Routes /api"]
        AuthAPI[/api/auth/*]
        BookAPI[/api/bookings/*]
        PitchAPI[/api/pitches/*]
        PayAPI[/api/payments/*]
        CustAPI[/api/customers/*]
        DashAPI[/api/dashboard]
        RepAPI[/api/reports]
    end

    subgraph Lib["Business Logic — /lib"]
        JWT[jwt.ts — Auth]
        SupaLib[supabase.ts — DB Client]
        Email[email.ts — Nodemailer]
    end

    subgraph External["External Services"]
        Supa[(Supabase PostgreSQL)]
        SMTP[Gmail SMTP]
    end

    Frontend --> Middleware
    Middleware --> Frontend
    Frontend --> API
    API --> Lib
    Lib --> Supa
    Lib --> SMTP
```

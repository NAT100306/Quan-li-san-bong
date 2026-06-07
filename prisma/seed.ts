import 'dotenv/config';
import { PrismaClient, Role, PitchType, PitchStatus, BookingStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();


async function main() {
  console.log('Bắt đầu seeding dữ liệu mẫu...');

  // Xóa dữ liệu cũ
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.pitch.deleteMany();
  await prisma.user.deleteMany();

  console.log('Đã làm sạch cơ sở dữ liệu cũ.');

  // Tạo tài khoản người dùng
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const staffPassword = await bcrypt.hash('staff123', salt);
  const customerPassword = await bcrypt.hash('customer123', salt);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@gmail.com',
      password: adminPassword,
      name: 'Nguyễn Văn Admin',
      phone: '0987654321',
      role: Role.ADMIN,
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@gmail.com',
      password: staffPassword,
      name: 'Trần Thị Nhân Viên',
      phone: '0912345678',
      role: Role.STAFF,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: 'customer@gmail.com',
      password: customerPassword,
      name: 'Lê Văn Khách Hàng',
      phone: '0901234567',
      role: Role.CUSTOMER,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'khach1@gmail.com',
      password: customerPassword,
      name: 'Phạm Minh Long',
      phone: '0933334444',
      role: Role.CUSTOMER,
    },
  });

  console.log('Đã tạo người dùng mẫu.');

  // Tạo các sân bóng
  const pitch1 = await prisma.pitch.create({
    data: {
      name: 'Sân 5 người A (Mặt cỏ nhân tạo)',
      type: PitchType.MINI_5,
      pricePerHour: 200000.00,
      status: PitchStatus.ACTIVE,
      description: 'Sân 5 tiêu chuẩn chất lượng cao, hệ thống đèn LED ban đêm siêu sáng.',
    },
  });

  const pitch2 = await prisma.pitch.create({
    data: {
      name: 'Sân 5 người B (Mặt cỏ nhân tạo)',
      type: PitchType.MINI_5,
      pricePerHour: 200000.00,
      status: PitchStatus.ACTIVE,
      description: 'Sân 5 kích thước chuẩn, thoát nước tốt.',
    },
  });

  const pitch3 = await prisma.pitch.create({
    data: {
      name: 'Sân 7 người C',
      type: PitchType.MINI_7,
      pricePerHour: 350000.00,
      status: PitchStatus.ACTIVE,
      description: 'Sân 7 cỏ mềm, thích hợp đá phong trào.',
    },
  });

  const pitch4 = await prisma.pitch.create({
    data: {
      name: 'Sân 7 người D',
      type: PitchType.MINI_7,
      pricePerHour: 350000.00,
      status: PitchStatus.MAINTENANCE,
      description: 'Sân đang bảo trì bề mặt cỏ, dự kiến hoạt động lại tuần sau.',
    },
  });

  const pitch5 = await prisma.pitch.create({
    data: {
      name: 'Sân 11 người E (Chuẩn quốc tế)',
      type: PitchType.STANDARD_11,
      pricePerHour: 800000.00,
      status: PitchStatus.ACTIVE,
      description: 'Sân 11 kích thước tiêu chuẩn FIFA, cỏ tự nhiên.',
    },
  });

  console.log('Đã tạo các sân bóng mẫu.');

  // Tạo các mốc thời gian booking mẫu
  const now = new Date();

  // Booking 1: Hôm qua, đã kết thúc, đã thanh toán
  const yesterdayStart = new Date(now);
  yesterdayStart.setDate(now.getDate() - 1);
  yesterdayStart.setHours(17, 0, 0, 0);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(yesterdayStart.getHours() + 2); // 2 tiếng

  const booking1 = await prisma.booking.create({
    data: {
      pitchId: pitch1.id,
      customerId: customer1.id,
      staffId: staff.id,
      startTime: yesterdayStart,
      endTime: yesterdayEnd,
      status: BookingStatus.COMPLETED,
      totalPrice: 400000.00, // 200k * 2
      checkInStatus: true,
      checkInAt: yesterdayStart,
      checkInCode: 'YESTERDAY-B1-QR-CODE',
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      amount: 400000.00,
      paymentMethod: PaymentMethod.CASH,
      status: PaymentStatus.COMPLETED,
      transactionId: 'TXN-CASH-123',
      createdAt: yesterdayStart,
    },
  });

  // Booking 2: Hôm nay, đang chờ duyệt
  const todayStart = new Date(now);
  todayStart.setHours(19, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(todayStart.getHours() + 1.5); // 1.5 tiếng

  const booking2 = await prisma.booking.create({
    data: {
      pitchId: pitch3.id,
      customerId: customer2.id,
      startTime: todayStart,
      endTime: todayEnd,
      status: BookingStatus.PENDING,
      totalPrice: 525000.00, // 350k * 1.5
      checkInStatus: false,
      checkInCode: 'TODAY-B2-QR-CODE',
    },
  });

  // Booking 3: Ngày mai, đã xác nhận, đã thanh toán qua chuyển khoản
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(now.getDate() + 1);
  tomorrowStart.setHours(18, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(tomorrowStart.getHours() + 2);

  const booking3 = await prisma.booking.create({
    data: {
      pitchId: pitch1.id,
      customerId: customer1.id,
      staffId: admin.id,
      startTime: tomorrowStart,
      endTime: tomorrowEnd,
      status: BookingStatus.CONFIRMED,
      totalPrice: 400000.00,
      checkInStatus: false,
      checkInCode: 'TOMORROW-B3-QR-CODE',
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking3.id,
      amount: 400000.00,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.COMPLETED,
      transactionId: 'FT26068888999',
      createdAt: now,
    },
  });

  // Booking 4: Tuần này, đã hủy
  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(now.getDate() - 3);
  lastWeekStart.setHours(15, 0, 0, 0);
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setHours(lastWeekStart.getHours() + 2);

  await prisma.booking.create({
    data: {
      pitchId: pitch2.id,
      customerId: customer2.id,
      startTime: lastWeekStart,
      endTime: lastWeekEnd,
      status: BookingStatus.CANCELLED,
      totalPrice: 400000.00,
      checkInStatus: false,
      checkInCode: 'CANCELLED-B4-QR-CODE',
    },
  });

  console.log('Đã tạo các đặt sân và thanh toán mẫu.');
  console.log('Seeding dữ liệu thành công!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seeding dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

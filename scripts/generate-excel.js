const XLSX = require('xlsx');
const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID();
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

// 1. Tạo dữ liệu Profiles
const profiles = [
  { id: uuid(), email: 'admin@sanfootball.com', name: 'Nguyễn Văn Admin', phone: '0901234567', role: 'ADMIN', created_at: new Date().toISOString() },
  { id: uuid(), email: 'staff1@sanfootball.com', name: 'Trần Thị Staff', phone: '0987654321', role: 'STAFF', created_at: new Date().toISOString() },
  { id: uuid(), email: 'customer1@gmail.com', name: 'Lê Khách Hàng', phone: '0911222333', role: 'CUSTOMER', created_at: new Date().toISOString() },
  { id: uuid(), email: 'customer2@gmail.com', name: 'Phạm Vui Chơi', phone: '0933444555', role: 'CUSTOMER', created_at: new Date().toISOString() },
  { id: uuid(), email: 'customer3@gmail.com', name: 'Đặng Thể Thao', phone: '0944555666', role: 'CUSTOMER', created_at: new Date().toISOString() }
];

// 2. Tạo dữ liệu Pitches
const pitches = [
  { id: uuid(), name: 'Sân 5A - Cỏ nhân tạo', type: 'MINI_5', price_per_hour: 250000, status: 'ACTIVE', description: 'Sân 5 người tiêu chuẩn, cỏ mới thay' },
  { id: uuid(), name: 'Sân 5B - Có mái che', type: 'MINI_5', price_per_hour: 300000, status: 'ACTIVE', description: 'Sân 5 người, có mái che mát mẻ' },
  { id: uuid(), name: 'Sân 7A - Gần khán đài', type: 'MINI_7', price_per_hour: 400000, status: 'ACTIVE', description: 'Sân 7 người, bóng đèn LED sáng' },
  { id: uuid(), name: 'Sân 7B - Góc trong', type: 'MINI_7', price_per_hour: 350000, status: 'ACTIVE', description: 'Sân 7 người, yên tĩnh' },
  { id: uuid(), name: 'Sân 11 Lớn', type: 'STANDARD_11', price_per_hour: 800000, status: 'MAINTENANCE', description: 'Sân 11 người đang bảo trì hệ thống thoát nước' }
];

// 3. Tạo dữ liệu Bookings
const bookings = [];
const payments = [];

const now = new Date();
for (let i = 0; i < 15; i++) {
  const pitch = pitches[Math.floor(Math.random() * (pitches.length - 1))]; // không chọn sân bảo trì
  const customer = profiles[Math.floor(Math.random() * 3) + 2]; // random customer
  const staff = Math.random() > 0.5 ? profiles[1] : null;

  // Lịch ngẫu nhiên trong khoảng 7 ngày tới
  const startOffset = Math.floor(Math.random() * 7 * 24);
  const startTime = new Date(now.getTime() + startOffset * 60 * 60 * 1000);
  startTime.setMinutes(0, 0, 0); // Tròn giờ
  
  const durationHours = Math.random() > 0.5 ? 1.5 : 2; // 1.5h hoặc 2h
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

  const totalPrice = pitch.price_per_hour * durationHours;
  
  const statuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  const bookingId = uuid();
  const checkInCode = uuid().split('-')[0].toUpperCase();

  bookings.push({
    id: bookingId,
    pitch_id: pitch.id,
    customer_id: customer.id,
    staff_id: staff ? staff.id : '',
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    status: status,
    total_price: totalPrice,
    check_in_code: checkInCode,
    check_in_status: status === 'COMPLETED',
    check_in_at: status === 'COMPLETED' ? startTime.toISOString() : ''
  });

  // 4. Tạo Payment tương ứng nếu status không phải PENDING / CANCELLED
  if (status === 'COMPLETED' || status === 'CONFIRMED') {
    const pMethods = ['CASH', 'BANK_TRANSFER', 'MOMO', 'VNPAY'];
    const pStatus = status === 'COMPLETED' ? 'COMPLETED' : 'PENDING';
    
    payments.push({
      id: uuid(),
      booking_id: bookingId,
      amount: totalPrice,
      payment_method: pMethods[Math.floor(Math.random() * pMethods.length)],
      status: pStatus,
      transaction_id: pStatus === 'COMPLETED' ? 'TXN' + Date.now() + Math.floor(Math.random()*1000) : ''
    });
  }
}

// Lưu từng file riêng biệt cho dễ import
const files = [
  { name: 'profiles.csv', data: profiles, sheetName: 'profiles' },
  { name: 'pitches.csv', data: pitches, sheetName: 'pitches' },
  { name: 'bookings.csv', data: bookings, sheetName: 'bookings' },
  { name: 'payments.csv', data: payments, sheetName: 'payments' }
];

files.forEach(f => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(f.data);
  XLSX.utils.book_append_sheet(wb, ws, f.sheetName);
  // Thêm tuỳ chọn bookType: 'csv' để đảm bảo xuất ra định dạng chuẩn CSV
  XLSX.writeFile(wb, f.name, { bookType: 'csv' });
  console.log('✅ Đã tạo thành công file: ' + f.name);
});

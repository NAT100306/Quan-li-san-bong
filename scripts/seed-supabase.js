const { createClient } = require('@supabase/supabase-js');

// Dùng Service Role Key để bypass RLS và gọi Admin API
const supabaseUrl = 'https://zayecaidaasmjakumygq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpheWVjYWlkYWFzbWpha3VteWdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc1MTQ2MywiZXhwIjoyMDk2MzI3NDYzfQ.lDVu6V96ZIVxhz6qYBxItEIdUZDiIkZxRDaGh4tD0Ac';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  try {
    console.log('🚀 Bắt đầu tạo dữ liệu mẫu trực tiếp vào Supabase...');

    // 1. Xoá dữ liệu cũ (nếu muốn) - bỏ qua để an toàn, hoặc chỉ thêm mới
    const usersData = [
      { email: 'staff1@sanfootball.com', name: 'Trần Thị Staff', phone: '0987654321', role: 'STAFF', password: 'Password123' },
      { email: 'customer1@gmail.com', name: 'Lê Khách Hàng', phone: '0911222333', role: 'CUSTOMER', password: 'Password123' },
      { email: 'customer2@gmail.com', name: 'Phạm Vui Chơi', phone: '0933444555', role: 'CUSTOMER', password: 'Password123' },
    ];

    const profiles = [];
    for (const u of usersData) {
      // Create user in auth.users
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true
      });

      if (authErr && !authErr.message.includes('already')) {
        console.error('Lỗi tạo user:', authErr.message);
        continue;
      }

      let userId = authData?.user?.id;
      if (!userId) {
        // Lấy lại ID nếu đã tồn tại
        const { data: existUser } = await supabase.from('profiles').select('id').eq('email', u.email).single();
        userId = existUser?.id;
      }

      if (userId) {
        // Upsert profile
        const { error: profileErr } = await supabase.from('profiles').upsert({
          id: userId,
          email: u.email,
          name: u.name,
          phone: u.phone,
          role: u.role
        });
        if (!profileErr) profiles.push({ id: userId, ...u });
      }
    }
    console.log(`✅ Đã tạo ${profiles.length} tài khoản người dùng!`);

    // 2. Thêm sân bóng
    const pitchesData = [
      { name: 'Sân 5A - Cỏ nhân tạo', type: 'MINI_5', price_per_hour: 250000, status: 'ACTIVE', description: 'Sân 5 người tiêu chuẩn' },
      { name: 'Sân 5B - Có mái che', type: 'MINI_5', price_per_hour: 300000, status: 'ACTIVE', description: 'Sân 5 người, mát mẻ' },
      { name: 'Sân 7A - Khán đài', type: 'MINI_7', price_per_hour: 400000, status: 'ACTIVE', description: 'Sân 7 người' }
    ];

    const { data: pitches, error: pitchErr } = await supabase.from('pitches').insert(pitchesData).select();
    if (pitchErr) console.error('Lỗi tạo sân:', pitchErr.message);
    else console.log(`✅ Đã tạo ${pitches.length} sân bóng!`);

    if (profiles.length < 2 || !pitches || pitches.length === 0) {
      console.log('Không đủ dữ liệu để tạo booking.');
      return;
    }

    // 3. Thêm Bookings
    const customer = profiles.find(p => p.role === 'CUSTOMER');
    const staff = profiles.find(p => p.role === 'STAFF');
    const pitch = pitches[0];

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Ngày mai
    startTime.setMinutes(0, 0, 0);
    const endTime = new Date(startTime.getTime() + 1.5 * 60 * 60 * 1000);

    const bookingData = {
      pitch_id: pitch.id,
      customer_id: customer.id,
      staff_id: staff.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'COMPLETED',
      total_price: pitch.price_per_hour * 1.5,
      check_in_status: true,
      check_in_at: startTime.toISOString()
    };

    const { data: bookingArr, error: bookErr } = await supabase.from('bookings').insert([bookingData]).select();
    if (bookErr) console.error('Lỗi tạo booking:', bookErr.message);
    else {
      console.log('✅ Đã tạo 1 đơn đặt sân!');
      
      // 4. Thêm Payment
      const { error: payErr } = await supabase.from('payments').insert([{
        booking_id: bookingArr[0].id,
        amount: bookingData.total_price,
        payment_method: 'MOMO',
        status: 'COMPLETED',
        transaction_id: 'MOMO' + Date.now()
      }]);
      if (payErr) console.error('Lỗi tạo thanh toán:', payErr.message);
      else console.log('✅ Đã tạo 1 thanh toán!');
    }

    console.log('🎉 HOÀN TẤT SEED DỮ LIỆU!');
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

seed();

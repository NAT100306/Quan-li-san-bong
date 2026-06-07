import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser, hasRole } from '@/lib/auth-api';

export const dynamic = 'force-dynamic';

// GET: Lấy số liệu thống kê tổng hợp cho Dashboard (Chỉ ADMIN, STAFF)
export async function GET(req: Request) {
  try {
    const session = getAuthenticatedUser(req);
    if (!session || !hasRole(session, ['ADMIN', 'STAFF'])) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 12, 0, 23, 59, 59, 999);

    // 1 & 6. Tính tổng doanh thu bằng cách lấy tất cả payments COMPLETED trong năm nay
    const { data: paymentsInYear, error: payErr } = await supabaseAdmin
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'COMPLETED')
      .gte('created_at', startOfYear.toISOString())
      .lte('created_at', endOfYear.toISOString());

    if (payErr) throw payErr;

    let currentMonthRevenue = 0;
    const monthlyRevenueData: { month: string; revenue: number }[] = Array.from({ length: 12 }, (_, i) => ({
      month: `Thg ${i + 1}`,
      revenue: 0,
    }));

    (paymentsInYear || []).forEach((p: any) => {
      const paymentDate = new Date(p.created_at);
      const monthIndex = paymentDate.getMonth();
      const amount = Number(p.amount || 0);

      monthlyRevenueData[monthIndex].revenue += amount;

      if (monthIndex === currentMonth) {
        currentMonthRevenue += amount;
      }
    });

    // 2. Tổng số bookings trong tháng (mọi trạng thái ngoại trừ CANCELLED)
    const { count: monthlyBookingsCount, error: bookErr } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['PENDING', 'CONFIRMED', 'COMPLETED'])
      .gte('start_time', startOfMonth.toISOString())
      .lte('start_time', endOfMonth.toISOString());

    if (bookErr) throw bookErr;

    // 3. Số lượng sân bóng đang hoạt động
    const { count: activePitchesCount, error: pitchErr } = await supabaseAdmin
      .from('pitches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE');

    if (pitchErr) throw pitchErr;

    // 4. Số lượng khách hàng đăng ký trên hệ thống
    const { count: totalCustomersCount, error: custErr } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'CUSTOMER');

    if (custErr) throw custErr;

    // 5. Danh sách 5 lịch đặt sân gần nhất
    const { data: recentBookings, error: recentErr } = await supabaseAdmin
      .from('bookings')
      .select('*, pitch:pitches(name), customer:profiles!bookings_customer_id_fkey(name, phone)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentErr) throw recentErr;

    const formattedRecentBookings = (recentBookings || []).map((b: any) => ({
      id: b.id,
      customerName: b.customer?.name || 'Khách',
      customerPhone: b.customer?.phone || '',
      pitchName: b.pitch?.name || 'Sân bóng',
      startTime: b.start_time,
      endTime: b.end_time,
      totalPrice: Number(b.total_price),
      status: b.status,
    }));

    return NextResponse.json({
      stats: {
        currentMonthRevenue,
        monthlyBookingsCount: monthlyBookingsCount || 0,
        activePitchesCount: activePitchesCount || 0,
        totalCustomersCount: totalCustomersCount || 0,
      },
      recentBookings: formattedRecentBookings,
      monthlyRevenueChart: monthlyRevenueData,
    });
  } catch (error) {
    console.error('Dashboard Stats API Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

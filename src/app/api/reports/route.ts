import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser, hasRole } from '@/lib/auth-api';

export const dynamic = 'force-dynamic';

// GET: Báo cáo doanh thu chi tiết (Chỉ ADMIN)
export async function GET(req: Request) {
  try {
    const session = getAuthenticatedUser(req);
    if (!session || !hasRole(session, ['ADMIN'])) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get('type') || 'month'; // day, month, year
    const dateStr = searchParams.get('date'); // YYYY-MM-DD hoặc YYYY-MM hoặc YYYY

    let startDate = new Date();
    let endDate = new Date();
    const now = new Date();

    if (filterType === 'day') {
      const targetDate = dateStr ? new Date(dateStr) : now;
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    } else if (filterType === 'year') {
      const year = dateStr ? parseInt(dateStr) : now.getFullYear();
      startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    } else {
      // Mặc định là tháng (month)
      let year = now.getFullYear();
      let month = now.getMonth(); // 0-11

      if (dateStr) {
        const parts = dateStr.split('-');
        year = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
      }

      startDate = new Date(year, month, 1, 0, 0, 0, 0);
      endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    }

    // Lấy tất cả payments hoàn thành trong kỳ
    const { data: paymentsRaw, error: payErr } = await supabaseAdmin
      .from('payments')
      .select('amount, created_at, booking:bookings!inner(pitch_id)')
      .eq('status', 'COMPLETED')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (payErr) throw payErr;
    const payments = paymentsRaw || [];

    // Lấy tất cả bookings trong kỳ
    const { data: bookingsRaw, error: bookErr } = await supabaseAdmin
      .from('bookings')
      .select('status, pitch_id, start_time')
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());

    if (bookErr) throw bookErr;
    const bookings = bookingsRaw || [];

    // Lấy thông tin sân bóng
    const { data: pitchesRaw, error: pitchErr } = await supabaseAdmin.from('pitches').select('id, name, type');
    if (pitchErr) throw pitchErr;
    const pitches = pitchesRaw || [];

    // 1. Thống kê tổng quan trong kỳ báo cáo
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length;
    const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED').length;

    // 2. Doanh thu phân chia theo từng sân bóng
    const revenueByPitch = pitches.map((pitch) => {
      const pitchPayments = payments.filter((p: any) => p.booking?.pitch_id === pitch.id);
      const pitchRevenue = pitchPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const pitchBookingsCount = bookings.filter((b) => b.pitch_id === pitch.id).length;

      return {
        pitchId: pitch.id,
        pitchName: pitch.name,
        pitchType: pitch.type,
        revenue: pitchRevenue,
        bookingsCount: pitchBookingsCount,
      };
    });

    // 3. Doanh thu chi tiết theo mốc thời gian con
    const breakdownData = [];

    if (filterType === 'month') {
      const daysInMonth = endDate.getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStart = new Date(startDate.getFullYear(), startDate.getMonth(), day, 0, 0, 0, 0).getTime();
        const dayEnd = new Date(startDate.getFullYear(), startDate.getMonth(), day, 23, 59, 59, 999).getTime();

        const dayRev = payments
          .filter((p) => {
            const time = new Date(p.created_at).getTime();
            return time >= dayStart && time <= dayEnd;
          })
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        breakdownData.push({
          label: `${day}/${startDate.getMonth() + 1}`,
          revenue: dayRev,
        });
      }
    } else if (filterType === 'year') {
      for (let month = 0; month < 12; month++) {
        const mStart = new Date(startDate.getFullYear(), month, 1, 0, 0, 0, 0).getTime();
        const mEnd = new Date(startDate.getFullYear(), month + 1, 0, 23, 59, 59, 999).getTime();

        const mRev = payments
          .filter((p) => {
            const time = new Date(p.created_at).getTime();
            return time >= mStart && time <= mEnd;
          })
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        breakdownData.push({
          label: `Thg ${month + 1}`,
          revenue: mRev,
        });
      }
    } else {
      // filterType === 'day' -> chia theo 6h - 12h - 18h - 24h
      const ranges = [
        { label: '0h - 6h', startH: 0, endH: 6 },
        { label: '6h - 12h', startH: 6, endH: 12 },
        { label: '12h - 18h', startH: 12, endH: 18 },
        { label: '18h - 24h', startH: 18, endH: 24 },
      ];

      for (const range of ranges) {
        const rStart = new Date(startDate);
        rStart.setHours(range.startH, 0, 0, 0);
        const rEnd = new Date(startDate);
        rEnd.setHours(range.endH, 0, 0, 0);

        const rangeRev = payments
          .filter((p) => {
            const time = new Date(p.created_at).getTime();
            return time >= rStart.getTime() && time < rEnd.getTime();
          })
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        breakdownData.push({
          label: range.label,
          revenue: rangeRev,
        });
      }
    }

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalBookings,
        completedBookings,
        cancelledBookings,
      },
      revenueByPitch,
      breakdown: breakdownData,
    });
  } catch (error) {
    console.error('Reports API Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

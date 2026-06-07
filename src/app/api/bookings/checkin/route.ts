import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser, hasRole } from '@/lib/auth-api';

// POST: Check-in trực tiếp qua checkInCode (Chỉ ADMIN, STAFF)
export async function POST(req: Request) {
  try {
    const session = getAuthenticatedUser(req);
    if (!session || !hasRole(session, ['ADMIN', 'STAFF'])) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const { checkInCode } = await req.json();

    if (!checkInCode) {
      return NextResponse.json({ error: 'Thiếu mã Check-in QR.' }, { status: 400 });
    }

    const { data: booking, error: getErr } = await supabaseAdmin
      .from('bookings')
      .select('*, pitch:pitches(*), customer:profiles!bookings_customer_id_fkey(id, name, phone, email)')
      .eq('check_in_code', checkInCode)
      .single();

    if (getErr || !booking) {
      return NextResponse.json({ error: 'Mã check-in không tồn tại hoặc không hợp lệ.' }, { status: 404 });
    }

    if (booking.check_in_status) {
      return NextResponse.json({ 
        error: 'Lịch đặt sân này đã được Check-in trước đó.', 
        booking 
      }, { status: 400 });
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Không thể Check-in lịch đặt sân đã bị hủy.' }, { status: 400 });
    }

    const { data: updatedBooking, error: updateErr } = await supabaseAdmin
      .from('bookings')
      .update({
        check_in_status: true,
        check_in_at: new Date().toISOString(),
        status: 'COMPLETED',
        staff_id: session.id,
      })
      .eq('id', booking.id)
      .select('*, pitch:pitches(*), customer:profiles!bookings_customer_id_fkey(id, name, phone, email)')
      .single();

    if (updateErr) throw updateErr;

    // Tự động thu tiền mặt PENDING
    await supabaseAdmin
      .from('payments')
      .update({ status: 'COMPLETED' })
      .eq('booking_id', booking.id)
      .eq('status', 'PENDING');

    const formattedUpdatedBooking = {
      ...updatedBooking,
      pitchId: updatedBooking.pitch_id,
      customerId: updatedBooking.customer_id,
      staffId: updatedBooking.staff_id,
      startTime: updatedBooking.start_time,
      endTime: updatedBooking.end_time,
      totalPrice: updatedBooking.total_price,
      checkInCode: updatedBooking.check_in_code,
      checkInStatus: updatedBooking.check_in_status,
      checkInAt: updatedBooking.check_in_at,
      createdAt: updatedBooking.created_at,
      updatedAt: updatedBooking.updated_at,
    };

    return NextResponse.json({
      message: 'Check-in thành công! Chúc khách hàng có trận đấu vui vẻ.',
      booking: formattedUpdatedBooking,
    });
  } catch (error) {
    console.error('Direct Checkin API Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser, hasRole } from '@/lib/auth-api';

// GET: Chi tiết đặt sân
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getAuthenticatedUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*, pitch:pitches(*), customer:profiles!bookings_customer_id_fkey(id, name, email, phone), payments(*)')
      .eq('id', id)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin đặt sân.' }, { status: 404 });
    }

    // Khách hàng bình thường chỉ xem được booking của chính mình
    if (session.role === 'CUSTOMER' && booking.customer_id !== session.id) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const formattedBooking = {
      ...booking,
      pitchId: booking.pitch_id,
      customerId: booking.customer_id,
      staffId: booking.staff_id,
      startTime: booking.start_time,
      endTime: booking.end_time,
      totalPrice: booking.total_price,
      checkInCode: booking.check_in_code,
      checkInStatus: booking.check_in_status,
      checkInAt: booking.check_in_at,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      pitch: booking.pitch ? {
        ...booking.pitch,
        pricePerHour: booking.pitch.price_per_hour,
        createdAt: booking.pitch.created_at,
        updatedAt: booking.pitch.updated_at,
      } : null,
      payments: (booking.payments || []).map((p: any) => ({
        ...p,
        bookingId: p.booking_id,
        paymentMethod: p.payment_method,
        transactionId: p.transaction_id,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))
    };

    return NextResponse.json({ booking: formattedBooking });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

// PUT: Cập nhật trạng thái đặt sân (Duyệt/Xác nhận, Hủy)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getAuthenticatedUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { status } = await req.json();
    if (!status) {
      return NextResponse.json({ error: 'Thiếu trạng thái cập nhật.' }, { status: 400 });
    }

    const { data: booking, error: getErr } = await supabaseAdmin.from('bookings').select('*').eq('id', id).single();
    if (getErr || !booking) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin đặt sân.' }, { status: 404 });
    }

    // Khách hàng chỉ được phép hủy đặt sân ở trạng thái PENDING
    if (session.role === 'CUSTOMER') {
      if (booking.customer_id !== session.id) {
        return NextResponse.json({ error: 'Không có quyền thực hiện.' }, { status: 403 });
      }
      if (status !== 'CANCELLED') {
        return NextResponse.json({ error: 'Khách hàng chỉ có thể yêu cầu hủy lịch đặt.' }, { status: 400 });
      }
      if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
        return NextResponse.json({ error: 'Không thể hủy lịch đặt sân ở trạng thái này.' }, { status: 400 });
      }
    }

    // Staff/Admin có quyền cập nhật mọi trạng thái
    if (session.role === 'ADMIN' || session.role === 'STAFF') {
      if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
        return NextResponse.json({ error: 'Trạng thái không hợp lệ.' }, { status: 400 });
      }
    }

    const updateData = {
      status,
      staff_id: (session.role === 'ADMIN' || session.role === 'STAFF') ? session.id : booking.staff_id,
    };

    const { data: updatedBooking, error: updateErr } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select('*, pitch:pitches(*), customer:profiles!bookings_customer_id_fkey(*)')
      .single();

    if (updateErr) throw updateErr;

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
      message: 'Cập nhật trạng thái đặt sân thành công.',
      booking: formattedUpdatedBooking,
    });
  } catch (error) {
    console.error('Update Booking API Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

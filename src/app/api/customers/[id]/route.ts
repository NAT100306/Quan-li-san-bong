import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser, hasRole } from '@/lib/auth-api';

// GET: Chi tiết lịch sử đặt sân của một khách hàng (Chỉ ADMIN, STAFF)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getAuthenticatedUser(req);
    if (!session || !hasRole(session, ['ADMIN', 'STAFF'])) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const { data: customer, error: custErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, phone, created_at')
      .eq('id', id)
      .eq('role', 'CUSTOMER')
      .single();

    if (custErr || !customer) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng.' }, { status: 404 });
    }

    const { data: bookings, error: bookErr } = await supabaseAdmin
      .from('bookings')
      .select('*, pitch:pitches(*), payments(*)')
      .eq('customer_id', id)
      .order('start_time', { ascending: false });

    if (bookErr) throw bookErr;

    // Chuyển đổi snake_case sang camelCase để tương thích frontend đang dùng chuẩn Prisma
    const formattedBookings = (bookings || []).map((b: any) => ({
      ...b,
      pitchId: b.pitch_id,
      customerId: b.customer_id,
      staffId: b.staff_id,
      startTime: b.start_time,
      endTime: b.end_time,
      totalPrice: b.total_price,
      checkInCode: b.check_in_code,
      checkInStatus: b.check_in_status,
      checkInAt: b.check_in_at,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
      pitch: b.pitch ? {
        ...b.pitch,
        pricePerHour: b.pitch.price_per_hour,
        createdAt: b.pitch.created_at,
        updatedAt: b.pitch.updated_at,
      } : null,
      payments: (b.payments || []).map((p: any) => ({
        ...p,
        bookingId: p.booking_id,
        paymentMethod: p.payment_method,
        transactionId: p.transaction_id,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))
    }));

    return NextResponse.json({
      customer: {
        ...customer,
        createdAt: customer.created_at
      },
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error('Customer Detail API Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

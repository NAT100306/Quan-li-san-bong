import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser, hasRole } from '@/lib/auth-api';

export const dynamic = 'force-dynamic';

// GET: Lấy danh sách giao dịch thanh toán
export async function GET(req: Request) {
  try {
    const session = getAuthenticatedUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('payments')
      .select('*, booking:bookings(*, pitch:pitches(*), customer:profiles!bookings_customer_id_fkey(id, name, email, phone))')
      .order('created_at', { ascending: false });
    
    // Nếu là CUSTOMER, lọc thanh toán qua booking của họ (do PostgREST chưa hỗ trợ filter qua relation dễ dàng như GraphQL)
    // Sẽ lọc trên memory nếu cần, nhưng PostgREST hỗ trợ: `booking!inner(customer_id.eq.xxx)`
    if (session.role === 'CUSTOMER') {
      query = supabaseAdmin
        .from('payments')
        .select('*, booking:bookings!inner(*, pitch:pitches(*), customer:profiles!bookings_customer_id_fkey(id, name, email, phone))')
        .eq('booking.customer_id', session.id)
        .order('created_at', { ascending: false });
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payments, error } = await query;
    if (error) throw error;

    const formattedPayments = (payments || []).map((p: any) => ({
      ...p,
      bookingId: p.booking_id,
      paymentMethod: p.payment_method,
      transactionId: p.transaction_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      booking: p.booking ? {
        ...p.booking,
        pitchId: p.booking.pitch_id,
        customerId: p.booking.customer_id,
        staffId: p.booking.staff_id,
        startTime: p.booking.start_time,
        endTime: p.booking.end_time,
        totalPrice: p.booking.total_price,
        checkInCode: p.booking.check_in_code,
        checkInStatus: p.booking.check_in_status,
        checkInAt: p.booking.check_in_at,
        createdAt: p.booking.created_at,
        updatedAt: p.booking.updated_at,
      } : null,
    }));

    return NextResponse.json({ payments: formattedPayments });
  } catch (error) {
    console.error('Get Payments Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

// POST: Tạo thanh toán mới cho Booking (Ví dụ Khách hàng bấm thanh toán online, hoặc Nhân viên tạo thanh toán thủ công)
export async function POST(req: Request) {
  try {
    const session = getAuthenticatedUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { bookingId, amount, paymentMethod, transactionId } = await req.json();

    if (!bookingId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ: bookingId, amount, paymentMethod.' },
        { status: 400 }
      );
    }

    const { data: booking, error: bookErr } = await supabaseAdmin.from('bookings').select('*').eq('id', bookingId).single();
    if (bookErr || !booking) {
      return NextResponse.json({ error: 'Booking không tồn tại.' }, { status: 404 });
    }

    // Khách hàng bình thường chỉ được tự thanh toán cho booking của mình
    if (session.role === 'CUSTOMER' && booking.customer_id !== session.id) {
      return NextResponse.json({ error: 'Không có quyền thực hiện giao dịch này.' }, { status: 403 });
    }

    const paymentStatus = paymentMethod === 'CASH' ? 'PENDING' : 'COMPLETED';

    // Tạo bản ghi thanh toán
    const { data: payment, error: payErr } = await supabaseAdmin
      .from('payments')
      .insert([{
        booking_id: bookingId,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        status: paymentStatus,
        transaction_id: transactionId,
      }])
      .select()
      .single();

    if (payErr) throw payErr;

    // Nếu thanh toán online hoàn tất thì cập nhật trạng thái Booking luôn
    if (payment.status === 'COMPLETED') {
      await supabaseAdmin.from('bookings').update({ status: 'CONFIRMED' }).eq('id', bookingId);
    }

    return NextResponse.json({
      message: 'Tạo giao dịch thanh toán thành công.',
      payment: {
        ...payment,
        bookingId: payment.booking_id,
        paymentMethod: payment.payment_method,
        transactionId: payment.transaction_id,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
      },
    });
  } catch (error) {
    console.error('Create Payment Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

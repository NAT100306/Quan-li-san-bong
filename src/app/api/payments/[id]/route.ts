import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser, hasRole } from '@/lib/auth-api';

// PUT: Cập nhật trạng thái giao dịch thanh toán (Chỉ ADMIN, STAFF)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getAuthenticatedUser(req);
    if (!session || !hasRole(session, ['ADMIN', 'STAFF'])) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const { status, transactionId } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'Vui lòng cung cấp trạng thái mới.' }, { status: 400 });
    }

    if (!['PENDING', 'COMPLETED', 'FAILED'].includes(status)) {
      return NextResponse.json({ error: 'Trạng thái không hợp lệ.' }, { status: 400 });
    }

    const { data: payment, error: getErr } = await supabaseAdmin
      .from('payments')
      .select('*, booking:bookings(*)')
      .eq('id', id)
      .single();

    if (getErr || !payment) {
      return NextResponse.json({ error: 'Giao dịch không tồn tại.' }, { status: 404 });
    }

    const { data: updatedPayment, error: updateErr } = await supabaseAdmin
      .from('payments')
      .update({
        status,
        transaction_id: transactionId !== undefined ? transactionId : payment.transaction_id,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Nếu cập nhật thanh toán thành COMPLETED, cập nhật trạng thái Booking thành CONFIRMED
    if (status === 'COMPLETED' && payment.booking.status === 'PENDING') {
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'CONFIRMED' })
        .eq('id', payment.booking_id);
    }

    return NextResponse.json({
      message: 'Cập nhật trạng thái thanh toán thành công.',
      payment: {
        ...updatedPayment,
        bookingId: updatedPayment.booking_id,
        paymentMethod: updatedPayment.payment_method,
        transactionId: updatedPayment.transaction_id,
        createdAt: updatedPayment.created_at,
        updatedAt: updatedPayment.updated_at,
      },
    });
  } catch (error) {
    console.error('Update Payment Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

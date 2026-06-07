import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser, hasRole } from '@/lib/auth-api';
import { sendEmail, getBookingEmailTemplate } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// GET: Lấy danh sách booking
export async function GET(req: Request) {
  try {
    const session = getAuthenticatedUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const pitchId = searchParams.get('pitchId');

    let query = supabaseAdmin
      .from('bookings')
      .select('*, pitch:pitches(*), customer:profiles!bookings_customer_id_fkey(id, name, email, phone), payments(*)')
      .order('start_time', { ascending: false });

    if (session.role === 'CUSTOMER') {
      query = query.eq('customer_id', session.id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (pitchId) {
      query = query.eq('pitch_id', pitchId);
    }

    const { data: bookings, error } = await query;
    if (error) throw error;

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

    return NextResponse.json({ bookings: formattedBookings });
  } catch (error) {
    console.error('Get Bookings Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

// POST: Đặt sân bóng
export async function POST(req: Request) {
  try {
    const session = getAuthenticatedUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { pitchId, startTime, endTime, customerId } = await req.json();

    if (!pitchId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ: pitchId, startTime, endTime.' },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json({ error: 'Thời gian bắt đầu phải trước thời gian kết thúc.' }, { status: 400 });
    }

    if (start < new Date()) {
      return NextResponse.json({ error: 'Không thể đặt sân trong quá khứ.' }, { status: 400 });
    }

    let targetCustomerId = session.id;
    if (session.role === 'ADMIN' || session.role === 'STAFF') {
      if (customerId) {
        targetCustomerId = customerId;
      }
    }

    const { data: pitch, error: pitchErr } = await supabaseAdmin.from('pitches').select('*').eq('id', pitchId).single();
    if (pitchErr || !pitch) {
      return NextResponse.json({ error: 'Sân bóng không tồn tại.' }, { status: 404 });
    }

    if (pitch.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Sân bóng này hiện không hoạt động hoặc đang bảo trì.' }, { status: 400 });
    }

    const { data: conflictBooking, error: conflictErr } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('pitch_id', pitchId)
      .in('status', ['PENDING', 'CONFIRMED'])
      .lt('start_time', end.toISOString())
      .gt('end_time', start.toISOString())
      .limit(1);

    if (conflictBooking && conflictBooking.length > 0) {
      return NextResponse.json(
        { error: 'Khung giờ này đã có người đặt sân. Vui lòng chọn khung giờ khác.' },
        { status: 400 }
      );
    }

    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalPrice = Number(pitch.price_per_hour) * durationHours;

    const { data: customer } = await supabaseAdmin.from('profiles').select('*').eq('id', targetCustomerId).single();
    if (!customer) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin khách hàng.' }, { status: 404 });
    }

    const checkInCode = crypto.randomUUID();

    const insertData = {
      pitch_id: pitchId,
      customer_id: targetCustomerId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: session.role === 'CUSTOMER' ? 'PENDING' : 'CONFIRMED',
      total_price: totalPrice,
      check_in_code: checkInCode,
    };

    const { data: booking, error: bookErr } = await supabaseAdmin
      .from('bookings')
      .insert([insertData])
      .select('*, pitch:pitches(*)')
      .single();

    if (bookErr) throw bookErr;

    if (session.role === 'ADMIN' || session.role === 'STAFF') {
      await supabaseAdmin.from('payments').insert([{
        booking_id: booking.id,
        amount: totalPrice,
        payment_method: 'CASH',
        status: 'PENDING',
      }]);
    }

    if (customer.email) {
      const formattedStart = start.toLocaleString('vi-VN');
      const formattedEnd = end.toLocaleString('vi-VN');
      const emailHtml = getBookingEmailTemplate(
        customer.name,
        pitch.name,
        formattedStart,
        formattedEnd,
        totalPrice.toLocaleString('vi-VN'),
        booking.check_in_code
      );

      await sendEmail({
        to: customer.email,
        subject: `[Quản Lý Sân Bóng] Đặt Sân Thành Công - ${pitch.name}`,
        html: emailHtml,
      });
    }

    return NextResponse.json({
      message: 'Đặt sân bóng thành công.',
      booking: {
        ...booking,
        pitchId: booking.pitch_id,
        customerId: booking.customer_id,
        startTime: booking.start_time,
        endTime: booking.end_time,
        totalPrice: booking.total_price,
        checkInCode: booking.check_in_code,
        checkInStatus: booking.check_in_status,
        checkInAt: booking.check_in_at,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
      },
    });
  } catch (error) {
    console.error('Create Booking Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi đặt sân.' }, { status: 500 });
  }
}

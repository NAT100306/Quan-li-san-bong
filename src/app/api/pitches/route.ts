import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser, hasRole } from '@/lib/auth-api';

export const dynamic = 'force-dynamic';

// GET: Lấy toàn bộ danh sách sân bóng (Khách hàng / Admin / Staff đều xem được)
export async function GET() {
  try {
    const { data: pitches, error } = await supabaseAdmin
      .from('pitches')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    // Chuyển format price_per_hour sang pricePerHour cho frontend
    const formattedPitches = pitches.map((p: any) => ({
      ...p,
      pricePerHour: p.price_per_hour,
    }));

    return NextResponse.json({ pitches: formattedPitches });
  } catch (error) {
    console.error('Pitches API Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

// POST: Tạo sân bóng mới (Chỉ ADMIN, STAFF)
export async function POST(req: Request) {
  try {
    const session = getAuthenticatedUser(req);
    if (!session || !hasRole(session, ['ADMIN', 'STAFF'])) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const { name, type, pricePerHour, status, description } = await req.json();

    if (!name || !type || pricePerHour === undefined) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ: name, type, pricePerHour.' },
        { status: 400 }
      );
    }

    if (type !== 'MINI_5' && type !== 'MINI_7' && type !== 'STANDARD_11') {
      return NextResponse.json({ error: 'Loại sân không hợp lệ.' }, { status: 400 });
    }

    const { data: pitch, error } = await supabaseAdmin
      .from('pitches')
      .insert([{
        name,
        type,
        price_per_hour: parseFloat(pricePerHour),
        status: status || 'ACTIVE',
        description,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: 'Tạo sân bóng thành công.',
      pitch: { ...pitch, pricePerHour: pitch.price_per_hour },
    });
  } catch (error) {
    console.error('Pitches API Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

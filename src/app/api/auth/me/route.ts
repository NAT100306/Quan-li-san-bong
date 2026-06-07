import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.' },
        { status: 401 }
      );
    }

    const session = verifyToken(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Phiên làm việc không hợp lệ.' },
        { status: 401 }
      );
    }

    // Lấy profile từ Supabase
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, role, phone, created_at')
      .eq('id', session.id)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Người dùng không tồn tại.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: profile });
  } catch (error) {
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra trên hệ thống.' },
      { status: 500 }
    );
  }
}

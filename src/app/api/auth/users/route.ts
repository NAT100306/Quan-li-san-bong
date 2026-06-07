import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser, hasRole } from '@/lib/auth-api';

// GET: Lấy danh sách toàn bộ người dùng (Chỉ ADMIN)
export async function GET(req: Request) {
  try {
    const session = getAuthenticatedUser(req);
    if (!session || !hasRole(session, ['ADMIN'])) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, phone, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

// POST: Tạo tài khoản STAFF hoặc ADMIN mới (Chỉ ADMIN)
export async function POST(req: Request) {
  try {
    const session = getAuthenticatedUser(req);
    if (!session || !hasRole(session, ['ADMIN'])) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const { email, password, name, phone, role } = await req.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ: email, password, name, role.' },
        { status: 400 }
      );
    }

    if (role !== 'ADMIN' && role !== 'STAFF' && role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Vai trò không hợp lệ.' }, { status: 400 });
    }

    // Tạo user trong Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      if (authError?.message?.includes('already')) {
        return NextResponse.json({ error: 'Email này đã tồn tại.' }, { status: 400 });
      }
      return NextResponse.json({ error: authError?.message || 'Không thể tạo tài khoản.' }, { status: 400 });
    }

    // Tạo profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: authData.user.id, email, name, phone: phone || null, role })
      .select('id, email, name, phone, role, created_at')
      .single();

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Không thể tạo hồ sơ.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Tạo người dùng thành công.', user: profile });
  } catch (error) {
    console.error('Users Admin API Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

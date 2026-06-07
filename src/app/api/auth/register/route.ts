import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const { email, password, name, phone } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ thông tin: email, mật khẩu và tên.' },
        { status: 400 }
      );
    }

    // Tạo tài khoản qua Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Tự động xác nhận email (không cần email verification)
    });

    if (authError || !authData.user) {
      if (authError?.message?.includes('already registered') || authError?.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Email này đã được sử dụng.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: authError?.message || 'Không thể tạo tài khoản.' },
        { status: 400 }
      );
    }

    // Tạo profile trong bảng profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        name,
        phone: phone || null,
        role: 'CUSTOMER',
      })
      .select()
      .single();

    if (profileError || !profile) {
      // Rollback: xóa user vừa tạo nếu insert profile thất bại
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Không thể tạo hồ sơ người dùng.' },
        { status: 500 }
      );
    }

    // Tạo JWT token
    const token = signToken({
      id: profile.id,
      email: profile.email,
      role: profile.role,
      name: profile.name,
    });

    const response = NextResponse.json({
      message: 'Đăng ký tài khoản thành công.',
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
      },
    });

    // Set cookie HttpOnly
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 ngày
    });

    return response;
  } catch (error: any) {
    console.error('Register API Error:', error);
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra trên hệ thống.' },
      { status: 500 }
    );
  }
}

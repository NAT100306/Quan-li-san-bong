import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp email và mật khẩu.' },
        { status: 400 }
      );
    }

    // Xác thực qua Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng.' },
        { status: 401 }
      );
    }

    // Lấy profile (role, name, phone) từ bảng profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin người dùng.' },
        { status: 404 }
      );
    }

    // Tạo JWT token để middleware nhận diện
    const token = signToken({
      id: profile.id,
      email: profile.email,
      role: profile.role,
      name: profile.name,
    });

    const response = NextResponse.json({
      message: 'Đăng nhập thành công.',
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
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra trên hệ thống.' },
      { status: 500 }
    );
  }
}

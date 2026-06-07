import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({
      message: 'Đăng xuất thành công.',
    });

    // Xóa cookie token bằng cách set maxAge = 0
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra trên hệ thống.' },
      { status: 500 }
    );
  }
}

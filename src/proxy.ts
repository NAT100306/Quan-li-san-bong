import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Giải mã payload JWT mà không cần verify chữ ký (chạy được trên Edge Runtime của Middleware)
function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const user = token ? decodeJwtPayload(token) : null;

  // 1. Nếu đang vào các trang yêu cầu đăng nhập quản trị (/admin)
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
      // Khách hàng không có quyền truy cập trang admin
      return NextResponse.redirect(new URL('/customer/bookings', request.url));
    }
  }

  // 2. Nếu đang vào các trang yêu cầu đăng nhập khách hàng (/customer)
  if (pathname.startsWith('/customer')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Nếu đã đăng nhập mà cố tình vào trang login hoặc register
  if (pathname === '/login' || pathname === '/register') {
    if (user) {
      if (user.role === 'ADMIN' || user.role === 'STAFF') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/customer/bookings', request.url));
      }
    }
  }

  return NextResponse.next();
}

// Cấu hình các route sẽ áp dụng middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/customer/:path*',
    '/login',
    '/register',
  ],
};

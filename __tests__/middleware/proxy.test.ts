/**
 * Unit tests for proxy.ts middleware logic
 *
 * Vì proxy.ts dùng NextRequest/NextResponse (Edge Runtime),
 * ta mock các API cần thiết để test logic route protection.
 */

// ─── Mock NextResponse ─────────────────────────────────────────────────────
const mockRedirect = jest.fn((url: URL) => ({ type: 'redirect', url: url.toString() }));
const mockNext = jest.fn(() => ({ type: 'next' }));

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => mockRedirect(url),
    next: () => mockNext(),
  },
}));

// ─── Helper để tạo mock NextRequest ───────────────────────────────────────
function createMockRequest(pathname: string, token?: string) {
  const url = `http://localhost:3000${pathname}`;
  const cookieMap = new Map<string, { value: string }>();
  if (token) {
    cookieMap.set('token', { value: token });
  }

  return {
    nextUrl: {
      pathname,
      clone: () => new URL(url),
    },
    url,
    cookies: {
      get: (name: string) => cookieMap.get(name),
    },
  } as any;
}

// ─── JWT payload encoder (base64url) ─────────────────────────────────────
function encodeJwtPayload(payload: object): string {
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `header.${base64}.signature`;
}

const adminToken = encodeJwtPayload({ id: '1', role: 'ADMIN', email: 'admin@test.com' });
const staffToken = encodeJwtPayload({ id: '2', role: 'STAFF', email: 'staff@test.com' });
const customerToken = encodeJwtPayload({ id: '3', role: 'CUSTOMER', email: 'cust@test.com' });

// ─── Import AFTER mocking ──────────────────────────────────────────────────
import { proxy } from '@/proxy';

describe('proxy() — Middleware Route Guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── /admin routes ────────────────────────────────────────────────────────
  describe('Bảo vệ route /admin', () => {
    it('nên redirect về /login khi chưa đăng nhập vào /admin', () => {
      const req = createMockRequest('/admin');
      proxy(req);
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl: string = mockRedirect.mock.calls[0][0].toString();
      expect(redirectUrl).toContain('/login');
    });

    it('nên cho phép ADMIN vào /admin', () => {
      const req = createMockRequest('/admin', adminToken);
      proxy(req);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('nên cho phép STAFF vào /admin', () => {
      const req = createMockRequest('/admin', staffToken);
      proxy(req);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('nên redirect CUSTOMER khỏi /admin về /customer/bookings', () => {
      const req = createMockRequest('/admin', customerToken);
      proxy(req);
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl: string = mockRedirect.mock.calls[0][0].toString();
      expect(redirectUrl).toContain('/customer/bookings');
    });

    it('nên redirect về /login khi token không hợp lệ vào /admin', () => {
      const req = createMockRequest('/admin', 'bad.token');
      proxy(req);
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl: string = mockRedirect.mock.calls[0][0].toString();
      expect(redirectUrl).toContain('/login');
    });
  });

  // ─── /customer routes ─────────────────────────────────────────────────────
  describe('Bảo vệ route /customer', () => {
    it('nên redirect về /login khi chưa đăng nhập vào /customer/bookings', () => {
      const req = createMockRequest('/customer/bookings');
      proxy(req);
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl: string = mockRedirect.mock.calls[0][0].toString();
      expect(redirectUrl).toContain('/login');
    });

    it('nên cho phép CUSTOMER vào /customer/bookings', () => {
      const req = createMockRequest('/customer/bookings', customerToken);
      proxy(req);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('nên cho phép ADMIN vào /customer (không chặn)', () => {
      const req = createMockRequest('/customer/bookings', adminToken);
      proxy(req);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ─── /login và /register ─────────────────────────────────────────────────
  describe('Redirect người dùng đã đăng nhập', () => {
    it('nên redirect ADMIN đã đăng nhập khỏi /login về /admin', () => {
      const req = createMockRequest('/login', adminToken);
      proxy(req);
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl: string = mockRedirect.mock.calls[0][0].toString();
      expect(redirectUrl).toContain('/admin');
    });

    it('nên redirect CUSTOMER đã đăng nhập khỏi /login về /customer/bookings', () => {
      const req = createMockRequest('/login', customerToken);
      proxy(req);
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl: string = mockRedirect.mock.calls[0][0].toString();
      expect(redirectUrl).toContain('/customer/bookings');
    });

    it('nên cho phép người chưa đăng nhập vào /login', () => {
      const req = createMockRequest('/login');
      proxy(req);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('nên redirect STAFF đã đăng nhập khỏi /register về /admin', () => {
      const req = createMockRequest('/register', staffToken);
      proxy(req);
      expect(mockRedirect).toHaveBeenCalledTimes(1);
      const redirectUrl: string = mockRedirect.mock.calls[0][0].toString();
      expect(redirectUrl).toContain('/admin');
    });
  });
});

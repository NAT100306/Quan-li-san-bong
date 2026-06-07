import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser, hasRole } from '@/lib/auth-api';

export const dynamic = 'force-dynamic';

// GET: Danh sách khách hàng kèm số lần đặt sân và chi tiêu (Chỉ ADMIN, STAFF)
export async function GET(req: Request) {
  try {
    const session = getAuthenticatedUser(req);
    if (!session || !hasRole(session, ['ADMIN', 'STAFF'])) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const { data: customers, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, phone, created_at, bookings!bookings_customer_id_fkey(id, total_price, status)')
      .eq('role', 'CUSTOMER')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Định dạng dữ liệu thống kê
    const formattedCustomers = customers.map((c: any) => {
      const bookings = c.bookings || [];
      const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED');
      const totalBookings = bookings.length;
      const totalSpent = completedBookings.reduce((sum: number, b: any) => sum + Number(b.total_price || 0), 0);

      return {
        id: c.id,
        email: c.email,
        name: c.name,
        phone: c.phone,
        createdAt: c.created_at,
        totalBookings,
        completedBookings: completedBookings.length,
        totalSpent,
      };
    });

    return NextResponse.json({ customers: formattedCustomers });
  } catch (error) {
    console.error('Customers API Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

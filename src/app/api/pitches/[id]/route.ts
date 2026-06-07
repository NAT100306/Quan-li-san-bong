import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser, hasRole } from '@/lib/auth-api';

// GET: Lấy chi tiết sân bóng
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: pitch, error } = await supabaseAdmin
      .from('pitches')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !pitch) {
      return NextResponse.json({ error: 'Không tìm thấy sân bóng.' }, { status: 404 });
    }

    return NextResponse.json({ pitch: { ...pitch, pricePerHour: pitch.price_per_hour } });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

// PUT: Cập nhật sân bóng (Admin, Staff)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getAuthenticatedUser(req);
    if (!session || !hasRole(session, ['ADMIN', 'STAFF'])) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const { name, type, pricePerHour, status, description } = await req.json();

    const { data: pitch, error: getErr } = await supabaseAdmin.from('pitches').select('*').eq('id', id).single();
    if (getErr || !pitch) {
      return NextResponse.json({ error: 'Không tìm thấy sân bóng.' }, { status: 404 });
    }

    const updateData: any = {
      name: name !== undefined ? name : pitch.name,
      type: type !== undefined ? type : pitch.type,
      status: status !== undefined ? status : pitch.status,
      description: description !== undefined ? description : pitch.description,
    };
    
    if (pricePerHour !== undefined) {
      updateData.price_per_hour = parseFloat(pricePerHour);
    }

    const { data: updatedPitch, error: updateErr } = await supabaseAdmin
      .from('pitches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({
      message: 'Cập nhật thông tin sân bóng thành công.',
      pitch: { ...updatedPitch, pricePerHour: updatedPitch.price_per_hour },
    });
  } catch (error) {
    console.error('Update Pitch API Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

// DELETE: Xóa sân bóng (Chỉ ADMIN)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getAuthenticatedUser(req);
    if (!session || !hasRole(session, ['ADMIN'])) {
      return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
    }

    const { data: pitch, error: getErr } = await supabaseAdmin.from('pitches').select('id').eq('id', id).single();
    if (getErr || !pitch) {
      return NextResponse.json({ error: 'Không tìm thấy sân bóng.' }, { status: 404 });
    }

    const { error: delErr } = await supabaseAdmin.from('pitches').delete().eq('id', id);
    if (delErr) throw delErr;

    return NextResponse.json({
      message: 'Xóa sân bóng thành công.',
    });
  } catch (error) {
    console.error('Delete Pitch API Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

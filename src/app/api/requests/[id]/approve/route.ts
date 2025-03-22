import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CarRequest from '@/models/CarRequest';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectDB();
    
    const body = await req.json();
    const { approver_id } = body;

    if (!approver_id) {
      return NextResponse.json({ error: "ไม่พบข้อมูล approver_id" }, { status: 400 });
    }

    const request = await CarRequest.findByIdAndUpdate(
      id,
      {
        approver_id,
        status: 'APPROVED'
      },
      { new: true }
    ).populate('user_id', 'firstName lastName department position');

    if (!request) {
      return NextResponse.json({ error: "ไม่พบคำขอ" }, { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error: any) {
    console.log('Approve Error:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการอนุมัติคำขอ' },
      { status: 500 }
    );
  }
} 
// @ts-nocheck
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CarRequest from '@/models/CarRequest';
import User from '@/models/User';

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

    const approver = await User.findById(approver_id);
    if (!approver) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้อนุมัติ" }, { status: 404 });
    }

    const request = await CarRequest.findByIdAndUpdate(
      id,
      {
        approver_id,
        status: 'REJECTED'
      },
      { new: true }
    )
    .populate('user_id', 'firstName lastName department position')
    .populate('approver_id', 'firstName lastName department position');

    if (!request) {
      return NextResponse.json({ error: "ไม่พบคำขอ" }, { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error: any) {
    console.log('Reject Error:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ' },
      { status: 500 }
    );
  }
} 
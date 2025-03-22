import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CarRequest from '@/models/CarRequest';
import Car from '@/models/Car';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { car_id, driver_id } = await req.json();
    
    // ดึง admin_id จาก token
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token!, JWT_SECRET) as { userId: string };
    const admin_id = decoded.userId;

    // อัพเดตสถานะรถ

    // อัพเดตคำขอพร้อมเพิ่ม admin_id
    const request = await CarRequest.findByIdAndUpdate(
      params.id,
      {
        car_id,
        driver_id,
        admin_id,
        status: 'ASSIGNED'
      },
      { new: true }
    ).populate('user_id', 'firstName lastName department position')
      .populate('admin_id', 'firstName lastName department position')
      .populate('driver_id', 'firstName lastName department position')
      .populate('car_id', 'brand model licensePlate type');

    if (!request) {
      return NextResponse.json({ error: "ไม่พบคำขอ" }, { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 
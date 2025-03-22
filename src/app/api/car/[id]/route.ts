// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Car from '@/models/Car';

// Update car
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const car = await Car.findByIdAndUpdate(params.id, body, { new: true });
    
    if (!car) {
      return NextResponse.json({ error: "ไม่พบข้อมูลรถ" }, { status: 404 });
    }

    return NextResponse.json(car);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// Delete car
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    await connectDB();
    const car = await Car.findByIdAndDelete(params.id);
    
    if (!car) {
      return NextResponse.json({ error: "ไม่พบข้อมูลรถ" }, { status: 404 });
    }

    return NextResponse.json({ message: "ลบข้อมูลสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
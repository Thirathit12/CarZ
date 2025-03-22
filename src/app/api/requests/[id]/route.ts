import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CarRequest from '@/models/CarRequest';
import User from '@/models/User';
import Car from '@/models/Car';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await connectDB();
    
    const request = await CarRequest.findById(params.id)
      .populate({
        path: 'user_id',
        model: User,
        select: 'firstName lastName gender birthDate email phoneNumber position department branch role'
      })
      .populate({
        path: 'driver_id',
        model: User,
        select: 'firstName lastName gender birthDate email phoneNumber position department branch role'
      })
      .populate({
        path: 'car_id',
        model: Car,
        select: 'brand model licensePlate capacity status type notes'
      })
      .populate({
        path: 'approver_id',
        model: User,
        select: 'firstName lastName gender birthDate email phoneNumber position department branch role'
      });

    if (!request) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลการจองรถ" },
        { status: 404 }
      );
    }

    // แปลงข้อมูลและจัดการกรณีที่ข้อมูลเป็น null
    const safeRequest = request.toObject();
    
    if (!safeRequest.user_id) {
      safeRequest.user_id = {
        firstName: 'ไม่พบข้อมูล',
        lastName: 'ผู้ใช้',
        department: '-',
        position: '-'
      };
    }

    if (!safeRequest.driver_id) {
      safeRequest.driver_id = null;
    }

    if (!safeRequest.car_id) {
      safeRequest.car_id = null;
    }

    if (!safeRequest.approver_id) {
      safeRequest.approver_id = null;
    }

    return NextResponse.json(safeRequest);
    
  } catch (error: any) {
    console.log('Error:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
} 
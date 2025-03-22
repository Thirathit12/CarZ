// @ts-nocheck
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CarRequest from '@/models/CarRequest';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import Car from '@/models/Car';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await connectDB();
    
    // ดึงข้อมูล requests พร้อมข้อมูล user
    const requests = await CarRequest.find()
      .populate({
        path: 'user_id',
        model: User,
        select: 'firstName lastName department position phoneNumber',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'admin_id',
        model: User,
        select: 'firstName lastName department position',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'driver_id',
        model: User,
        select: 'firstName lastName department position phoneNumber ',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'car_id',
        model: Car,
        select: 'brand model licensePlate type',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'approver_id',
        model: User,
        select: 'firstName lastName department position',
        options: { strictPopulate: false }
      })
      .sort({ created_at: -1 });

    // ตรวจสอบและแปลงข้อมูลก่อนส่งกลับ
    const safeRequests = requests.map(request => {
      const doc = request.toObject();
      if (!doc.user_id) {
        doc.user_id = {
          firstName: 'ไม่พบข้อมูล',
          lastName: 'ผู้ใช้',
          department: '-',
          position: '-',
          phoneNumber: '-'
        };
      }
      if (!doc.admin_id) {
        doc.admin_id = {
          firstName: '-',
          lastName: '',
          department: '-',
          position: '-'
        };
      }
      if (!doc.driver_id) {
        doc.driver_id = null;
      }
      if (!doc.car_id) {
        doc.car_id = null;
      }
      if (!doc.approver_id) {
        doc.approver_id = null;
      }
      return doc;
    });

    return NextResponse.json(safeRequests);
  } catch (error: any) {
    console.log('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 
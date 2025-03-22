import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import jwt from 'jsonwebtoken';
import DriverLicense from '@/models/DriverLicense';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (!['admin', 'super_admin', 'approver', 'user', 'driver'].includes(decoded.role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();
    
    // ดึงเฉพาะข้อมูล driver
    const drivers = await User.find({ role: 'driver' }).select({
      password: 0,
      __v: 0,
    }).lean();

    // ดึงข้อมูลใบขับขี่
    const driverLicenses = await DriverLicense.find({
      userId: { $in: drivers.map(d => d._id) }
    }).lean();

    // รวมข้อมูลใบขับขี่เข้ากับข้อมูล driver
    const driversWithLicense = drivers.map(driver => ({
      ...driver,
      driverLicenseExpiry: driverLicenses.find(
        d => d.userId.toString() === driver._id.toString()
      )?.expiryDate
    }));

    return NextResponse.json(driversWithLicense);
  } catch (error) {
    console.log("GET drivers error:", error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
} 
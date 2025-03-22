import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET - ดึงข้อมูลผู้ใช้ปัจจุบัน
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

// PUT - อัพเดทข้อมูลผู้ใช้ปัจจุบัน
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const data = await req.json();
    
    // ป้องกันการแก้ไขบทบาท
    const { role, ...updateData } = data;

    await connectDB();

    // จัดการกับรหัสผ่านแบบเดียวกับ user-manage
    if (updateData.password && updateData.password.trim() !== '') {
      try {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      } catch (error) {
        console.log('Password hashing error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเข้ารหัสรหัสผ่าน' }, { status: 500 });
      }
    } else {
      // ถ้าไม่มีการส่งรหัสผ่านมาหรือเป็นค่าว่าง ให้ลบออก
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.log('Update error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
} 
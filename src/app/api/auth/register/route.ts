import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await connectDB();
    
    const {
      firstName,
      lastName,
      gender,
      birthDate,
      email,
      phoneNumber,
      position,
      department,
      password
    } = await req.json();

    // ตรวจสอบว่ามีผู้ใช้นี้อยู่แล้วหรือไม่
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'อีเมล์นี้ถูกใช้งานแล้ว' },
        { status: 400 }
      );
    }

    // สร้างผู้ใช้ใหม่พร้อมกำหนด role เป็น user
    const user = await User.create({
      firstName,
      lastName,
      gender,
      birthDate: new Date(birthDate),
      email,
      phoneNumber,
      position,
      department,
      password,
      role: 'user' // กำหนดค่าเริ่มต้นเป็น user
      // role: 'super_admin' // กำหนดค่าเริ่มต้นเป็น super_admin
    });

    return NextResponse.json(
      { 
        message: 'ลงทะเบียนสำเร็จ',
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการลงทะเบียน' },
      { status: 500 }
    );
  }
} 
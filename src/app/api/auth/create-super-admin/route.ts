import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await connectDB();

    // ตรวจสอบ secret key จาก environment variable
    const { secretKey } = await req.json();
    if (secretKey !== process.env.SUPER_ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์ในการสร้าง Super Admin' },
        { status: 403 }
      );
    }

    // ตรวจสอบว่ามี super admin อยู่แล้วหรือไม่
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      return NextResponse.json(
        { error: 'มี Super Admin อยู่แล้วในระบบ' },
        { status: 400 }
      );
    }

    // สร้าง super admin - ไม่ต้องเข้ารหัสที่นี่ เพราะ model จะจัดการให้
    const superAdminData = {
      firstName: 'Super',
      lastName: 'Admin',
      gender: 'ชาย',
      birthDate: new Date(),
      email: 'superadmin@mail.com',
      phoneNumber: '0000000000',
      position: 'Super Administrator',
      department: 'System Administration',
      password: '123456', // รหัสผ่านปกติ model จะเข้ารหัสให้เอง
      role: 'super_admin'
    };

    // สร้าง super admin
    const superAdmin = await User.create(superAdminData);
    console.log('Created super admin:', {
      email: superAdmin.email,
      role: superAdmin.role
    });

    return NextResponse.json(
      {
        message: 'สร้าง Super Admin สำเร็จ',
        user: {
          email: superAdmin.email,
          role: superAdmin.role
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.log('Create super admin error:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการสร้าง Super Admin' },
      { status: 500 }
    );
  }
} 
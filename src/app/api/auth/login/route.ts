import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    const user = await User.findOne({ email });
    
    // เพิ่ม log เพื่อ debug
    console.log('Login attempt:', {
      attemptedEmail: email,
      userFound: !!user,
      userRole: user?.role
    });

    if (!user) {
      return NextResponse.json(
        { error: 'อีเมล์หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const isPasswordValid = await user.comparePassword(password);
    
    // เพิ่ม log เพื่อ debug
    console.log('Password check:', {
      isPasswordValid,
      userEmail: user.email
    });

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'อีเมล์หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // เพิ่มข้อมูลใน token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        position: user.position
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return NextResponse.json({ token });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
} 
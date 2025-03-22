import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CarRequest from '@/models/CarRequest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await connectDB();
    
    const data = await req.json();
    
    const carRequest = await CarRequest.create({
      ...data,
      user_id: decoded.userId,
      status: 'PENDING'
    });

    return NextResponse.json(carRequest, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

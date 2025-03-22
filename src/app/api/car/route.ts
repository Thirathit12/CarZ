// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Car from '@/models/Car';
import jwt from 'jsonwebtoken';
import CarRequest from '@/models/CarRequest';
import mongoose from 'mongoose';
import { userSchema } from '@/models/User';

const User = mongoose.models.User || mongoose.model('User', userSchema);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Get all cars
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    await connectDB();

    const includeDriver = req.nextUrl.searchParams.get('includeDriver') === 'true';

    let cars = await Car.find({});

    if (includeDriver) {
      // หารถที่กำลังถูกใช้งานอยู่
      const activeRequests = await CarRequest.find({
        status: 'APPROVED',
        start_datetime: { $lte: new Date() },
        end_datetime: { $gte: new Date() }
      }).populate('driver_id');

      // แมปข้อมูลคนขับเข้ากับรถ
      const carsWithDrivers = cars.map(car => {
        const carObj = car.toObject();
        const activeRequest = activeRequests.find(
          req => req.car_id.toString() === car._id.toString()
        );

        if (activeRequest && activeRequest.driver_id) {
          return {
            ...carObj,
            currentDriver: {
              firstName: activeRequest.driver_id.firstName,
              lastName: activeRequest.driver_id.lastName,
              position: activeRequest.driver_id.position,
              department: activeRequest.driver_id.department
            }
          };
        }
        return carObj;
      });

      return NextResponse.json(carsWithDrivers);
    }

    return NextResponse.json(cars);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// Create new car
export async function POST(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();
    const car = await Car.create(data);
    return NextResponse.json(car, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

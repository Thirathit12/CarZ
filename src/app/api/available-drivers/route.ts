import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import CarRequest from '@/models/CarRequest';

export async function GET(req: Request) {
  try {
    await connectDB();
    
    // หาคนขับทั้งหมด
    const drivers = await User.find({ role: 'driver' });

    // ดึงวันเวลาที่ต้องการจองจาก query parameters
    const url = new URL(req.url);
    const startDatetime = url.searchParams.get('start_datetime');
    const endDatetime = url.searchParams.get('end_datetime');

    if (!startDatetime || !endDatetime) {
      return NextResponse.json(drivers);
    }

    // หารถที่ถูกจองในช่วงเวลาที่ต้องการ
    const currentRequests = await CarRequest.find({
      status: { $in: ['ASSIGNED', 'APPROVED'] },
      $or: [
        {
          // กรณีที่เวลาเริ่มต้นของการจองอยู่ในช่วงเวลาที่มีคนจองแล้ว
          start_datetime: {
            $lte: new Date(endDatetime),
            $gte: new Date(startDatetime)
          }
        },
        {
          // กรณีที่เวลาสิ้นสุดของการจองอยู่ในช่วงเวลาที่มีคนจองแล้ว
          end_datetime: {
            $lte: new Date(endDatetime),
            $gte: new Date(startDatetime)
          }
        },
        {
          // กรณีที่ช่วงเวลาที่ต้องการจองคร่อมช่วงเวลาที่มีคนจองแล้ว
          start_datetime: { $lte: new Date(startDatetime) },
          end_datetime: { $gte: new Date(endDatetime) }
        }
      ]
    });

    // หา requests ที่อยู่ในช่วงเวลาปัจจุบัน
    // const currentRequests = await CarRequest.find({
    //   status: 'ASSIGNED',
    //   start_datetime: { $lte: new Date() },
    //   end_datetime: { $gte: new Date() }
    // });

    // กรองคนขับที่ไม่อยู่ใน requests ปัจจุบัน
    const busyDriverIds = currentRequests.map(req => req.driver_id?.toString());
    const availableDrivers = drivers.filter(
      driver => !busyDriverIds.includes(driver._id.toString())
    );

    return NextResponse.json(availableDrivers);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 
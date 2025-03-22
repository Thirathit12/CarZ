import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Car from '@/models/Car';
import CarRequest from '@/models/CarRequest';

export async function GET(req: Request) {
  try {
    await connectDB();

    // หารถทั้งหมด
    const allCars = await Car.find({ status: { $ne: 'MAINTENANCE' } });

    // ดึงวันเวลาที่ต้องการจองจาก query parameters
    const url = new URL(req.url);
    const startDatetime = url.searchParams.get('start_datetime');
    const endDatetime = url.searchParams.get('end_datetime');

    if (!startDatetime || !endDatetime) {
      return NextResponse.json(allCars);
    }

    // หารถที่ถูกจองในช่วงเวลาที่ต้องการ
    const bookedRequests = await CarRequest.find({
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

    // รวบรวม ID ของรถที่ถูกจองแล้ว
    const bookedCarIds = bookedRequests.map(req => req.car_id.toString());

    // กรองรถที่ว่างในช่วงเวลาที่ต้องการ
    const availableCars = allCars.filter(
      car => !bookedCarIds.includes(car._id.toString())
    );

    return NextResponse.json(availableCars);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 
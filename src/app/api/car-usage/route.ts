import { NextResponse } from "next/server";
import { connectDB } from '@/lib/db';
import CarRequest from "@/models/CarRequest";
import Car from "@/models/Car";
import User from "@/models/User";

// เพิ่มฟังก์ชันสำหรับสร้าง CSV
function generateCSV(data: any, type: 'car' | 'driver') {
  if (type === 'car') {
    // สร้างหัวตาราง
    const headers = [
      'ทะเบียนรถ',
      'ยี่ห้อ/รุ่น',
      'จำนวนเที่ยว',
      'ชั่วโมงใช้งาน',
      'สถานะ',
      'การใช้งานล่าสุด'
    ].join('\t');

    // ส่งกลับเฉพาะหัวตาราง
    return { content: [headers] };
  }

  // สำหรับ driver ส่งกลับ array ว่าง
  return { content: [] };
}

export async function GET() {
  try {
    await connectDB();

    // ดึงข้อมูลสถิติรถ
    const carStats = await CarRequest.aggregate([
      {
        $lookup: {
          from: "cars",
          localField: "car_id",
          foreignField: "_id",
          as: "car"
        }
      },
      { $unwind: "$car" },
      {
        $group: {
          _id: "$car_id",
          brand: { $first: "$car.brand" },
          model: { $first: "$car.model" },
          licensePlate: { $first: "$car.licensePlate" },
          totalTrips: { $sum: 1 },
          totalHours: {
            $sum: {
              $divide: [
                { $subtract: ["$end_datetime", "$start_datetime"] },
                3600000 // แปลงมิลลิวินาทีเป็นชั่วโมง
              ]
            }
          },
          recentTrips: {
            $push: {
              destination: "$destination",
              purpose: "$purpose",
              start_datetime: "$start_datetime",
              end_datetime: "$end_datetime",
              status: "$status"
            }
          }
        }
      },
      {
        $lookup: {
          from: "cars",
          localField: "_id",
          foreignField: "_id",
          as: "currentStatus"
        }
      },
      { $unwind: "$currentStatus" },
      {
        $project: {
          carId: "$_id",
          brand: 1,
          model: 1,
          licensePlate: 1,
          totalTrips: 1,
          totalHours: { $round: ["$totalHours", 1] },
          status: "$currentStatus.status",
          recentTrips: { $slice: ["$recentTrips", -5] }
        }
      }
    ]);

    // ดึงข้อมูลสถิติพนักงานขับรถ
    const driverStats = await CarRequest.aggregate([
      {
        $match: {
          driver_id: { $exists: true },
          status: "APPROVED"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "driver_id",
          foreignField: "_id",
          as: "driver"
        }
      },
      { $unwind: "$driver" },
      {
        $group: {
          _id: "$driver_id",
          firstName: { $first: "$driver.firstName" },
          lastName: { $first: "$driver.lastName" },
          totalTrips: { $sum: 1 },
          totalHours: {
            $sum: {
              $divide: [
                { $subtract: ["$end_datetime", "$start_datetime"] },
                3600000
              ]
            }
          }
        }
      },
      {
        $project: {
          driverId: "$_id",
          firstName: 1,
          lastName: 1,
          totalTrips: 1,
          totalHours: { $round: ["$totalHours", 1] }
        }
      }
    ]);

    // ดึงข้อมูลสถานะรถทั้งหมด
    const carStatusCount = await Car.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // สร้าง CSV สำหรับรถและคนขับ
    const carCsvData = generateCSV(carStats, 'car');
    const driverCsvData = generateCSV(driverStats, 'driver');

    return NextResponse.json({
      carStats,
      driverStats,
      carStatusCount,
      csvData: {
        car: carCsvData,
        driver: driverCsvData
      }
    });

  } catch (error) {
    console.log("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
} 
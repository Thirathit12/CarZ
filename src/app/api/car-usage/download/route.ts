import { NextResponse } from "next/server";
import { connectDB } from '@/lib/db';
import CarRequest from "@/models/CarRequest";
import Car from "@/models/Car";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'car') {
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
            _id: {
              car_id: "$car_id",
              month: { $month: "$start_datetime" },
              year: { $year: "$start_datetime" }
            },
            brand: { $first: "$car.brand" },
            model: { $first: "$car.model" },
            licensePlate: { $first: "$car.licensePlate" },
            totalTrips: { $sum: 1 },
            totalHours: {
              $sum: {
                $divide: [
                  { $subtract: ["$end_datetime", "$start_datetime"] },
                  3600000
                ]
              }
            },
            recentTrips: {
              $push: {
                destination: "$destination",
                start_datetime: "$start_datetime",
                purpose: "$purpose"
              }
            }
          }
        },
        {
          $lookup: {
            from: "cars",
            localField: "_id.car_id",
            foreignField: "_id",
            as: "currentStatus"
          }
        },
        { $unwind: "$currentStatus" },
        {
          $project: {
            licensePlate: 1,
            brand: 1,
            model: 1,
            month: "$_id.month",
            year: "$_id.year",
            totalTrips: 1,
            totalHours: { $round: ["$totalHours", 1] },
            status: "$currentStatus.status",
            recentTrips: { $slice: ["$recentTrips", -1] }
          }
        },
        { $sort: { year: 1, month: 1 } }
      ]);

      // สร้างเนื้อหา CSV
      const headers = [
        'เดือน/ปี',
        'ทะเบียนรถ',
        'ยี่ห้อ/รุ่น',
        'จำนวนเที่ยว',
        'ชั่วโมงใช้งาน',
        'สถานะ',
        'การใช้งานล่าสุด'
      ].join(',');

      const statusMap = {
        AVAILABLE: 'ว่าง',
        MAINTENANCE: 'ซ่อมบำรุง'
      };

      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];

      const rows = carStats.map(car => {
        let lastUsage = '-';
        if (car.recentTrips?.length > 0) {
          const trip = car.recentTrips[0];
          const date = new Date(trip.start_datetime).toLocaleDateString('th-TH');
          lastUsage = `${date}\nสถานที่: ${trip.destination || '-'}\nวัตถุประสงค์: ${trip.purpose || '-'}`;
        }

        const monthYear = `${thaiMonths[car.month - 1]} ${car.year + 543}`;

        const cells = [
          `"${monthYear}"`,
          car.licensePlate,
          `"${car.brand} ${car.model}"`,
          car.totalTrips,
          car.totalHours.toFixed(1),
          statusMap[car.status as keyof typeof statusMap] || car.status,
          `"${lastUsage}"`
        ];
        return cells.join(',');
      });

      const csvContent = [headers, ...rows].join('\n');

      // เพิ่ม BOM และปรับ encoding
      const BOM = '\uFEFF';
      const contentWithBOM = BOM + csvContent;

      return new NextResponse(contentWithBOM, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8-sig',
          'Content-Disposition': 'attachment; filename="car-usage-report.csv"'
        }
      });
    } else if (type === 'driver') {
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
            _id: {
              driver_id: "$driver_id",
              month: { $month: "$start_datetime" },
              year: { $year: "$start_datetime" }
            },
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
            driverName: { $concat: ["$firstName", " ", "$lastName"] },
            month: "$_id.month",
            year: "$_id.year",
            totalTrips: 1,
            totalHours: { $round: ["$totalHours", 1] },
            avgHoursPerTrip: {
              $round: [{ $divide: ["$totalHours", "$totalTrips"] }, 1]
            }
          }
        },
        { $sort: { year: 1, month: 1 } }
      ]);

      const headers = [
        'เดือน/ปี',
        'ชื่อ-นามสกุล',
        'จำนวนเที่ยว',
        'ชั่วโมงทำงาน',
        'เฉลี่ยชั่วโมง/เที่ยว'
      ].join(',');

      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];

      const rows = driverStats.map(driver => {
        const monthYear = `${thaiMonths[driver.month - 1]} ${driver.year + 543}`;
        
        const cells = [
          `"${monthYear}"`,
          `"${driver.driverName}"`,
          driver.totalTrips,
          driver.totalHours.toFixed(1),
          driver.avgHoursPerTrip.toFixed(1)
        ];
        return cells.join(',');
      });

      // เพิ่มแถวสรุป
      const totalTrips = driverStats.reduce((sum, driver) => sum + driver.totalTrips, 0);
      const totalHours = driverStats.reduce((sum, driver) => sum + driver.totalHours, 0);
      const avgHoursPerTrip = totalTrips > 0 ? (totalHours / totalTrips).toFixed(1) : '0.0';

      rows.push(''); // เพิ่มบรรทัดว่าง
      rows.push([
        '"รวมทั้งหมด"',
        totalTrips,
        totalHours.toFixed(1),
        avgHoursPerTrip
      ].join(','));

      const csvContent = [headers, ...rows].join('\n');
      const BOM = '\uFEFF';
      const contentWithBOM = BOM + csvContent;

      return new NextResponse(contentWithBOM, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8-sig',
          'Content-Disposition': 'attachment; filename="driver-report.csv"'
        }
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.log("Download error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
} 
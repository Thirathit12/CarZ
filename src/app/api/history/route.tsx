import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CarRequest from "@/models/CarRequest";
import User from "@/models/User";
import Car from "@/models/Car";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: string;
    };

    await connectDB();

    // ตรวจสอบและลงทะเบียน schemas ทั้งหมดที่จำเป็น
    if (!mongoose.models.User) {
      mongoose.model("User", User.schema);
    }

    if (!mongoose.models.Car) {
      const carSchema = new mongoose.Schema({
        brand: String,
        model: String,
        licensePlate: String,
        capacity: Number,
        status: String,
        type: String,
        notes: String,
      });
      mongoose.model("Car", carSchema);
    }

    // ถ้าเป็น admin หรือ super_admin จะเห็นทุกคำขอ
    // ถ้าเป็น approver จะเห็นคำขอที่ต้องอนุมัติ
    // ถ้าเป็น driver จะเห็นคำขอที่ได้รับมอบหมาย
    // ถ้าเป็น user ปกติจะเห็นแค่คำขอของตัวเอง
    let query = {};

    switch (decoded.role) {
      case "admin":
      case "super_admin":
        // เห็นทุกคำขอ
        break;
      case "approver":
        query = { status: "PENDING" };
        break;
      case "driver":
        query = { driver_id: decoded.id };
        break;
      default:
        query = { user_id: decoded.id };
    }

    const requests = await CarRequest.find(query)
      .populate("car_id", "brand model licensePlate type")
      .populate("admin_id", "firstName lastName")
      .populate("driver_id", "firstName lastName phoneNumber")
      .populate("approver_id", "firstName lastName")
      .populate("user_id", "firstName lastName")
      .sort({ created_at: -1 });

    return NextResponse.json(requests);
  } catch (error) {
    console.log("Error in GET /api/history:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

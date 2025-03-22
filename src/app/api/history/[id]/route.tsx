import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CarRequest from "@/models/CarRequest";
import User from "@/models/User";
import Car from "@/models/Car";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    console.log("Searching for user_id:", id);
    console.log("ID type:", typeof id);
    console.log("ID length:", id.length);

    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: string;
    };

    await connectDB();

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

    const objectId = new mongoose.Types.ObjectId(id);
    console.log("Converted ObjectId:", objectId);

    const requests = await CarRequest.find({ user_id: objectId })
      .populate("car_id", "brand model licensePlate type")
      .populate("admin_id", "firstName lastName")
      .populate("driver_id", "firstName lastName phoneNumber")
      .populate("approver_id", "firstName lastName")
      .populate("user_id", "firstName lastName department position")
      .sort({ created_at: -1 });

    console.log("Query:", { user_id: objectId });
    console.log("Found requests:", requests);

    if (!requests || requests.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }

    return NextResponse.json(requests);
  } catch (error) {
    console.log("Error in GET /api/history/[id]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import DriverLicense from '@/models/DriverLicense';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET - ดึงรายการผู้ใช้ทั้งหมด
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (!['admin', 'super_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();
    const roleFilter = req.nextUrl.searchParams.get('role');
    const query = roleFilter ? { role: roleFilter } : {};
    
    const users = await User.find(query).select({
      password: 0,
      __v: 0,
    }).lean();

    // ดึงข้อมูลใบขับขี่สำหรับ driver
    const driverLicenses = await DriverLicense.find({
      userId: { $in: users.filter(u => u.role === 'driver').map(u => u._id) }
    }).lean();

    // รวมข้อมูลใบขับขี่เข้ากับข้อมูลผู้ใช้
    const usersWithLicense = users.map(user => ({
      ...user,
      driverLicenseExpiry: driverLicenses.find(d => d.userId.toString() === user._id.toString())?.expiryDate
    }));

    return NextResponse.json(usersWithLicense);
  } catch (error) {
    console.log("GET error:", error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

// POST - สร้างผู้ใช้ใหม่
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (![ 'super_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    const data = await req.json();
    console.log("Received data:", data);
    
    // ตรวจสอบว่า admin ไม่สามารถสร้าง super_admin ได้
    if (decoded.role === 'admin' && data.role === 'super_admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์สร้าง Super Admin' }, { status: 403 });
    }

    // ตรวจสอบว่าถ้าเป็น driver ต้องมี driverLicenseExpiry
    if (data.role === 'driver' && !data.driverLicenseExpiry) {
      return NextResponse.json({ error: 'กรุณาระบุวันหมดอายุใบขับขี่' }, { status: 400 });
    }

    // ลบ field branch ออกจาก data ก่อนบันทึก
    const { branch, ...userData } = data;

    // แปลงวันที่ให้เป็น Date object
    if (userData.driverLicenseExpiry) {
      userData.driverLicenseExpiry = new Date(userData.driverLicenseExpiry);
    }
    if (userData.birthDate) {
      userData.birthDate = new Date(userData.birthDate);
    }

    console.log("Data to save:", userData);

    await connectDB();
    
    // สร้าง document ใหม่แต่ยังไม่บันทึก
    const newUser = new User(userData);
    
    // บันทึกข้อมูล
    const user = await newUser.save();
    
    console.log("Created user:", user.toObject());

    // ถ้าเป็น driver ให้สร้างข้อมูลใบขับขี่
    if (userData.role === 'driver' && data.driverLicenseExpiry) {
      await DriverLicense.create({
        userId: user._id,
        expiryDate: new Date(data.driverLicenseExpiry)
      });
    }

    const userResponse = await User.findById(user._id)
      .select({
        password: 0,
        __v: 0
      })
      .lean();

    // ถ้าเป็น driver ให้เพิ่มข้อมูลใบขับขี่ในการตอบกลับ
    if (data.role === 'driver') {
      return NextResponse.json({
        ...userResponse,
        driverLicenseExpiry: data.driverLicenseExpiry
      }, { status: 201 });
    }

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error: any) {
    console.log("Error creating user:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT - แก้ไขข้อมูลผู้ใช้
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (!['admin', 'super_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    const data = await req.json();
    console.log("Received update data:", data);

    const { id, driverLicenseExpiry, branch, ...updateData } = data;

    // ตรวจสอบว่า admin ไม่สามารถแก้ไขเป็น super_admin ได้
    if (decoded.role === 'admin' && updateData.role === 'super_admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขเป็น Super Admin' }, { status: 403 });
    }

    // แก้ไขตรงนี้: ตรวจสอบ driverLicenseExpiry จาก data แทน updateData
    if (updateData.role === 'driver' && !driverLicenseExpiry) {
      return NextResponse.json({ error: 'กรุณาระบุวันหมดอายุใบขับขี่' }, { status: 400 });
    }

    // แปลงวันที่ให้เป็น Date object
    if (updateData.birthDate) {
      updateData.birthDate = new Date(updateData.birthDate);
    }

    console.log("Data to update:", updateData);

    await connectDB();

    // ถ้ามีการส่งรหัสผ่านมาและไม่ใช่ค่าว่าง
    if (updateData.password && updateData.password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
    .select({
      password: 0,
      __v: 0
    })
    .lean();

    console.log("Updated user:", user);

    // ตรวจสอบว่ามี driverLicenseExpiry ในข้อมูลที่อัปเดตหรือไม่
    const updatedUser = await User.findById(id).lean();
    console.log("Updated user in DB:", updatedUser);

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    // จัดการข้อมูลใบขับขี่
    if (updateData.role === 'driver' && driverLicenseExpiry) {
      await DriverLicense.findOneAndUpdate(
        { userId: id },
        { 
          expiryDate: new Date(driverLicenseExpiry),
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    } else if (updateData.role !== 'driver') {
      // ลบข้อมูลใบขับขี่ถ้าเปลี่ยน role จาก driver เป็นอย่างอื่น
      await DriverLicense.deleteOne({ userId: id });
    }

    return NextResponse.json({
      ...user,
      driverLicenseExpiry: updateData.role === 'driver' ? driverLicenseExpiry : undefined
    });
  } catch (error: any) {
    console.log("Update error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE - ลบผู้ใช้
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (!['admin', 'super_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ไม่พบ ID' }, { status: 400 });
    }

    await connectDB();
    const userToDelete = await User.findById(id);
    
    // ป้องกันการลบ super_admin โดย admin
    if (decoded.role === 'admin' && userToDelete?.role === 'super_admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบ Super Admin' }, { status: 403 });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    return NextResponse.json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

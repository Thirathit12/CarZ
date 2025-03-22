import { connectDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

async function createSuperAdmin() {
  try {
    await connectDB();

    // ตรวจสอบว่ามี super admin อยู่แล้วหรือไม่
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('มี Super Admin อยู่แล้วในระบบ');
      process.exit(0);
    }

    // ข้อมูล super admin
    const superAdminData = {
      firstName: 'Super',
      lastName: 'Admin',
      gender: 'ไม่ระบุ',
      birthDate: new Date(),
      email: 'superadmin@example.com', // ควรเปลี่ยนตามที่ต้องการ
      phoneNumber: '0000000000',
      position: 'Super Administrator',
      department: 'System Administration',
      password: await bcrypt.hash('superadmin123', 10), // ควรเปลี่ยนรหัสผ่านที่ปลอดภัยกว่านี้
      role: 'super_admin'
    };

    // สร้าง super admin
    const superAdmin = await User.create(superAdminData);
    console.log('สร้าง Super Admin สำเร็จ:', {
      email: superAdmin.email,
      role: superAdmin.role
    });

  } catch (error) {
    console.log('เกิดข้อผิดพลาดในการสร้าง Super Admin:', error);
  } finally {
    process.exit(0);
  }
}

createSuperAdmin(); 
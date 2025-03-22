import mongoose, { Model } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser {
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: Date;
  email: string;
  phoneNumber: string;
  position: string;
  department: string;
  branch?: string;
  password: string;
  role: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'กรุณากรอกชื่อ'],
  },
  lastName: {
    type: String,
    required: [true, 'กรุณากรอกนามสกุล'],
  },
  gender: {
    type: String,
    required: [true, 'กรุณาเลือกเพศ'],
    enum: ['ชาย', 'หญิง', 'อื่นๆ'],
  },
  birthDate: {
    type: Date,
    required: false,
  },
  email: {
    type: String,
    required: [true, 'กรุณากรอกอีเมล์'],
    unique: true,
    lowercase: true,
  },
  phoneNumber: {
    type: String,
    required: [true, 'กรุณากรอกเบอร์โทรศัพท์'],
  },
  position: {
    type: String,
    required: [true, 'กรุณากรอกตำแหน่งงาน'],
  },
  department: {
    type: String,
    required: [true, 'กรุณากรอกสำนักงาน/หน่วยงาน'],
  },
  branch: {
    type: String,
    required: false,
    enum: [
      'สำนักงานใหญ่',
      'สาขาเชียงใหม่',
      'สาขาขอนแก่น',
      'สาขาชลบุรี',
      'สาขาภูเก็ต',
      'สาขาหาดใหญ่'
    ]
  },
  password: {
    type: String,
    required: [true, 'กรุณากรอกรหัสผ่าน'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'super_admin', 'driver', 'approver'],
    default: 'user',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// เข้ารหัสรหัสผ่านก่อนบันทึก
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// เมธอดสำหรับตรวจสอบรหัสผ่าน
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export { userSchema };
export default User; 
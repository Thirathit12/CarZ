import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
console.log(process.env.MONGODB_URI);

if (!MONGODB_URI) {
  throw new Error('กรุณากำหนดค่า MONGODB_URI ใน .env file');
}

export const connectDB = async () => {
  try {
    const { connection } = await mongoose.connect(MONGODB_URI);
    if (connection.readyState === 1) {
      console.log('เชื่อมต่อกับ MongoDB สำเร็จ');
      return;
    }
  } catch (error) {
    console.log('เกิดข้อผิดพลาดในการเชื่อมต่อกับ MongoDB:', error);
  }
}; 
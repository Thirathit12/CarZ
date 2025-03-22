import mongoose, { Model } from 'mongoose';

interface ICar {
  brand: string;
  model: string;
  licensePlate: string;
  capacity: number;
  status: 'AVAILABLE' | 'MAINTENANCE';
  type: 'รถเก๋ง' | 'รถตู้' | 'รถกระบะ' | 'รถบัส';
  notes?: string;
}

let Car: Model<ICar>;

try {
  Car = mongoose.model<ICar>('Car');
} catch {
  const carSchema = new mongoose.Schema({
    brand: {
      type: String,
      required: [true, 'กรุณากรอกยี่ห้อรถ']
    },
    model: {
      type: String,
      required: [true, 'กรุณากรอกรุ่นรถ']
    },
    licensePlate: {
      type: String,
      required: [true, 'กรุณากรอกเลขทะเบียนรถ'],
      unique: true
    },
    capacity: {
      type: Number,
      required: [true, 'กรุณากรอกจำนวนที่นั่ง'],
      min: [1, 'จำนวนที่นั่งต้องมากกว่า 0']
    },
    status: {
      type: String,
      enum: ['AVAILABLE',  'MAINTENANCE'],
      default: 'AVAILABLE'
    },
    type: {
      type: String,
      required: [true, 'กรุณาเลือกประเภทรถ'],
      enum: ['รถเก๋ง', 'รถตู้', 'รถกระบะ', 'รถบัส']
    },
    notes: {
      type: String,
      default: ''
    }
  }, {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });

  Car = mongoose.model<ICar>('Car', carSchema);
}

export default Car; 
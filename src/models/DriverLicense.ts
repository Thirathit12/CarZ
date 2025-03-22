import mongoose, { Model } from 'mongoose';

interface IDriverLicense {
  userId: mongoose.Types.ObjectId;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const driverLicenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'กรุณาระบุผู้ใช้'],
    unique: true
  },
  expiryDate: {
    type: Date,
    required: [true, 'กรุณาระบุวันหมดอายุใบขับขี่']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// อัปเดต updatedAt เมื่อมีการแก้ไข
driverLicenseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const DriverLicense = mongoose.models.DriverLicense || mongoose.model<IDriverLicense>('DriverLicense', driverLicenseSchema);

export default DriverLicense as Model<IDriverLicense>; 
import mongoose from 'mongoose';
import User from './User';

const carRequestSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  car_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  },
  approver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  start_datetime: {
    type: Date,
    required: true
  },
  end_datetime: {
    type: Date,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  passenger_count: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ASSIGNED', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING'
  },
  travel_type: {
    type: String,
    required: true
  },
  usage_type: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const CarRequest = mongoose.models.CarRequest || mongoose.model('CarRequest', carRequestSchema);

export default CarRequest; 
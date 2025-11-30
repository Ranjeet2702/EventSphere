// backend/models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['Tech', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'],
    default: 'Other'
  },
  competitionType: {type: String, enum: ['Intra College', 'Inter College'], required: true},
  date: { type: Date, required: true },
  time: { type: String, required: true },
  venue: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attendees: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registeredCollege: { type: String, trim: true },
    isAttended: { type: Boolean, default: false },
    paymentId: { type: String }
  }],
  posterUrl: { type: String, default: '' },
  qrCodeId: { type: String, unique: true, sparse: true },
  eventMode: { type: String, enum: ['Online', 'Offline'], required: true, default: 'Offline' },
  meetingLink: { type: String },
  registrationLimit: { type: Number, default: 0 },
  registrationFee: { type: Number, default: 0 },
  attendanceQuestion: {
    question: { type: String },
    options: [{ type: String }],
    correctAnswer: { type: String }
  },
  certificateTemplateUrl: { type: String, default: '' },
  cancellationReason: { type: String }
}, { timestamps: true });

eventSchema.pre('save', function(next) {
  if (this.isNew && !this.qrCodeId) {
    this.qrCodeId = new mongoose.Types.ObjectId().toHexString();
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
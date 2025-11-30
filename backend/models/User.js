// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String }, // Not required for OAuth users

  role: { type: String, enum: ['student', 'club', 'admin'], default: 'student' },

  // New Fields
  profileImageUrl: { type: String, default: '' },
  phone: { type: String, default: '' },
  googleId: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
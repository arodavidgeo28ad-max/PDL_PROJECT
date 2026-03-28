const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  usedAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  maxUses: { type: Number, default: 1 },
  uses: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Referral', referralSchema);

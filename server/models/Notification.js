const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['analysis', 'appointment', 'message', 'wellness', 'referral', 'system'], default: 'system' },
  title: { type: String, required: true },
  body: { type: String, required: true },
  icon: { type: String, default: 'notifications' },
  read: { type: Boolean, default: false },
  actionUrl: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateTime: { type: Date, required: true },
  duration: { type: Number, default: 45 }, // minutes
  reason: { type: String, required: true },
  urgency: { type: String, enum: ['routine', 'urgent', 'crisis'], default: 'routine' },
  status: { type: String, enum: ['requested', 'accepted', 'completed', 'declined', 'cancelled'], default: 'requested' },
  meetingLink: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);

const mongoose = require('mongoose');

const wellnessDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sleepHours: { type: Number, required: true, min: 0, max: 24 },
  screenTime: { type: Number, required: true, min: 0, max: 24 },
  exerciseHours: { type: Number, required: true, min: 0, max: 24 },
  studyHours: { type: Number, required: true, min: 0, max: 24 },
  socialScore: { type: Number, required: true, min: 1, max: 10 }, // 1=very isolated, 10=very social
  mood: { type: String, enum: ['great', 'good', 'okay', 'stressed', 'overwhelmed'], default: 'okay' },
  notes: { type: String, default: '' },
  stressScore: { type: Number, default: null },
  burnoutRisk: { type: String, enum: ['low', 'moderate', 'high'], default: null },
}, { timestamps: true });

module.exports = mongoose.model('WellnessData', wellnessDataSchema);

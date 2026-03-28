const mongoose = require('mongoose');

const stressReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wellnessDataId: { type: mongoose.Schema.Types.ObjectId, ref: 'WellnessData', required: true },
  stressScore: { type: Number, required: true }, // 0–100
  burnoutRisk: { type: String, enum: ['low', 'moderate', 'high'], required: true },
  burnoutPercentage: { type: Number, required: true }, // 0–100
  contributingFactors: [{
    factor: String,
    impact: Number, // +points added to stress
    icon: String,
    description: String
  }],
  recommendations: [{
    title: String,
    description: String,
    icon: String,
    priority: { type: String, enum: ['immediate', 'daily', 'weekly'] }
  }],
  predictiveTrend: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('StressReport', stressReportSchema);

/**
 * StressSync AI Analysis Engine
 * Rule-based stress scoring from wellness inputs.
 */

const analyzeWellness = (data) => {
  const { sleepHours, screenTime, exerciseHours, studyHours, socialScore, mood } = data;
  let stressScore = 0;
  const factors = [];

  // --- Sleep Analysis (target: 8h) ---
  const sleepDeficit = Math.max(0, 8 - sleepHours);
  const sleepImpact = Math.round(sleepDeficit * 15);
  if (sleepImpact > 0) {
    stressScore += sleepImpact;
    factors.push({
      factor: 'Low Sleep',
      impact: sleepImpact,
      icon: 'bedtime',
      description: `Only ${sleepHours}h of sleep. Cognitive load is ${Math.round(sleepDeficit * 22)}% higher than baseline.`
    });
  }

  // --- Screen Time Analysis (target: ≤6h) ---
  const screenExcess = Math.max(0, screenTime - 6);
  const screenImpact = Math.round(screenExcess * 8);
  if (screenImpact > 0) {
    stressScore += screenImpact;
    factors.push({
      factor: 'High Screen Time',
      impact: screenImpact,
      icon: 'desktop_windows',
      description: `${screenTime}h of screen exposure. Blue light and digital fatigue contributing significantly.`
    });
  }

  // --- Exercise Analysis (target: 1h) ---
  const exerciseDeficit = Math.max(0, 1 - exerciseHours);
  const exerciseImpact = Math.round(exerciseDeficit * 20);
  if (exerciseImpact > 0) {
    stressScore += exerciseImpact;
    factors.push({
      factor: 'Low Physical Activity',
      impact: exerciseImpact,
      icon: 'fitness_center',
      description: `Only ${exerciseHours}h of exercise. Physical movement is essential for cortisol regulation.`
    });
  }

  // --- Study/Work Overload (target: ≤8h) ---
  const studyExcess = Math.max(0, studyHours - 8);
  const studyImpact = Math.round(studyExcess * 12);
  if (studyImpact > 0) {
    stressScore += studyImpact;
    factors.push({
      factor: 'High Workload',
      impact: studyImpact,
      icon: 'work_history',
      description: `${studyHours}h focus block detected without sufficient breaks.`
    });
  }

  // --- Social Isolation (score 1–10, low = isolated) ---
  const socialImpact = Math.round((10 - socialScore) * 2);
  if (socialImpact > 5) {
    stressScore += socialImpact;
    factors.push({
      factor: 'Social Isolation',
      impact: socialImpact,
      icon: 'people',
      description: `Social connectedness score is ${socialScore}/10. Isolation amplifies stress responses.`
    });
  }

  // --- Mood Adjustment ---
  const moodMap = { great: -10, good: -5, okay: 0, stressed: 10, overwhelmed: 20 };
  stressScore += (moodMap[mood] || 0);

  // Clamp between 0 and 100
  stressScore = Math.min(100, Math.max(0, stressScore));

  // Burnout risk
  let burnoutRisk;
  let burnoutPercentage;
  if (stressScore < 30) {
    burnoutRisk = 'low';
    burnoutPercentage = Math.round(stressScore * 0.5);
  } else if (stressScore < 65) {
    burnoutRisk = 'moderate';
    burnoutPercentage = Math.round(25 + (stressScore - 30) * 1.1);
  } else {
    burnoutRisk = 'high';
    burnoutPercentage = Math.round(60 + (stressScore - 65) * 1.14);
  }
  burnoutPercentage = Math.min(100, burnoutPercentage);

  // Sort factors by impact desc (top 3)
  factors.sort((a, b) => b.impact - a.impact);

  // Build recommendations
  const recommendations = buildRecommendations(factors, { sleepHours, screenTime, exerciseHours, studyHours, socialScore });

  const predictiveTrend = generateTrend(stressScore, factors);

  return { stressScore, burnoutRisk, burnoutPercentage, contributingFactors: factors.slice(0, 3), recommendations, predictiveTrend };
};

const buildRecommendations = (factors, data) => {
  const recs = [];

  if (data.sleepHours < 6) {
    recs.push({ title: 'Prioritize Sleep', icon: 'bedtime', description: 'Set a consistent sleep schedule. Aim to sleep before 11 PM and wake up at the same time daily. Sleep deprivation severely impacts cognitive performance.', priority: 'immediate' });
  } else if (data.sleepHours < 8) {
    recs.push({ title: 'Improve Sleep Quality', icon: 'nightlight', description: 'Try a 15-minute Non-Sleep Deep Rest (NSDR) session. Avoid screens 30 min before bed to naturally raise melatonin.', priority: 'daily' });
  }

  if (data.screenTime > 8) {
    recs.push({ title: 'Digital Detox Session', icon: 'phonelink_off', description: 'Schedule a 20-minute screen-free window between 2:00–4:00 PM. Replace one digital session with paper-based notes.', priority: 'immediate' });
  } else if (data.screenTime > 6) {
    recs.push({ title: 'Blue Light Management', icon: 'visibility', description: 'Enable night mode after sunset. Take a 5-min screen break every 45 minutes using the 20-20-20 rule.', priority: 'daily' });
  }

  if (data.exerciseHours < 0.5) {
    recs.push({ title: 'Quick 5-Min Walk', icon: 'directions_walk', description: 'A brisk 5-minute walk boosts serotonin and clears mental workspace. Do this immediately after a 2-hour study block.', priority: 'immediate' });
  } else {
    recs.push({ title: 'Maintain Activity', icon: 'fitness_center', description: 'Great work on exercising! Consistency is key. Try to include a short warm-up and cool-down to maximize recovery.', priority: 'weekly' });
  }

  if (data.studyHours > 10) {
    recs.push({ title: 'Implement Pomodoro', icon: 'timer', description: 'Break study sessions into 25-minute focused blocks with 5-minute breaks. After 4 cycles, take a 30-minute rest. This reduces cognitive fatigue by 35%.', priority: 'immediate' });
  }

  if (data.socialScore < 5) {
    recs.push({ title: 'Social Reconnection', icon: 'people', description: 'Reach out to a friend or join a study group session. Even a 10-minute social interaction has measurable cortisol-lowering effects.', priority: 'daily' });
  }

  recs.push({ title: 'Guided Breathing', icon: 'self_care', description: "Try 5 minutes of box breathing (inhale 4s, hold 4s, exhale 4s, hold 4s). This activates your parasympathetic nervous system and lowers stress hormones within minutes.", priority: 'immediate' });

  return recs.slice(0, 5);
};

const generateTrend = (score, factors) => {
  const topFactor = factors[0]?.factor || 'workload';
  if (score > 70) return `Your stress is critically elevated. ${topFactor} is the primary driver. Immediate intervention recommended.`;
  if (score > 45) return `Moderate stress patterns detected. Your ${topFactor} is a key stressor. AI suggests shifting high-focus tasks to your morning window.`;
  return `Your wellbeing metrics are balanced. Maintain your current routine and watch for screen time patterns in the afternoon.`;
};

module.exports = { analyzeWellness };

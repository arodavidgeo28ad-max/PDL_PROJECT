const { NlpManager } = require('node-nlp');

const manager = new NlpManager({ languages: ['en'], forceNER: true });

// ── Greetings ──────────────────────────────────────────────────────────
manager.addDocument('en', 'hello', 'greetings.hello');
manager.addDocument('en', 'hi', 'greetings.hello');
manager.addDocument('en', 'hey', 'greetings.hello');
manager.addDocument('en', 'yo', 'greetings.hello');
manager.addDocument('en', 'good morning', 'greetings.hello');

manager.addAnswer('en', 'greetings.hello', 'Hey {{name}}! 😊 Really glad you\'re here. What\'s on your mind today?');
manager.addAnswer('en', 'greetings.hello', 'Hi {{name}}! 💙 I was literally just thinking — how\'s your day treating you?');

// ── How are you ────────────────────────────────────────────────────────
manager.addDocument('en', 'how are you', 'greetings.howareyou');
manager.addDocument('en', 'how are things', 'greetings.howareyou');
manager.addDocument('en', 'how is life', 'greetings.howareyou');

manager.addAnswer('en', 'greetings.howareyou', 'I\'m doing great, thanks for checking on me 🥺💙 But really, how are *you* doing?');
manager.addAnswer('en', 'greetings.howareyou', 'Honestly? Living my best life listening to you 😄 More importantly — how are *you*, {{name}}?');

// ── Stress & Anxiety ───────────────────────────────────────────────────
manager.addDocument('en', 'I am so stressed', 'emotion.stress');
manager.addDocument('en', 'I feel overwhelmed', 'emotion.stress');
manager.addDocument('en', 'Too much pressure', 'emotion.stress');
manager.addDocument('en', 'I am having anxiety', 'emotion.stress');
manager.addDocument('en', 'I am nervous about this', 'emotion.stress');

manager.addAnswer('en', 'emotion.stress', 'Ugh, stress is THE worst and I hate that for you 😔 What\'s been piling up lately? Maybe we can break it down together.');
manager.addAnswer('en', 'emotion.stress', 'Hey {{name}}, breathe. Seriously — in... and out. 🌬️ You\'ve handled hard things before. What\'s the biggest thing stressing you right now?');

// ── Sadness / Feeling low ──────────────────────────────────────────────
manager.addDocument('en', 'I feel sad', 'emotion.sad');
manager.addDocument('en', 'I have been crying', 'emotion.sad');
manager.addDocument('en', 'I am depressed', 'emotion.sad');
manager.addDocument('en', 'I feel miserable', 'emotion.sad');
manager.addDocument('en', 'Everything sucks', 'emotion.sad');

manager.addAnswer('en', 'emotion.sad', 'I\'m sorry you\'re going through this 💙 Sadness can feel incredibly heavy. You\'re not alone — I\'m right here. What happened?');
manager.addAnswer('en', 'emotion.sad', '{{name}}, I hear you. It\'s okay to not be okay 🤍 Can you tell me what\'s been bringing you down?');

// ── Academic Issues ────────────────────────────────────────────────────
manager.addDocument('en', 'I have an exam coming up', 'school.exams');
manager.addDocument('en', 'I am failing my classes', 'school.exams');
manager.addDocument('en', 'Too much homework', 'school.exams');
manager.addDocument('en', 'I cannot study', 'school.exams');

manager.addAnswer('en', 'school.exams', 'Okay 📚 academic pressure is relentless. Let\'s not look at the whole pile — what\'s the single most urgent thing right now?');
manager.addAnswer('en', 'school.exams', 'You are MORE than your grades, {{name}}. I need you to really hear that 💙 But let\'s tackle this. What\'s stressing you most — content, time, or motivation?');

// ── Action: Message Mentor ─────────────────────────────────────────────
manager.addDocument('en', 'tell my mentor I am stressed', 'action.message_mentor');
manager.addDocument('en', 'send a message to my mentor saying hi', 'action.message_mentor');
manager.addDocument('en', 'message mentor that I need help', 'action.message_mentor');

// ── Action: Book Appointment ───────────────────────────────────────────
manager.addDocument('en', 'book an appointment with my mentor today', 'action.book_appointment');
manager.addDocument('en', 'schedule a meeting for tomorrow at 4 pm', 'action.book_appointment');
manager.addDocument('en', 'make an appointment', 'action.book_appointment');

// ── Fallback ───────────────────────────────────────────────────────────
manager.addAnswer('en', 'None', 'Tell me more about that 👂 I want to fully understand what\'s going on for you, {{name}}.');
manager.addAnswer('en', 'None', 'That\'s really interesting — how does that make you feel overall? 🌟');
manager.addAnswer('en', 'None', 'Hmm, that sounds like there might be more to unpack 🤔 What else is on your mind?');


async function trainModel() {
  try {
    await manager.train();
    // Note: manager.save() is intentionally omitted to avoid disk-write crashes in cloud environments
    console.log('✅ NLP Model Trained (in-memory)');
  } catch (err) {
    console.error('⚠️ NLP training error (non-fatal):', err.message);
  }
}

trainModel();

module.exports = manager;

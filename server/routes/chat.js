const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const nlpManager = require('../services/nlpEngine');

// ─── Distress Keywords (Fallback safety net) ──────────────────────────────────
const DISTRESS_KEYWORDS = [
  'depressed', 'worthless', 'hopeless', 'give up', 'no reason',
  'crying', 'breakdown', 'numb', 'empty inside',
  'anxious', 'panic', 'anxiety', 'overwhelmed', 'suffocating', 'drowning'
];

// ─── Parse appointment date/time from message ─────────────────────────────────
function parseAppointmentDetails(msg) {
  const timeRegex = /at\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const timeMatch = msg.match(timeRegex);

  let dateTarget = new Date();
  if (msg.includes('tomorrow')) {
    dateTarget.setDate(dateTarget.getDate() + 1);
  } else {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (const day of days) {
      if (msg.includes(day)) {
        const today = dateTarget.getDay();
        const target = days.indexOf(day);
        const diff = (target - today + 7) % 7 || 7;
        dateTarget.setDate(dateTarget.getDate() + diff);
        break;
      }
    }
  }

  let hours = null, minutes = 0;
  if (timeMatch) {
    hours = parseInt(timeMatch[1]);
    minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    if (!period && hours < 8) hours += 12;
  }

  if (hours !== null) {
    dateTarget.setHours(hours, minutes, 0, 0);
    return dateTarget;
  }
  return null;
}

// ─── Extract message to mentor from command ───────────────────────────────────
function extractMentorMessage(msg) {
  const patterns = [
    /(?:tell|say|message|text|send)\s+(?:my\s+)?mentor[:\s]+(.+)/i,
    /(?:tell|message|text)\s+(?:my\s+)?mentor\s+(?:that\s+)?(.+)/i,
    /say\s+(.+?)\s+to\s+(?:my\s+)?mentor/i,
  ];
  for (const p of patterns) {
    const m = msg.match(p);
    if (m) return m[1].trim();
  }
  if (/say\s+hi\s+to\s+(?:my\s+)?mentor/i.test(msg)) return 'Hi! 👋';
  return null;
}

// ─── POST /api/chat ───────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const user = req.user;
    const name = user && user.firstName ? user.firstName : 'friend';
    const lowerMsg = message.toLowerCase().trim();
    const safeHistory = Array.isArray(history) ? history : [];
    
    // Evaluate message against trained NLP Model
    const nlpResponse = await nlpManager.process('en', message);
    const intent = nlpResponse.intent;

    // ── ACTION: Message Mentor ─────────────────────────────────────────────
    if (intent === 'action.message_mentor' || nlpResponse.score > 0.8 && lowerMsg.includes('mentor')) {
      if (!user.mentorId) {
        return res.json({ reply: `I'd love to help you reach out, ${name} 💙 But it looks like you don't have a mentor assigned yet. You can find one in the **Directory** tab!` });
      }
      const msgContent = extractMentorMessage(lowerMsg) || message;
      await Message.create({ senderId: user._id, receiverId: user.mentorId, content: msgContent });
      await Notification.create({
        userId: user.mentorId, type: 'message',
        title: `New message from ${name}`,
        body: `${name} says: "${msgContent}"`,
        icon: 'chat', actionUrl: '/messages'
      });
      return res.json({ reply: `Done! ✅ I've sent your message to your mentor: *"${msgContent}"* 💙 They'll get a notification right away!` });
    }

    // ── ACTION: Book Appointment ───────────────────────────────────────────
    if (intent === 'action.book_appointment' || lowerMsg.includes('appointment')) {
      if (!user.mentorId) {
        return res.json({ reply: `I'd love to book that for you, ${name}! 📅 But you don't have a mentor assigned yet. Check out the **Directory** tab to connect with one first!` });
      }
      const appointmentTime = parseAppointmentDetails(lowerMsg);
      if (!appointmentTime) {
        return res.json({ reply: `I want to book that appointment for you, ${name}! 📅 Just let me know what time works — for example: *"book appointment today at 4 pm"* or *"tomorrow at 10 am"*` });
      }
      const formattedTime = appointmentTime.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
      await Appointment.create({
        studentId: user._id, mentorId: user.mentorId,
        dateTime: appointmentTime,
        reason: `Requested via AI Chat by ${name}`,
        status: 'requested'
      });
      await Notification.create({
        userId: user.mentorId, type: 'appointment',
        title: `New appointment request from ${name}`,
        body: `${name} has requested a session on ${formattedTime}. Please accept or decline.`,
        icon: 'event', actionUrl: '/appointments'
      });
      return res.json({ reply: `All done! 🎉 I've booked an appointment request with your mentor for **${formattedTime}**. They'll get a notification to confirm it. You can also track it in the **Appointments** tab! 📅` });
    }

    // ── Smart Escalation ───────────────────────────────────────────────────
    try {
      const pastUserTexts = safeHistory
        .filter(m => m && m.role === 'user' && m.parts && m.parts[0])
        .map(m => String(m.parts[0].text || '').toLowerCase());
      const allTexts = [...pastUserTexts, lowerMsg];
      const distressCount = allTexts.filter(t => DISTRESS_KEYWORDS.some(k => t.includes(k))).length;

      if (distressCount >= 2 && user.mentorId) {
        const recentAlert = await Notification.findOne({
          userId: user.mentorId, type: 'system',
          createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          title: new RegExp(name, 'i')
        });
        if (!recentAlert) {
          await Notification.create({
            userId: user.mentorId, type: 'system',
            title: `Check-in suggestion for ${name}`,
            body: `${name} has expressed repeated signs of stress or sadness in recent chats. A gentle check-in could be very helpful.`,
            icon: 'volunteer_activism', actionUrl: '/messages'
          });
        }
      }
    } catch (e) {
      console.error('Escalation error (non-fatal):', e.message);
    }

    // ── Simulate typing delay ──────────────────────────────────────────────
    await new Promise(r => setTimeout(r, 800 + Math.floor(Math.random() * 900)));

    // ── Determine NLP Reply ────────────────────────────────────────────────
    let reply = nlpResponse.answer;
    
    // Inject user name into NLP parameterized answers
    if (reply && reply.includes('{{name}}')) {
      reply = reply.replace('{{name}}', name);
    }

    // Single distress nudge fallback
    if (!reply && DISTRESS_KEYWORDS.some(k => lowerMsg.includes(k))) {
      reply = `${name}, I just want to check in 🤍 Things sound heavy right now. You don't have to carry this alone — your mentor is always there for a real human conversation when you're ready.`;
    }

    // Complete Fallback if NLP fails to hit an intent
    if (!reply) {
      reply = `Hmm, I see. What else is on your mind, ${name}? I'm here to listen.`;
    }

    return res.json({ reply });

  } catch (err) {
    console.error('Chat route error:', err.message, err.stack);
    return res.status(500).json({ message: "I'm having a little moment — give me a sec! 💙" });
  }
});

module.exports = router;

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../api';
import styles from './AIChat.module.css';

const QUICK_REPLIES = [
  "I'm feeling overwhelmed today.",
  "How can I improve my sleep?",
  "I need help focusing on my studies."
];

export default function AIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'ai', 
      text: `Hello ${user?.firstName}. I am Lumi, your personal wellness guide. How can I support your equilibrium today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const sendMessage = async (textText) => {
    const userMsg = typeof textText === 'string' ? textText : input.trim();
    if (!userMsg) return;
    
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg, timestamp: new Date() }]);
    setIsTyping(true);

    try {
      // 2. Context awareness: pass last 10 messages (excluding the new one and the initial greeting if too old)
      const chatHistory = messages.slice(-10).map(m => ({
        role: m.sender === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const res = await chatAPI.send(userMsg, chatHistory);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: res.data.reply, timestamp: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: err.response?.data?.message || 'Sorry, my neural pathways are currently clouded. Please try again later.', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.page}>
      
      <div className={styles.chatContainer}>
        {/* Chat Header */}
        <div className={styles.chatHeader}>
          <div className={styles.headerProfile}>
            <div className={styles.aiAvatarLg}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>spa</span>
              <div className={styles.onlineStatus}></div>
            </div>
            <div>
              <h2 className="font-headline" style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.1rem' }}>Lumi</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>AI Wellness Guide • Online</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn}><span className="material-symbols-outlined">search</span></button>
            <button className={styles.iconBtn}><span className="material-symbols-outlined">more_vert</span></button>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messagesArea}>
          <div className={styles.dateDivider}>
            <span>Today</span>
          </div>
          
          {messages.map((msg) => (
            <div key={msg.id} className={`${styles.messageWrap} ${msg.sender === 'user' ? styles.userWrap : styles.aiWrap}`}>
              {msg.sender === 'ai' && (
                <div className={styles.aiAvatarSm}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>spa</span>
                </div>
              )}
              <div className={styles.messageContent}>
                <div className={`${styles.bubble} ${msg.sender === 'user' ? styles.userBubble : styles.aiBubble}`}>
                  {msg.text}
                </div>
                <div className={styles.timestamp}>{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className={`${styles.messageWrap} ${styles.aiWrap}`}>
              <div className={styles.aiAvatarSm}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>spa</span>
              </div>
              <div className={`${styles.bubble} ${styles.aiBubble} ${styles.typingIndicator}`}>
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Replies */}
        {messages.length < 3 && !isTyping && (
          <div className={styles.quickReplies}>
            {QUICK_REPLIES.map((qr, i) => (
              <button key={i} className={styles.qrBtn} onClick={() => sendMessage(qr)}>{qr}</button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className={styles.inputArea}>
          <button className={styles.attachBtn}>
            <span className="material-symbols-outlined">add_circle</span>
          </button>
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }} 
            style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Message Lumi..."
                value={input}
                onChange={e => setInput(e.target.value)}
                className={styles.input}
                disabled={isTyping}
              />
              <button type="button" className={styles.micBtn}>
                <span className="material-symbols-outlined">mic</span>
              </button>
            </div>
            {input.trim() ? (
              <button type="submit" disabled={isTyping} className={styles.sendBtnActive}>
                <span className="material-symbols-outlined">send</span>
              </button>
            ) : (
              <button type="button" disabled className={styles.sendBtnIdle}>
                <span className="material-symbols-outlined">thumb_up</span>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

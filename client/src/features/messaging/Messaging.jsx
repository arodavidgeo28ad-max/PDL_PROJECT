import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { messagesAPI } from '../../api';
import styles from './Messaging.module.css';

export default function Messaging() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesAPI.contacts().then(r => setContacts(r.data.contacts)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected) {
      messagesAPI.conversation(selected._id).then(r => setMessages(r.data.messages)).catch(console.error);
    }
  }, [selected]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selected) return;
    try {
      const r = await messagesAPI.send({ receiverId: selected._id, content: input });
      setMessages(prev => [...prev, r.data.message]);
      setInput('');
      setContacts(prev => prev.map(c => c._id === selected._id ? { ...c, lastMessage: input, lastMessageAt: new Date() } : c));
    } catch (err) { console.error(err); }
  };

  const isMe = (msg) => msg.senderId?._id === user._id || msg.senderId === user._id;

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className="font-headline" style={{ fontWeight: 700, fontSize: '1.25rem' }}>Messages</h2>
        </div>
        {loading ? <div className={styles.loading}><div className={styles.spinner} /></div> : contacts.length === 0 ? (
          <div className={styles.emptyContacts}>No conversations yet</div>
        ) : contacts.map(c => (
          <div key={c._id} className={`${styles.contact} ${selected?._id === c._id ? styles.contactActive : ''}`} onClick={() => setSelected(c)}>
            <div className={styles.contactAvatar}>{c.firstName[0]}{c.lastName[0]}</div>
            <div className={styles.contactInfo}>
              <div className={styles.contactName}>{c.firstName} {c.lastName}</div>
              <div className={styles.lastMsg}>{c.lastMessage || 'Start a conversation'}</div>
            </div>
            {c.unreadCount > 0 && <span className={styles.unreadBadge}>{c.unreadCount}</span>}
          </div>
        ))}
      </div>

      <div className={styles.chatArea}>
        {!selected ? (
          <div className={styles.selectContact}>
            <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--outline)', marginBottom: '1rem' }}>forum</span>
            <p>Select a conversation to start messaging</p>
          </div>
        ) : (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.chatAvatar}>{selected.firstName[0]}{selected.lastName[0]}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{selected.firstName} {selected.lastName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>● Online</div>
              </div>
            </div>

            <div className={styles.messages}>
              {messages.map((msg, i) => (
                <div key={msg._id || i} className={`${styles.message} ${isMe(msg) ? styles.messageRight : styles.messageLeft}`}>
                  <div className={isMe(msg) ? styles.bubbleRight : styles.bubbleLeft}>{msg.content}</div>
                  <span className={styles.msgTime}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className={styles.inputArea} onSubmit={sendMessage}>
              <input className={styles.chatInput} placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} />
              <button type="submit" className={styles.sendBtn} disabled={!input.trim()}>
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, MessageSquare } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'What is my current runway?',
  'Summarise key financial risks',
  'Which costs should I review first?',
  'How is operating margin trending?',
];

export function FintechChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Astroiq Financial Assistant. I can help you interpret metrics, highlight risks, and prioritise decisions. What would you like to review?',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content }]);
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content }] }),
      });
      const data = await res.json();
      const reply = typeof data.reply === 'string' ? data.reply : 'Unable to respond right now.';
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Connection issue. Please try again.' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button className="chat-fab" onClick={() => setOpen(true)} aria-label="Open financial assistant">
          <MessageSquare size={20} />
          <span>Assistant</span>
        </button>
      )}
      {open && (
        <div className="chat-panel glass">
          <header className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="feature-icon" style={{ width: 32, height: 32, margin: 0 }}>
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Astroiq Assistant</div>
                <div className="muted" style={{ fontSize: 11 }}>Enterprise financial insights</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="chat-close" aria-label="Close">
              <X size={18} />
            </button>
          </header>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {busy && <div className="chat-bubble assistant">Thinking…</div>}
            <div ref={bottomRef} />
          </div>

          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chat-chip" onClick={() => send(s)} disabled={busy}>
                {s}
              </button>
            ))}
          </div>

          <form
            className="chat-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              className="chat-input"
              placeholder="Ask about runway, margins, costs…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 12px' }} disabled={busy || !input.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

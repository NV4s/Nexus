import { useCallback, useEffect, useRef, useState } from 'react';
import { ids } from '../lib/track';

type Message = { id: string; name: string; text: string; at: number; who: string };

const NAME_KEY = 'nexus:chat:name';
const POLL_MS = 5000;
const MAX_TEXT = 200;

const clock = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


function localCheck(text: string): string | null {
  if (!text.trim()) return 'Type something first.';
  if (text.length > MAX_TEXT) return `Keep it under ${MAX_TEXT} characters.`;
  if (/https?:\/\/|www\.|@[\w.]+\.[a-z]{2,}/i.test(text)) return 'No links or addresses.';
  return null;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem(NAME_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [off, setOff] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/chat');
      if (!response.ok) return;
      const data = (await response.json()) as { messages: Message[]; off?: boolean };
      setOff(Boolean(data.off));
      setMessages(data.messages ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    load();


    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    document.addEventListener('visibilitychange', load);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
    };
  }, [load]);

  useEffect(() => {
    const el = log.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    const complaint = localCheck(draft);
    if (complaint) return setError(complaint);
    if (name.trim().length < 2) return setError('Pick a name first.');

    const { sid, vid } = ids();
    if (!sid || !vid) return setError('Storage is blocked, so chat cannot work here.');

    setSending(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sid, vid, name: name.trim(), text: draft }),
      });
      const data = (await response.json()) as { error?: string; message?: Message };
      if (!response.ok) {
        setError(data.error ?? 'That did not send.');
        return;
      }
      try {
        localStorage.setItem(NAME_KEY, name.trim());
      } catch {}
      setDraft('');
      if (data.message) setMessages((current) => [...current, data.message!]);
    } catch {
      setError('No connection.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="chat">
      <header className="page-head">
        <h2>Chat</h2>
        <p>
          One public room. Everyone can see everything you type here, including
          the owner — no private messages, and no links, addresses or contact
          details.
        </p>
      </header>

      {off ? (
        <div className="empty">Chat is switched off right now.</div>
      ) : (
        <div className="chat-box glass">
          <div
            className="chat-log"
            ref={log}
            onScroll={(event) => {
              const el = event.currentTarget;
              pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
            }}
          >
            {messages.length === 0 ? (
              <p className="chat-empty">Nothing yet. Say hello.</p>
            ) : (
              messages.map((message) => (
                <p className="chat-line" key={message.id}>
                  <span className="chat-when">{clock(message.at)}</span>
                  <span className="chat-name">{message.name}</span>
                  <span className="chat-text">{message.text}</span>
                </p>
              ))
            )}
          </div>

          <form className="chat-form" onSubmit={send}>
            <input
              className="chat-name-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              maxLength={16}
              aria-label="Your name in chat"
            />
            <input
              className="chat-draft"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Message"
              maxLength={MAX_TEXT}
              aria-label="Message"
            />
            <button type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>

          {error && <p className="chat-error">{error}</p>}
        </div>
      )}
    </section>
  );
}

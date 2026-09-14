import { useCallback, useEffect, useRef, useState } from 'react';
import { ids } from '../lib/track';

type Message = { id: string; name: string; text: string; at: number; who: string };

const NAME_KEY = 'nexus:chat:name';
const POLL_MS = 5000;
const MAX_TEXT = 200;
const GROUP_MS = 5 * 60 * 1000;

const clock = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const hue = (text: string) => {
  let value = 0;
  for (const char of text.toLowerCase()) value = (value * 31 + char.charCodeAt(0)) % 360;
  return value;
};


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
  const latest = useRef('');

  const load = useCallback(async () => {
    if (document.visibilityState !== 'visible') return;
    try {
      const response = await fetch('/api/chat');
      if (!response.ok) return;
      const data = (await response.json()) as { messages?: Message[]; off?: boolean };
      setOff(Boolean(data.off));
      const next = data.messages ?? [];
      const key = `${next.length}:${next[next.length - 1]?.id ?? ''}`;
      if (key === latest.current) return;
      latest.current = key;
      setMessages(next);
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, POLL_MS);
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
      pinned.current = true;
      if (data.message) setMessages((current) => [...current, data.message!]);
    } catch {
      setError('No connection.');
    } finally {
      setSending(false);
    }
  }

  const left = MAX_TEXT - draft.length;

  return (
    <section className="section chat-room">
      <header className="section-head">
        <div>
          <h2>Chat</h2>
          <p>
            One public room. Everyone sees what you type, the owner included. No private messages,
            links, addresses or contact details.
          </p>
        </div>
      </header>

      {off ? (
        <p className="empty">Chat is switched off right now.</p>
      ) : (
        <div className="chat-room-box glass">
          <div
            className="chat-log"
            ref={log}
            role="log"
            aria-live="polite"
            onScroll={(event) => {
              const el = event.currentTarget;
              pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
            }}
          >
            {messages.length === 0 ? (
              <p className="chat-empty">Nothing yet. Say hello.</p>
            ) : (
              messages.map((message, index) => {
                const previous = messages[index - 1];
                const first =
                  !previous ||
                  previous.who !== message.who ||
                  previous.name !== message.name ||
                  message.at - previous.at > GROUP_MS;
                return (
                  <div
                    key={message.id}
                    className={first ? 'chat-msg is-first' : 'chat-msg'}
                    style={first ? ({ '--hue': hue(message.name) } as React.CSSProperties) : undefined}
                  >
                    {first && (
                      <>
                        <span className="chat-avatar" aria-hidden="true">
                          {message.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="chat-meta">
                          <span className="chat-name">{message.name}</span>
                          <time className="chat-when" dateTime={new Date(message.at).toISOString()}>
                            {clock(message.at)}
                          </time>
                        </div>
                      </>
                    )}
                    <p className="chat-text">{message.text}</p>
                  </div>
                );
              })
            )}
          </div>

          <form className="chat-form" onSubmit={send}>
            <input
              className="field chat-name-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              maxLength={16}
              aria-label="Your name in chat"
            />
            <input
              className="field chat-draft"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Message"
              maxLength={MAX_TEXT}
              aria-label="Message"
            />
            <span className={left < 30 ? 'chat-count is-near' : 'chat-count'} aria-hidden="true">
              {left}
            </span>
            <button type="submit" className="button" disabled={sending || !draft.trim()}>
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>

          {error && (
            <p className="chat-error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Send, ShieldCheck, Cloud } from 'lucide-react';
import {
  DEFAULT_MODEL,
  ENGINES,
  engineById,
  readKey,
  readSetting,
  writeKey,
  writeSetting,
  type Availability,
  type EngineId,
  type Message,
} from '../lib/ai';

const KEY_HELP: Partial<Record<EngineId, string>> = {
  anthropic: 'console.anthropic.com → API keys',
  google: 'aistudio.google.com → Get API key',
  openai: 'platform.openai.com → API keys',
  custom: 'Whatever your provider calls it',
};

export default function Assistant() {
  const [engineId, setEngineId] = useState<EngineId>(
    () => (readSetting('engine') as EngineId) || 'local',
  );
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [answeredBy, setAnsweredBy] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const engine = engineById(engineId);

  useEffect(() => {
    writeSetting('engine', engineId);
    setAvailability(null);
    let cancelled = false;
    engine.check().then((result) => !cancelled && setAvailability(result));
    return () => {
      cancelled = true;
    };
  }, [engineId, engine]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, status]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;

    const history = [...messages, { role: 'user' as const, content: text }];
    setMessages(history);
    setDraft('');
    setBusy(true);
    setError('');
    setStatus('Thinking…');

    try {
      const answer = await engine.ask(history, (note) => setStatus(note));
      setMessages([...history, { role: 'assistant', content: answer }]);
      setAnsweredBy(engine.label);
      // Downloading the model changes what the panel should offer next time.
      engine.check().then(setAvailability);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
      setStatus('');
    }
  };

  const blocked =
    availability?.state === 'unsupported' ||
    availability?.state === 'needs-key' ||
    (availability?.state === 'needs-download' && !busy);

  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>Assistant</h2>
          <p>
            Runs on this device, or through your own API key. There is no shared key — nothing you
            type is ever sent to this site.
          </p>
        </div>
      </header>

      <div className="panels">
        <div className="panel">
          <h3>Where it runs</h3>
          <div className="row">
            {ENGINES.map((option) => (
              <button
                key={option.id}
                className={`button ${engineId === option.id ? '' : 'ghost'}`}
                onClick={() => setEngineId(option.id)}
              >
                {option.private ? <ShieldCheck size={14} /> : <Cloud size={14} />} {option.label}
              </button>
            ))}
          </div>
          <p>{engine.note}</p>

          {availability?.state === 'unsupported' && <p className="admin-error">{availability.reason}</p>}

          {availability?.state === 'needs-download' && (
            <p>
              The model is not on this device yet — {availability.size}. Pressing Send starts the
              download; browsers only allow it from a click, so it cannot happen on its own. After
              that it answers offline.
            </p>
          )}

          {availability?.state === 'needs-key' && (
            <>
              {engineId === 'custom' && (
                <input
                  className="field"
                  placeholder="Base URL, e.g. https://openrouter.ai/api/v1"
                  defaultValue={readSetting('baseUrl')}
                  onChange={(event) => writeSetting('baseUrl', event.target.value)}
                />
              )}
              <input
                className="field"
                type="password"
                placeholder={`API key — ${KEY_HELP[engineId] ?? 'from your provider'}`}
                defaultValue={readKey(engineId)}
                onChange={(event) => writeKey(engineId, event.target.value)}
              />
              <input
                className="field"
                placeholder={`Model (default ${DEFAULT_MODEL[engineId] ?? 'provider default'})`}
                defaultValue={readSetting(`model:${engineId}`)}
                onChange={(event) => writeSetting(`model:${engineId}`, event.target.value)}
              />
              <div className="row">
                <button className="button" onClick={() => engine.check().then(setAvailability)}>
                  Save
                </button>
              </div>
              <p>
                Kept in this browser only, and sent only to {engine.label}. Anyone using this
                computer can read it, so do not use a shared machine.
              </p>
            </>
          )}
        </div>

        <div className="panel">
          <h3>Chat</h3>
          <div className="chat">
            {messages.length === 0 && !status && <p>Ask it something.</p>}
            {messages.map((message, index) => (
              <div className={`chat-turn is-${message.role}`} key={index}>
                {message.content}
              </div>
            ))}
            {status && <div className="chat-turn is-status">{status}</div>}
            {error && <div className="chat-turn is-error">{error}</div>}
            <div ref={endRef} />
          </div>

          <form className="row" onSubmit={send}>
            <input
              className="field"
              placeholder={blocked ? 'Pick an engine that is ready first' : 'Message'}
              value={draft}
              disabled={busy}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button className="button" disabled={busy || !draft.trim() || availability?.state === 'unsupported'}>
              <Send size={16} /> Send
            </button>
          </form>

          {answeredBy && (
            <p>
              Last answer came from <strong>{answeredBy}</strong>
              {engine.private ? ' — on this device' : ' — sent to their servers'}.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

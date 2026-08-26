import { useEffect, useRef, useState } from 'react';
import { Paperclip, RefreshCw, Send, ShieldCheck, Cloud, X } from 'lucide-react';
import {
  DEFAULT_MODEL,
  ENGINES,
  MODELS,
  engineById,
  fetchModels,
  readKey,
  readSetting,
  writeKey,
  writeSetting,
  type Attachment,
  type Availability,
  type EngineId,
  type Message,
} from '../lib/ai';
import { extractText, isImage, isPdf } from '../lib/archive';

/** 4 MB each: base64 inflates by a third, and providers reject large payloads. */
const MAX_FILE = 4 * 1024 * 1024;

const asBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    // Strip the "data:…;base64," prefix — every provider wants the payload alone.
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.readAsDataURL(file);
  });

/**
 * Prepares one file for sending.
 *
 * Images and PDFs go up as themselves, because every provider accepts them.
 * Everything else — zips, spreadsheets, source files, logs — is unpacked to text
 * here, since none of these APIs accepts an arbitrary binary. A file with
 * nothing readable inside is reported rather than sent empty.
 */
async function prepare(file: File): Promise<Attachment> {
  const type = file.type || 'application/octet-stream';
  if (isImage(type) || isPdf(type, file.name)) {
    return { name: file.name, type, data: await asBase64(file) };
  }
  const text = await extractText(file);
  if (!text) throw new Error(`Nothing readable in ${file.name}`);
  return { name: file.name, type, text };
}

const KEY_HELP: Partial<Record<EngineId, string>> = {
  anthropic: 'console.anthropic.com → API keys',
  google: 'aistudio.google.com → Get API key',
  openai: 'platform.openai.com → API keys',
  custom: 'Whatever your provider calls it',
};


/**
 * A list rather than a text box, because an exact model id is easy to mistype
 * and the failure is a 404 from the provider. "Other" keeps the free-text escape
 * hatch for anything newer than this list, and Refresh asks the provider what it
 * actually offers where its API allows that from a browser.
 */
function ModelPicker({
  engineId,
  listed,
  onRefresh,
}: {
  engineId: EngineId;
  listed: string[];
  onRefresh: () => Promise<void>;
}) {
  const known = MODELS[engineId] ?? [];
  const options = listed.length ? listed.map((id) => ({ id, label: id })) : known;
  const saved = readSetting(`model:${engineId}`) || DEFAULT_MODEL[engineId] || '';
  const [value, setValue] = useState(saved);
  const [custom, setCustom] = useState(() => !options.some((option) => option.id === saved));
  const [busy, setBusy] = useState(false);

  const choose = (next: string) => {
    if (next === '__other') return setCustom(true);
    setCustom(false);
    setValue(next);
    writeSetting(`model:${engineId}`, next);
  };

  return (
    <>
      {!custom && (
        <select className="field" value={value} onChange={(event) => choose(event.target.value)}>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
          <option value="__other">Other — type a model id…</option>
        </select>
      )}

      {custom && (
        <input
          className="field"
          placeholder={`Model id (default ${DEFAULT_MODEL[engineId] ?? 'provider default'})`}
          defaultValue={saved}
          onChange={(event) => writeSetting(`model:${engineId}`, event.target.value)}
        />
      )}

      <div className="row">
        {engineId !== 'anthropic' && (
          <button
            className="button ghost"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onRefresh();
              setBusy(false);
            }}
            title="Ask the provider which models your key can use"
          >
            <RefreshCw size={14} /> {busy ? 'Asking…' : 'Refresh list'}
          </button>
        )}
        {custom && (
          <button className="button ghost" onClick={() => setCustom(false)}>
            Back to list
          </button>
        )}
      </div>
    </>
  );
}

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
  // The key inputs are uncontrolled, so they need a new identity to pick up a
  // different engine's saved value or a clear.
  const [keyFields, setKeyFields] = useState(0);
  const [models, setModels] = useState<string[]>([]);
  const [files, setFiles] = useState<Attachment[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

    const history: Message[] = [
      ...messages,
      { role: 'user', content: text, ...(files.length ? { files } : {}) },
    ];
    setMessages(history);
    setDraft('');
    setFiles([]);
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

          {!availability && <p>Checking…</p>}

          {availability?.state === 'unsupported' && <p className="admin-error">{availability.reason}</p>}

          {availability?.state === 'needs-download' && (
            <p>
              The model is not on this device yet — {availability.size}. Pressing Send starts the
              download; browsers only allow it from a click, so it cannot happen on its own. After
              that it answers offline.
            </p>
          )}

          {engine.keyed && (
            <>
              {availability?.state === 'ready' && (
                <p className="key-set">
                  A key is saved for {engine.label}. Change or clear it below.
                </p>
              )}
              {engineId === 'custom' && (
                <input
                  key={`base-${keyFields}`}
                  className="field"
                  placeholder="Base URL, e.g. https://openrouter.ai/api/v1"
                  defaultValue={readSetting('baseUrl')}
                  onChange={(event) => writeSetting('baseUrl', event.target.value)}
                />
              )}
              <input
                key={`key-${engineId}-${keyFields}`}
                className="field"
                type="password"
                placeholder={`API key — ${KEY_HELP[engineId] ?? 'from your provider'}`}
                defaultValue={readKey(engineId)}
                onChange={(event) => writeKey(engineId, event.target.value)}
              />
              <ModelPicker
                key={`model-${engineId}-${keyFields}`}
                engineId={engineId}
                listed={models}
                onRefresh={async () => setModels(await fetchModels(engineId))}
              />
              <div className="row">
                <button className="button" onClick={() => engine.check().then(setAvailability)}>
                  Save
                </button>
                <button
                  className="button ghost"
                  onClick={() => {
                    writeKey(engineId, '');
                    setKeyFields((n) => n + 1); // remount the inputs so they clear
                    engine.check().then(setAvailability);
                  }}
                >
                  Clear key
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
                {message.files?.length ? (
                  <span className="chat-files">
                    {message.files
                      .map((file) => (file.text ? `${file.name} (as text)` : file.name))
                      .join(', ')}
                  </span>
                ) : null}
              </div>
            ))}
            {status && <div className="chat-turn is-status">{status}</div>}
            {error && <div className="chat-turn is-error">{error}</div>}
            <div ref={endRef} />
          </div>

          {files.length > 0 && (
            <div className="attachments">
              {files.map((file, index) => (
                <span className="attachment" key={`${file.name}-${index}`}>
                  {file.name}
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <form className="row" onSubmit={send}>
            <input
              ref={fileRef}
              type="file"
              hidden
              multiple
              /* Anything: images and PDFs go as-is, the rest is read as text. */
              onChange={async (event) => {
                const picked = [...(event.target.files ?? [])];
                event.target.value = ''; // let the same file be chosen twice
                const tooBig = picked.filter((file) => file.size > MAX_FILE);
                if (tooBig.length) {
                  setError(`${tooBig.map((f) => f.name).join(', ')} — over 4 MB, too large to send.`);
                }
                const ok = picked.filter((file) => file.size <= MAX_FILE);
                if (!ok.length) return;
                const prepared = await Promise.allSettled(ok.map(prepare));
                const good = prepared.flatMap((result) =>
                  result.status === 'fulfilled' ? [result.value] : [],
                );
                const bad = prepared.flatMap((result) =>
                  result.status === 'rejected' ? [String(result.reason?.message ?? result.reason)] : [],
                );
                if (bad.length) setError(bad.join(' · '));
                if (good.length) setFiles([...files, ...good]);
              }}
            />
            <button
              type="button"
              className="button ghost"
              disabled={busy || engine.private}
              title={
                engine.private
                  ? 'On-device models read text only'
                  : 'Attach an image or document'
              }
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip size={16} />
            </button>
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

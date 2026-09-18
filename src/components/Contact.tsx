import { useState } from 'react';
import { ids } from '../lib/track';

const TYPES = [
  {
    id: 'blocked',
    label: 'Site not loading',
    subject: 'e.g. the site would not open this morning',
    body: 'When it started and stopped, which network you were on, and whether it was the whole site or one page.',
  },
  {
    id: 'bug',
    label: 'Bug',
    subject: 'e.g. Duck Life 3 will not load',
    body: 'What happened, what you expected, and which page it was on.',
  },
  {
    id: 'game',
    label: 'Add something',
    subject: 'e.g. Add Retro Bowl',
    body: 'The name of it, and a link to where it can be opened if you have one.',
  },
  {
    id: 'suggestion',
    label: 'Suggestion',
    subject: 'e.g. Sort the library by newest',
    body: 'What would make the site better.',
  },
  { id: 'other', label: 'Other', subject: 'What is it about?', body: 'Your message.' },
] as const;

type TypeId = (typeof TYPES)[number]['id'];

const BLOCKED_TEMPLATE =
  'Date and time it started: \n' +
  'Date and time it worked again: \n' +
  'Network (school, home, phone data): \n' +
  'What would not load (whole site, one page): \n' +
  'Any message on screen: \n';

const SUBJECT_MAX = 120;
const BODY_MAX = 3000;

type Status = { kind: 'idle' | 'sending' | 'sent' | 'error'; text?: string };

export default function Contact() {
  const [type, setType] = useState<TypeId>('blocked');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState(BLOCKED_TEMPLATE);
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const current = TYPES.find((option) => option.id === type) ?? TYPES[0];

  const changeType = (next: TypeId) => {
    setType(next);
    if (next === 'blocked' && !body.trim()) setBody(BLOCKED_TEMPLATE);
    if (next !== 'blocked' && body === BLOCKED_TEMPLATE) setBody('');
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (type === 'blocked' && body.trim() === BLOCKED_TEMPLATE.trim()) {
      setStatus({ kind: 'error', text: 'Fill in at least one line of the template.' });
      return;
    }

    const { sid, vid } = ids();
    if (!sid || !vid) {
      setStatus({ kind: 'error', text: 'Storage is blocked in this browser, so the form cannot send.' });
      return;
    }

    setStatus({ kind: 'sending' });
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sid,
          vid,
          type,
          subject,
          body,
          website,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus({ kind: 'error', text: data.error ?? 'That did not send.' });
        return;
      }
      setStatus({ kind: 'sent', text: 'Sent. Thanks, the owner reads every one.' });
      setSubject('');
      setBody(type === 'blocked' ? BLOCKED_TEMPLATE : '');
    } catch {
      setStatus({ kind: 'error', text: 'No connection. Try again in a moment.' });
    }
  }

  return (
    <section className="section contact">
      <header className="section-head">
        <div>
          <h2>Contact</h2>
          <p>
            Report a bug, ask for something, or tell us when the site would not load. Only the owner
            reads these.
          </p>
        </div>
      </header>

      <form className="panel contact-form" onSubmit={submit}>
        <label className="contact-field">
          <span>Type</span>
          <select className="field" value={type} onChange={(event) => changeType(event.target.value as TypeId)}>
            {TYPES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="contact-field">
          <span>Subject</span>
          <input
            className="field"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder={current.subject}
            maxLength={SUBJECT_MAX}
            required
          />
        </label>

        <label className="contact-field">
          <span>Body</span>
          <textarea
            className="field contact-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={current.body}
            maxLength={BODY_MAX}
            rows={8}
            required
          />
          <small className="contact-count">{BODY_MAX - body.length} characters left</small>
        </label>

        <label className="visually-hidden" aria-hidden="true">
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </label>

        <div className="contact-actions">
          <button type="submit" className="button" disabled={status.kind === 'sending'}>
            {status.kind === 'sending' ? 'Sending…' : 'Send'}
          </button>
          {status.text && (
            <p className={`contact-status is-${status.kind}`} role="status">
              {status.text}
            </p>
          )}
        </div>

        <p className="contact-privacy">
          Please leave out your full name, email and phone number. Each message is kept with the time
          it was sent, your time zone and this browser's random id, and nothing else.
        </p>
      </form>
    </section>
  );
}

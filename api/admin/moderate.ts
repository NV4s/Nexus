import { redis, requireAdmin, send, type Req, type Res } from '../_lib.js';

const MOD = 'mod';
const UUID = /^[0-9a-f-]{36}$/;


export const TROLLS = ['message', 'shake', 'flip', 'invert'] as const;
export type Troll = (typeof TROLLS)[number];

const MAX_TEXT = 200;


export default async function handler(req: Req, res: Res) {
  if (!(await requireAdmin(req, res))) return;
  if (req.method !== 'POST') return send(res, 405);

  const body = (req.body ?? {}) as Record<string, unknown>;
  const action = String(body.action ?? '');
  const id = typeof body.id === 'string' ? body.id : '';


  const NEEDS_ID = ['block', 'unblock', 'mute', 'unmute', 'troll'];
  const valid = UUID.test(id) || /^[0-9a-f]{8}$/.test(id);
  if (NEEDS_ID.includes(action) && !valid) {
    return send(res, 400, { error: 'Bad id.' });
  }

  switch (action) {
    case 'list': {
      const [raw] = (await redis([['HGETALL', MOD]])) ?? [];
      const flat = Array.isArray(raw) ? raw.map(String) : [];
      const blocked: string[] = [];
      const muted: string[] = [];
      let chatOff = false;
      for (let i = 0; i < flat.length; i += 2) {
        const [field, value] = [flat[i], flat[i + 1]];
        if (field === 'chatOff') chatOff = Boolean(value);
        else if (field.startsWith('b:')) blocked.push(field.slice(2));
        else if (field.startsWith('m:')) muted.push(field.slice(2));
      }
      return send(res, 200, { blocked, muted, chatOff });
    }

    case 'block':
      await redis([['HSET', MOD, `b:${id}`, String(Date.now())]]);
      return send(res, 200, { blocked: id });

    case 'unblock':
      await redis([['HDEL', MOD, `b:${id}`]]);
      return send(res, 200, { unblocked: id });

    case 'mute':
      await redis([['HSET', MOD, `m:${id}`, String(Date.now())]]);
      return send(res, 200, { muted: id });

    case 'unmute':
      await redis([['HDEL', MOD, `m:${id}`]]);
      return send(res, 200, { unmuted: id });

    case 'troll': {
      const kind = String(body.kind ?? '') as Troll;
      if (!TROLLS.includes(kind)) return send(res, 400, { error: 'Unknown prank.' });
      const text = String(body.text ?? '').slice(0, MAX_TEXT);
      if (kind === 'message' && !text.trim()) return send(res, 400, { error: 'Say something.' });



      await redis([['HSET', MOD, `t:${id}`, JSON.stringify({ kind, text, at: Date.now() })]]);
      return send(res, 200, { sent: kind });
    }

    case 'chatOff':
      await redis([['HSET', MOD, 'chatOff', '1']]);
      return send(res, 200, { chatOff: true });

    case 'chatOn':
      await redis([['HDEL', MOD, 'chatOff']]);
      return send(res, 200, { chatOff: false });

    default:
      return send(res, 400, { error: 'Unknown action.' });
  }
}

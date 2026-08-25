import { clearedCookie, send, type Req, type Res } from '../_lib.js';

export default function handler(_req: Req, res: Res) {
  res.setHeader('set-cookie', clearedCookie());
  return send(res, 204);
}

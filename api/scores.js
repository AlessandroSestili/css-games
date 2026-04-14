// Upstash Redis REST API — no npm needed, plain fetch
// Env vars injected automatically when Vercel KV is linked to this project:
//   KV_REST_API_URL, KV_REST_API_TOKEN

async function redis(...args) {
  const res = await fetch(process.env.KV_REST_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const game = (req.query.game || 'memory-glitch').replace(/[^a-z0-9-]/g, '');
  const key  = `scores:${game}`;

  // ── GET — top 10 ──────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const raw = await redis('ZREVRANGE', key, '0', '9', 'WITHSCORES');
      // raw = [member, score, member, score, ...]
      const scores = [];
      for (let i = 0; i < raw.length; i += 2) {
        try {
          const data = JSON.parse(raw[i]);
          scores.push({ ...data, score: Number(raw[i + 1]) });
        } catch { /* skip malformed */ }
      }
      return res.status(200).json(scores);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── POST — submit score ───────────────────────────────────────
  if (req.method === 'POST') {
    const { name, score, moves, time } = req.body ?? {};
    const cleanName = String(name ?? '').trim().slice(0, 20);
    const numScore  = Math.max(0, Math.min(99999, Number(score)));

    if (!cleanName || !numScore) {
      return res.status(400).json({ error: 'name and score required' });
    }

    const member = JSON.stringify({
      name: cleanName,
      moves: Number(moves) || 0,
      time: String(time || ''),
      date: new Date().toISOString().split('T')[0],
    });

    try {
      await redis('ZADD', key, String(numScore), member);
      return res.status(201).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

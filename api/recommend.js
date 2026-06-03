export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { messages, system, max_tokens } = req.body;
    if (!messages || !system) return res.status(400).json({ error: 'Missing fields' });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28000);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: max_tokens || 4096,
        system,
        messages,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error || 'API error' });
    return res.status(200).json(data);
  } catch (err) {
    if (err.name === 'AbortError') return res.status(504).json({ error: 'Request timeout' });
    return res.status(500).json({ error: err.message });
  }
}

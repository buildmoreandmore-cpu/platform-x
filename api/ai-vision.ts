import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// ~5MB in base64 ≈ 6,800,000 characters (base64 encodes 3 bytes as 4 chars)
const MAX_BASE64_LENGTH = 6_800_000;

const EXTRACTION_PROMPT = `You are an energy auditor. Extract equipment data from this photo.
Return ONLY a valid JSON object with these fields (use null for any field not visible):
{
  "type": "equipment type (e.g. Chiller, AHU, Boiler, Pump, etc.)",
  "manufacturer": "brand/manufacturer name",
  "model": "model number",
  "serialNumber": "serial number",
  "yearInstalled": "year as string or null",
  "condition": "Good | Fair | Poor | Critical",
  "refrigerant": "refrigerant type if applicable",
  "capacity": "capacity with units if visible",
  "notes": "any other relevant observations",
  "category": "one of: HVAC | Lighting | Controls | Envelope | Water | Renewables | Mechanical System | Electrical System | Other",
  "floor": "floor or level if visible (e.g. 'B1', '2nd Floor', 'Roof')",
  "zone": "zone or area if visible (e.g. 'East Wing', 'Server Room')",
  "panel": "electrical panel ID if visible",
  "meter": "meter ID if visible"
}
Return only the JSON, no explanation.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' });
  }

  const { image, mediaType } = req.body;

  // ── Input validation ──────────────────────────────────────────────────────

  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "image" field — expected a base64 string' });
  }

  if (!mediaType || !ALLOWED_MEDIA_TYPES.includes(mediaType)) {
    return res.status(400).json({
      error: `Invalid "mediaType" — must be one of: ${ALLOWED_MEDIA_TYPES.join(', ')}`,
    });
  }

  if (image.length > MAX_BASE64_LENGTH) {
    return res.status(413).json({ error: 'Image too large — maximum 5MB' });
  }

  // ── Call Anthropic Vision API ─────────────────────────────────────────────

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: image },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        }],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error('[ai-vision] Anthropic API error:', anthropicRes.status, errBody);
      return res.status(502).json({ error: 'AI extraction failed', detail: errBody });
    }

    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text || '{}';

    let extracted: any = {};
    try {
      const match = text.match(/\{[\s\S]*\}/);
      extracted = match ? JSON.parse(match[0]) : {};
    } catch {
      extracted = {};
    }

    return res.status(200).json({ extracted });
  } catch (err: any) {
    console.error('[ai-vision] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

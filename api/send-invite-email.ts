import type { VercelRequest, VercelResponse } from '@vercel/node';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY || '';
const GMAIL_CONNECTION_ID = process.env.GMAIL_CONNECTION_ID || '18437286-5cc1-41c1-b414-2463391436eb';
const SITE_URL = process.env.SITE_URL || 'https://2kb-intelligence.vercel.app';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple API key auth to prevent abuse
  const authHeader = req.headers['x-api-key'];
  if (INTERNAL_API_KEY && authHeader !== INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { clientName, clientEmail, projectName, inviteToken, invitedBy } = req.body;

  if (!clientEmail || !inviteToken) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const inviteUrl = `${SITE_URL}/client/accept?token=${inviteToken}`;

  const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0B1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0;">
        2KB <span style="color:#37BB26;font-weight:300;letter-spacing:0.15em;">Intelligence</span>
      </h1>
    </div>

    <!-- Card -->
    <div style="background:#121C35;border:1px solid #1E2A45;border-radius:16px;padding:32px;margin-bottom:24px;">
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 8px;">
        You've Been Invited
      </h2>
      <p style="color:#7A8BA8;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Hi ${clientName || 'there'},<br><br>
        You've been invited to access the <strong style="color:#37BB26;">${projectName || 'project'}</strong> portal on 2KB Intelligence. This gives you real-time visibility into your project's progress, savings, and key milestones.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${inviteUrl}" style="display:inline-block;background:#0D918C;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px;font-weight:600;">
          Accept Invite &amp; Set Up Account
        </a>
      </div>

      <p style="color:#5A6B88;font-size:12px;line-height:1.6;margin:16px 0 0;text-align:center;">
        Or copy this link:<br>
        <span style="color:#7A8BA8;word-break:break-all;">${inviteUrl}</span>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;">
      <p style="color:#3A4860;font-size:11px;margin:0;">
        This invite was sent by ${invitedBy || 'your project team'} via 2KB Intelligence.<br>
        &copy; ${new Date().getFullYear()} 2KB Energy Services, LLC
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    // Send email via Composio Gmail
    const response = await fetch('https://backend.composio.dev/api/v2/actions/GMAIL_SEND_EMAIL/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': COMPOSIO_API_KEY,
      },
      body: JSON.stringify({
        connectedAccountId: GMAIL_CONNECTION_ID,
        input: {
          recipient_email: clientEmail,
          subject: `You're invited to the ${projectName || 'project'} portal — 2KB Intelligence`,
          message_body: emailBody,
          content_type: 'text/html',
        },
      }),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      console.error('Email send error:', result);
      return res.status(500).json({ error: 'Failed to send invite email', details: result.error });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Send invite email error:', err);
    return res.status(500).json({ error: err.message });
  }
}

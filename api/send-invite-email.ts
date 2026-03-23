import type { VercelRequest, VercelResponse } from '@vercel/node';
import { transporter, FROM, FROM_NAME } from './_mailer';

const SITE_URL = process.env.SITE_URL;

if (!SITE_URL) {
  throw new Error('Missing required environment variable: SITE_URL');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { clientName, clientEmail, projectName, inviteToken, invitedBy } = req.body;
  if (!clientEmail || !inviteToken) return res.status(400).json({ error: 'Missing required fields' });

  const inviteUrl = `${SITE_URL}/client/accept?token=${inviteToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0B1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0;">
        ${FROM_NAME}
      </h1>
    </div>
    <div style="background:#121C35;border:1px solid #1E2A45;border-radius:16px;padding:32px;margin-bottom:24px;">
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 8px;">You've Been Invited</h2>
      <p style="color:#7A8BA8;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Hi ${clientName || 'there'},<br><br>
        You've been invited to access the <strong style="color:#37BB26;">${projectName || 'project'}</strong> portal on ${FROM_NAME}. This gives you real-time visibility into your project's progress, savings, and key milestones.
      </p>
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
    <div style="text-align:center;">
      <p style="color:#3A4860;font-size:11px;margin:0;">
        This invite was sent by ${invitedBy || 'your project team'} via ${FROM_NAME}.<br>
        &copy; ${new Date().getFullYear()} ${FROM_NAME}
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: FROM,
      to: clientEmail,
      subject: `You're invited to the ${projectName || 'project'} portal — ${FROM_NAME}`,
      html,
    });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Send invite email error:', err);
    return res.status(500).json({ error: err.message });
  }
}

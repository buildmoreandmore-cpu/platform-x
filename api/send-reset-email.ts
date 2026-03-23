import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { transporter, FROM, FROM_NAME } from './_mailer';

const SITE_URL = process.env.SITE_URL;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SITE_URL || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing required environment variables: SITE_URL, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${SITE_URL}/reset-password` },
    });

    if (error || !data) {
      // Don't reveal whether email exists
      return res.status(200).json({ success: true });
    }

    const resetUrl = data.properties?.action_link || '';

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
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 8px;">Reset Your Password</h2>
      <p style="color:#7A8BA8;font-size:14px;line-height:1.6;margin:0 0 24px;">
        We received a request to reset the password for your ${FROM_NAME} account. Click the button below to create a new password.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#0D918C;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px;font-weight:600;">
          Reset Password
        </a>
      </div>
      <p style="color:#5A6B88;font-size:12px;line-height:1.6;margin:16px 0 0;text-align:center;">
        This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    <div style="text-align:center;">
      <p style="color:#3A4860;font-size:11px;margin:0;">
        &copy; ${new Date().getFullYear()} ${FROM_NAME}
      </p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `Reset your password — ${FROM_NAME}`,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Reset email error:', err);
    // Always return success
    return res.status(200).json({ success: true });
  }
}

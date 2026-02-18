import { Resend } from 'resend';
import logger from '../utils/logger';

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Send a password reset email. Returns true if sent, false if not.
 * Never throws — errors are logged internally.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
): Promise<boolean> {
  const client = getResendClient();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  if (!client) {
    logger.warn('RESEND_API_KEY not set — logging password reset link instead', {
      email,
      resetLink,
    });
    return false;
  }

  try {
    await client.emails.send({
      from: process.env.EMAIL_FROM || 'Habit Tracker <onboarding@resend.dev>',
      to: email,
      subject: 'Reset Your Password',
      html: buildResetEmailHtml(userName, resetLink),
    });

    logger.info('Password reset email sent', { email });
    return true;
  } catch (error) {
    logger.error('Failed to send password reset email', { email, error });
    return false;
  }
}

function buildResetEmailHtml(userName: string, resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background-color:#1e293b;border-radius:16px;border:1px solid #334155;padding:40px;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="width:48px;height:48px;background:linear-gradient(135deg,#0ea5e9,#0369a1);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;">
                <span style="font-size:24px;">✨</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">Reset Your Password</h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0;color:#94a3b8;font-size:15px;line-height:1.6;">
                Hi ${userName},
              </p>
              <p style="margin:12px 0 0;color:#94a3b8;font-size:15px;line-height:1.6;">
                We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong style="color:#e2e8f0;">15 minutes</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:10px;">
                Reset Password
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;border-top:1px solid #334155;padding-top:24px;">
              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          <tr>
            <td>
              <p style="margin:0;color:#475569;font-size:12px;">
                Habit Tracker
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

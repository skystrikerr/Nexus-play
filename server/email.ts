// Transactional email (password resets).
//
// Two providers are supported so there is a $0 path that can email ANY user:
//
//   * Brevo   — set BREVO_API_KEY. Free tier (300/day) can send to any
//               recipient once you verify a single sender address (no domain
//               purchase required). Preferred when both are configured.
//   * Resend  — set RESEND_API_KEY. Free tier can only email the account
//               owner until you verify a domain you own.
//
// With neither configured, messages are logged to the server console so the
// flow still works in local development.

const FROM_ADDRESS = process.env.EMAIL_FROM || "NexusPlay <onboarding@resend.dev>";

/** Split "Name <addr@example.com>" into its parts */
function parseFrom(value: string): { name: string; email: string } {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1] || "NexusPlay", email: match[2] };
  return { name: "NexusPlay", email: value.trim() };
}

async function sendViaBrevo(apiKey: string, to: string, subject: string, html: string) {
  const from = parseFrom(FROM_ADDRESS);
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: from.name, email: from.email },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Brevo send failed (${res.status}): ${await res.text()}`);
  }
}

async function sendViaResend(apiKey: string, to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  });
  if (!res.ok) {
    throw new Error(`Resend send failed (${res.status}): ${await res.text()}`);
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const brevoKey = process.env.BREVO_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (brevoKey) return sendViaBrevo(brevoKey, to, subject, html);
  if (resendKey) return sendViaResend(resendKey, to, subject, html);

  console.log(`[email] No email provider configured — would have sent to ${to}: ${subject}`);
  console.log(`[email] Body:\n${html}`);
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  await sendEmail(
    to,
    "Confirm your NexusPlay email",
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Welcome to NexusPlay 🎮</h2>
      <p>Confirm this email address to secure your account. The link expires in 24 hours.</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background: linear-gradient(135deg, #14B8A6, #8B5CF6); color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Confirm Email</a>
      </p>
      <p style="color: #64748B; font-size: 13px;">If the button doesn't work, paste this into your browser:<br>${verifyUrl}</p>
      <p style="color: #64748B; font-size: 13px;">If you didn't create a NexusPlay account, you can safely ignore this email.</p>
    </div>
    `
  );
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await sendEmail(
    to,
    "Reset your NexusPlay password",
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Reset your password</h2>
      <p>Someone requested a password reset for your NexusPlay account. If this was you, click the button below. The link expires in 1 hour.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: linear-gradient(135deg, #14B8A6, #8B5CF6); color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
      </p>
      <p style="color: #64748B; font-size: 13px;">If the button doesn't work, paste this into your browser:<br>${resetUrl}</p>
      <p style="color: #64748B; font-size: 13px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
    </div>
    `
  );
}

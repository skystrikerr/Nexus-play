// Minimal email sender. Uses Resend (https://resend.com) when RESEND_API_KEY is
// set; otherwise logs the message to the server console so the flow still works
// in local development.

const FROM_ADDRESS = process.env.EMAIL_FROM || "NexusPlay <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email] RESEND_API_KEY not set — would have sent to ${to}: ${subject}`);
    console.log(`[email] Body:\n${html}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Email send failed (${res.status}): ${body}`);
  }
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
      <p style="color: #64748B; font-size: 13px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
    </div>
    `
  );
}

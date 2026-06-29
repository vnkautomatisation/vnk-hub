import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export async function sendOrderEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[mock email] to=${to} subject=${subject}`);
    return { mocked: true };
  }

  return resend.emails.send({
    from: process.env.FROM_EMAIL ?? "noreply@vnk.local",
    to,
    subject,
    html,
  });
}

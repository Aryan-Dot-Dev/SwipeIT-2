// Shared helper: sends email via Brevo Transactional Email API
// Import in other edge functions as:
//   import { sendEmail } from "../_shared/resend.ts"

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? ""
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "swipeitai@gmail.com"
const FROM_NAME = "SwipeIT"

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.error("[send-email] BREVO_API_KEY not set")
    return false
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[send-email] Brevo error:", err)
    return false
  }
  console.log("[send-email] Email sent to", to, "subject:", subject)
  return true
}

// ── Email Templates ──────────────────────────────────────────────────────────

export function welcomeEmailHtml(name: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#F6F5FA;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(154,140,242,0.1);border:1px solid #E4DFF5;">
      <div style="background:linear-gradient(135deg,#9A8CF2,#6ED7A5);padding:40px 32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">SwipeIT</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Where Talent Meets Opportunity</p>
      </div>
      <div style="padding:40px 32px;">
        <h2 style="color:#1C1A2E;font-size:22px;margin:0 0 16px;">Welcome aboard, ${name}! 🎉</h2>
        <p style="color:#6E6B86;line-height:1.6;margin:0 0 24px;">
          You've joined SwipeIT — the smarter way to hire and get hired. Here's what you can do:
        </p>
        <div style="background:#F6F5FA;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 12px;color:#1C1A2E;font-weight:600;">✨ Swipe through opportunities</p>
          <p style="margin:0 0 12px;color:#1C1A2E;font-weight:600;">🤝 Get matched with the right people</p>
          <p style="margin:0;color:#1C1A2E;font-weight:600;">🧠 AI-powered profile insights</p>
        </div>
        <a href="https://swipe-it-2.vercel.app/dashboard"
           style="display:inline-block;background:linear-gradient(135deg,#9A8CF2,#6ED7A5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;">
          Go to Dashboard →
        </a>
      </div>
      <div style="padding:24px 32px;border-top:1px solid #E4DFF5;text-align:center;">
        <p style="color:#6E6B86;font-size:12px;margin:0;">SwipeIT · Swipe. Match. Get Hired.</p>
      </div>
    </div>
  </body>
  </html>`
}

export function applicationStatusHtml(candidateName: string, jobTitle: string, status: "shortlisted" | "rejected"): string {
  const isAccepted = status === "shortlisted"
  const emoji = isAccepted ? "🎉" : "📋"
  const statusText = isAccepted ? "shortlisted" : "not selected"
  const color = isAccepted ? "#6ED7A5" : "#9A8CF2"

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#F6F5FA;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(154,140,242,0.1);border:1px solid #E4DFF5;">
      <div style="background:linear-gradient(135deg,#9A8CF2,#6ED7A5);padding:40px 32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">SwipeIT</h1>
      </div>
      <div style="padding:40px 32px;">
        <h2 style="color:#1C1A2E;font-size:22px;margin:0 0 16px;">${emoji} Application Update</h2>
        <p style="color:#6E6B86;line-height:1.6;margin:0 0 16px;">Hi ${candidateName},</p>
        <p style="color:#6E6B86;line-height:1.6;margin:0 0 24px;">
          Your application for <strong style="color:#1C1A2E;">${jobTitle}</strong> has been reviewed.
          You have been <span style="color:${color};font-weight:700;">${statusText}</span>.
        </p>
        ${isAccepted ? `
        <div style="background:#F0FDF4;border:1px solid rgba(110,215,165,0.4);border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0;color:#1C1A2E;font-weight:600;">🌟 The recruiter is interested in your profile! Log in to see next steps and chat.</p>
        </div>
        <a href="https://swipe-it-2.vercel.app/dashboard"
           style="display:inline-block;background:linear-gradient(135deg,#9A8CF2,#6ED7A5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;">
          View on Dashboard →
        </a>` : `
        <p style="color:#6E6B86;font-size:14px;">Don't be discouraged — keep swiping! There are many more opportunities on SwipeIT.</p>
        <a href="https://swipe-it-2.vercel.app/dashboard"
           style="display:inline-block;background:linear-gradient(135deg,#9A8CF2,#6ED7A5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;">
          Browse More Jobs →
        </a>`}
      </div>
      <div style="padding:24px 32px;border-top:1px solid #E4DFF5;text-align:center;">
        <p style="color:#6E6B86;font-size:12px;margin:0;">SwipeIT · Swipe. Match. Get Hired.</p>
      </div>
    </div>
  </body>
  </html>`
}

export function matchEmailHtml(recipientName: string, otherName: string, jobTitle: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#F6F5FA;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(154,140,242,0.1);border:1px solid #E4DFF5;">
      <div style="background:linear-gradient(135deg,#9A8CF2,#6ED7A5);padding:40px 32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;">SwipeIT</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:18px;">It's a Match! 🎉</p>
      </div>
      <div style="padding:40px 32px;text-align:center;">
        <div style="font-size:64px;margin-bottom:24px;">💚</div>
        <h2 style="color:#1C1A2E;font-size:22px;margin:0 0 16px;">You matched with ${otherName}!</h2>
        <p style="color:#6E6B86;line-height:1.6;margin:0 0 8px;">For the role: <strong style="color:#1C1A2E;">${jobTitle}</strong></p>
        <p style="color:#6E6B86;line-height:1.6;margin:0 0 32px;">
          Both sides swiped right — now it's time to connect. Start a conversation on SwipeIT!
        </p>
        <a href="https://swipe-it-2.vercel.app/dashboard"
           style="display:inline-block;background:linear-gradient(135deg,#9A8CF2,#6ED7A5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;">
          Start Chatting →
        </a>
      </div>
      <div style="padding:24px 32px;border-top:1px solid #E4DFF5;text-align:center;">
        <p style="color:#6E6B86;font-size:12px;margin:0;">SwipeIT · Swipe. Match. Get Hired.</p>
      </div>
    </div>
  </body>
  </html>`
}

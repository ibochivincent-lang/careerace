/**
 * Career Ace Sovereign Email Dispatch Engine via Resend
 * 
 * Supports custom domain transactional sending (e.g. notifications@yourdomain.com)
 * for candidate OTP codes, recruiter application dispatches, and interview alerts.
 */

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  reply_to?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  provider: "resend" | "mock_fallback";
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY || "";
  const configuredFrom =
    options.from ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    "Career Ace <notifications@careerace.online>"; // Verified custom domain on Resend

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not configured in environment. Running in safe mock fallback mode.");
    return {
      success: true,
      id: `mock_email_${Date.now()}`,
      provider: "mock_fallback",
    };
  }

  try {
    const toRecipients = Array.isArray(options.to) ? options.to : [options.to];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: configuredFrom,
        to: toRecipients,
        subject: options.subject,
        html: options.html,
        text: options.text || options.subject,
        reply_to: options.reply_to,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[email/resend] Failed to send email:", data);
      return {
        success: false,
        error: data.message || data.error || "Resend API error",
        provider: "resend",
      };
    }

    return {
      success: true,
      id: data.id,
      provider: "resend",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[email/resend] Exception while dispatching email:", message);
    return {
      success: false,
      error: message,
      provider: "resend",
    };
  }
}

/**
 * Format and send an autonomous Track A job application email to recruiter
 */
export async function sendApplicationDispatchEmail({
  to,
  candidateName,
  candidateEmail,
  jobTitle,
  company,
  coverLetter,
  passportUrl,
  fitScore,
}: {
  to: string;
  candidateName: string;
  candidateEmail?: string;
  jobTitle: string;
  company: string;
  coverLetter: string;
  passportUrl: string;
  fitScore: number;
}): Promise<SendEmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 24px; color: white; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
          .header p { margin: 4px 0 0 0; opacity: 0.9; font-size: 13px; }
          .content { padding: 24px; }
          .badge { display: inline-block; background: #eff6ff; color: #2563eb; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; border: 1px solid #bfdbfe; }
          .cover-letter { background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; font-size: 14px; white-space: pre-wrap; margin: 16px 0; color: #334155; }
          .cta-btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 12px; }
          .footer { padding: 16px 24px; background: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application for ${jobTitle}</h1>
            <p>Candidate: ${candidateName} &bull; Target: ${company}</p>
          </div>
          <div class="content">
            <span class="badge">Fit Score: ${fitScore}/10 &bull; Verified via Career Ace</span>
            
            <p>Dear Hiring Team at <strong>${company}</strong>,</p>
            
            <div class="cover-letter">${coverLetter}</div>

            <p style="margin-top: 20px;">
              You can verify ${candidateName}'s cryptographically sealed competencies, verified repositories, and STAR+R interview assessments directly on their sovereign Career Ace Passport:
            </p>

            <a href="${passportUrl}" class="cta-btn" target="_blank">View Verified Candidate Passport &rarr;</a>

            ${candidateEmail ? `<p style="font-size: 12px; color: #64748b; margin-top: 24px;">Direct Contact: <a href="mailto:${candidateEmail}">${candidateEmail}</a></p>` : ""}
          </div>
          <div class="footer">
            Dispatched via Career Ace Sovereign Autonomous Career Agent &bull; Powered by Sui & Walrus Storage
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Application: ${candidateName} - ${jobTitle} at ${company}`,
    html,
    text: `${coverLetter}\n\nCandidate Passport: ${passportUrl}`,
    reply_to: candidateEmail,
  });
}

/**
 * Generates an RFC-compliant mailto URI for instant 1-click desktop/mobile client dispatch.
 */
export function generateMailtoUrl({
  to,
  subject,
  body,
  cc,
}: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
}): string {
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  if (cc) params.push(`cc=${encodeURIComponent(cc)}`);

  const query = params.length > 0 ? `?${params.join("&")}` : "";
  return `mailto:${encodeURIComponent(to)}${query}`;
}

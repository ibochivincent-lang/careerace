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
  provider: "resend" | "brevo" | "sendgrid" | "mailersend";
  keyIndex?: number;
  totalKeysAttempted?: number;
  failoverOccurred?: boolean;
}

/**
 * Extracts and deduplicates all configured Resend API keys.
 * Supports:
 * - Comma-separated RESEND_API_KEYS (e.g. "re_key1,re_key2")
 * - Comma-separated RESEND_API_KEY (e.g. "re_key1,re_key2")
 * - Numbered/Secondary keys: RESEND_API_KEY_2, RESEND_API_KEY_3, RESEND_API_KEY_SECONDARY, RESEND_BACKUP_API_KEY
 */
export function getResendApiKeys(): string[] {
  const keys: string[] = [];

  const addKey = (raw?: string) => {
    if (!raw) return;
    for (const part of raw.split(",")) {
      const trimmed = part.trim();
      if (trimmed && !keys.includes(trimmed)) {
        keys.push(trimmed);
      }
    }
  };

  addKey(process.env.RESEND_API_KEYS);
  addKey(process.env.RESEND_API_KEY);
  addKey(process.env.RESEND_API_KEY_2);
  addKey(process.env.RESEND_API_KEY_3);
  addKey(process.env.RESEND_API_KEY_SECONDARY);
  addKey(process.env.RESEND_BACKUP_API_KEY);

  return keys;
}

/**
 * Dispatches an email via Twilio SendGrid REST API (100 free emails/day forever)
 */
async function sendViaSendGrid(
  apiKey: string,
  options: SendEmailOptions,
  fromEmail: string,
  fromName: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const toRecipients = (Array.isArray(options.to) ? options.to : [options.to]).map((email) => ({
      email: email.trim(),
    }));

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: toRecipients }],
        from: { email: fromEmail, name: fromName },
        subject: options.subject,
        content: [
          { type: "text/plain", value: options.text || options.subject },
          { type: "text/html", value: options.html },
        ],
        reply_to: options.reply_to ? { email: options.reply_to } : undefined,
      }),
    });

    if (response.status === 200 || response.status === 202) {
      const msgId = response.headers.get("x-message-id") || `sg-${Date.now()}`;
      return { success: true, id: msgId };
    }

    const data = await response.json().catch(() => ({}));
    const errMsg = data?.errors?.[0]?.message || `SendGrid HTTP ${response.status}`;
    return { success: false, error: errMsg };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Dispatches an email via MailerSend REST API (3,000 free emails/month)
 */
async function sendViaMailerSend(
  apiKey: string,
  options: SendEmailOptions,
  fromEmail: string,
  fromName: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const toRecipients = (Array.isArray(options.to) ? options.to : [options.to]).map((email) => ({
      email: email.trim(),
    }));

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: { email: fromEmail, name: fromName },
        to: toRecipients,
        subject: options.subject,
        html: options.html,
        text: options.text || options.subject,
        reply_to: options.reply_to ? { email: options.reply_to } : undefined,
      }),
    });

    if (response.status === 200 || response.status === 202) {
      const msgId = response.headers.get("x-message-id") || `ms-${Date.now()}`;
      return { success: true, id: msgId };
    }

    const data = await response.json().catch(() => ({}));
    const errMsg = data?.message || `MailerSend HTTP ${response.status}`;
    return { success: false, error: errMsg };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Dispatches an email via Brevo (Sendinblue) transactional REST API
 */
async function sendViaBrevo(
  apiKey: string,
  options: SendEmailOptions,
  fromEmail: string,
  fromName: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const toRecipients = (Array.isArray(options.to) ? options.to : [options.to]).map((email) => ({
      email: email.trim(),
    }));

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: toRecipients,
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text || options.subject,
        replyTo: options.reply_to ? { email: options.reply_to } : undefined,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMessage = data?.message || data?.error || `Brevo HTTP ${response.status}`;
      return { success: false, error: errMessage };
    }

    return {
      success: true,
      id: data?.messageId || `brevo-${Date.now()}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Dispatches an email via Resend REST API
 */
async function sendViaResend(
  apiKey: string,
  options: SendEmailOptions,
  configuredFrom: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const toRecipients = Array.isArray(options.to) ? options.to : [options.to];

    let response = await fetch("https://api.resend.com/emails", {
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

    let data = await response.json().catch(() => ({}));

    // If domain verification failed and custom from was used, fallback retry once with onboarding@resend.dev
    if (
      !response.ok &&
      data?.message &&
      typeof data.message === "string" &&
      data.message.toLowerCase().includes("domain") &&
      !configuredFrom.includes("onboarding@resend.dev")
    ) {
      console.warn("[email/resend] Custom domain not verified on Resend. Retrying via onboarding@resend.dev...");
      const retryResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Career Ace <onboarding@resend.dev>",
          to: toRecipients,
          subject: options.subject,
          html: options.html,
          text: options.text || options.subject,
          reply_to: options.reply_to,
        }),
      });
      if (retryResponse.ok) {
        data = await retryResponse.json().catch(() => ({}));
        response = retryResponse;
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.message || data?.error || `Resend HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      id: data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const resendKeys = getResendApiKeys();
  const sendgridKey = (process.env.SENDGRID_API_KEY || "").trim();
  const mailersendKey = (process.env.MAILERSEND_API_KEY || "").trim();
  const brevoKey = (process.env.BREVO_API_KEY || process.env.SIB_API_KEY || "").trim();

  const configuredFrom =
    options.from ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.SENDGRID_FROM_EMAIL ||
    process.env.MAILERSEND_FROM_EMAIL ||
    process.env.BREVO_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    "Career Ace <notifications@careerace.online>";

  const fromEmail =
    configuredFrom.includes("<")
      ? configuredFrom.match(/<([^>]+)>/)?.[1] || configuredFrom
      : configuredFrom;
  const fromName =
    process.env.EMAIL_FROM_NAME ||
    (configuredFrom.includes("<") ? configuredFrom.split("<")[0].trim() : "Career Ace");

  if (resendKeys.length === 0 && !sendgridKey && !mailersendKey && !brevoKey) {
    console.warn("[email] No email provider API keys configured in environment. Refusing to send mock data.");
    return {
      success: false,
      error: "No email provider configured. Configure RESEND_API_KEY (or multiple keys like RESEND_API_KEY_2) in Vercel or .env.local to enable live transactional email delivery.",
      provider: "resend",
    };
  }

  // 1. Primary path: Resend (with multi-key rotation and failover)
  if (resendKeys.length > 0) {
    let lastResendError = "";
    for (let i = 0; i < resendKeys.length; i++) {
      const currentKey = resendKeys[i];
      const resendResult = await sendViaResend(currentKey, options, configuredFrom);
      if (resendResult.success) {
        return {
          success: true,
          id: resendResult.id,
          provider: "resend",
          keyIndex: i + 1,
          totalKeysAttempted: i + 1,
          failoverOccurred: i > 0,
        };
      }

      lastResendError = resendResult.error || "Resend API error";
      console.warn(`[email/resend] Key #${i + 1} of ${resendKeys.length} failed (${lastResendError}).`);
      if (i + 1 < resendKeys.length) {
        console.info(`[email/resend] Rotating to Resend Key #${i + 2}...`);
      }
    }

    console.warn(`[email] All ${resendKeys.length} Resend key(s) failed. Checking fallback providers...`);

    // Fallback A: SendGrid (100 free emails/day)
    if (sendgridKey) {
      console.info("[email] Failover: Dispatching via SendGrid secondary provider...");
      const sgResult = await sendViaSendGrid(sendgridKey, options, fromEmail, fromName);
      if (sgResult.success) {
        return {
          success: true,
          id: sgResult.id,
          provider: "sendgrid",
          failoverOccurred: true,
        };
      }
    }

    // Fallback B: MailerSend (3,000 free emails/month)
    if (mailersendKey) {
      console.info("[email] Failover: Dispatching via MailerSend secondary provider...");
      const msResult = await sendViaMailerSend(mailersendKey, options, fromEmail, fromName);
      if (msResult.success) {
        return {
          success: true,
          id: msResult.id,
          provider: "mailersend",
          failoverOccurred: true,
        };
      }
    }

    // Fallback C: Brevo
    if (brevoKey) {
      console.info("[email] Failover: Dispatching via Brevo secondary provider...");
      const brevoResult = await sendViaBrevo(brevoKey, options, fromEmail, fromName);
      if (brevoResult.success) {
        return {
          success: true,
          id: brevoResult.id,
          provider: "brevo",
          failoverOccurred: true,
        };
      }
    }

    return {
      success: false,
      error: `All ${resendKeys.length} Resend key(s) failed: ${lastResendError}`,
      provider: "resend",
      totalKeysAttempted: resendKeys.length,
    };
  }

  // 2. Direct SendGrid (if SENDGRID_API_KEY configured)
  if (sendgridKey) {
    const sgResult = await sendViaSendGrid(sendgridKey, options, fromEmail, fromName);
    if (sgResult.success) {
      return {
        success: true,
        id: sgResult.id,
        provider: "sendgrid",
      };
    }
    return {
      success: false,
      error: sgResult.error,
      provider: "sendgrid",
    };
  }

  // 3. Direct MailerSend (if MAILERSEND_API_KEY configured)
  if (mailersendKey) {
    const msResult = await sendViaMailerSend(mailersendKey, options, fromEmail, fromName);
    if (msResult.success) {
      return {
        success: true,
        id: msResult.id,
        provider: "mailersend",
      };
    }
    return {
      success: false,
      error: msResult.error,
      provider: "mailersend",
    };
  }

  // 4. Direct Brevo
  if (brevoKey) {
    const brevoResult = await sendViaBrevo(brevoKey, options, fromEmail, fromName);
    if (brevoResult.success) {
      return {
        success: true,
        id: brevoResult.id,
        provider: "brevo",
      };
    }
    return {
      success: false,
      error: brevoResult.error,
      provider: "brevo",
    };
  }

  return {
    success: false,
    error: "No provider handled the request.",
    provider: "resend",
  };
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

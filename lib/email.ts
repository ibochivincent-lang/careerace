/**
 * Career Ace Sovereign Email Dispatch Engine via Resend
 * 
 * Supports custom domain transactional sending (e.g. notifications@yourdomain.com)
 * for candidate OTP codes, recruiter application dispatches, and interview alerts.
 */

export interface SendEmailAttachment {
  filename: string;
  content?: string;
  path?: string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  reply_to?: string;
  attachments?: SendEmailAttachment[];
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
  addKey(process.env.RESEND_API_KEY_4);
  addKey(process.env.RESEND_API_KEY_5);
  addKey(process.env.RESEND_API_KEY_SECONDARY);
  addKey(process.env.RESEND_BACKUP_API_KEY);

  return keys;
}

/**
 * Resolves the from-email address configured for a specific Resend key index.
 * Dynamically supports RESEND_FROM_EMAIL_2, RESEND_FROM_EMAIL_3, etc.
 */
export function getResendFromEmail(keyIndex: number = 1): string {
  const dynamicEnv = (process.env as Record<string, string | undefined>)[`RESEND_FROM_EMAIL_${keyIndex}`];
  if (dynamicEnv && dynamicEnv.trim()) {
    return dynamicEnv.trim();
  }
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    "Career Ace <notifications@careerace.online>"
  ).trim();
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

    const bodyPayload: Record<string, any> = {
      personalizations: [{ to: toRecipients }],
      from: { email: fromEmail, name: fromName },
      subject: options.subject,
      content: [
        { type: "text/plain", value: options.text || options.subject },
        { type: "text/html", value: options.html },
      ],
      reply_to: options.reply_to ? { email: options.reply_to } : undefined,
    };

    if (options.attachments && options.attachments.length > 0) {
      bodyPayload.attachments = options.attachments
        .filter((a) => a.content)
        .map((a) => ({
          content: a.content,
          filename: a.filename,
          type: a.contentType || "application/pdf",
          disposition: "attachment",
        }));
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
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

    const bodyPayload: Record<string, any> = {
      from: { email: fromEmail, name: fromName },
      to: toRecipients,
      subject: options.subject,
      html: options.html,
      text: options.text || options.subject,
      reply_to: options.reply_to ? { email: options.reply_to } : undefined,
    };

    if (options.attachments && options.attachments.length > 0) {
      bodyPayload.attachments = options.attachments
        .filter((a) => a.content)
        .map((a) => ({
          content: a.content,
          filename: a.filename,
        }));
    }

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
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

    const bodyPayload: Record<string, any> = {
      sender: { name: fromName, email: fromEmail },
      to: toRecipients,
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text || options.subject,
      replyTo: options.reply_to ? { email: options.reply_to } : undefined,
    };

    if (options.attachments && options.attachments.length > 0) {
      bodyPayload.attachment = options.attachments.map((a) => {
        if (a.path && a.path.startsWith("http")) {
          return { url: a.path, name: a.filename };
        }
        return { content: a.content, name: a.filename };
      });
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(bodyPayload),
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

    const bodyPayload: Record<string, any> = {
      from: configuredFrom,
      to: toRecipients,
      subject: options.subject,
      html: options.html,
      text: options.text || options.subject,
      reply_to: options.reply_to,
    };

    if (options.attachments && options.attachments.length > 0) {
      bodyPayload.attachments = options.attachments.map((a) => {
        const item: Record<string, any> = { filename: a.filename };
        if (a.content) item.content = a.content;
        if (a.path) item.path = a.path;
        return item;
      });
    }

    let response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
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
      const fromForThisKey = options.from || getResendFromEmail(i + 1);
      const resendResult = await sendViaResend(currentKey, options, fromForThisKey);
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
 * Application email attachment interface
 */
export interface ApplicationAttachmentItem {
  id?: string;
  name: string;
  size?: number | string;
  blobId?: string;
  url?: string;
  category?: string;
}

export interface ApplicationEmailBuildOptions {
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  candidateLocation?: string;
  company?: string;
  role?: string;
  dateStr?: string;
  coverLetter: string;
  passportUrl?: string;
  walrusBlobId?: string;
  primaryCvName?: string;
  primaryCvSize?: number | string;
  primaryCvUrl?: string;
  attachments?: ApplicationAttachmentItem[];
  fitScore?: number;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatAttachmentSize(size?: number | string): string {
  if (!size) return "Verified Document";
  if (typeof size === "string") return size;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Builds the signature CareerAce responsive HTML email matching Image 2
 */
export function buildApplicationEmailHtml(options: ApplicationEmailBuildOptions): string {
  const candidateName = options.candidateName || "Candidate";
  const candidateEmail = options.candidateEmail || "applicant@careerace.online";
  const candidatePhone = options.candidatePhone || "";
  const candidateLocation = options.candidateLocation || "";
  const company = options.company || "Hiring Team";
  const role = options.role || "Target Role";
  const dateStr =
    options.dateStr ||
    new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const passportUrl =
    options.passportUrl ||
    (options.walrusBlobId
      ? `https://walruscan.com/mainnet/blob/${options.walrusBlobId}`
      : "https://careerace.online/verify");

  const primaryCvName =
    options.primaryCvName ||
    `${candidateName.replace(/\s+/g, "_")}_CV.pdf`;

  const primaryCvSize = formatAttachmentSize(options.primaryCvSize || 245000);
  const primaryCvUrl =
    options.primaryCvUrl ||
    (options.walrusBlobId
      ? `https://walruscan.com/mainnet/blob/${options.walrusBlobId}`
      : passportUrl);

  const walrusBlobId = options.walrusBlobId || "";

  const additionalAttachments = options.attachments || [];
  const additionalDocsHtml =
    additionalAttachments.length > 0
      ? additionalAttachments
          .map((att) => {
            const docSizeStr = formatAttachmentSize(att.size);
            const downloadUrl =
              att.url ||
              (att.blobId
                ? `https://walruscan.com/mainnet/blob/${att.blobId}`
                : passportUrl);
            return `
              <div style="background:#ffffff; border:1px solid #bbf7d0; border-radius:8px; padding:10px 14px; margin-bottom:8px; box-shadow:0 1px 2px rgba(0,0,0,0.02);">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:28px; vertical-align:middle;">
                      <span style="display:inline-block; width:26px; height:26px; line-height:26px; text-align:center; background:#f0fdf4; color:#15803d; border-radius:6px; font-size:13px; font-weight:bold;">&#128206;</span>
                    </td>
                    <td style="vertical-align:middle; padding-left:10px;">
                      <div style="font-size:12.5px; font-weight:600; color:#0f172a;">${escapeHtml(att.name)}</div>
                      <div style="font-size:10.5px; color:#64748b;">
                        ${docSizeStr} ${att.blobId ? `&bull; <span style="color:#16a34a; font-weight:600;">Walrus Stored</span>` : ""}
                      </div>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <a href="${downloadUrl}" target="_blank" style="display:inline-block; background:#f0fdf4; border:1px solid #86efac; color:#15803d; text-decoration:none; font-size:11px; font-weight:700; padding:4px 10px; border-radius:6px;">
                        View &darr;
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            `;
          })
          .join("")
      : "";

  const rawBody = (options.coverLetter || "").replace(/\r\n/g, "\n").trim();
  const rawParagraphs = rawBody.split(/\n\s*\n+/);

  const formattedBodyHtml = rawParagraphs
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return "";

      const lines = trimmed.split("\n");
      const isNumberedList =
        lines.length > 1 &&
        lines.every((l) => /^\s*(\d+\.|\-|\*|•)/.test(l.trim()));

      if (isNumberedList) {
        const listItems = lines
          .map((l) => {
            const itemContent = l.replace(/^\s*(\d+\.|\-|\*|•)\s*/, "");
            return `<li style="margin-bottom:6px; color:#334155; line-height:1.6;">${escapeHtml(itemContent)}</li>`;
          })
          .join("");
        return `<ol style="margin:12px 0 16px 20px; padding:0; color:#334155; font-size:14.5px; line-height:1.65;">${listItems}</ol>`;
      }

      const formattedLines = lines.map((l) => escapeHtml(l)).join("<br/>");
      return `<p style="margin:0 0 16px; font-size:14.5px; line-height:1.65; color:#334155;">${formattedLines}</p>`;
    })
    .filter(Boolean)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application for ${escapeHtml(role)} &bull; ${escapeHtml(candidateName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fa;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- BRAND HEADER WITH REAL LOGO -->
          <tr>
            <td align="left" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="https://careerace.online/careerace_logo.png" alt="CareerAce" width="38" height="38" style="display:block;width:38px;height:38px;border-radius:9px;object-fit:contain;" />
                  </td>
                  <td style="vertical-align:middle;padding-left:12px;">
                    <span style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Career<span style="color:#16a34a;">Ace</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 4px 16px rgba(0,0,0,0.04);overflow:hidden;padding:36px 32px;">

              <!-- CANDIDATE IDENTITY & CONTACT BANNER -->
              <div style="margin-bottom:22px;padding-bottom:18px;border-bottom:1px solid #f1f5f9;">
                <h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.4px;">
                  ${escapeHtml(candidateName)}
                </h1>
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
                  <a href="mailto:${escapeHtml(candidateEmail)}" style="color:#16a34a;text-decoration:none;font-weight:600;">${escapeHtml(candidateEmail)}</a>
                  ${candidatePhone ? ` &bull; <span>${escapeHtml(candidatePhone)}</span>` : ""}
                  ${candidateLocation ? ` &bull; <span>${escapeHtml(candidateLocation)}</span>` : ""}
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                  <tr>
                    <td align="left">
                      <span style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700;color:#15803d;">
                        Target: ${escapeHtml(role)} &bull; ${escapeHtml(company)}
                      </span>
                    </td>
                    <td align="right" style="font-size:12px;color:#94a3b8;font-weight:500;">
                      ${escapeHtml(dateStr)}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- COVER LETTER CONTENT -->
              <div style="margin-bottom:24px;">
                ${formattedBodyHtml}
              </div>

              <!-- ATTACHMENT SIDE: VERIFIED ATTACHMENTS & CREDENTIALS BOX -->
              <div style="background:#f0fdf4;border:1.5px dashed #86efac;border-radius:12px;padding:20px 22px;margin:28px 0 24px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                  <tr>
                    <td align="left" style="font-size:11px;font-weight:800;color:#15803d;text-transform:uppercase;letter-spacing:0.8px;">
                      Attachments &amp; Sovereign Credentials
                    </td>
                    <td align="right" style="font-size:10px;font-weight:700;color:#16a34a;font-family:'SFMono-Regular',Consolas,Liberation Mono,Menlo,monospace;">
                      ${walrusBlobId ? "WALRUS STORAGE SEALED" : "VERIFIED CANDIDATE ATTESTATION"}
                    </td>
                  </tr>
                </table>

                <!-- Primary CV Card -->
                <div style="background:#ffffff;border:1px solid #bbf7d0;border-radius:10px;padding:12px 14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:34px;vertical-align:middle;">
                        <div style="width:32px;height:32px;border-radius:8px;background:#dcfce7;text-align:center;line-height:32px;font-size:16px;">
                          &#128196;
                        </div>
                      </td>
                      <td style="vertical-align:middle;padding-left:12px;">
                        <div style="font-size:13px;font-weight:700;color:#0f172a;">${escapeHtml(primaryCvName)}</div>
                        <div style="font-size:11px;color:#64748b;margin-top:2px;">
                          ${primaryCvSize} &bull; <span style="color:#16a34a;font-weight:600;">Primary Curriculum Vitae</span>
                        </div>
                      </td>
                      <td align="right" style="vertical-align:middle;">
                        <a href="${primaryCvUrl}" target="_blank" style="display:inline-block;background:#16a34a;color:#ffffff !important;text-decoration:none;font-size:11px;font-weight:700;padding:7px 14px;border-radius:7px;">
                          Download CV &darr;
                        </a>
                      </td>
                    </tr>
                  </table>
                  ${
                    walrusBlobId
                      ? `
                  <div style="margin-top:10px;padding-top:8px;border-top:1px dashed #dcfce7;font-size:10.5px;color:#475569;font-family:'SFMono-Regular',Consolas,Liberation Mono,Menlo,monospace;">
                    Walrus Blob: <a href="https://walruscan.com/mainnet/blob/${walrusBlobId}" target="_blank" style="color:#16a34a;text-decoration:underline;">walruscan.com/mainnet/blob/${walrusBlobId.slice(0, 10)}...${walrusBlobId.slice(-8)}</a>
                  </div>`
                      : ""
                  }
                </div>

                <!-- Additional Uploaded Credentials/Certificates -->
                ${additionalDocsHtml}

                <p style="margin:10px 0 0 0;font-size:11px;color:#15803d;line-height:1.4;">
                  All credential documents are verified and accessible above.
                </p>
              </div>

              <!-- PRIMARY GREEN CTA BUTTON -->
              <table cellpadding="0" cellspacing="0" style="margin:24px 0 28px 0;">
                <tr>
                  <td align="left">
                    <a href="${passportUrl}"
                       style="display:inline-block;background-color:#16a34a;background:linear-gradient(135deg,#22c55e,#16a34a);color:#ffffff !important;text-decoration:none;font-size:14.5px;font-weight:700;padding:13px 28px;border-radius:10px;letter-spacing:-0.2px;box-shadow:0 4px 14px rgba(22,163,74,0.3);">
                      View Verified Candidate Passport &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- SIGN OFF -->
              <div style="margin-bottom:8px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">${escapeHtml(candidateName)}</p>
                <p style="margin:2px 0 0;font-size:13px;font-weight:600;color:#16a34a;">CareerAce Verified Candidate</p>
              </div>

            </td>
          </tr>

          <!-- MINIMAL BOTTOM PADDING -->
          <tr>
            <td align="center" style="padding-top:20px;padding-bottom:12px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                &copy; 2026 CareerAce. All rights reserved.
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

/**
 * Format and send an autonomous Track A job application email to recruiter
 */
export async function sendApplicationDispatchEmail({
  to,
  candidateName,
  candidateEmail,
  candidatePhone,
  candidateLocation,
  jobTitle,
  company,
  coverLetter,
  passportUrl,
  walrusBlobId,
  fitScore,
  attachments,
}: {
  to: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  candidateLocation?: string;
  jobTitle: string;
  company: string;
  coverLetter: string;
  passportUrl: string;
  walrusBlobId?: string;
  fitScore?: number;
  attachments?: ApplicationAttachmentItem[];
}): Promise<SendEmailResult> {
  const html = buildApplicationEmailHtml({
    candidateName,
    candidateEmail,
    candidatePhone,
    candidateLocation,
    role: jobTitle,
    company,
    coverLetter,
    passportUrl,
    walrusBlobId,
    fitScore,
    attachments,
  });

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

export interface DispatchReportItem {
  company: string;
  role: string;
  recipientEmail?: string;
  appliedAt?: string;
  followUpDue?: string;
  status?: string;
}

/**
 * Sends an executive daily dispatch summary report directly to the candidate's personal email
 */
export async function sendDailyDispatchReportEmail({
  candidateEmail,
  candidateName,
  dispatches,
  walrusCvSnapshotLabel,
  walrusBlobId,
}: {
  candidateEmail: string;
  candidateName: string;
  dispatches: DispatchReportItem[];
  walrusCvSnapshotLabel?: string;
  walrusBlobId?: string;
}): Promise<SendEmailResult> {
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const rowsHtml = dispatches
    .map(
      (d, i) => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:10px 8px;font-family:monospace;font-size:11px;color:#64748b;">${i + 1}</td>
      <td style="padding:10px 8px;font-size:13px;font-weight:600;color:#0f172a;">${escapeHtml(d.company)}</td>
      <td style="padding:10px 8px;font-size:12px;color:#334155;">${escapeHtml(d.role)}</td>
      <td style="padding:10px 8px;font-family:monospace;font-size:11px;color:#059669;">${escapeHtml(d.recipientEmail || "Direct Crewing Desk")}</td>
      <td style="padding:10px 8px;font-size:11px;color:#64748b;">${escapeHtml(d.followUpDue || "In 7 Days")}</td>
      <td style="padding:10px 8px;font-size:11px;font-weight:600;color:#059669;">Delivered</td>
    </tr>`
    )
    .join("");

  const rowsText = dispatches
    .map(
      (d, i) =>
        `${i + 1}. ${d.company} — ${d.role} (${d.recipientEmail || "Direct Desk"}) | Follow-up: ${d.followUpDue || "7 Days"}`
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#1e293b;background-color:#f8fafc;margin:0;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
    <tr>
      <td style="background:#0f172a;padding:24px;border-bottom:1px solid #334155;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:18px;font-weight:800;color:#f8fafc;letter-spacing:-0.02em;">CareerAce Dispatch Report</span>
          <span style="font-size:11px;font-family:monospace;background:#1e293b;color:#38bdf8;padding:4px 8px;border-radius:4px;border:1px solid #334155;">SUMMARY ATTESTATION</span>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px;">
        <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 8px;">
          Applications Dispatched for ${escapeHtml(candidateName)}
        </h2>
        <p style="font-size:13px;color:#64748b;margin:0 0 20px;">
          Date: ${escapeHtml(currentDate)} &bull; Primary CV: <strong>${escapeHtml(walrusCvSnapshotLabel || "Walrus Sovereign CV")}</strong>
          ${walrusBlobId ? ` &bull; Blob ID: <span style="font-family:monospace;font-size:11px;">${escapeHtml(walrusBlobId)}</span>` : ""}
        </p>

        <!-- METRIC CARDS -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="padding:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;text-align:center;width:33%;">
              <div style="font-size:22px;font-weight:800;color:#15803d;">${dispatches.length}</div>
              <div style="font-size:11px;font-weight:600;color:#166534;text-transform:uppercase;">Applications Sent</div>
            </td>
            <td style="width:10px;"></td>
            <td style="padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;text-align:center;width:33%;">
              <div style="font-size:22px;font-weight:800;color:#0f172a;">7 Days</div>
              <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Follow-up Cooldown</div>
            </td>
            <td style="width:10px;"></td>
            <td style="padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;text-align:center;width:33%;">
              <div style="font-size:22px;font-weight:800;color:#0284c7;">100%</div>
              <div style="font-size:11px;font-weight:600;color:#0369a1;text-transform:uppercase;">Relay Integrity</div>
            </td>
          </tr>
        </table>

        <!-- APPLICATIONS TABLE -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
              <th style="padding:8px;font-size:10px;text-align:left;color:#64748b;font-weight:700;">#</th>
              <th style="padding:8px;font-size:10px;text-align:left;color:#64748b;font-weight:700;">EMPLOYER</th>
              <th style="padding:8px;font-size:10px;text-align:left;color:#64748b;font-weight:700;">ROLE</th>
              <th style="padding:8px;font-size:10px;text-align:left;color:#64748b;font-weight:700;">DESK EMAIL</th>
              <th style="padding:8px;font-size:10px;text-align:left;color:#64748b;font-weight:700;">FOLLOW-UP</th>
              <th style="padding:8px;font-size:10px;text-align:left;color:#64748b;font-weight:700;">STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;color:#475569;line-height:1.6;">
          <strong>What happens next:</strong>
          <ul style="margin:6px 0 0;padding-left:18px;">
            <li>All recipient crewing desks have received your tailored CV, cover letter, and verified credentials.</li>
            <li>Direct replies from hiring managers will route directly to your email (<strong>${escapeHtml(candidateEmail)}</strong>).</li>
            <li>Your 7-day cooldown prevents accidental duplicate submissions. Calendar follow-ups (.ics) are available on your Application Board.</li>
          </ul>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8;">
        &copy; 2026 CareerAce. Decentralized Sovereign Career Protocol.
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `CareerAce Application Dispatch Summary Report
Date: ${currentDate}
Candidate: ${candidateName} (${candidateEmail})
Total Applications Sent Today: ${dispatches.length}

Dispatched Opportunities:
${rowsText}

Direct replies will connect to your inbox (${candidateEmail}).
View full status and cooldown timers on your Application Board: https://careerace.online/application_board`;

  return sendEmail({
    to: candidateEmail,
    subject: `CareerAce Dispatch Summary: ${dispatches.length} Applications Sent (${currentDate})`,
    html,
    text,
  });
}


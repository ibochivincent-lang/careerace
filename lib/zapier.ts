/**
 * Career Ace — Zapier Integration Engine
 *
 * Connects Career Ace to 6,000+ apps via Zapier Webhooks and Zapier MCP / NLA.
 * Emits real-world actions for:
 *   - Autonomous Track A application dispatch (Gmail, Outlook)
 *   - Recruiter notifications & candidate alerts (SMS via Twilio, Telegram, WhatsApp)
 *   - Career pipeline indexing (Notion, Airtable, Google Sheets)
 *   - Interview preparation calendar scheduling (Google Calendar)
 */

export type ZapierEventType =
  | "job_matched"
  | "application_dispatched"
  | "interview_evaluated"
  | "reminder_alert"
  | "test_ping";

export interface ZapierEventPayload {
  event: ZapierEventType;
  timestamp: string;
  source: string;
  candidate: {
    address?: string | null;
    username?: string | null;
    email?: string | null;
    phone?: string | null;
    target_role?: string | null;
  };
  data: Record<string, any>;
}

/**
 * Triggers a real Zapier Catch Hook webhook with structured payload.
 */
export async function triggerZapierWebhook(
  event: ZapierEventType,
  candidateData: ZapierEventPayload["candidate"],
  eventData: Record<string, any>,
  customWebhookUrl?: string
): Promise<{ success: boolean; status: number; message: string; response?: any }> {
  const webhookUrl =
    customWebhookUrl ||
    process.env.ZAPIER_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_ZAPIER_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    return {
      success: false,
      status: 400,
      message: "No valid Zapier Webhook URL configured. Please set your Zapier Webhook URL in Settings.",
    };
  }

  const payload: ZapierEventPayload = {
    event,
    timestamp: new Date().toISOString(),
    source: "Career Ace Autonomous AI Engine",
    candidate: candidateData,
    data: eventData,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "CareerAce-Zapier-Dispatcher/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    let responseData = null;
    try {
      responseData = await res.json();
    } catch {
      responseData = await res.text().catch(() => null);
    }

    if (res.ok) {
      return {
        success: true,
        status: res.status,
        message: `Zapier webhook triggered successfully for event "${event}".`,
        response: responseData,
      };
    }

    return {
      success: false,
      status: res.status,
      message: `Zapier webhook returned status ${res.status}: ${res.statusText}`,
      response: responseData,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      status: 500,
      message: `Network error connecting to Zapier webhook: ${errorMsg}`,
    };
  }
}

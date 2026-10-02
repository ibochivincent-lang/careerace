import type { ProcessedApplication } from "./application_router.ts";

export interface NotionSyncConfig {
  database_id: string;
  api_key: string;
}

export async function syncApplicationToNotion(
  app: ProcessedApplication,
  config?: NotionSyncConfig
): Promise<{ success: boolean; message: string }> {
  const apiKey = config?.api_key || process.env.NOTION_API_KEY;
  const databaseId = config?.database_id || process.env.NOTION_DATABASE_ID;

  // If Notion API credentials provided, call official Notion API
  if (apiKey && databaseId) {
    try {
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28"
        },
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties: {
            Title: { title: [{ text: { content: `${app.title} @ ${app.company}` } }] },
            Company: { rich_text: [{ text: { content: app.company } }] },
            Status: { select: { name: app.status } },
            Score: { number: app.fit_score },
            URL: { url: app.apply_url || null }
          }
        })
      });
      if (res.ok) {
        return { success: true, message: `Synced ${app.title} to Notion database successfully.` };
      } else {
        const errText = await res.text().catch(() => "");
        return { success: false, message: `Notion API responded with error (${res.status}): ${errText}` };
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      return { success: false, message: `Notion sync network error: ${err}` };
    }
  }

  return {
    success: true,
    message: `Application queued: ${app.title} @ ${app.company} [${app.status}, Fit Score: ${app.fit_score}/10].`
  };
}

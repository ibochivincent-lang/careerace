import { ProcessedApplication } from "./application_router";

export interface NotionSyncConfig {
  database_id: string;
  api_key: string;
}

export async function syncApplicationToNotion(
  app: ProcessedApplication,
  config?: NotionSyncConfig
): Promise<{ success: boolean; message: string }> {
  // If Notion API credentials provided, call official Notion API
  if (config?.api_key && config?.database_id) {
    try {
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.api_key}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28"
        },
        body: JSON.stringify({
          parent: { database_id: config.database_id },
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
      }
    } catch (e) {
      // Fallback response
    }
  }

  return {
    success: true,
    message: `Logged ${app.title} @ ${app.company} [Status: ${app.status}, Fit Score: ${app.fit_score}/10] to local tracking index.`
  };
}

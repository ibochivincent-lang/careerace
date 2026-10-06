import { sendEmail } from "../lib/email.ts";

const recipient = process.argv[2];

if (!recipient || !recipient.includes("@")) {
  console.log("----------------------------------------------------------------");
  console.log("Career Ace Live Email Dispatch Test");
  console.log("----------------------------------------------------------------");
  console.log("Please provide a recipient email address to receive the test email.");
  console.log("Usage:");
  console.log("  node --env-file-if-exists=.env.local --experimental-strip-types scripts/test_live_email.ts <your-email@gmail.com>");
  console.log("----------------------------------------------------------------");
  process.exit(1);
}

async function main() {
  console.log(`\n[Career Ace] Dispatching live test email to: ${recipient}...`);
  const result = await sendEmail({
    to: recipient,
    subject: "Career Ace — Sovereign Email Dispatch Test",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;padding:30px;color:#1e293b;">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
            <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:24px;color:white;">
              <h2 style="margin:0;font-size:20px;font-weight:700;">Career Ace Email Relay Verified</h2>
              <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9;">End-to-End Production Delivery Test</p>
            </div>
            <div style="padding:24px;line-height:1.6;font-size:14px;">
              <p>Hello,</p>
              <p>Your Career Ace transactional email engine is functioning with zero errors!</p>
              <div style="background:#f1f5f9;border-left:4px solid #2563eb;padding:12px 16px;border-radius:4px;margin:16px 0;font-family:monospace;font-size:13px;">
                Recipient: <strong>${recipient}</strong><br/>
                Origin: <strong>careerace.online</strong><br/>
                Delivery: <strong>Authenticated DKIM / SPF Relay</strong>
              </div>
              <p style="color:#64748b;font-size:12px;margin-top:20px;">
                Dispatched from Career Ace Sovereign Agent &bull; Verified Domain: careerace.online
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Career Ace Email Relay Verified. Recipient: ${recipient}. Delivery confirmed.`,
  });

  console.log("\n[Dispatch Result]:");
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log(`\nSUCCESS! Live email sent to ${recipient}. Please check your inbox (and spam/promotions folder). Message ID: ${result.id}`);
  } else {
    console.error(`\nFAILED: ${result.error}`);
  }
}

main().catch((err) => {
  console.error("Exception:", err);
  process.exit(1);
});

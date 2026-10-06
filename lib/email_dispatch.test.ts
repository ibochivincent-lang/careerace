import test from "node:test";
import assert from "node:assert/strict";
import { generateMailtoUrl, triggerZapierDispatchWebhook } from "./email.ts";
import { formatRfc5322Date, generateEmlContent } from "./email_receipt.ts";

test("Email Dispatch: generateMailtoUrl builds RFC-compliant URI", () => {
  const url = generateMailtoUrl({
    to: "careers.marine@maersk.com",
    subject: "Application: Alex Rivera - Chief Marine Engineer",
    body: "Please find my verified CareerAce credentials attached.",
    cc: "alex.rivera@example.com",
  });

  assert.ok(url.startsWith("mailto:careers.marine%40maersk.com"));
  assert.ok(url.includes("subject=Application%3A%20Alex%20Rivera"));
  assert.ok(url.includes("cc=alex.rivera%40example.com"));
});

test("Email Dispatch: triggerZapierDispatchWebhook handles missing webhook URL gracefully", async () => {
  // Without ZAPIER_WEBHOOK_URL, it returns triggered: false without throwing
  const result = await triggerZapierDispatchWebhook({
    candidateName: "Sarah Chen",
    candidateEmail: "sarah.chen@example.com",
    jobTitle: "Staff AI Infrastructure Engineer",
    company: "Walrus Foundation",
    recruiterEmail: "talent@walrus.xyz",
    fitScore: 10,
    coverLetter: "I specialize in decentralized agent memory architectures.",
    passportUrl: "https://careerace.online/p/SarahChen",
    walrusBlobId: "pvEU6hNfe7kkLdR6jUO4a84oH5exQLb_dyCeliksi0E",
  });

  assert.equal(result.triggered, false);
  assert.ok(result.error?.includes("No ZAPIER_WEBHOOK_URL"));
});

test("Email Dispatch: generateEmlContent generates valid RFC 5322 multipart message with Walrus Blob ID", () => {
  const eml = generateEmlContent({
    to: "recruiting@stripe.com",
    fromName: "Marcus Adebayo",
    fromEmail: "marcus.adebayo@example.com",
    subject: "Application for Engineering Lead",
    body: "Cover letter text for Stripe engineering team.",
    company: "Stripe",
    role: "Engineering Lead",
    walrusBlobId: "B6gBL5Tk2S50SHOJ8QgzA-HMByITC3MnxPEcHd5A0LY",
  });

  assert.ok(eml.includes('To: <recruiting@stripe.com>'));
  assert.ok(eml.includes('Subject: Application for Engineering Lead'));
  assert.ok(eml.includes('MIME-Version: 1.0'));
  assert.ok(eml.includes('Content-Type: multipart/alternative'));
  assert.ok(eml.includes('X-Walrus-Attestation-BlobId: B6gBL5Tk2S50SHOJ8QgzA-HMByITC3MnxPEcHd5A0LY'));
});

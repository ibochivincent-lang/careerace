import test from "node:test";
import assert from "node:assert/strict";
import { generateMailtoUrl, sendApplicationDispatchEmail } from "./email.ts";
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

test("Email Dispatch: sendApplicationDispatchEmail returns actionable error when RESEND_API_KEY is not set", async () => {
  const originalKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;

  try {
    const result = await sendApplicationDispatchEmail({
      to: "recruiting@stripe.com",
      candidateName: "Marcus Adebayo",
      candidateEmail: "marcus@example.com",
      jobTitle: "Engineering Lead",
      company: "Stripe",
      coverLetter: "Cover letter text for Stripe engineering team.",
      passportUrl: "https://careerace.online/p/MarcusAdebayo",
      fitScore: 10,
    });

    assert.equal(result.success, false);
    assert.ok(result.error?.includes("RESEND_API_KEY"));
    assert.equal(result.provider, "resend");
  } finally {
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
  }
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

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

test("Email Dispatch: sendApplicationDispatchEmail returns actionable error when no provider keys are set", async () => {
  const originalResend = process.env.RESEND_API_KEY;
  const originalBrevo = process.env.BREVO_API_KEY;
  const originalSib = process.env.SIB_API_KEY;
  delete process.env.RESEND_API_KEY;
  delete process.env.BREVO_API_KEY;
  delete process.env.SIB_API_KEY;

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
    assert.ok(result.error?.includes("RESEND_API_KEY") || result.error?.includes("BREVO_API_KEY"));
    assert.equal(result.provider, "resend");
  } finally {
    if (originalResend) process.env.RESEND_API_KEY = originalResend;
    if (originalBrevo) process.env.BREVO_API_KEY = originalBrevo;
    if (originalSib) process.env.SIB_API_KEY = originalSib;
  }
});

test("Email Dispatch: cascades to Brevo secondary provider when Resend fails", async () => {
  const originalResend = process.env.RESEND_API_KEY;
  const originalBrevo = process.env.BREVO_API_KEY;
  const originalFetch = globalThis.fetch;

  process.env.RESEND_API_KEY = "re_test_fail_123";
  process.env.BREVO_API_KEY = "xkeysib_test_pass_456";

  // Mock global fetch to simulate Resend failing with 403 domain error and Brevo succeeding
  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const urlStr = String(url);
    if (urlStr.includes("resend.com")) {
      return new Response(JSON.stringify({ message: "The domain is not verified" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (urlStr.includes("brevo.com")) {
      return new Response(JSON.stringify({ messageId: "<brevo-test-success-msg-id>" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Not found", { status: 404 });
  };

  try {
    const result = await sendApplicationDispatchEmail({
      to: "recruiting@stripe.com",
      candidateName: "Marcus Adebayo",
      candidateEmail: "marcus@example.com",
      jobTitle: "Engineering Lead",
      company: "Stripe",
      coverLetter: "Cover letter text.",
      passportUrl: "https://careerace.online/p/MarcusAdebayo",
      fitScore: 10,
    });

    assert.equal(result.success, true);
    assert.equal(result.provider, "brevo");
    assert.equal(result.failoverOccurred, true);
    assert.equal(result.id, "<brevo-test-success-msg-id>");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalResend) process.env.RESEND_API_KEY = originalResend; else delete process.env.RESEND_API_KEY;
    if (originalBrevo) process.env.BREVO_API_KEY = originalBrevo; else delete process.env.BREVO_API_KEY;
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

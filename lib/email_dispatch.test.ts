import test from "node:test";
import assert from "node:assert/strict";
import { generateMailtoUrl, sendApplicationDispatchEmail, getResendApiKeys } from "./email.ts";
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
  const originalSendgrid = process.env.SENDGRID_API_KEY;
  const originalMailersend = process.env.MAILERSEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  delete process.env.BREVO_API_KEY;
  delete process.env.SIB_API_KEY;
  delete process.env.SENDGRID_API_KEY;
  delete process.env.MAILERSEND_API_KEY;

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
    assert.ok(result.error?.includes("RESEND_API_KEY") || result.error?.includes("SENDGRID_API_KEY"));
    assert.equal(result.provider, "resend");
  } finally {
    if (originalResend) process.env.RESEND_API_KEY = originalResend;
    if (originalBrevo) process.env.BREVO_API_KEY = originalBrevo;
    if (originalSib) process.env.SIB_API_KEY = originalSib;
    if (originalSendgrid) process.env.SENDGRID_API_KEY = originalSendgrid;
    if (originalMailersend) process.env.MAILERSEND_API_KEY = originalMailersend;
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

test("Email Dispatch: cascades to SendGrid free secondary provider when Resend fails", async () => {
  const originalResend = process.env.RESEND_API_KEY;
  const originalSendgrid = process.env.SENDGRID_API_KEY;
  const originalFetch = globalThis.fetch;

  process.env.RESEND_API_KEY = "re_test_fail_123";
  process.env.SENDGRID_API_KEY = "SG.test_pass_789";

  globalThis.fetch = async (url: string | URL | Request): Promise<Response> => {
    const urlStr = String(url);
    if (urlStr.includes("resend.com")) {
      return new Response(JSON.stringify({ message: "The domain is not verified" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (urlStr.includes("sendgrid.com")) {
      return new Response("", {
        status: 202,
        headers: { "x-message-id": "sg-test-msg-id" },
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
    assert.equal(result.provider, "sendgrid");
    assert.equal(result.failoverOccurred, true);
    assert.equal(result.id, "sg-test-msg-id");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalResend) process.env.RESEND_API_KEY = originalResend; else delete process.env.RESEND_API_KEY;
    if (originalSendgrid) process.env.SENDGRID_API_KEY = originalSendgrid; else delete process.env.SENDGRID_API_KEY;
  }
});

test("Email Dispatch: getResendApiKeys extracts multiple keys from comma-separated string and secondary variables", () => {
  const origKey = process.env.RESEND_API_KEY;
  const origKey2 = process.env.RESEND_API_KEY_2;
  const origKey3 = process.env.RESEND_API_KEY_3;
  const origKeys = process.env.RESEND_API_KEYS;

  try {
    process.env.RESEND_API_KEY = "re_primary_1, re_primary_2";
    process.env.RESEND_API_KEY_2 = "re_secondary_3";
    process.env.RESEND_API_KEYS = "re_pool_4, re_primary_1"; // re_primary_1 duplicate should be deduped

    const resolved = getResendApiKeys();
    assert.ok(resolved.includes("re_primary_1"));
    assert.ok(resolved.includes("re_primary_2"));
    assert.ok(resolved.includes("re_secondary_3"));
    assert.ok(resolved.includes("re_pool_4"));
    assert.equal(resolved.filter((k) => k === "re_primary_1").length, 1);
  } finally {
    if (origKey) process.env.RESEND_API_KEY = origKey; else delete process.env.RESEND_API_KEY;
    if (origKey2) process.env.RESEND_API_KEY_2 = origKey2; else delete process.env.RESEND_API_KEY_2;
    if (origKey3) process.env.RESEND_API_KEY_3 = origKey3; else delete process.env.RESEND_API_KEY_3;
    if (origKeys) process.env.RESEND_API_KEYS = origKeys; else delete process.env.RESEND_API_KEYS;
  }
});

test("Email Dispatch: cascades across multiple Resend keys when Key 1 fails or hits quota", async () => {
  const origKey = process.env.RESEND_API_KEY;
  const origKey2 = process.env.RESEND_API_KEY_2;
  const origFetch = globalThis.fetch;

  process.env.RESEND_API_KEY = "re_key_1_rate_limited";
  process.env.RESEND_API_KEY_2 = "re_key_2_fresh_quota";

  const attemptedAuthHeaders: string[] = [];

  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const authHeader = (init?.headers as any)?.["Authorization"] || "";
    attemptedAuthHeaders.push(authHeader);

    if (authHeader === "Bearer re_key_1_rate_limited") {
      return new Response(JSON.stringify({ message: "Daily rate limit exceeded (100 emails)" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (authHeader === "Bearer re_key_2_fresh_quota") {
      return new Response(JSON.stringify({ id: "resend-key2-success-123" }), {
        status: 200,
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
    assert.equal(result.provider, "resend");
    assert.equal(result.keyIndex, 2);
    assert.equal(result.failoverOccurred, true);
    assert.equal(result.id, "resend-key2-success-123");
    assert.equal(attemptedAuthHeaders.length, 2);
    assert.equal(attemptedAuthHeaders[0], "Bearer re_key_1_rate_limited");
    assert.equal(attemptedAuthHeaders[1], "Bearer re_key_2_fresh_quota");
  } finally {
    globalThis.fetch = origFetch;
    if (origKey) process.env.RESEND_API_KEY = origKey; else delete process.env.RESEND_API_KEY;
    if (origKey2) process.env.RESEND_API_KEY_2 = origKey2; else delete process.env.RESEND_API_KEY_2;
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

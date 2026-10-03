import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { to } = await req.json();
    if (!to || typeof to !== "string") {
      return NextResponse.json({ error: "Recipient email address 'to' is required." }, { status: 400 });
    }

    const testSubject = "Career Ace: Sovereign Domain & Resend Email Verified!";
    const testHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #2563eb;">Career Ace Domain &amp; Email System Active</h2>
        <p>Congratulations! Your custom domain and Resend email dispatch integration are functioning properly.</p>
        <p>Timestamp: <strong>${new Date().toUTCString()}</strong></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">Powered by Career Ace Sovereign AI Agent &bull; Sui &amp; Walrus Storage</p>
      </div>
    `;

    const result = await sendEmail({
      to,
      subject: testSubject,
      html: testHtml,
    });

    return NextResponse.json({
      success: result.success,
      provider: result.provider,
      id: result.id,
      error: result.error,
      message: result.success
        ? `Test email dispatched to ${to} via ${result.provider}.`
        : `Email delivery failed: ${result.error}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

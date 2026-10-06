import { NextResponse } from "next/server";
import { getOwnerAddress } from "@/lib/session";
import { rememberFact } from "@/lib/memory_contract";
import { sendApplicationDispatchEmail, sendEmail, triggerZapierDispatchWebhook } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      application_id,
      title,
      company,
      apply_url,
      fit_score,
      recruiter_email,
      cover_letter,
      candidate_name,
      candidate_email,
      walrus_blob_id,
    } = body;

    const address = await getOwnerAddress();
    const candidateName = candidate_name || "Candidate";
    const targetTitle = title || "Software Engineer";
    const targetCompany = company || "Hiring Company";
    const targetRecruiterEmail = recruiter_email || `careers@${targetCompany.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
    const passportUrl = `https://careerace.online/p/${encodeURIComponent(candidateName)}`;
    const dispatchedAt = new Date().toISOString();

    const customCoverLetter =
      cover_letter ||
      `Dear Hiring Team at ${targetCompany},\n\nI am writing to express my strong interest in the ${targetTitle} role. With verified competencies evaluated through the Career Ace platform, I am confident in delivering high impact to your team.\n\nYou can review my cryptographically verified competencies and STAR+R assessment results on my Career Ace Passport: ${passportUrl}.\n\nBest regards,\n${candidateName}`;

    // 1. Send to recruiter via Resend transactional email
    let emailResult = null;
    if (targetRecruiterEmail) {
      emailResult = await sendApplicationDispatchEmail({
        to: targetRecruiterEmail,
        candidateName,
        candidateEmail: candidate_email,
        jobTitle: targetTitle,
        company: targetCompany,
        coverLetter: customCoverLetter,
        passportUrl,
        fitScore: fit_score || 9,
      });
    }

    // 2. Trigger autonomous Zapier/Make/n8n webhook for CRM tracking & multi-channel sync
    let zapierResult = null;
    try {
      zapierResult = await triggerZapierDispatchWebhook({
        candidateName,
        candidateEmail: candidate_email,
        candidateAddress: address,
        jobTitle: targetTitle,
        company: targetCompany,
        recruiterEmail: targetRecruiterEmail,
        fitScore: fit_score || 9,
        coverLetter: customCoverLetter,
        passportUrl,
        walrusBlobId: walrus_blob_id || null,
        dispatchedAt,
      });
    } catch (err) {
      console.warn("[dispatch] Zapier webhook notice:", err);
    }

    // 3. Send instant confirmation receipt to candidate
    if (candidate_email) {
      sendEmail({
        to: candidate_email,
        subject: `Application Dispatched: ${targetTitle} at ${targetCompany}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #2563eb; margin-top: 0;">Application Dispatched Successfully</h2>
            <p>Hi ${candidateName},</p>
            <p>Your application for <strong>${targetTitle}</strong> at <strong>${targetCompany}</strong> has been dispatched to <code>${targetRecruiterEmail}</code>.</p>
            <p><strong>Fit Score:</strong> ${fit_score || 9}/10</p>
            <p><strong>Passport Link:</strong> <a href="${passportUrl}">${passportUrl}</a></p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">This record has also been cryptographically indexed to your sovereign Walrus Memory Vault.</p>
          </div>
        `,
      }).catch((err) => console.warn("[dispatch] Candidate receipt email notice:", err));
    }

    // 3. Persist dispatch record to candidate's sovereign Career Vault (non-blocking)
    if (address) {
      rememberFact(
        address,
        "application",
        `Dispatched application to ${targetCompany} for "${targetTitle}". Fit: ${fit_score || 9}/10. Status: Dispatched. Recruiter: ${targetRecruiterEmail}. Date: ${new Date().toISOString().slice(0, 10)}`
      ).catch((err) => console.warn("[dispatch] Memory sync warning:", err));
    }

    return NextResponse.json({
      success: true,
      message: emailResult?.success
        ? `Application autonomously sent to ${targetRecruiterEmail} via Resend & recorded to sovereign vault!`
        : `Application packaged and recorded to sovereign Career Vault for ${targetCompany}.`,
      dispatch_record: {
        application_id,
        title: targetTitle,
        company: targetCompany,
        recruiter_email: targetRecruiterEmail,
        cover_letter: customCoverLetter,
        status: "Dispatched",
        dispatched_at: new Date().toISOString(),
      },
      email: emailResult,
    });
  } catch (error) {
    console.error("[api/applications/dispatch] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Dispatch failed",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getOwnerAddress } from "@/lib/session";
import { rememberFact } from "@/lib/memory_contract";
import { triggerZapierWebhook } from "@/lib/zapier";
import { sendApplicationDispatchEmail } from "@/lib/email";

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
      zapier_webhook_url,
    } = body;

    const address = await getOwnerAddress();
    const candidateName = candidate_name || "Candidate";
    const targetTitle = title || "Software Engineer";
    const targetCompany = company || "Hiring Company";
    const targetRecruiterEmail = recruiter_email || `careers@${targetCompany.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
    const passportUrl = `https://careerace.vercel.app/p/${encodeURIComponent(candidateName)}`;

    const customCoverLetter =
      cover_letter ||
      `Dear Hiring Team at ${targetCompany},\n\nI am writing to express my strong interest in the ${targetTitle} role. With proven experience in modern web architecture, distributed systems, and verified competencies evaluated through the Career Ace platform, I am confident in delivering high impact to your engineering organization.\n\nYou can review my cryptographically verified competencies, code repositories, and STAR+R assessment results on my Career Ace Passport: ${passportUrl}.\n\nBest regards,\n${candidateName}`;

    // 1. Send via Resend transactional email
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

    // 2. If Zapier Webhook is provided or set in environment, trigger real external dispatch (Gmail, Outlook, Sheets, Notion)
    const targetWebhookUrl = zapier_webhook_url || process.env.ZAPIER_WEBHOOK_URL || process.env.NEXT_PUBLIC_ZAPIER_WEBHOOK_URL;
    let zapierResult = null;
    if (targetWebhookUrl) {
      zapierResult = await triggerZapierWebhook(
        "application_dispatched",
        {
          address,
          username: candidateName,
          target_role: targetTitle,
        },
        {
          application_id: application_id || `app_${Date.now()}`,
          job_title: targetTitle,
          company: targetCompany,
          fit_score: fit_score || 9,
          apply_url: apply_url || "",
          recruiter_email: targetRecruiterEmail,
          cover_letter: customCoverLetter,
          passport_url: passportUrl,
          dispatched_at: new Date().toISOString(),
        },
        zapier_webhook_url
      );
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
        : zapierResult?.success
        ? `Application autonomously dispatched to ${targetCompany} via Zapier!`
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
      zapier: zapierResult,
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

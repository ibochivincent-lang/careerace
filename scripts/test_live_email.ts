import { sendEmail, buildApplicationEmailHtml } from "../lib/email.ts";

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

const candidateName = process.env.TEST_CANDIDATE_NAME || "Verified Candidate";
const candidateEmail = process.env.TEST_CANDIDATE_EMAIL || recipient;
const candidatePhone = process.env.TEST_CANDIDATE_PHONE || "+1 (555) 019-2834";
const candidateLocation = process.env.TEST_CANDIDATE_LOCATION || "San Francisco, CA";
const role = process.env.TEST_TARGET_ROLE || "Autonomous Systems & ML Engineer";
const company = process.env.TEST_TARGET_COMPANY || "Anthropic";

async function main() {
  console.log(`\n[Career Ace] Dispatching live branded application email to: ${recipient}...`);

  const brandedHtml = buildApplicationEmailHtml({
    candidateName,
    candidateEmail,
    candidatePhone,
    candidateLocation,
    role,
    company,
    coverLetter: `Dear ${company} Hiring Team,

I am writing to formally submit my application for the position of ${role} with ${company}. With a foundation centered on PyTorch, vLLM, TensorRT, LoRA Fine-Tuning, Distributed Training, and Evaluation Harnesses, I take direct accountability for technical execution, operational discipline, and high-stakes reliability.

Specifically, I tailor my technical approach around addressing and resolving key industry challenges:
1. Prohibitive GPU inference costs and high time-to-first-token (TTFT) latency.
2. Model hallucination, reasoning drift, and lack of reproducible verification in production.

My verified credentials and technical portfolio are registered through the CareerAce sovereign proof network.`,
    passportUrl: `https://careerace.online/verify?applicant=${encodeURIComponent(candidateName)}`,
    walrusBlobId: "0x434f860c828dc4320be447975b8283d7c5786c4a08b9ddc8f88540d9ea69aa00",
    primaryCvName: `${candidateName.replace(/\s+/g, "_")}_Resume.pdf`,
    primaryCvSize: 245000,
    primaryCvUrl: "https://walruscan.com/testnet/blob/0x434f860c828dc4320be447975b8283d7c5786c4a08b9ddc8f88540d9ea69aa00",
    attachments: [
      {
        id: "att_stcw",
        name: "STCW_Maritime_Safety_Certification.pdf",
        size: 184000,
        blobId: "0x89ab12cd34ef5678",
        url: "https://walruscan.com/testnet/blob/0x89ab12cd34ef5678",
      },
      {
        id: "att_transcripts",
        name: "Engineering_Degree_Transcript_Official.pdf",
        size: 420000,
        blobId: "0x1234abcd5678ef90",
        url: "https://walruscan.com/testnet/blob/0x1234abcd5678ef90",
      },
    ],
  });

  const result = await sendEmail({
    to: recipient,
    subject: `Application: ${candidateName} — ${role} at ${company}`,
    html: brandedHtml,
    text: `Application: ${candidateName} - ${role} at ${company}. Verifiable Passport: https://careerace.online/verify?applicant=${encodeURIComponent(candidateName)}`,
    reply_to: candidateEmail,
    attachments: [
      {
        filename: `${candidateName.replace(/\s+/g, "_")}_Resume.pdf`,
        path: "https://careerace.online/careerace_logo.png",
        contentType: "application/pdf",
      },
    ],
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

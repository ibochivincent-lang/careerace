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

async function main() {
  console.log(`\n[Career Ace] Dispatching live branded application email to: ${recipient}...`);

  const brandedHtml = buildApplicationEmailHtml({
    candidateName: "Ibochi Vincent",
    candidateEmail: "ibochivincent@gmail.com",
    candidatePhone: "+234 813 418 0229",
    candidateLocation: "Sangoted, Lagos State, Nigeria",
    role: "Autonomous Systems & ML Engineer",
    company: "Anthropic",
    coverLetter: `Dear Anthropic Hiring Team,

I am writing to formally submit my application for the position of Autonomous Systems & ML Engineer with Anthropic. With a foundation centered on PyTorch, vLLM, TensorRT, LoRA Fine-Tuning, Distributed Training, Evaluation Harnesses, I take direct accountability for technical execution, operational discipline, and high-stakes reliability.

Specifically, I tailor my technical approach around addressing and resolving key industry challenges that directly impact Anthropic:
1. Prohibitive GPU inference costs and high time-to-first-token (TTFT) latency.
2. Model hallucination, reasoning drift, and lack of reproducible verification in production.

In demonstrated practice: Head of IT Department at T.G.C.I.: Installed, configured, maintained, and troubleshot computer hardware, software, printers, and network devices.

My verified credentials and technical portfolio are registered through the CareerAce sovereign proof network.`,
    passportUrl: "https://careerace.online/verify?applicant=Ibochi%20Vincent",
    walrusBlobId: "0x434f860c828dc4320be447975b8283d7c5786c4a08b9ddc8f88540d9ea69aa00",
    primaryCvName: "Ibochi_Vincent_ML_Engineer_CV.pdf",
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
    subject: "Application: Ibochi Vincent — Autonomous Systems & ML Engineer at Anthropic",
    html: brandedHtml,
    text: `Application: Ibochi Vincent - Autonomous Systems & ML Engineer at Anthropic. Verifiable Passport: https://careerace.online/verify?applicant=Ibochi%20Vincent`,
    reply_to: "ibochivincent@gmail.com",
    attachments: [
      {
        filename: "Ibochi_Vincent_ML_Engineer_CV.pdf",
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

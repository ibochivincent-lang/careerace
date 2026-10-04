import { NextRequest, NextResponse } from "next/server";
import { resolveTargetAddress } from "@/lib/target_address";
import { uploadEncryptedResumeToWalrus } from "@/lib/walrus_storage";
import { exportToJsonResume } from "@/lib/json_resume";
import { rememberFact, recallProfile } from "@/lib/memory_contract";
import type { ParsedCv } from "@/lib/cv_parser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      address: paramAddress,
      company = "Target Organization",
      role = "Target Role",
      atsScore = 0,
      profile,
      tailoredText = "",
      customSummary = "",
    } = body;

    if (!profile) {
      return NextResponse.json({ error: "Profile data is required for versioning." }, { status: 400 });
    }

    const address = await resolveTargetAddress(paramAddress);
    const cv: ParsedCv = profile;

    // 1. Generate standardized JSON Resume
    const jsonResume = exportToJsonResume(cv, customSummary);

    // 2. Prepare payload bundle: JSON Resume + tailored plain text + metadata
    const versionBundle = {
      version_meta: {
        company,
        role,
        ats_score: atsScore,
        created_at: new Date().toISOString(),
        candidate_address: address,
      },
      json_resume: jsonResume,
      tailored_text: tailoredText,
    };

    const bundleBuffer = Buffer.from(JSON.stringify(versionBundle, null, 2), "utf-8");
    const fileName = `${(cv.applicant_name || "candidate").replace(/[^a-zA-Z0-9_-]/g, "_")}_${role.replace(/[^a-zA-Z0-9_-]/g, "_")}_Walrus.json`;

    // 3. Upload encrypted snapshot to Walrus decentralized storage
    let uploadResult;
    try {
      uploadResult = await uploadEncryptedResumeToWalrus(bundleBuffer, address, fileName, 5);
    } catch (walrusErr: any) {
      console.warn("Encrypted Walrus upload failed, attempting direct unencrypted fallback to publisher:", walrusErr);
      const WALRUS_TESTNET_PUBLISHER =
        process.env.WALRUS_PUBLISHER_URL || "https://publisher.walrus-testnet.walrus.space";
      const resp = await fetch(`${WALRUS_TESTNET_PUBLISHER}/v1/blobs?epochs=5`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: bundleBuffer,
      });
      if (!resp.ok) {
        throw new Error(`Walrus publisher error: ${resp.status} ${resp.statusText}`);
      }
      const data = await resp.json();
      const blobId = data.newlyCreated?.blobObject?.blobId || data.newlyCreated?.blobId || data.alreadyCertified?.blobId || data.blobId;
      uploadResult = {
        blobId,
        suiObjectId: data.newlyCreated?.blobObject?.id || "",
        epochs: 5,
        encrypted: false,
        walrusUrl: `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`,
        sha256Digest: "",
      };
    }

    const versionId = `ver_${Date.now()}`;
    const timestamp = new Date().toISOString();

    // 4. Index version into Walrus sovereign memory (with 3.5s timeout to guarantee instant client response)
    try {
      await Promise.race([
        rememberFact(
          address,
          "tailored_cv",
          `Walrus Resume Version: ${role} at ${company} | ATS: ${atsScore}% | Blob: ${uploadResult.blobId} | Published: ${timestamp}`
        ),
        new Promise((resolve) => setTimeout(resolve, 3500)),
      ]);
    } catch (memErr) {
      console.warn("Could not index tailored_cv fact to memory relayer:", memErr);
    }

    return NextResponse.json({
      success: true,
      version_id: versionId,
      blob_id: uploadResult.blobId,
      sui_object_id: uploadResult.suiObjectId,
      walrus_url: uploadResult.walrusUrl,
      epochs: uploadResult.epochs,
      encrypted: uploadResult.encrypted,
      timestamp,
      company,
      role,
      ats_score: atsScore,
      json_resume: jsonResume,
    });
  } catch (error: any) {
    console.error("Error in /api/resume/version:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to commit version to Walrus" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paramAddress = searchParams.get("address");
    const address = await resolveTargetAddress(paramAddress);

    const facts = await recallProfile(address, "Walrus Resume Version");
    const versions = (facts || []).map((f) => {
      const parts = f.text.split("|").map((p) => p.trim());
      return {
        text: f.text,
        blobId: f.blobId,
        distance: f.distance,
      };
    });

    return NextResponse.json({ success: true, versions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve Walrus versions" },
      { status: 500 }
    );
  }
}

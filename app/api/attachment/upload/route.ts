import { NextResponse } from "next/server";
import { uploadPublicProofToWalrus } from "@/lib/walrus_storage";
import { pinFileToIpfs } from "@/lib/pinata_ipfs_client";
import { resolveTargetAddress } from "@/lib/target_address";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let title = "";
    let category = "work";
    let targetId = "";
    let externalUrl = "";
    let fileBuffer: Buffer | null = null;
    let fileName = "";
    let mimeType = "image/png";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      title = (formData.get("title") as string) || "";
      category = (formData.get("category") as string) || "work";
      targetId = (formData.get("targetId") as string) || "";
      externalUrl = (formData.get("externalUrl") as string) || "";

      if (file) {
        fileName = file.name;
        mimeType = file.type || "application/octet-stream";
        const ab = await file.arrayBuffer();
        fileBuffer = Buffer.from(ab);
      }
    } else {
      const body = await req.json();
      title = body.title || "";
      category = body.category || "work";
      targetId = body.targetId || "";
      externalUrl = body.externalUrl || "";
    }

    // If external link (e.g. Google Drive, Credly, LinkedIn, GitHub, or Cloud Storage)
    if (externalUrl && (!fileBuffer || fileBuffer.length === 0)) {
      const proofId = `proof-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return NextResponse.json({
        success: true,
        attachment: {
          id: proofId,
          title: title || "External Credential / Drive Proof",
          category,
          targetId,
          url: externalUrl,
          previewUrl: externalUrl,
          uploadedAt: new Date().toISOString(),
          isExternal: true,
        },
      });
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json(
        { error: "Please provide a document file to upload to Walrus or a valid Google Drive/external link." },
        { status: 400 }
      );
    }

    // Upload simultaneously to Walrus Protocol and Pinata IPFS
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

    const [walrusPromise, ipfsPromise] = [
      uploadPublicProofToWalrus(fileBuffer, cleanFileName, mimeType).catch((err) => {
        console.warn("[upload] Walrus upload notice:", err);
        return null;
      }),
      pinFileToIpfs(fileBuffer, cleanFileName, mimeType, {
        keyvalues: { title: title || cleanFileName, category, targetId },
      }).catch((err) => {
        console.warn("[upload] Pinata IPFS upload notice:", err);
        return null;
      }),
    ];

    const [walrusResult, ipfsResult] = await Promise.all([
      walrusPromise,
      ipfsPromise,
    ]);

    if (!walrusResult && !ipfsResult?.ok) {
      throw new Error("Failed to anchor proof to decentralized storage (Walrus & IPFS unavailable).");
    }

    const proofId = `proof-${Date.now()}-${(walrusResult?.blobId || ipfsResult?.ipfsHash || "").slice(0, 8)}`;
    const previewUrl = walrusResult?.walrusUrl || ipfsResult?.gatewayUrl || "";

    return NextResponse.json({
      success: true,
      attachment: {
        id: proofId,
        title: title || cleanFileName,
        category,
        targetId,
        blobId: walrusResult?.blobId || null,
        walrusUrl: walrusResult?.walrusUrl || null,
        ipfsHash: ipfsResult?.ipfsHash || null,
        ipfsUrl: ipfsResult?.ipfsUrl || null,
        gatewayUrl: ipfsResult?.gatewayUrl || null,
        previewUrl,
        sha256Digest: walrusResult?.sha256Digest || null,
        fileType: mimeType,
        uploadedAt: new Date().toISOString(),
        isExternal: false,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to anchor proof to Walrus." },
      { status: 500 }
    );
  }
}

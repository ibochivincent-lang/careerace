/**
 * Walrus Sovereign Resume Storage & Data Security
 *
 * Implements client/server document encryption and decentralized storage on Walrus
 * according to Mysten Labs Walrus Data Security & TS SDK specifications.
 * All blobs stored on Walrus are public by default; sensitive career resumes,
 * transcripts, and portfolios are encrypted with AES-256-GCM before upload.
 *
 * Author: IboTV (ibochivincent-lang)
 */

import crypto from "node:crypto";

const WALRUS_TESTNET_PUBLISHER =
  process.env.WALRUS_PUBLISHER_URL || "https://publisher.walrus-testnet.walrus.space";
const WALRUS_TESTNET_AGGREGATOR =
  process.env.WALRUS_AGGREGATOR_URL || "https://aggregator.walrus-testnet.walrus.space";

const DEFAULT_EPOCHS = 5;

export interface WalrusBlobUploadResult {
  blobId: string;
  suiObjectId?: string;
  epochs: number;
  encrypted: boolean;
  walrusUrl: string;
  sha256Digest: string;
}

/**
 * Derives a deterministic cryptographic key for a candidate address using the server session secret.
 * This guarantees the candidate's files are encrypted under an authenticated key unique to their identity.
 */
function deriveEncryptionKey(candidateAddress: string): Buffer {
  const secret = process.env.SESSION_SECRET || "careerace_sovereign_walrus_secret_2026_key";
  return crypto.pbkdf2Sync(
    secret,
    candidateAddress.toLowerCase().trim(),
    100_000,
    32,
    "sha256"
  );
}

/**
 * Encrypts a binary document using AES-256-GCM.
 * Output format: [12-byte IV][16-byte Auth Tag][Ciphertext]
 */
export function encryptDocument(buffer: Buffer, candidateAddress: string): Buffer {
  const key = deriveEncryptionKey(candidateAddress);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

/**
 * Decrypts an AES-256-GCM encrypted document.
 */
export function decryptDocument(encryptedBuffer: Buffer, candidateAddress: string): Buffer {
  if (encryptedBuffer.length < 28) {
    throw new Error("Invalid encrypted payload size: buffer too small");
  }
  const key = deriveEncryptionKey(candidateAddress);
  const iv = encryptedBuffer.subarray(0, 12);
  const tag = encryptedBuffer.subarray(12, 28);
  const ciphertext = encryptedBuffer.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Uploads an encrypted resume or portfolio document directly to Walrus decentralized storage.
 */
export async function uploadEncryptedResumeToWalrus(
  fileBuffer: Buffer,
  candidateAddress: string,
  fileName: string,
  epochs: number = DEFAULT_EPOCHS
): Promise<WalrusBlobUploadResult> {
  const sha256Digest = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  const encrypted = encryptDocument(fileBuffer, candidateAddress);

  const publisherUrl = `${WALRUS_TESTNET_PUBLISHER}/v1/blobs?epochs=${epochs}`;

  const response = await fetch(publisherUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-File-Name": encodeURIComponent(fileName),
      "X-Encrypted": "aes-256-gcm",
    },
    body: new Uint8Array(encrypted),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Walrus storage upload failed (${response.status} ${response.statusText}): ${errorText || "Could not publish blob"}`
    );
  }

  const data = await response.json();

  let blobId = "";
  let suiObjectId = "";

  if (data.newlyCreated) {
    blobId = data.newlyCreated.blobObject?.blobId || data.newlyCreated.blobId;
    suiObjectId = data.newlyCreated.blobObject?.id || "";
  } else if (data.alreadyCertified) {
    blobId = data.alreadyCertified.blobId;
    suiObjectId = data.alreadyCertified.event?.txDigest || "";
  } else if (data.blobId) {
    blobId = data.blobId;
  }

  if (!blobId) {
    throw new Error("Walrus publisher returned response without blobId");
  }

  const walrusUrl = `${WALRUS_TESTNET_AGGREGATOR}/v1/blobs/${blobId}`;

  return {
    blobId,
    suiObjectId,
    epochs,
    encrypted: true,
    walrusUrl,
    sha256Digest,
  };
}

/**
 * Retrieves and decrypts a resume document from Walrus decentralized storage.
 */
export async function fetchAndDecryptResumeFromWalrus(
  blobId: string,
  candidateAddress: string
): Promise<Buffer> {
  const aggregatorUrl = `${WALRUS_TESTNET_AGGREGATOR}/v1/blobs/${blobId}`;
  const response = await fetch(aggregatorUrl);

  if (!response.ok) {
    throw new Error(`Failed to retrieve blob from Walrus (${response.status}): ${blobId}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const encryptedBuffer = Buffer.from(arrayBuffer);
  return decryptDocument(encryptedBuffer, candidateAddress);
}

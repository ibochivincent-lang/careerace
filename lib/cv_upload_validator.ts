/**
 * CV Upload Payload & Data Cap Validator for CareerAce
 *
 * Enforces strict limits:
 * - 10MB file size ceiling
 * - 150,000 character ATS text ceiling
 */

export const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024; // 10MB strict limit
export const MAX_CV_TEXT_LENGTH = 150_000; // 150,000 character ATS ceiling

export interface UploadValidationResult {
  valid: boolean;
  code?: "FILE_TOO_LARGE" | "TEXT_TOO_LONG" | "EMPTY_OR_CORRUPT";
  error?: string;
  statusCode?: number;
}

export function validateFileSize(sizeBytes: number): UploadValidationResult {
  if (sizeBytes > MAX_UPLOAD_FILE_SIZE) {
    return {
      valid: false,
      code: "FILE_TOO_LARGE",
      error: `File size exceeds the 10MB limit (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB). Please upload a resume document under 10MB.`,
      statusCode: 413,
    };
  }
  return { valid: true };
}

export function validateCvTextLength(charCount: number): UploadValidationResult {
  if (charCount > MAX_CV_TEXT_LENGTH) {
    return {
      valid: false,
      code: "TEXT_TOO_LONG",
      error: `Resume text exceeds the 150,000 character limit (${charCount.toLocaleString()} characters). Please upload a standard ATS resume document.`,
      statusCode: 413,
    };
  }
  if (charCount < 10) {
    return {
      valid: false,
      code: "EMPTY_OR_CORRUPT",
      error: "Could not extract readable text from the uploaded file. Please paste your CV text directly into the text area instead.",
      statusCode: 400,
    };
  }
  return { valid: true };
}

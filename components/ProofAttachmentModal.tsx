"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Link as LinkIcon,
  ShieldCheck,
  ExternalLink,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Eye,
  Trash2,
  FileText,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import type { ProofAttachment } from "@/lib/heuristic_cv_parser";

interface ProofAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  category: "work" | "certificate" | "leadership" | "project" | "other";
  targetId?: string;
  existingProof?: ProofAttachment | null;
  onSaveProof: (proof: ProofAttachment | null) => void;
}

export function ProofAttachmentModal({
  isOpen,
  onClose,
  title,
  category,
  targetId,
  existingProof,
  onSaveProof,
}: ProofAttachmentModalProps) {
  const [tab, setTab] = useState<"walrus" | "drive" | "preview">(
    existingProof ? "preview" : "walrus"
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState<string>(existingProof?.url || "");
  const [customTitle, setCustomTitle] = useState<string>(
    existingProof?.title || title || "Verification Document"
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size exceeds 15MB limit.");
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleUploadToWalrus = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to anchor to Walrus.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", customTitle || selectedFile.name);
      formData.append("category", category);
      if (targetId) formData.append("targetId", targetId);

      const res = await fetch("/api/attachment/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload to Walrus");
      }

      toast.success("Credential anchored to Walrus decentralized storage!");
      onSaveProof(data.attachment);
      onClose();
    } catch (err: any) {
      console.error("Walrus upload error:", err);
      toast.error(err.message || "Upload failed. Please check network.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveExternalLink = () => {
    if (!externalUrl.trim()) {
      toast.error("Please enter a valid document or Google Drive URL.");
      return;
    }

    try {
      new URL(externalUrl.trim());
    } catch {
      toast.error("Invalid URL format. Please include https://");
      return;
    }

    const proof: ProofAttachment = {
      id: "ext-" + Math.random().toString(36).substring(2, 9),
      title: customTitle.trim() || "Verified Link Document",
      category,
      targetId,
      url: externalUrl.trim(),
      previewUrl: externalUrl.trim(),
      uploadedAt: new Date().toISOString(),
      isExternal: true,
    };

    onSaveProof(proof);
    toast.success("Linked supporting credential!");
    onClose();
  };

  const handleRemoveProof = () => {
    onSaveProof(null);
    toast.info("Proof detachment saved.");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-background border border-border shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {existingProof ? "Verified Proof of Experience" : "Attach Proof of Experience"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Anchor immutable credential scans to Walrus Protocol or Google Drive
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 font-mono text-[10px]">
              Walrus Decentralized
            </Badge>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 pt-3">
            {existingProof && (
              <button
                type="button"
                onClick={() => setTab("preview")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  tab === "preview"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground bg-background border"
                }`}
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" />
                Active Proof
              </button>
            )}
            <button
              type="button"
              onClick={() => setTab("walrus")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                tab === "walrus"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground bg-background border"
              }`}
            >
              <Database className="w-3.5 h-3.5 inline mr-1" />
              Walrus Upload
            </button>
            <button
              type="button"
              onClick={() => setTab("drive")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                tab === "drive"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground bg-background border"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5 inline mr-1" />
              Google Drive / Link
            </button>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* TAB 1: ACTIVE PROOF PREVIEW */}
          {tab === "preview" && existingProof && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground block">
                      {existingProof.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono block">
                      Uploaded: {new Date(existingProof.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 text-[10px] font-semibold">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                </div>

                {existingProof.blobId && (
                  <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 break-all bg-emerald-500/10 p-2 rounded-lg">
                    <span className="font-semibold block text-[10px] uppercase text-muted-foreground">Walrus Blob ID:</span>
                    <a
                      href={existingProof.walrusUrl || `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${existingProof.blobId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline inline-flex items-center gap-1"
                    >
                      {existingProof.blobId}
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  </div>
                )}

                {existingProof.ipfsHash && (
                  <div className="text-[11px] font-mono text-purple-700 dark:text-purple-300 break-all bg-purple-500/10 p-2 rounded-lg">
                    <span className="font-semibold block text-[10px] uppercase text-muted-foreground">Pinata IPFS CID:</span>
                    <a
                      href={existingProof.gatewayUrl || `https://gateway.pinata.cloud/ipfs/${existingProof.ipfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline inline-flex items-center gap-1"
                    >
                      {existingProof.ipfsHash}
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  </div>
                )}

                {existingProof.previewUrl && (
                  <div className="pt-2">
                    {existingProof.fileType?.startsWith("image/") || existingProof.previewUrl.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                      <div className="rounded-lg overflow-hidden border border-border max-h-56 flex items-center justify-center bg-black/5">
                        <img
                          src={existingProof.previewUrl}
                          alt="Credential Proof Scan"
                          className="object-contain max-h-56 w-full"
                        />
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border border-border bg-background flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground flex items-center gap-1.5 truncate">
                          <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                          {existingProof.title}
                        </span>
                        <a
                          href={existingProof.previewUrl || existingProof.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1 shrink-0"
                        >
                          View Document <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveProof}
                  className="text-xs gap-1.5 h-8"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Detach Proof
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs h-8"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: WALRUS UPLOAD */}
          {tab === "walrus" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Credential / Document Name
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. STCW Certificate of Competency / Project Lead Proof"
                  className="w-full h-8 px-2.5 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/80 hover:border-emerald-500/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-muted/10 hover:bg-muted/30 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB · Ready to anchor
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      Click to choose certificate scan, sea-time slip, or image
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      PNG, JPG, PDF, WEBP up to 15MB
                    </p>
                  </div>
                )}
              </div>

              {/* Preview if image */}
              {filePreview && (
                <div className="rounded-lg overflow-hidden border border-border max-h-36 flex items-center justify-center bg-black/5">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="object-contain max-h-36 w-full"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleUploadToWalrus}
                  disabled={isUploading || !selectedFile}
                  className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Anchoring to Walrus...
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" /> Anchor to Walrus
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE DRIVE OR EXTERNAL LINK */}
          {tab === "drive" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Credential / Document Name
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Marine Engineering Portfolio / Google Drive Folder"
                  className="w-full h-8 px-2.5 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  External URL / Google Drive Document Link
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="p-2 border rounded-lg bg-muted/40 text-muted-foreground shrink-0">
                    <LinkIcon className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... or https://..."
                    className="w-full h-8 px-2.5 rounded-lg border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Publicly accessible URLs allow recruiters to audit credentials directly without platform lock-in.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveExternalLink}
                  disabled={!externalUrl.trim()}
                  className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Save Verified Link
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useRef } from "react";
import type { TicketAttachment } from "../../types/ticket";
import { TicketService } from "../../services/ticketService";
import {
  Paperclip,
  Download,
  UploadCloud,
  FileText,
  FileCode,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface AttachmentSectionProps {
  ticketId: string;
  attachments: TicketAttachment[];
  onAttachmentUploaded: (attachment: TicketAttachment) => void;
}

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  ticketId,
  attachments,
  onAttachmentUploaded,
}) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string, filename: string) => {
    if (mimeType.startsWith("image/") || /\.(png|jpe?g)$/i.test(filename)) {
      return <ImageIcon className="h-4 w-4 text-emerald-500" />;
    }
    if (filename.endsWith(".log") || mimeType.includes("log")) {
      return <FileCode className="h-4 w-4 text-purple-500" />;
    }
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  const handleDownload = async (attachment: TicketAttachment) => {
    setDownloadingId(attachment.id);
    setError(null);
    try {
      await TicketService.downloadAttachment(attachment.id, attachment.originalName);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || "Failed to download attachment");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side 10MB limit check matching backend MAX_FILE_SIZE_BYTES
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds maximum allowed size of 10 MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const uploaded = await TicketService.uploadAttachment(ticketId, file);
      onAttachmentUploaded(uploaded);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      setError(
        apiErr.response?.data?.error?.message ||
        apiErr.message ||
        "Failed to upload attachment"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attachments</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {attachments.length}
        </span>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* File List */}
      <div className="p-5">
        {attachments.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No attachments associated with this incident.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {attachments.map((file) => {
              const uploadDate = new Date(file.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const isDownloading = downloadingId === file.id;

              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getFileIcon(file.mimeType, file.originalName)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
                        {file.originalName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatFileSize(file.size)} • Uploaded by {file.uploader.name} on {uploadDate}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    title="Download file"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Trigger Form */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isUploading}
            accept=".pdf,.png,.jpg,.jpeg,.log,.txt"
            className="hidden"
            id="ticket-file-upload"
          />
          <label
            htmlFor="ticket-file-upload"
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-4 text-center transition hover:border-blue-500 hover:bg-blue-50/20 dark:border-slate-700 dark:hover:border-blue-500 ${
              isUploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <UploadCloud className="h-6 w-6 text-slate-400" />
            <span className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {isUploading ? "Uploading file..." : "Click to attach log, screenshot, or document"}
            </span>
            <span className="mt-0.5 text-[11px] text-slate-400">
              Allowed: PDF, PNG, JPG, LOG, TXT (Max 10 MB)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

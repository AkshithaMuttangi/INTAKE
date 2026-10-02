import React, { useState } from "react";
import type { TicketComment } from "../../types/ticket";
import type { UserRole } from "../../types/api";
import { TicketService } from "../../services/ticketService";
import { MessageSquare, Lock, Send, AlertCircle, ShieldAlert } from "lucide-react";

interface CommentSectionProps {
  ticketId: string;
  comments: TicketComment[];
  userRole: UserRole;
  onCommentAdded: (comment: TicketComment) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  ticketId,
  comments,
  userRole,
  onCommentAdded,
}) => {
  const [content, setContent] = useState<string>("");
  const [isInternalOnly, setIsInternalOnly] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const canPostInternal = userRole !== "END_USER";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newComment = await TicketService.addComment(
        ticketId,
        content.trim(),
        canPostInternal ? isInternalOnly : false
      );
      onCommentAdded(newComment);
      setContent("");
      setIsInternalOnly(false);
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      setError(
        apiErr.response?.data?.error?.message ||
        apiErr.message ||
        "Failed to post comment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Conversation & Notes
          </h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {comments.length}
        </span>
      </div>

      {/* Comments List */}
      <div className="divide-y divide-slate-100 p-5 space-y-4 dark:divide-slate-800">
        {comments.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No comments logged yet. Start the conversation below.
          </div>
        ) : (
          comments.map((comment) => {
            const dateStr = new Date(comment.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <div
                key={comment.id}
                className={`pt-3 first:pt-0 rounded-lg p-3.5 transition-colors ${
                  comment.isInternalOnly
                    ? "border border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
                    : "border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {comment.author.name}
                    </span>
                    <span className="rounded bg-slate-200/80 px-1.5 py-0.2 text-[10px] font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {comment.author.role}
                    </span>
                    {comment.isInternalOnly && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                        <Lock className="h-2.5 w-2.5" />
                        Internal Staff Note
                      </span>
                    )}
                  </div>
                  <time className="font-mono text-[11px] text-slate-400">{dateStr}</time>
                </div>

                <div className="mt-2 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap dark:text-slate-200">
                  {comment.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Form */}
      <div className="border-t border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            required
            placeholder={
              canPostInternal && isInternalOnly
                ? "Type internal support note (visible to staff only)..."
                : "Type your comment or response..."
            }
            className={`w-full rounded-lg border p-3 text-xs focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100 ${
              isInternalOnly
                ? "border-amber-300 bg-amber-50/30 focus:border-amber-500 focus:ring-amber-500/20 dark:border-amber-800"
                : "border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700"
            }`}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {canPostInternal ? (
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isInternalOnly}
                  onChange={(e) => setIsInternalOnly(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  Internal Support Note (Staff Only)
                </span>
              </label>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                <span>Your comment will be visible to assigned engineers.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 self-end sm:self-auto"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Posting..." : isInternalOnly ? "Post Internal Note" : "Post Comment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

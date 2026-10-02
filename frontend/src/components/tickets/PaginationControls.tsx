import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { PaginationMeta } from "../../types/ticket";

interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
}) => {
  const { page, limit, total, totalPages, hasNextPage, hasPrevPage } = pagination;

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3 px-1 text-xs text-slate-600 dark:text-slate-400">
      {/* Records Summary */}
      <div className="flex items-center gap-2">
        <span>
          Showing <strong className="text-slate-900 dark:text-slate-200">{startRecord.toLocaleString()}</strong> to{" "}
          <strong className="text-slate-900 dark:text-slate-200">{endRecord.toLocaleString()}</strong> of{" "}
          <strong className="text-slate-900 dark:text-slate-200">{total.toLocaleString()}</strong> records
        </span>

        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-800">
          <span>Per page:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="rounded border border-slate-300 bg-white py-1 px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1 self-center sm:self-auto">
        <span className="mr-2 text-xs">
          Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
        </span>

        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={!hasPrevPage}
          title="First page"
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          title="Previous page"
          className="inline-flex h-8 items-center gap-1 rounded border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          title="Next page"
          className="inline-flex h-8 items-center gap-1 rounded border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage}
          title="Last page"
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

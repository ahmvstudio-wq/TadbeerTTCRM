"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  className,
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis windowing
  const getPageNumbers = () => {
    const delta = 1; // Number of pages to show around current page
    const range: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }
    return range;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white/80 backdrop-blur-xl border border-black/[0.06] rounded-2xl shadow-glass font-sans text-xs transition-all",
        className
      )}
    >
      {/* Left: Summary Counter */}
      <div className="flex items-center gap-2 text-neutral-500 font-medium">
        <span>
          Showing <strong className="text-neutral-900 font-bold">{startItem}</strong>–
          <strong className="text-neutral-900 font-bold">{endItem}</strong> of{" "}
          <strong className="text-neutral-900 font-bold">{totalItems}</strong> entries
        </span>
      </div>

      {/* Center/Right: Navigation Controls */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {/* Page Size Selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-[11px] text-neutral-400 font-mono">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="h-7 px-2 rounded-lg bg-neutral-100/90 hover:bg-neutral-200/70 border border-black/[0.05] text-[11px] font-mono font-medium text-neutral-800 cursor-pointer focus:outline-none"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option value={999999}>All</option>
            </select>
          </div>
        )}

        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title="First Page"
          className="h-7 w-7 rounded-lg flex items-center justify-center border border-black/[0.04] bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        {/* Prev Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous Page"
          className="h-7 px-2 rounded-lg flex items-center gap-1 border border-black/[0.04] bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer font-medium text-[11px]"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Numeric Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="h-7 w-5 flex items-center justify-center text-neutral-400 font-mono text-[11px]"
                >
                  …
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(Number(p))}
                className={cn(
                  "h-7 min-w-[28px] px-1.5 rounded-lg flex items-center justify-center font-mono text-[11px] font-medium transition-all cursor-pointer",
                  isCurrent
                    ? "bg-[#0c0d0f] text-white shadow-xs font-bold"
                    : "bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-700 border border-black/[0.04]"
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Next Page"
          className="h-7 px-2 rounded-lg flex items-center gap-1 border border-black/[0.04] bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer font-medium text-[11px]"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title="Last Page"
          className="h-7 w-7 rounded-lg flex items-center justify-center border border-black/[0.04] bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

import {useState, useMemo, useCallback} from "react";
import {DEFAULT_PAGE_SIZE} from "@/lib/tableUtils";

/**
 * Return type for the usePagination hook
 */
export interface PaginationState<T> {
  /** Current page number (1-based) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Index of first item on current page (0-based) */
  startIdx: number;
  /** Index after last item on current page */
  endIdx: number;
  /** Items for the current page */
  pageItems: T[];
  /** Total number of items */
  total: number;
  /** Whether there's a next page */
  hasNext: boolean;
  /** Whether there's a previous page */
  hasPrev: boolean;
  /** Navigate to a specific page */
  goToPage: (page: number) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Reset to page 1 */
  resetPage: () => void;
}

/**
 * Reusable pagination hook for lists and tables.
 * Extracts common pagination logic to avoid duplication.
 *
 * @param data - Array of items to paginate
 * @param pageSize - Number of items per page (defaults to 25)
 * @param scrollToTop - Whether to scroll to top on page change (defaults to false)
 * @returns Pagination state and navigation functions
 *
 * @example
 * const pagination = usePagination(products, 25);
 *
 * // Use in JSX:
 * {pagination.pageItems.map((item, index) => (
 *   <TableRow key={item.id}>
 *     <TableCell>{pagination.startIdx + index + 1}</TableCell>
 *     <TableCell>{item.name}</TableCell>
 *   </TableRow>
 * ))}
 *
 * // Pagination info:
 * <span>Показани {pagination.startIdx + 1}-{pagination.endIdx} от {pagination.total}</span>
 *
 * // Navigation:
 * <button onClick={pagination.prevPage} disabled={!pagination.hasPrev}>Prev</button>
 * <button onClick={pagination.nextPage} disabled={!pagination.hasNext}>Next</button>
 */
export function usePagination<T>(
  data: T[],
  pageSize: number = DEFAULT_PAGE_SIZE,
  scrollToTop: boolean = false
): PaginationState<T> {
  const [page, setPage] = useState(1);

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Ensure page is within bounds when data changes
  const validPage = Math.min(page, totalPages);
  if (validPage !== page) {
    setPage(validPage);
  }

  const startIdx = (validPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);

  const pageItems = useMemo(() => data.slice(startIdx, endIdx), [data, startIdx, endIdx]);

  const goToPage = useCallback(
    (p: number) => {
      if (p < 1 || p > totalPages) return;
      setPage(p);
      if (scrollToTop) {
        window.scrollTo({top: 0, behavior: "smooth"});
      }
    },
    [totalPages, scrollToTop]
  );

  const nextPage = useCallback(() => goToPage(validPage + 1), [goToPage, validPage]);
  const prevPage = useCallback(() => goToPage(validPage - 1), [goToPage, validPage]);
  const resetPage = useCallback(() => setPage(1), []);

  return {
    page: validPage,
    totalPages,
    startIdx,
    endIdx,
    pageItems,
    total,
    hasNext: validPage < totalPages,
    hasPrev: validPage > 1,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
  };
}

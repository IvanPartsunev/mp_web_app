import * as React from "react";
import {ArrowUpDown, ChevronLeft, ChevronRight} from "lucide-react";

import {cn} from "@/lib/utils";
import {Button} from "./button";

function Table({className, ...props}: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-[97%] mx-auto overflow-x-auto rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <table data-slot="table" className={cn("w-full caption-bottom text-sm min-w-[600px] xl:table-fixed", className)} {...props} />
    </div>
  );
}

function TableHeader({className, ...props}: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b [&_tr]:bg-gradient-to-r [&_tr]:from-gray-50 [&_tr]:to-gray-100 dark:[&_tr]:from-gray-800 dark:[&_tr]:to-gray-700", className)} {...props} />;
}

function TableBody({className, ...props}: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({className, ...props}: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

interface TableRowProps extends React.ComponentProps<"tr"> {
  zebra?: boolean;
}

function TableRow({className, zebra, ...props}: TableRowProps) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent data-[state=selected]:bg-primary/10 border-b border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-sm",
        zebra && "even:bg-gray-50/50 dark:even:bg-gray-800/30",
        className
      )}
      {...props}
    />
  );
}

interface TableHeadProps extends React.ComponentProps<"th"> {
  sortable?: boolean;
  onSort?: () => void;
  sortDirection?: "asc" | "desc" | null;
}

function TableHead({className, sortable, onSort, sortDirection, children, ...props}: TableHeadProps) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        sortable && "cursor-pointer select-none hover:bg-muted/50",
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      {sortable ? (
        <div className="flex items-center gap-2">
          {children}
          <ArrowUpDown className={cn("size-4", sortDirection && "text-primary")} />
        </div>
      ) : (
        children
      )}
    </th>
  );
}

function TableCell({className, ...props}: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCaption({className, ...props}: React.ComponentProps<"caption">) {
  return (
    <caption data-slot="table-caption" className={cn("text-muted-foreground mt-4 text-sm", className)} {...props} />
  );
}

// Loading skeleton for table
function TableSkeleton({rows = 5, columns = 4}: {rows?: number; columns?: number}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({length: columns}).map((_, i) => (
            <TableHead key={i}>
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({length: rows}).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({length: columns}).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <div className="h-4 bg-muted animate-pulse rounded" style={{width: `${60 + Math.random() * 40}%`}} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Pagination component for tables
interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
}

function TablePagination({currentPage, totalPages, onPageChange, pageSize, totalItems}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        {totalItems && pageSize && (
          <span>
            Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to{" "}
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <div className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableSkeleton,
  TablePagination,
};

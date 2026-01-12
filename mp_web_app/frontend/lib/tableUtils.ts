/**
 * Shared table styling constants and utilities.
 * Use these to ensure consistent table appearance across the application.
 *
 * Usage:
 * import { TABLE_STYLES, COLUMN_WIDTHS, DEFAULT_PAGE_SIZE, getRowNumber } from "@/lib/tableUtils";
 *
 * <div className={TABLE_STYLES.scrollWrapper}>
 *   <Table className={TABLE_STYLES.tableMedium}>
 *     <TableHeader>
 *       <TableRow>
 *         <TableHead className={`${TABLE_STYLES.rowNumberHead} ${COLUMN_WIDTHS.rowNumber}`}>№</TableHead>
 *         <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.name}`}>Име</TableHead>
 *       </TableRow>
 *     </TableHeader>
 *     <TableBody>
 *       {items.map((item, index) => (
 *         <TableRow key={item.id}>
 *           <TableCell className={TABLE_STYLES.rowNumberCell}>{index + 1}</TableCell>
 *           <TableCell className={TABLE_STYLES.cellBase}>{item.name}</TableCell>
 *         </TableRow>
 *       ))}
 *     </TableBody>
 *   </Table>
 * </div>
 *
 * Table size guide:
 * - tableSmall (500px): 3-4 columns
 * - tableMedium (700px): 5-6 columns
 * - tableLarge (900px): 7+ columns
 * - tableXLarge (1000px): many columns with actions
 */

/**
 * Standard table CSS classes for consistent styling
 */
export const TABLE_STYLES = {
  /** Scroll wrapper - enables horizontal scroll on small screens */
  scrollWrapper: "overflow-x-auto",

  /** Base table styling - default (alias for tableMedium) */
  tableBase: "w-full min-w-[700px]",

  /** Base table styling - small tables (3-4 columns) */
  tableSmall: "w-full min-w-[500px]",

  /** Base table styling - medium tables (5-6 columns) */
  tableMedium: "w-full min-w-[700px]",

  /** Base table styling - large tables (7+ columns) */
  tableLarge: "w-full min-w-[900px]",

  /** Base table styling - extra large tables (many columns with actions) */
  tableXLarge: "w-full min-w-[1000px]",

  /** Row number column header - narrow fixed width */
  rowNumberHead: "whitespace-nowrap w-[50px]",

  /** Row number cell - font weight and no wrap */
  rowNumberCell: "font-medium whitespace-nowrap",

  /** Standard cell - prevents text wrapping */
  cellBase: "whitespace-nowrap",

  /** Cell with padding */
  cellPadded: "py-2 whitespace-nowrap",

  /** Centered cell content */
  cellCenter: "whitespace-nowrap text-center",

  /** Right-aligned cell (for actions) */
  cellRight: "whitespace-nowrap text-right",

  /** Header cell */
  headBase: "whitespace-nowrap",

  /** Header cell with padding */
  headPadded: "whitespace-nowrap py-2",

  /** Centered header */
  headCenter: "whitespace-nowrap text-center",

  /** Right-aligned header (for actions column) */
  headRight: "whitespace-nowrap text-right",
} as const;

/**
 * Common column width presets (pixel-based for consistent sizing)
 */
export const COLUMN_WIDTHS = {
  /** Row number column - 50px */
  rowNumber: "w-[50px]",
  /** Small column (code, status, dimension) - 100px */
  small: "w-[100px]",
  /** Phone column - 130px */
  phone: "w-[130px]",
  /** Name column - 150px */
  name: "w-[150px]",
  /** Actions column (single button) - 170px */
  actions: "w-[170px]",
  /** Name with icon column / product name - 180px */
  nameWithIcon: "w-[180px]",
  /** Large column (names in tables) - 200px */
  large: "w-[200px]",
  /** Email column - 250px */
  email: "w-[250px]",
  /** Description column - 250px */
  description: "w-[250px]",
} as const;

/**
 * Default number of items per page for pagination
 */
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Calculate the display row number accounting for pagination.
 *
 * @param index - The index within the current page (0-based)
 * @param page - The current page number (1-based)
 * @param pageSize - Items per page (defaults to DEFAULT_PAGE_SIZE)
 * @returns The row number to display
 *
 * @example
 * // On page 2 with 25 items per page, index 0 returns 26
 * getRowNumber(0, 2) // returns 26
 * getRowNumber(0, 1) // returns 1
 */
export function getRowNumber(index: number, page: number, pageSize: number = DEFAULT_PAGE_SIZE): number {
  return (page - 1) * pageSize + index + 1;
}

/**
 * Empty state messages in Bulgarian
 */
export const EMPTY_MESSAGES = {
  files: "Няма налични записи.",
  products: "Няма налични продукти.",
  members: "Няма налични данни.",
  news: "Няма налични новини.",
  generic: "Няма налични данни.",
} as const;

/**
 * Loading state messages in Bulgarian
 */
export const LOADING_MESSAGES = {
  generic: "Зареждане...",
  files: "Зареждане на файлове...",
  products: "Зареждане на продукти...",
  members: "Зареждане на членове...",
} as const;

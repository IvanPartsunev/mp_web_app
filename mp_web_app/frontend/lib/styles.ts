/**
 * Shared CSS style constants for consistent styling across the application.
 * Import these constants instead of repeating long className strings.
 *
 * Usage:
 * import { HERO_STYLES, CARD_STYLES, STATE_STYLES } from "@/lib/styles";
 *
 * <section className={HERO_STYLES.section}>
 *   <div className={HERO_STYLES.overlay} />
 *   <div className={HERO_STYLES.container}>
 *     <h1 className={HERO_STYLES.title}>Title</h1>
 *   </div>
 * </section>
 */

/**
 * Hero section styles - used for page headers with gradient backgrounds
 */
export const HERO_STYLES = {
  /** Full section wrapper with gradient background */
  section:
    "relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-gray-900 dark:via-gray-800 dark:to-primary/5 border-b border-gray-200/50",
  /** Grid pattern overlay */
  overlay: "absolute inset-0 bg-grid-pattern opacity-5",
  /** Container with padding */
  container: "container mx-auto px-4 py-12 md:py-16 relative",
  /** Large container for home page hero */
  containerLarge: "container mx-auto px-4 py-16 md:py-24 relative",
  /** Centered content wrapper */
  content: "max-w-4xl mx-auto text-center",
  /** Main page title with gradient text */
  title:
    "text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary to-gray-900 dark:from-white dark:via-primary dark:to-white bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000",
  /** Subtitle/description text */
  subtitle:
    "text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150",
} as const;

/**
 * Card styles - for Card components with consistent look
 */
export const CARD_STYLES = {
  /** Base card styling (use with Card component) */
  base: "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700",
  /** Card header with bottom border */
  header: "p-6 border-b border-gray-100 dark:border-gray-700",
  /** Card content area */
  content: "p-6",
  /** Card content with no horizontal padding (for full-width tables) */
  contentNoPadding: "px-0",
} as const;

/**
 * Page section styles - for content sections
 */
export const SECTION_STYLES = {
  /** Standard page section */
  standard: "container mx-auto px-4 py-12",
  /** Full width section with responsive padding */
  fullWidth: "w-full px-2 xl:container xl:mx-auto xl:px-4 py-8",
} as const;

/**
 * Loading state styles
 */
export const LOADING_STYLES = {
  /** Centered loading container */
  container: "flex flex-col items-center justify-center py-20 space-y-4",
  /** Spinner wrapper */
  spinnerWrapper: "relative w-16 h-16",
  /** Outer spinner ring */
  spinnerOuter: "absolute inset-0 border-4 border-primary/20 rounded-full",
  /** Inner spinning ring */
  spinnerInner: "absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin",
  /** Loading text */
  text: "text-gray-600 dark:text-gray-400 animate-pulse",
} as const;

/**
 * Error state styles
 */
export const ERROR_STYLES = {
  /** Error container */
  container: "max-w-md mx-auto text-center py-20",
  /** Error card */
  card: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 space-y-4",
  /** Error icon wrapper */
  iconWrapper: "w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center",
  /** Error message text */
  message: "text-red-800 dark:text-red-200 font-semibold",
  /** Retry button */
  button:
    "px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95",
} as const;

/**
 * Empty state styles
 */
export const EMPTY_STYLES = {
  /** Empty state container */
  container: "max-w-md mx-auto text-center py-20",
  /** Empty state card */
  card: "bg-gray-50 dark:bg-gray-800 rounded-2xl p-12 space-y-4",
  /** Empty icon wrapper */
  iconWrapper: "w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center",
  /** Empty message text */
  message: "text-gray-600 dark:text-gray-400 text-lg",
} as const;

/**
 * Animation styles for list items
 */
export const ANIMATION_STYLES = {
  /** Fade in from bottom for grids/lists */
  gridFadeIn: "animate-in fade-in slide-in-from-bottom-8 duration-700",
  /** Individual item animation */
  itemFadeIn: "animate-in fade-in slide-in-from-bottom-4",
} as const;

/**
 * Form input styles
 */
export const FORM_STYLES = {
  /** Form label */
  label: "text-sm font-medium",
  /** Form group spacing */
  group: "space-y-4",
  /** Form row with multiple inputs */
  row: "grid grid-cols-3 gap-2",
} as const;

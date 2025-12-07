export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 mt-auto overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50" />
      
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container mx-auto px-4 py-8 relative">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            © {currentYear} Горовладелческа Производителна Кооперация &quot;Мурджов Пожар&quot;
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Всички права запазени
          </p>
        </div>
      </div>
    </footer>
  );
}

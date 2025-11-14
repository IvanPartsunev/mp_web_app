export function Logo() {

  return (
    <div className="relative flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-6 px-4 py-4 overflow-hidden min-h-[110px] sm:min-h-[130px]">
      {/* Forest-themed hero background image */}
      <div
        className="absolute inset-0 bg-[url('/imgs/background.jpg')] bg-center bg-cover opacity-40"
        aria-hidden="true"
      />

      {/* Modern gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/50 to-white/70 dark:from-gray-900/30 dark:via-gray-900/50 dark:to-gray-900/70"
        aria-hidden="true"
      />

      {/* Logo with modern styling */}
      <div className="relative z-10 group">
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
        <img
          src="/imgs/logo-cmyk.svg"
          alt="Горовладелческа Производителна Кооперация Мурджов Пожар Logo"
          className="relative h-[67px] w-auto sm:h-[84px] max-w-[147px] drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      
      {/* Company name with modern typography */}
      <div className="relative z-10 text-center sm:text-left">
        <span
          className="block font-serif font-bold leading-tight text-[1.0em] sm:text-[1.155em] text-gray-900/80 dark:text-white/80 drop-shadow-sm"
        >
          ГОРОВЛАДЕЛЧЕСКА ПРОИЗВОДИТЕЛНА
        </span>
        <span
          className="block font-serif font-bold leading-tight text-[1.0em] sm:text-[1.155em] text-gray-900/80 dark:text-white/80 drop-shadow-sm mt-1"
        >
          КООПЕРАЦИЯ &quot;МУРДЖОВ ПОЖАР&quot;
        </span>
      </div>
    </div>
  );
}

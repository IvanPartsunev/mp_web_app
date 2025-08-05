export function Logo() {
  return (
    <div
      className="relative flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-6 px-4 py-4 overflow-hidden">
      {/* background image */}
      <div
        className="absolute inset-0 bg-[url('/imgs/background.jpg')] bg-center bg-cover opacity-50 "
        aria-hidden="true"
      />

      {/* your content */}
      <img
        src="/imgs/logo-cmyk.svg"
        alt="Logo"
        className="relative h-24 w-auto sm:h-30 max-w-[200px] drop-shadow-sm drop-shadow-white"
      />
      <span
        className="relative drop-shadow-sm drop-shadow-white text-center sm:text-left font-serif font-bold leading-tight
                   text-[1.1em] sm:text-[1.3em] text-gray-800"
      >
        ГОРОВЛАДЕЛЧЕСКА ПРОИЗВОДИТЕЛНА<br/>
        КООПЕРАЦИЯ &quot;МУРДЖОВ ПОЖАР&quot;
      </span>
    </div>
  );
}

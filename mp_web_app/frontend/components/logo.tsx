import React from "react";

export function Logo() {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-2 sm:gap-6 px-4 py-4">
      <img
        src="imgs/logo-cmyk.svg"
        alt="Logo"
        className="h-20 w-auto sm:h-24 max-w-[120px]"
      />
      <span
        className="text-center sm:text-left font-serif font-bold leading-tight
                   text-[1.1em] sm:text-[1.3em] text-gray-700"
      >
        ГОРОВЛАДЕЛЧЕСКА ПРОИЗВОДИТЕЛНА<br/>
        КООПЕРАЦИЯ &quot;МУРДЖОВ ПОЖАР&quot;
      </span>
    </div>
  );
}

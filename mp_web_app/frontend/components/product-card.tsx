import {useState} from "react";
import {Package} from "lucide-react";
import type {Product} from "@/hooks/useProducts";

interface ProductCardProps {
  product: Product;
}

const SIZES_COLLAPSED_LIMIT = 3;
const DESC_CHAR_LIMIT = 180;

function SizesTable({product}: {product: Product}) {
  const [expanded, setExpanded] = useState(false);

  const hasSizes = product.sizes && product.sizes.length > 0;

  if (!hasSizes) {
    const legacyRows = [
      product.width != null ? {label: "Ширина", value: `${product.width} см`} : null,
      product.height != null ? {label: "Височина", value: `${product.height} см`} : null,
      product.length != null ? {label: "Дължина", value: `${product.length} см`} : null,
    ].filter(Boolean) as {label: string; value: string}[];

    if (legacyRows.length === 0) return null;

    return (
      <div>
        <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-1.5">Размери</p>
        <table className="text-sm border-collapse w-full">
          <tbody>
            {legacyRows.map((r) => (
              <tr key={r.label} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                <td className="py-1 pr-4 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{r.label}</td>
                <td className="py-1 text-gray-800 dark:text-gray-200">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const sizes = product.sizes!;
  const shouldCollapse = sizes.length > SIZES_COLLAPSED_LIMIT;
  const visibleSizes = expanded || !shouldCollapse ? sizes : sizes.slice(0, SIZES_COLLAPSED_LIMIT);

  const cols = {
    width: sizes.some((s) => s.width != null),
    height: sizes.some((s) => s.height != null),
    length: sizes.some((s) => s.length != null),
  };

  return (
    <div>
      <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-1.5">Размери</p>
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-1 pr-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap w-1/3">
                Вид
              </th>
              {cols.width && (
                <th className="py-1 pr-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Ширина
                </th>
              )}
              {cols.height && (
                <th className="py-1 pr-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Височина
                </th>
              )}
              {cols.length && (
                <th className="py-1 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Дължина
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleSizes.map((s, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                <td className="py-1.5 pr-4 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{s.label}</td>
                {cols.width && (
                  <td className="py-1.5 pr-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {s.width != null ? `${s.width} см` : "—"}
                  </td>
                )}
                {cols.height && (
                  <td className="py-1.5 pr-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {s.height != null ? `${s.height} см` : "—"}
                  </td>
                )}
                {cols.length && (
                  <td className="py-1.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {s.length != null ? `${s.length} см` : "—"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {shouldCollapse && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors duration-200 flex items-center gap-1"
        >
          {expanded ? "Покажи по-малко" : "Покажи всички"}
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function ProductCard({product}: ProductCardProps) {
  const [descExpanded, setDescExpanded] = useState(false);

  const shouldTruncateDesc = (product.description?.length ?? 0) > DESC_CHAR_LIMIT;
  const displayDesc =
    !descExpanded && shouldTruncateDesc ? product.description!.slice(0, DESC_CHAR_LIMIT) + "…" : product.description;

  const hasSizes =
    (product.sizes && product.sizes.length > 0) ||
    product.width != null ||
    product.height != null ||
    product.length != null;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
      style={{backdropFilter: "blur(10px)"}}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />

      {/* Picture */}
      <div className="w-full overflow-hidden bg-gray-100 dark:bg-gray-800" style={{aspectRatio: "16/9"}}>
        {product.picture_url ? (
          <img
            src={product.picture_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
            <Package className="w-12 h-12 opacity-40" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative p-5 space-y-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight group-hover:text-primary transition-colors duration-300">
          {product.name}
        </h3>

        {product.description && (
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{displayDesc}</p>
            {shouldTruncateDesc && (
              <button
                onClick={() => setDescExpanded((e) => !e)}
                className="mt-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors duration-200 flex items-center gap-1"
              >
                {descExpanded ? "Покажи по-малко" : "Прочети повече"}
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${descExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        )}

        {hasSizes && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <SizesTable product={product} />
          </div>
        )}
      </div>

      {/* Bottom shine */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}

export default ProductCard;

import {Package} from "lucide-react";
import type {Product} from "@/hooks/useProducts";

interface ProductCardProps {
  product: Product;
}

function SizesTable({product}: {product: Product}) {
  const hasSizes = product.sizes && product.sizes.length > 0;

  if (!hasSizes) {
    // fallback to legacy flat fields
    const legacyRows = [
      product.width != null ? {label: "Ширина", value: `${product.width} см`} : null,
      product.height != null ? {label: "Височина", value: `${product.height} см`} : null,
      product.length != null ? {label: "Дължина", value: `${product.length} см`} : null,
    ].filter(Boolean) as {label: string; value: string}[];

    if (legacyRows.length === 0) return null;

    return (
      <div>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Размери</p>
        <table className="text-sm border-collapse w-auto">
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

  const cols = {
    width: product.sizes!.some((s) => s.width != null),
    height: product.sizes!.some((s) => s.height != null),
    length: product.sizes!.some((s) => s.length != null),
  };

  return (
    <div>
      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Размери</p>
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-auto min-w-[200px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-1 pr-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Размер
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
            {product.sizes!.map((s, i) => (
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
    </div>
  );
}

export function ProductCard({product}: ProductCardProps) {

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-500">
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />

      <div className="relative p-6 space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-primary transition-colors duration-300">
          {product.name}
        </h3>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Picture */}
          <div className="w-full md:w-56 lg:w-64 flex-shrink-0">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
              {product.picture_url ? (
                <img
                  src={product.picture_url}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                  <Package className="w-16 h-16 opacity-40" />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4 flex-1">
            {product.description && (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            )}

            <SizesTable product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;

import {Package} from "lucide-react";
import type {Product} from "@/hooks/useProducts";

interface ProductCardProps {
  product: Product;
}

function DimensionPill({label, value}: {label: string; value: number}) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20">
      <span className="font-medium">{label}:</span>
      <span>{value} см</span>
    </span>
  );
}

export function ProductCard({product}: ProductCardProps) {
  const dims = [
    product.width != null ? {label: "Ширина", value: product.width} : null,
    product.height != null ? {label: "Височина", value: product.height} : null,
    product.length != null ? {label: "Дължина", value: product.length} : null,
  ].filter(Boolean) as {label: string; value: number}[];

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

            {dims.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Размери
                </p>
                <div className="flex flex-wrap gap-2">
                  {dims.map((d) => (
                    <DimensionPill key={d.label} label={d.label} value={d.value} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;

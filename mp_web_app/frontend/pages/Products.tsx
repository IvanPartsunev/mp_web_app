import {ProductCard} from "@/components/product-card";
import {useProducts} from "@/hooks/useProducts";
import {LoadingSpinner} from "@/components/ui/loading-spinner";

export default function Products() {
  const {data: products = [], isLoading, error} = useProducts();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-gray-900 dark:via-gray-800 dark:to-primary/5 border-b border-gray-200/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary to-gray-900 dark:from-white dark:via-primary dark:to-white bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Продукти
            </h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 py-10">
        {isLoading && <LoadingSpinner />}

        {error && (
          <p className="text-center text-red-600 py-8">Възникна грешка при зареждане.</p>
        )}

        {!isLoading && !error && products.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Няма налични продукти.</p>
        )}

        {!isLoading && !error && products.length > 0 && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            {products.map((product) => (
              <ProductCard key={product.id ?? product.name} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

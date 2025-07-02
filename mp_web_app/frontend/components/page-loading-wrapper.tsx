import React, {Suspense} from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface PageLoadingWrapperProps {
  children: React.ReactNode;
  loadingText?: string;
  fallback?: React.ReactNode;
}

export const PageLoadingWrapper: React.FC<PageLoadingWrapperProps> = ({
                                                                        children,
                                                                        loadingText = "Зареждане на страницата...",
                                                                        fallback
                                                                      }) => {
  const defaultFallback = (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text={loadingText}/>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

export default PageLoadingWrapper;
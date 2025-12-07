import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({size = "md", text = "Зареждане...", className = ""}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-gray-200 dark:border-gray-700 border-t-green-600 dark:border-t-green-500 rounded-full animate-spin`} />
      {text && <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;

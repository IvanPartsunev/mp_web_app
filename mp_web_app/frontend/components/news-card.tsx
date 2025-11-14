import {useState} from "react";
import {Calendar, Lock} from "lucide-react";

interface NewsCardProps {
  title: string;
  content: string;
  created_at: string;
  news_type: "regular" | "private";
}

export function NewsCard({title, content, created_at, news_type}: NewsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formattedDate = new Date(created_at).toLocaleDateString("bg-BG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isPrivate = news_type === "private";
  const shouldTruncate = content.length > 200;
  const displayContent = !isExpanded && shouldTruncate ? content.slice(0, 200) + "..." : content;

  return (
    <div 
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
      style={{
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Accent line with animation */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
      
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          
          {/* Badge with icon - only show for private news */}
          {isPrivate && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary/20">
              <Lock className="w-3 h-3" />
              За членове
            </div>
          )}
        </div>

        {/* Date with icon */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 text-primary" />
          <time dateTime={created_at}>{formattedDate}</time>
        </div>

        {/* Content */}
        <div className="relative">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </p>
          
          {/* Read more button */}
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 text-sm font-semibold text-primary hover:text-primary/80 transition-colors duration-200 flex items-center gap-1 group/btn"
            >
              {isExpanded ? "Покажи по-малко" : "Прочети повече"}
              <svg 
                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Bottom shine effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}

export default NewsCard;

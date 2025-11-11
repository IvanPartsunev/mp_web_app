import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";

interface NewsCardProps {
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  news_type: "regular" | "private";
}

export function NewsCard({title, content, author_id, created_at, news_type}: NewsCardProps) {
  const formattedDate = new Date(created_at).toLocaleDateString("bg-BG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="w-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-primary/50 hover:border-l-primary">
      <CardHeader className="space-y-3">
        <div className="flex justify-between items-start gap-3">
          <CardTitle className="text-xl font-bold leading-tight hover:text-primary transition-colors">
            {title}
          </CardTitle>
          <Badge
            variant={news_type === "private" ? "default" : "secondary"}
            className="shrink-0 px-3 py-1 rounded-full"
          >
            {news_type === "private" ? "За членове" : "Обществена"}
          </Badge>
        </div>
        <CardDescription className="text-sm flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60"></span>
          {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{content}</p>
      </CardContent>
    </Card>
  );
}

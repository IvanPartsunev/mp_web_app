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
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-xl">{title}</CardTitle>
          <Badge variant={news_type === "private" ? "default" : "secondary"}>
            {news_type === "private" ? "За членове" : "Обществена"}
          </Badge>
        </div>
        <CardDescription>{formattedDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
      </CardContent>
    </Card>
  );
}

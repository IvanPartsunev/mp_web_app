import {ReactNode} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

interface AdminLayoutProps {
  title: string;
  children: ReactNode;
}

export function AdminLayout({title, children}: AdminLayoutProps) {
  return (
    <div className="w-full px-2 xl:container xl:mx-auto xl:px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="px-0 [&>div]:space-y-4 [&>div>div:not(:has(table))]:px-6 [&>div>p]:px-6">{children}</CardContent>
      </Card>
    </div>
  );
}

import React, {ReactNode} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

interface AdminLayoutProps {
  title: string;
  children: ReactNode;
}

export function AdminLayout({title, children}: AdminLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

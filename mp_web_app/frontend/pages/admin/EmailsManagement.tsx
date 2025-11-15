import {AdminLayout} from "@/components/admin-layout";
import {Card} from "@/components/ui/card";

export default function EmailsManagement() {
  return (
    <AdminLayout title="Управление на мейли">
      <Card className="p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold">В разработка</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Функционалността за управление на мейли е в процес на разработка и скоро ще бъде достъпна.
          </p>
        </div>
      </Card>
    </AdminLayout>
  );
}

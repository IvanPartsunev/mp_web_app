import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Mail, Phone, User as UserIcon} from "lucide-react";
import {useBoardMembers} from "@/hooks/useUsers";

export default function Board() {
  const {data: members = [], isLoading: loading} = useBoardMembers();

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Зареждане...</p>
      </section>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-gray-900 dark:via-gray-800 dark:to-primary/5 border-b border-gray-200/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary to-gray-900 dark:from-white dark:via-primary dark:to-white bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Управителен съвет
            </h1>
          </div>
        </div>
      </section>

      <section className="w-full px-2 xl:container xl:mx-auto xl:px-4 py-8">
        <Card>
        <CardHeader>
          <CardTitle>Членове на управителния съвет</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Няма налични данни</p>
          ) : (
              <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        Име
                      </div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Имейл
                      </div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Телефон
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {member.first_name} {member.last_name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                          {member.email}
                        </a>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <a href={`tel:${member.phone}`} className="text-primary hover:underline">
                          {member.phone || "-"}
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
          )}
        </CardContent>
      </Card>
      </section>
    </div>
  );
}

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {User as UserIcon, Mail, Phone, CheckCircle, XCircle} from "lucide-react";
import {LoadingSpinner} from "@/components/ui/loading-spinner";
import {useMembers} from "@/hooks/useMembers";
import {useAuth} from "@/context/AuthContext";

export default function CooperativeMembers() {
  const {data: members = [], isLoading: loading} = useMembers({ proxy_only: false });
  const {user} = useAuth();
  const isAdmin = user?.role === "admin";
  const isBoardOrControl = user?.role === "board" || user?.role === "control";
  const canSeeContactInfo = isAdmin || isBoardOrControl;

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <LoadingSpinner />
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
              Член кооператори
            </h1>
          </div>
        </div>
      </section>

      <section className="w-full px-2 xl:container xl:mx-auto xl:px-4 py-8">
        <Card>
        <CardHeader>
          <CardTitle>Списък на член кооператорите ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Няма налични данни</p>
          ) : (
              <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap w-[5%]">№</TableHead>
                    <TableHead className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        Име
                      </div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Фамилия</TableHead>
                    {canSeeContactInfo && (
                      <>
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
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <TableHead className="whitespace-nowrap text-center">Код</TableHead>
                        <TableHead className="whitespace-nowrap text-center">Използван</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium whitespace-nowrap">{index + 1}</TableCell>
                      <TableCell className="whitespace-nowrap">{member.first_name}</TableCell>
                      <TableCell className="whitespace-nowrap">{member.last_name}</TableCell>
                      {canSeeContactInfo && (
                        <>
                          <TableCell className="whitespace-nowrap">{member.email || "-"}</TableCell>
                          <TableCell className="whitespace-nowrap">{member.phone || "-"}</TableCell>
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <TableCell className="text-center">
                            {member.member_code ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm bg-muted border border-border">
                                {member.member_code}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {member.member_code ? (
                              !member.member_code_valid ? (
                                <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                              )
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </>
                      )}
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

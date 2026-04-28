import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {User as UserIcon, Mail, Phone, CheckCircle} from "lucide-react";
import {LoadingSpinner} from "@/components/ui/loading-spinner";
import {useMembers} from "@/hooks/useMembers";
import {useAuth} from "@/context/AuthContext";
import {TABLE_STYLES, COLUMN_WIDTHS} from "@/lib/tableUtils";
import {HERO_STYLES, SECTION_STYLES} from "@/lib/styles";

export default function Proxies() {
  const {data: members = [], isLoading: loading, error: queryError} = useMembers({proxy_only: true}, 30 * 60 * 1000);
  const error = queryError ? "Неуспешно зареждане на пълномощниците" : null;
  const {isLoggedIn, user} = useAuth();
  const isAdmin = user?.role === "admin";
  const isBoardOrControl = user?.role === "board" || user?.role === "control";
  const canSeePhone = isAdmin || isBoardOrControl;

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </section>
    );
  }

  return (
    <div className="min-h-screen">
      <section className={HERO_STYLES.section}>
        <div className={HERO_STYLES.overlay} />
        <div className={HERO_STYLES.container}>
          <div className={HERO_STYLES.content}>
            <h1 className={HERO_STYLES.title}>Пълномощници</h1>
          </div>
        </div>
      </section>

      <section className={SECTION_STYLES.fullWidth}>
        <Card>
          <CardHeader>
            <CardTitle>Списък на пълномощниците ({members.length})</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {error ? (
              <p className="text-center text-destructive py-8">{error}</p>
            ) : members.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Няма налични пълномощници</p>
            ) : (
              <div className={TABLE_STYLES.scrollWrapper}>
                <Table className={TABLE_STYLES.tableLarge}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.rowNumber}`}>№</TableHead>
                      <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.name}`}>
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          Име
                        </div>
                      </TableHead>
                      <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.name}`}>Презиме</TableHead>
                      <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.name}`}>Фамилия</TableHead>
                      {isLoggedIn && (
                        <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.email}`}>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Имейл
                          </div>
                        </TableHead>
                      )}
                      {canSeePhone && (
                        <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.phone}`}>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Телефон
                          </div>
                        </TableHead>
                      )}
                      {isAdmin && (
                        <>
                          <TableHead className={`${TABLE_STYLES.headCenter} ${COLUMN_WIDTHS.small}`}>Код</TableHead>
                          <TableHead className={`${TABLE_STYLES.headCenter} ${COLUMN_WIDTHS.small}`}>
                            Използван
                          </TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member, index) => (
                      <TableRow key={index}>
                        <TableCell className={TABLE_STYLES.rowNumberCell}>{index + 1}</TableCell>
                        <TableCell className={TABLE_STYLES.cellBase}>{member.first_name}</TableCell>
                        <TableCell className={TABLE_STYLES.cellBase}>{member.middle_name || "-"}</TableCell>
                        <TableCell className={TABLE_STYLES.cellBase}>{member.last_name}</TableCell>
                        {isLoggedIn && <TableCell className={TABLE_STYLES.cellBase}>{member.email || "-"}</TableCell>}
                        {canSeePhone && <TableCell className={TABLE_STYLES.cellBase}>{member.phone || "-"}</TableCell>}
                        {isAdmin && (
                          <>
                            <TableCell className={TABLE_STYLES.cellCenter}>
                              {member.member_code ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm bg-muted border border-border">
                                  {member.member_code}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className={TABLE_STYLES.cellCenter}>
                              {member.member_code ? (
                                !member.member_code_valid ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                                ) : null
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

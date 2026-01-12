import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Mail, Phone, User as UserIcon} from "lucide-react";
import {useBoardMembers} from "@/hooks/useUsers";
import {useAuth} from "@/context/AuthContext";
import {TABLE_STYLES, COLUMN_WIDTHS, EMPTY_MESSAGES, LOADING_MESSAGES} from "@/lib/tableUtils";
import {HERO_STYLES, SECTION_STYLES} from "@/lib/styles";

export default function Board() {
  const {data: members = [], isLoading: loading} = useBoardMembers();
  const {isLoggedIn} = useAuth();

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">{LOADING_MESSAGES.generic}</p>
      </section>
    );
  }

  return (
    <div className="min-h-screen">
      <section className={HERO_STYLES.section}>
        <div className={HERO_STYLES.overlay} />
        <div className={HERO_STYLES.container}>
          <div className={HERO_STYLES.content}>
            <h1 className={HERO_STYLES.title}>Управителен съвет</h1>
          </div>
        </div>
      </section>

      <section className={SECTION_STYLES.fullWidth}>
        <Card>
          <CardHeader>
            <CardTitle>Членове на управителния съвет ({members.length})</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {members.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{EMPTY_MESSAGES.members}</p>
            ) : (
              <div className={TABLE_STYLES.scrollWrapper}>
                <Table className={TABLE_STYLES.tableMedium}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.rowNumber}`}>№</TableHead>
                      <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.nameWithIcon}`}>
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          Име
                        </div>
                      </TableHead>
                      {isLoggedIn && (
                        <>
                          <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.email}`}>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Имейл
                            </div>
                          </TableHead>
                          <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.phone}`}>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Телефон
                            </div>
                          </TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member, index) => (
                      <TableRow key={member.id}>
                        <TableCell className={TABLE_STYLES.rowNumberCell}>{index + 1}</TableCell>
                        <TableCell className={`${TABLE_STYLES.cellBase} font-medium`}>
                          {member.first_name} {member.last_name}
                        </TableCell>
                        {isLoggedIn && (
                          <>
                            <TableCell className={TABLE_STYLES.cellBase}>
                              <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                                {member.email}
                              </a>
                            </TableCell>
                            <TableCell className={TABLE_STYLES.cellBase}>
                              <a href={`tel:${member.phone}`} className="text-primary hover:underline">
                                {member.phone || "-"}
                              </a>
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

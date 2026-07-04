import {useState, useMemo} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {User as UserIcon, Mail, Phone, Search} from "lucide-react";
import {LoadingSpinner} from "@/components/ui/loading-spinner";
import {useMembers} from "@/hooks/useMembers";
import {TABLE_STYLES, COLUMN_WIDTHS, EMPTY_MESSAGES} from "@/lib/tableUtils";
import {HERO_STYLES, SECTION_STYLES} from "@/lib/styles";
import {usePagination} from "@/hooks/usePagination";
import {TablePagination} from "@/components/table-pagination";
import {RoleBadge} from "@/components/role-badge";

export default function Control() {
  const {data: members = [], isLoading: loading, error: queryError} = useMembers("control", 30 * 60 * 1000);
  const error = queryError ? "Неуспешно зареждане на контролния съвет" : null;

  const [search, setSearch] = useState("");

  const filteredMembers = useMemo(() => {
    const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return members;
    return members.filter((m) => {
      const nameParts = [m.first_name, m.middle_name, m.last_name].filter(Boolean).map((p) => p!.toLowerCase());
      const usedIndices = new Set<number>();
      return words.every((word) => {
        const idx = nameParts.findIndex((part, i) => !usedIndices.has(i) && part.startsWith(word));
        if (idx !== -1) {
          usedIndices.add(idx);
          return true;
        }
        return false;
      });
    });
  }, [members, search]);

  const pagination = usePagination(filteredMembers, 50, true);

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
            <h1 className={HERO_STYLES.title}>Контролен съвет</h1>
          </div>
        </div>
      </section>

      <section className={SECTION_STYLES.fullWidth}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle>
                Членове на контролния съвет ({filteredMembers.length}
                {search && ` от ${members.length}`})
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Търсене..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    pagination.goToPage(1);
                  }}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {error ? (
              <p className="text-center text-destructive py-8">{error}</p>
            ) : members.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{EMPTY_MESSAGES.members}</p>
            ) : (
              <>
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
                        <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.small}`}>Роля</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagination.pageItems.map((member, index) => (
                        <TableRow key={index}>
                          <TableCell className={TABLE_STYLES.rowNumberCell}>
                            {pagination.startIdx + index + 1}
                          </TableCell>
                          <TableCell className={TABLE_STYLES.cellBase}>{member.first_name}</TableCell>
                          <TableCell className={TABLE_STYLES.cellBase}>{member.middle_name || "-"}</TableCell>
                          <TableCell className={TABLE_STYLES.cellBase}>{member.last_name}</TableCell>
                          <TableCell className={TABLE_STYLES.cellBase}>{member.email || "-"}</TableCell>
                          <TableCell className={TABLE_STYLES.cellBase}>{member.phone || "-"}</TableCell>
                          <TableCell className={TABLE_STYLES.cellBase}>
                            <RoleBadge proxy={member.proxy} board={member.board} control={member.control} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="py-4">
                  <TablePagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={pagination.goToPage}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

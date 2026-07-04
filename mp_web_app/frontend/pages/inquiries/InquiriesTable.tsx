import {useNavigate} from "react-router-dom";
import {Inquiry, STATUS_BG} from "@/hooks/useInquiries";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "secondary",
  accepted: "outline",
  in_progress: "default",
  closed: "outline",
  finished: "default",
  failed: "destructive",
};

interface Props {
  title: string;
  inquiries: Inquiry[];
  isLoading: boolean;
  error?: string | null;
}

export function InquiriesTable({title, inquiries, isLoading, error}: Props) {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>

      {isLoading && <p className="text-muted-foreground">Зареждане...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!isLoading && !error && inquiries.length === 0 && <p className="text-muted-foreground">Няма запитвания.</p>}

      {!isLoading && inquiries.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Вх. номер</TableHead>
              <TableHead>Заглавие</TableHead>
              <TableHead className="w-28">Вид</TableHead>
              <TableHead className="w-32">Статус</TableHead>
              <TableHead className="w-32">Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.map((inq) => (
              <TableRow
                key={inq.id}
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => navigate(`/inquiries/${inq.id}`)}
              >
                <TableCell className="font-mono text-sm">{inq.entry_number ?? "—"}</TableCell>
                <TableCell className="font-medium">{inq.title}</TableCell>
                <TableCell className="capitalize">{inq.inquiry_type}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[inq.status] ?? "secondary"}>
                    {STATUS_BG[inq.status] ?? inq.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{inq.created_at?.slice(0, 10) ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

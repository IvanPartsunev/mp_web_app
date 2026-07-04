import {useNavigate} from "react-router-dom";
import {Inquiry, STATUS_BG} from "@/hooks/useInquiries";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";

const STATUS_CLASS: Record<string, string> = {
  sent: "border border-gray-400 text-gray-500 bg-transparent",
  accepted: "border border-blue-500 text-blue-600 bg-transparent",
  in_progress: "border border-amber-600 text-amber-700 bg-transparent",
  closed: "border border-gray-600 text-gray-700 bg-transparent",
  finished: "border border-green-600 text-green-700 bg-transparent",
  failed: "border border-red-500 text-red-600 bg-transparent",
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
                <TableCell className="uppercase">{inq.inquiry_type}</TableCell>
                <TableCell>
                  <Badge className={`rounded-sm ${STATUS_CLASS[inq.status] ?? "border border-gray-400 text-gray-500 bg-transparent"}`}>
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

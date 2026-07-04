import {useState} from "react";
import {AdminLayout} from "@/components/admin-layout";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {useToast} from "@/components/ui/use-toast";
import {LoadingSpinner} from "@/components/ui/loading-spinner";
import {Lock, Globe, Pencil, Trash2} from "lucide-react";
import {TABLE_STYLES, COLUMN_WIDTHS, DEFAULT_PAGE_SIZE} from "@/lib/tableUtils";
import {useAdminNews, useCreateNews, useUpdateNews, useDeleteNews, NewsItem} from "@/hooks/useNews";
import type {ApiError} from "@/lib/errorUtils";
import {TablePagination} from "@/components/table-pagination";

interface News extends NewsItem {
  id: string;
  author_id: string;
  created_at: string;
}

export default function NewsManagement() {
  const {data: news = [], isLoading: loading} = useAdminNews();
  const createMutation = useCreateNews();
  const updateMutation = useUpdateNews();
  const deleteMutation = useDeleteNews();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(news.length / DEFAULT_PAGE_SIZE));
  const pagedNews = news.slice((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    news_type: "regular" as "regular" | "private",
  });

  const {toast} = useToast();

  const handleCreate = async () => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        toast({title: "Успех", description: "Новината е създадена успешно"});
        setCreateDialogOpen(false);
        setFormData({title: "", content: "", news_type: "regular"});
      },
      onError: (err: Error) => {
        const detail = (err as ApiError).response?.data?.detail;
        toast({
          title: "Грешка",
          description: detail || "Неуспешно създаване на новината",
          variant: "destructive",
        });
      },
    });
  };

  const handleEdit = async () => {
    if (!selectedNews) return;

    updateMutation.mutate(
      {id: selectedNews.id, ...formData},
      {
        onSuccess: () => {
          toast({title: "Успех", description: "Новината е обновена успешно"});
          setEditDialogOpen(false);
          setSelectedNews(null);
          setFormData({title: "", content: "", news_type: "regular"});
        },
        onError: (err: Error) => {
          const detail = (err as ApiError).response?.data?.detail;
          toast({
            title: "Грешка",
            description: detail || "Неуспешно обновяване на новината",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDelete = async () => {
    if (!selectedNews) return;

    deleteMutation.mutate(selectedNews.id, {
      onSuccess: () => {
        toast({title: "Успех", description: "Новината е изтрита успешно"});
        setDeleteDialogOpen(false);
        setSelectedNews(null);
      },
      onError: (err: Error) => {
        const detail = (err as ApiError).response?.data?.detail;
        toast({
          title: "Грешка",
          description: detail || "Неуспешно изтриване на новината",
          variant: "destructive",
        });
      },
    });
  };

  const openEditDialog = (newsItem: News) => {
    setSelectedNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      news_type: newsItem.news_type ?? "regular",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (newsItem: News) => {
    setSelectedNews(newsItem);
    setDeleteDialogOpen(true);
  };

  return (
    <AdminLayout title="Управление на новини">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Списък с новини ({news.length})</h3>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline-primary">Създай новина</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Създай нова новина</DialogTitle>
                <DialogDescription>Попълнете формата за да създадете нова новина</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Заглавие</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Въведете заглавие"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Съдържание</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="Въведете съдържание"
                    rows={6}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Тип</label>
                  <Select
                    value={formData.news_type}
                    onValueChange={(value: "regular" | "private") => setFormData({...formData, news_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Обществена</SelectItem>
                      <SelectItem value="private">За членове</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full">
                  Създай
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : news.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Няма налични новини</p>
        ) : (
          <div className={TABLE_STYLES.scrollWrapper}>
            <Table className={TABLE_STYLES.tableBase}>
              <TableHeader>
                <TableRow>
                  <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.rowNumber}`}>№</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[45%] min-w-[200px]`}>Заглавие</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[20%]`}>Тип</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[15%]`}>Дата</TableHead>
                  <TableHead className={`${TABLE_STYLES.headCenter} w-[90px]`}>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedNews.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className={TABLE_STYLES.rowNumberCell}>
                      {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell className="font-medium w-[45%] min-w-[200px]">
                      <span className="block truncate pr-4">{item.title}</span>
                    </TableCell>
                    <TableCell className={TABLE_STYLES.cellBase}>
                      {item.news_type === "private" ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap w-fit bg-primary/10 text-primary border border-primary/20">
                          <Lock className="w-3 h-3" />
                          За членове
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap w-fit bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                          <Globe className="w-3 h-3" />
                          Обществена
                        </div>
                      )}
                    </TableCell>
                    <TableCell className={TABLE_STYLES.cellBase}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString("bg-BG") : "-"}
                    </TableCell>
                    <TableCell className={TABLE_STYLES.cellCenter}>
                      <div className="flex justify-center gap-2">
                        <button
                          title="Редактирай"
                          onClick={() => openEditDialog(item as News)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Изтрий"
                          onClick={() => openDeleteDialog(item as News)}
                          className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактирай новина</DialogTitle>
              <DialogDescription>Редактирайте детайлите на новината</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Заглавие</label>
                <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Съдържание</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={6}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Тип</label>
                <Select
                  value={formData.news_type}
                  onValueChange={(value: "regular" | "private") => setFormData({...formData, news_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Обществена</SelectItem>
                    <SelectItem value="private">За членове</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleEdit} className="w-full">
                Запази
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Изтриване на новина"
          description="Сигурни ли сте, че искате да изтриете тази новина? Това действие не може да бъде отменено."
          onConfirm={handleDelete}
          confirmText="Изтрий"
          variant="destructive"
        />
      </div>
    </AdminLayout>
  );
}

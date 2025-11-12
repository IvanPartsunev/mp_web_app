import React, {useEffect, useState} from "react";
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
import {Badge} from "@/components/ui/badge";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {useToast} from "@/components/ui/use-toast";
import apiClient from "@/context/apiClient";
import {getAccessToken} from "@/context/tokenStore";

interface News {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  news_type: "regular" | "private";
}

export default function NewsManagement() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    news_type: "regular" as "regular" | "private",
  });

  const {toast} = useToast();

  const fetchNews = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const response = await apiClient.get("news/list", {
        params: token ? {token} : {},
      });
      setNews(response.data || []);
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err.response?.data?.detail || "Неуспешно зареждане на новините",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleCreate = async () => {
    try {
      await apiClient.post("news/create", formData);
      toast({
        title: "Успех",
        description: "Новината е създадена успешно",
      });
      setCreateDialogOpen(false);
      setFormData({title: "", content: "", news_type: "regular"});
      fetchNews();
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err.response?.data?.detail || "Неуспешно създаване на новината",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedNews) return;
    try {
      await apiClient.put(`news/update/${selectedNews.id}`, formData);
      toast({
        title: "Успех",
        description: "Новината е обновена успешно",
      });
      setEditDialogOpen(false);
      setSelectedNews(null);
      setFormData({title: "", content: "", news_type: "regular"});
      fetchNews();
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err.response?.data?.detail || "Неуспешно обновяване на новината",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedNews) return;
    try {
      await apiClient.delete(`news/delete/${selectedNews.id}`);
      toast({
        title: "Успех",
        description: "Новината е изтрита успешно",
      });
      setDeleteDialogOpen(false);
      setSelectedNews(null);
      fetchNews();
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err.response?.data?.detail || "Неуспешно изтриване на новината",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (newsItem: News) => {
    setSelectedNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      news_type: newsItem.news_type,
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
          <h3 className="text-lg font-semibold">Списък с новини</h3>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Създай новина</Button>
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
          <p className="text-center text-muted-foreground">Зареждане...</p>
        ) : news.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Няма налични новини</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Заглавие</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {news.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    <Badge variant={item.news_type === "private" ? "default" : "secondary"}>
                      {item.news_type === "private" ? "За членове" : "Обществена"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleDateString("bg-BG")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                        Редактирай
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(item)}>
                        Изтрий
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

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

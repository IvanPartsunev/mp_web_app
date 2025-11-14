import {useEffect, useState} from "react";
import {AdminLayout} from "@/components/admin-layout";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {useToast} from "@/components/ui/use-toast";
import apiClient from "@/context/apiClient";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  subscribed: boolean;
  created_at: string;
}

const roleTranslations: Record<string, string> = {
  regular: "Обикновен",
  board: "УС",
  control: "КС",
  admin: "Админ",
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<{
    role: string;
    active: boolean;
    subscribed: boolean;
  } | null>(null);

  const {toast} = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("users/list");
      // Force a new array reference to trigger React re-render
      setUsers([...(response.data || [])]);
    } catch (err) {
      toast({
        title: "Грешка",
        description: "Неуспешно зареждане на потребителите",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      role: user.role,
      active: user.active,
      subscribed: user.subscribed,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedUser || !formData) return;
    try {
      await apiClient.put(`users/update/${selectedUser.id}`, formData);
      toast({
        title: "Успех",
        description: "Потребителят е обновен успешно",
      });
      setEditDialogOpen(false);
      setSelectedUser(null);
      setFormData(null);
      await fetchUsers();
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err.response?.data?.detail || "Неуспешно обновяване на потребителя",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await apiClient.delete(`users/delete/${selectedUser.id}`);
      toast({
        title: "Успех",
        description: "Потребителят е изтрит успешно",
      });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Грешка",
        description: err.response?.data?.detail || "Неуспешно изтриване на потребителя",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout title="Управление на потребители">
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Зареждане...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Име</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роля</TableHead>
                <TableHead>Активен</TableHead>
                <TableHead>Абониран</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{roleTranslations[user.role] || user.role}</TableCell>
                  <TableCell>{user.active ? "Да" : "Не"}</TableCell>
                  <TableCell>{user.subscribed ? "Да" : "Не"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                        Редактирай
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(user)}>
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
        <Dialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setFormData(null);
              setSelectedUser(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактирай потребител</DialogTitle>
              <DialogDescription>Променете ролята и настройките на потребителя</DialogDescription>
            </DialogHeader>
            {formData && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Роля</label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Обикновен</SelectItem>
                      <SelectItem value="board">УС</SelectItem>
                      <SelectItem value="control">КС</SelectItem>
                      <SelectItem value="admin">Администратор</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Активен</label>
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Абониран</label>
                  <Switch
                    checked={formData.subscribed}
                    onCheckedChange={(checked) => setFormData({...formData, subscribed: checked})}
                  />
                </div>
                <Button onClick={handleEdit} className="w-full">
                  Запази
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Изтриване на потребител"
          description="Сигурни ли сте, че искате да изтриете този потребител? Това действие не може да бъде отменено."
          onConfirm={handleDelete}
          confirmText="Изтрий"
          variant="destructive"
        />
      </div>
    </AdminLayout>
  );
}

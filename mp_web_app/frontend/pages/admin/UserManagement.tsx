import {useState} from "react";
import {AdminLayout} from "@/components/admin-layout";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {useToast} from "@/components/ui/use-toast";
import {LoadingSpinner} from "@/components/ui/loading-spinner";
import {useUsersList, useUpdateUser, useDeleteUser} from "@/hooks/useUsers";
import {TABLE_STYLES, COLUMN_WIDTHS} from "@/lib/tableUtils";

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
  accountant: "Счетоводител",
  admin: "Админ",
};

export default function UserManagement() {
  const {data: users = [], isLoading: loading} = useUsersList();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<{
    role: string;
    active: boolean;
    subscribed: boolean;
  } | null>(null);

  const {toast} = useToast();

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

    updateMutation.mutate({id: selectedUser.id, ...formData}, {
      onSuccess: () => {
        toast({title: "Успех", description: "Потребителят е обновен успешно"});
        setEditDialogOpen(false);
        setSelectedUser(null);
        setFormData(null);
      },
      onError: (err: any) => {
        toast({
          title: "Грешка",
          description: err.response?.data?.detail || "Неуспешно обновяване на потребителя",
          variant: "destructive",
        });
      },
    });
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    deleteMutation.mutate(selectedUser.id, {
      onSuccess: () => {
        toast({title: "Успех", description: "Потребителят е изтрит успешно"});
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      },
      onError: (err: any) => {
        toast({
          title: "Грешка",
          description: err.response?.data?.detail || "Неуспешно изтриване на потребителя",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <AdminLayout title="Управление на потребители">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Списък с потребители ({users.length})</h3>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className={TABLE_STYLES.scrollWrapper}>
          <Table className={TABLE_STYLES.tableBase}>
            <TableHeader>
              <TableRow>
                <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.rowNumber}`}>№</TableHead>
                <TableHead className={TABLE_STYLES.headBase}>Име</TableHead>
                <TableHead className={TABLE_STYLES.headBase}>Email</TableHead>
                <TableHead className={TABLE_STYLES.headBase}>Телефон</TableHead>
                <TableHead className={`${TABLE_STYLES.headBase} w-[10%]`}>Роля</TableHead>
                <TableHead className={`${TABLE_STYLES.headBase} w-[8%]`}>Активен</TableHead>
                <TableHead className={`${TABLE_STYLES.headBase} w-[8%]`}>Абониран</TableHead>
                <TableHead className={`${TABLE_STYLES.headBase} w-[15%]`}>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell className={TABLE_STYLES.rowNumberCell}>{index + 1}</TableCell>
                  <TableCell className={`${TABLE_STYLES.cellBase} font-medium`}>
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell className={TABLE_STYLES.cellBase}>{user.email}</TableCell>
                  <TableCell className={TABLE_STYLES.cellBase}>{user.phone || "-"}</TableCell>
                  <TableCell className={TABLE_STYLES.cellBase}>{roleTranslations[user.role] || user.role}</TableCell>
                  <TableCell className={TABLE_STYLES.cellBase}>{user.active ? "Да" : "Не"}</TableCell>
                  <TableCell className={TABLE_STYLES.cellBase}>{user.subscribed ? "Да" : "Не"}</TableCell>
                  <TableCell className={TABLE_STYLES.cellBase}>
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
          </div>
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
                      <SelectItem value="accountant">Счетоводител</SelectItem>
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

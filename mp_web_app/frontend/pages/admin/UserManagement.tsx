import {useState} from "react";
import {AdminLayout} from "@/components/admin-layout";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {useToast} from "@/components/ui/use-toast";
import {LoadingSpinner} from "@/components/ui/loading-spinner";
import {useUsersList, useUpdateUser, useDeleteUser, useRedactUserPhone, useRedactUserNames, User} from "@/hooks/useUsers";
import type {ApiError} from "@/lib/errorUtils";
import {TABLE_STYLES, COLUMN_WIDTHS, DEFAULT_PAGE_SIZE} from "@/lib/tableUtils";
import {TablePagination} from "@/components/table-pagination";

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
  const redactPhoneMutation = useRedactUserPhone();
  const redactNamesMutation = useRedactUserNames();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(users.length / DEFAULT_PAGE_SIZE));
  const pagedUsers = users.slice((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE);

  const [formData, setFormData] = useState<{
    role: string;
    active: boolean;
    subscribed: boolean;
    phone: string | null;
    first_name: string;
    last_name: string;
  } | null>(null);

  const {toast} = useToast();

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      role: user.role ?? "regular",
      active: user.active ?? user.is_active ?? false,
      subscribed: user.subscribed ?? false,
      phone: user.phone ?? null,
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedUser?.id || !formData) return;

    updateMutation.mutate(
      {id: selectedUser.id, role: formData.role, active: formData.active, subscribed: formData.subscribed, first_name: formData.first_name, last_name: formData.last_name, phone: formData.phone ?? undefined},
      {
        onSuccess: () => {
          toast({title: "Успех", description: "Потребителят е обновен успешно"});
          setEditDialogOpen(false);
          setSelectedUser(null);
          setFormData(null);
        },
        onError: (err: Error) => {
          const detail = (err as ApiError).response?.data?.detail;
          toast({
            title: "Грешка",
            description: detail || "Неуспешно обновяване на потребителя",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleRedactPhone = () => {
    if (!selectedUser?.id) return;

    redactPhoneMutation.mutate(selectedUser.id, {
      onSuccess: () => {
        toast({title: "Успех", description: "Телефонът е заличен успешно"});
        setFormData((prev) => (prev ? {...prev, phone: null} : prev));
        setSelectedUser((prev) => (prev ? {...prev, phone: undefined} : prev));
      },
      onError: (err: Error) => {
        const detail = (err as ApiError).response?.data?.detail;
        toast({
          title: "Грешка",
          description: detail || "Неуспешно заличаване на телефона",
          variant: "destructive",
        });
      },
    });
  };

  const handleRedactNames = () => {
    if (!selectedUser?.id) return;

    redactNamesMutation.mutate(selectedUser.id, {
      onSuccess: () => {
        toast({title: "Успех", description: "Имената са заличени успешно"});
        setFormData((prev) => (prev ? {...prev, first_name: "[ЗАЛИЧЕНО]", last_name: "[ЗАЛИЧЕНО]"} : prev));
        setSelectedUser((prev) => (prev ? {...prev, first_name: "[ЗАЛИЧЕНО]", last_name: "[ЗАЛИЧЕНО]"} : prev));
      },
      onError: (err: Error) => {
        const detail = (err as ApiError).response?.data?.detail;
        toast({
          title: "Грешка",
          description: detail || "Неуспешно заличаване на имената",
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
    if (!selectedUser?.id) return;

    deleteMutation.mutate(selectedUser.id, {
      onSuccess: () => {
        toast({title: "Успех", description: "Потребителят е изтрит успешно"});
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      },
      onError: (err: Error) => {
        const detail = (err as ApiError).response?.data?.detail;
        toast({
          title: "Грешка",
          description: detail || "Неуспешно изтриване на потребителя",
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
                  <TableHead className={`${TABLE_STYLES.headCenter} w-[15%]`}>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedUsers.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className={TABLE_STYLES.rowNumberCell}>
                      {(page - 1) * DEFAULT_PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell className={`${TABLE_STYLES.cellBase} font-medium`}>
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell className={TABLE_STYLES.cellBase}>{user.email}</TableCell>
                    <TableCell className={TABLE_STYLES.cellBase}>{user.phone || "-"}</TableCell>
                    <TableCell className={TABLE_STYLES.cellBase}>
                      {user.role ? roleTranslations[user.role] || user.role : "-"}
                    </TableCell>
                    <TableCell className={TABLE_STYLES.cellBase}>
                      {(user.active ?? user.is_active) ? "Да" : "Не"}
                    </TableCell>
                    <TableCell className={TABLE_STYLES.cellBase}>{user.subscribed ? "Да" : "Не"}</TableCell>
                    <TableCell className={TABLE_STYLES.cellCenter}>
                      <div className="flex justify-center gap-2">
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
        <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

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
                  <label className="text-sm font-medium">Име</label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Фамилия</label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Телефон</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={formData.phone ?? ""}
                      onChange={(e) => setFormData({...formData, phone: e.target.value || null})}
                      placeholder="Няма телефон"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRedactPhone}
                      disabled={formData.phone === null || redactPhoneMutation.isPending}
                    >
                      Заличи
                    </Button>
                  </div>
                </div>
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

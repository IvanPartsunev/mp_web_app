import {useState} from "react";
import {AdminLayout} from "@/components/admin-layout";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
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
import {extractApiErrorDetails} from "@/lib/errorUtils";
import {TABLE_STYLES, COLUMN_WIDTHS} from "@/lib/tableUtils";
import {useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, Product} from "@/hooks/useProducts";

export default function ProductsManagement() {
  const {data: products = [], isLoading: loading} = useProducts();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    width: "",
    height: "",
    length: "",
    description: "",
  });

  const {toast} = useToast();

  const handleCreate = async () => {
    const payload = {
      name: formData.name,
      width: formData.width ? parseFloat(formData.width) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      length: formData.length ? parseFloat(formData.length) : null,
      description: formData.description || null,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast({title: "Успех", description: "Продуктът е създаден успешно"});
        setCreateDialogOpen(false);
        setFormData({name: "", width: "", height: "", length: "", description: ""});
      },
      onError: (err: any) => {
        const errorMessage = extractApiErrorDetails(err.response?.data) || "Неуспешно създаване на продукта";
        toast({title: "Грешка", description: errorMessage, variant: "destructive"});
      },
    });
  };

  const handleEdit = async () => {
    if (!selectedProduct?.id) return;

    if (!formData.name || formData.name.trim() === "") {
      toast({title: "Грешка", description: "Името на продукта е задължително", variant: "destructive"});
      return;
    }

    const payload = {
      id: selectedProduct.id,
      name: formData.name.trim(),
      width: formData.width && formData.width.trim() !== "" ? parseFloat(formData.width) : null,
      height: formData.height && formData.height.trim() !== "" ? parseFloat(formData.height) : null,
      length: formData.length && formData.length.trim() !== "" ? parseFloat(formData.length) : null,
      description: formData.description && formData.description.trim() !== "" ? formData.description.trim() : null,
    };

    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast({title: "Успех", description: "Продуктът е обновен успешно"});
        setEditDialogOpen(false);
        setSelectedProduct(null);
        setFormData({name: "", width: "", height: "", length: "", description: ""});
      },
      onError: (err: any) => {
        const errorMessage = extractApiErrorDetails(err.response?.data) || "Неуспешно обновяване на продукта";
        toast({title: "Грешка", description: errorMessage, variant: "destructive"});
      },
    });
  };

  const handleDelete = async () => {
    if (!selectedProduct?.id) return;

    deleteMutation.mutate(selectedProduct.id, {
      onSuccess: () => {
        toast({title: "Успех", description: "Продуктът е изтрит успешно"});
        setDeleteDialogOpen(false);
        setSelectedProduct(null);
      },
      onError: (err: any) => {
        const errorMessage = extractApiErrorDetails(err.response?.data) || "Неуспешно изтриване на продукта";
        toast({title: "Грешка", description: errorMessage, variant: "destructive"});
      },
    });
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      width: product.width?.toString() || "",
      height: product.height?.toString() || "",
      length: product.length?.toString() || "",
      description: product.description || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  return (
    <AdminLayout title="Управление на продукти">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Списък с продукти ({products.length})</h3>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Създай продукт</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Създай нов продукт</DialogTitle>
                <DialogDescription>Попълнете формата за да създадете нов продукт</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Име *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Въведете име на продукта"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-sm font-medium">Дължина (см)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.length}
                      onChange={(e) => setFormData({...formData, length: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ширина (см)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.width}
                      onChange={(e) => setFormData({...formData, width: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Височина (см)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.height}
                      onChange={(e) => setFormData({...formData, height: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Описание</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Въведете описание"
                    rows={4}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={!formData.name}>
                  Създай
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Няма налични продукти</p>
        ) : (
          <div className={TABLE_STYLES.scrollWrapper}>
          <Table className={TABLE_STYLES.tableXLarge}>
            <TableHeader>
              <TableRow>
                <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.rowNumber}`}>№</TableHead>
                <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.nameWithIcon}`}>Име</TableHead>
                <TableHead className={`${TABLE_STYLES.headCenter} ${COLUMN_WIDTHS.small}`}>Дължина (см)</TableHead>
                <TableHead className={`${TABLE_STYLES.headCenter} ${COLUMN_WIDTHS.small}`}>Ширина (см)</TableHead>
                <TableHead className={`${TABLE_STYLES.headCenter} ${COLUMN_WIDTHS.small}`}>Височина (см)</TableHead>
                <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.description}`}>Описание</TableHead>
                <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.actions}`}>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={product.id}>
                  <TableCell className={TABLE_STYLES.rowNumberCell}>{index + 1}</TableCell>
                  <TableCell className={`${TABLE_STYLES.cellBase} font-medium`}>{product.name}</TableCell>
                  <TableCell className={TABLE_STYLES.cellCenter}>{product.length ?? "-"}</TableCell>
                  <TableCell className={TABLE_STYLES.cellCenter}>{product.width ?? "-"}</TableCell>
                  <TableCell className={TABLE_STYLES.cellCenter}>{product.height ?? "-"}</TableCell>
                  <TableCell className={TABLE_STYLES.cellBase}>{product.description || "-"}</TableCell>
                  <TableCell className={TABLE_STYLES.cellBase}>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                        Редактирай
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(product)}>
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
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактирай продукт</DialogTitle>
              <DialogDescription>Редактирайте детайлите на продукта</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Име *</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-sm font-medium">Дължина (см)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.length}
                    onChange={(e) => setFormData({...formData, length: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ширина (см)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.width}
                    onChange={(e) => setFormData({...formData, width: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Височина (см)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.height}
                    onChange={(e) => setFormData({...formData, height: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Описание</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                />
              </div>
              <Button onClick={handleEdit} className="w-full" disabled={!formData.name}>
                Запази
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Изтриване на продукт"
          description="Сигурни ли сте, че искате да изтриете този продукт? Това действие не може да бъде отменено."
          onConfirm={handleDelete}
          confirmText="Изтрий"
          variant="destructive"
        />
      </div>
    </AdminLayout>
  );
}

import {useRef, useState} from "react";
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
import type {ApiError} from "@/lib/errorUtils";
import {TABLE_STYLES, COLUMN_WIDTHS, DEFAULT_PAGE_SIZE} from "@/lib/tableUtils";
import {
  useAdminProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useOrphanedPictures,
  useDeleteOrphanedPictures,
  type Product,
} from "@/hooks/useProducts";
import {TablePagination} from "@/components/table-pagination";
import {MoreVertical, Package, Pencil, Trash2, X} from "lucide-react";

// ---------------------------------------------------------------------------
// Dimensions display helper
// ---------------------------------------------------------------------------
function formatDimensions(product: Product): string {
  const parts = [
    product.width != null ? `Ш: ${product.width} см` : null,
    product.height != null ? `В: ${product.height} см` : null,
    product.length != null ? `Д: ${product.length} см` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "—";
}

// ---------------------------------------------------------------------------
// Picture preview helper
// ---------------------------------------------------------------------------
interface PictureInputProps {
  currentUrl?: string | null;
  onFileChange: (file: File | null) => void;
  onRemove?: () => void;
  removePicture?: boolean;
}

function PictureInput({currentUrl, onFileChange, onRemove, removePicture}: PictureInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onFileChange(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const displayUrl = preview ?? (removePicture ? null : currentUrl);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Снимка</label>
      <div className="flex gap-3 items-start">
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 border border-gray-200 dark:border-gray-700">
          {displayUrl ? (
            <img src={displayUrl} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package className="w-8 h-8 opacity-40" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="w-full">
            {displayUrl ? "Смени снимката" : "Избери снимка"}
          </Button>
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={handleChange} />
          {onRemove && currentUrl && !preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <X className="h-3 w-3 mr-1" />
              {removePicture ? "Отмени премахването" : "Премахни снимката"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dimensions editor — 3 plain number inputs
// ---------------------------------------------------------------------------
interface DimensionsEditorProps {
  width: string;
  height: string;
  length: string;
  onChange: (field: "width" | "height" | "length", val: string) => void;
}

function DimensionsEditor({width, height, length, onChange}: DimensionsEditorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Размери (см)</label>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            {key: "width", label: "Ширина"},
            {key: "height", label: "Височина"},
            {key: "length", label: "Дължина"},
          ] as const
        ).map(({key, label}) => (
          <div key={key} className="space-y-1">
            <label className="text-xs text-muted-foreground">{label}</label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                step="any"
                placeholder="—"
                value={key === "width" ? width : key === "height" ? height : length}
                onChange={(e) => onChange(key, e.target.value)}
                className="h-8 text-sm pr-8"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                см
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Initial form state
// ---------------------------------------------------------------------------
const emptyForm = () => ({
  name: "",
  description: "",
  width: "",
  height: "",
  length: "",
  picture: null as File | null,
  remove_picture: false,
});

type FormData = ReturnType<typeof emptyForm>;

function parseNum(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ProductsManagement() {
  const {data: products = [], isLoading: loading} = useAdminProducts();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const orphansQuery = useOrphanedPictures();
  const deleteOrphansMutation = useDeleteOrphanedPictures();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orphansDialogOpen, setOrphansDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState<FormData>(emptyForm());

  const {toast} = useToast();

  const totalPages = Math.max(1, Math.ceil(products.length / DEFAULT_PAGE_SIZE));
  const pagedProducts = products.slice((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE);

  const setDim = (field: "width" | "height" | "length", val: string) =>
    setFormData((f) => ({...f, [field]: val}));

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({title: "Грешка", description: "Името е задължително", variant: "destructive"});
      return;
    }
    createMutation.mutate(
      {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        width: parseNum(formData.width),
        height: parseNum(formData.height),
        length: parseNum(formData.length),
        picture: formData.picture,
      },
      {
        onSuccess: () => {
          toast({title: "Успех", description: "Продуктът е създаден успешно"});
          setCreateDialogOpen(false);
          setFormData(emptyForm());
        },
        onError: (err: Error) => {
          toast({
            title: "Грешка",
            description: extractApiErrorDetails((err as ApiError).response?.data) || "Неуспешно създаване",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleEdit = () => {
    if (!selectedProduct?.id) return;
    if (!formData.name.trim()) {
      toast({title: "Грешка", description: "Името е задължително", variant: "destructive"});
      return;
    }
    updateMutation.mutate(
      {
        id: selectedProduct.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        width: parseNum(formData.width),
        height: parseNum(formData.height),
        length: parseNum(formData.length),
        picture: formData.picture,
        remove_picture: formData.remove_picture,
      },
      {
        onSuccess: () => {
          toast({title: "Успех", description: "Продуктът е обновен успешно"});
          setEditDialogOpen(false);
          setSelectedProduct(null);
          setFormData(emptyForm());
        },
        onError: (err: Error) => {
          toast({
            title: "Грешка",
            description: extractApiErrorDetails((err as ApiError).response?.data) || "Неуспешно обновяване",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleDelete = () => {
    if (!selectedProduct?.id) return;
    deleteMutation.mutate(selectedProduct.id, {
      onSuccess: () => {
        toast({title: "Успех", description: "Продуктът е изтрит успешно"});
        setDeleteDialogOpen(false);
        setSelectedProduct(null);
      },
      onError: (err: Error) => {
        toast({
          title: "Грешка",
          description: extractApiErrorDetails((err as ApiError).response?.data) || "Неуспешно изтриване",
          variant: "destructive",
        });
      },
    });
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      width: product.width != null ? String(product.width) : "",
      height: product.height != null ? String(product.height) : "",
      length: product.length != null ? String(product.length) : "",
      picture: null,
      remove_picture: false,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleCheckOrphans = async () => {
    await orphansQuery.refetch();
    setOrphansDialogOpen(true);
  };

  const handleDeleteOrphans = () => {
    deleteOrphansMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast({title: "Успех", description: `Изтрити ${data.deleted} файла`});
        setOrphansDialogOpen(false);
      },
      onError: () => {
        toast({title: "Грешка", description: "Неуспешно изтриване на неизползвани снимки", variant: "destructive"});
      },
    });
  };

  const formFields = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Име *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Въведете име на продукта"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Описание</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Въведете описание"
          rows={3}
        />
      </div>
      <DimensionsEditor
        width={formData.width}
        height={formData.height}
        length={formData.length}
        onChange={setDim}
      />
    </div>
  );

  return (
    <AdminLayout title="Управление на продукти">
      <div className="space-y-4">
        {/* Header bar */}
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-lg font-semibold">Списък с продукти ({products.length})</h3>
          <div className="flex items-center gap-2">
            {/* Create dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Създай продукт</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Създай нов продукт</DialogTitle>
                  <DialogDescription>Попълнете формата за да създадете нов продукт</DialogDescription>
                </DialogHeader>
                {formFields}
                <PictureInput onFileChange={(file) => setFormData({...formData, picture: file})} />
                <Button onClick={handleCreate} className="w-full" disabled={!formData.name || createMutation.isPending}>
                  {createMutation.isPending ? "Създаване..." : "Създай"}
                </Button>
              </DialogContent>
            </Dialog>

            {/* Maintenance kebab */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                title="Опции"
                aria-label="Опции"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-8 z-20 w-56 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1">
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                      disabled={orphansQuery.isFetching}
                      onClick={() => {
                        setMenuOpen(false);
                        handleCheckOrphans();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      {orphansQuery.isFetching ? "Проверка..." : "Изчисти неизползвани снимки"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Няма налични продукти</p>
        ) : (
          <div className={TABLE_STYLES.scrollWrapper}>
            <Table className={TABLE_STYLES.tableXLarge}>
              <TableHeader>
                <TableRow>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[56px]`}>Снимка</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.nameWithIcon}`}>Име</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.description}`}>Описание</TableHead>
                  <TableHead className={`${TABLE_STYLES.headBase} w-[220px]`}>Размери</TableHead>
                  <TableHead className={`${TABLE_STYLES.headCenter} ${COLUMN_WIDTHS.actions}`}>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="py-2">
                      <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                        {product.picture_url ? (
                          <img src={product.picture_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-5 h-5 opacity-40" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={`${TABLE_STYLES.cellBase} font-medium`}>{product.name}</TableCell>
                    <TableCell className={TABLE_STYLES.cellBase}>
                      {product.description
                        ? product.description.length > 60
                          ? product.description.slice(0, 60) + "…"
                          : product.description
                        : "—"}
                    </TableCell>
                    <TableCell className={`${TABLE_STYLES.cellBase} text-sm text-muted-foreground`}>
                      {formatDimensions(product)}
                    </TableCell>
                    <TableCell className={TABLE_STYLES.cellCenter}>
                      <div className="flex justify-center gap-2">
                        <button
                          title="Редактирай"
                          onClick={() => openEditDialog(product)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Изтрий"
                          onClick={() => openDeleteDialog(product)}
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
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Редактирай продукт</DialogTitle>
              <DialogDescription>Редактирайте детайлите на продукта</DialogDescription>
            </DialogHeader>
            {formFields}
            <PictureInput
              currentUrl={selectedProduct?.picture_url}
              onFileChange={(file) => setFormData({...formData, picture: file})}
              onRemove={() => setFormData({...formData, remove_picture: !formData.remove_picture})}
              removePicture={formData.remove_picture}
            />
            <Button onClick={handleEdit} className="w-full" disabled={!formData.name || updateMutation.isPending}>
              {updateMutation.isPending ? "Запазване..." : "Запази"}
            </Button>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Изтриване на продукт"
          description="Сигурни ли сте, че искате да изтриете този продукт? Снимката му също ще бъде изтрита. Това действие не може да бъде отменено."
          onConfirm={handleDelete}
          confirmText="Изтрий"
          variant="destructive"
        />

        {/* Orphans Dialog */}
        <Dialog open={orphansDialogOpen} onOpenChange={setOrphansDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Неизползвани снимки</DialogTitle>
              <DialogDescription>Снимки в S3 под products/, които не са свързани с никой продукт.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {orphansQuery.isFetching ? (
                <LoadingSpinner />
              ) : orphansQuery.data?.count === 0 ? (
                <p className="text-sm text-muted-foreground">Няма неизползвани снимки.</p>
              ) : (
                <>
                  <p className="text-sm">
                    Намерени <span className="font-semibold">{orphansQuery.data?.count ?? 0}</span> неизползвани снимки.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
                    {orphansQuery.data?.orphans.map((key) => (
                      <li key={key} className="truncate">{key}</li>
                    ))}
                  </ul>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDeleteOrphans}
                    disabled={deleteOrphansMutation.isPending}
                  >
                    {deleteOrphansMutation.isPending ? "Изтриване..." : `Изтрий всички (${orphansQuery.data?.count ?? 0})`}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

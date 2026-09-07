"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  useAdminDiskon,
  useCreateDiskon,
  useUpdateDiskon,
  useDeleteDiskon,
} from "@/hooks/useAdmin";
import {
  diskonSchema,
  toCreateDiskonPayload,
  toDateInputValue,
  type DiskonFormValues,
} from "@/schemas/admin.schema";
import { DataTable, type Column } from "@/components/features/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, Pencil, Trash2, Tag } from "lucide-react";
import type { Diskon } from "@/types";

// ─── Modal states ──────────────────────────────────────────────────────────

type ModalState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; diskon: Diskon }
  | { kind: "delete"; diskon: Diskon };

// ─── Format helpers ────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

// ─── Create form ──────────────────────────────────────────────────────────

function CreateDiskonForm({ onSuccess }: { onSuccess: () => void }) {
  const createDiskon = useCreateDiskon();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DiskonFormValues>({
    resolver: zodResolver(diskonSchema),
    defaultValues: {
      nama_diskon: "",
      persentase_diskon: undefined as unknown as number,
      tanggal_awal: "",
      tanggal_akhir: "",
    },
  });

  const onSubmit = async (values: DiskonFormValues) => {
    try {
      const payload = toCreateDiskonPayload(values);
      await createDiskon.mutateAsync(payload);
      toast.success("Diskon berhasil ditambahkan");
      onSuccess();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menambah diskon",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nama_diskon">Nama Diskon</Label>
        <Input id="nama_diskon" {...register("nama_diskon")} />
        {errors.nama_diskon && (
          <p className="text-xs text-destructive">
            {errors.nama_diskon.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="persentase_diskon">Persentase Diskon (%)</Label>
        <Input
          id="persentase_diskon"
          type="number"
          min={1}
          max={100}
          {...register("persentase_diskon", { valueAsNumber: true })}
        />
        {errors.persentase_diskon && (
          <p className="text-xs text-destructive">
            {errors.persentase_diskon.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tanggal_awal">Tanggal Awal</Label>
          <Input
            id="tanggal_awal"
            type="date"
            {...register("tanggal_awal")}
          />
          {errors.tanggal_awal && (
            <p className="text-xs text-destructive">
              {errors.tanggal_awal.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tanggal_akhir">Tanggal Akhir</Label>
          <Input
            id="tanggal_akhir"
            type="date"
            {...register("tanggal_akhir")}
          />
          {errors.tanggal_akhir && (
            <p className="text-xs text-destructive">
              {errors.tanggal_akhir.message}
            </p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createDiskon.isPending}>
          {createDiskon.isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────

function EditDiskonForm({
  diskon,
  onSuccess,
}: {
  diskon: Diskon;
  onSuccess: () => void;
}) {
  const updateDiskon = useUpdateDiskon();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DiskonFormValues>({
    resolver: zodResolver(diskonSchema),
    defaultValues: {
      nama_diskon: diskon.nama_diskon,
      persentase_diskon: diskon.persentase_diskon,
      tanggal_awal: toDateInputValue(diskon.tanggal_awal),
      tanggal_akhir: toDateInputValue(diskon.tanggal_akhir),
    },
  });

  const onSubmit = async (values: DiskonFormValues) => {
    try {
      const payload = toCreateDiskonPayload(values);
      await updateDiskon.mutateAsync({ id: diskon.id, ...payload });
      toast.success("Diskon berhasil diperbarui");
      onSuccess();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui diskon",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-nama_diskon">Nama Diskon</Label>
        <Input id="edit-nama_diskon" {...register("nama_diskon")} />
        {errors.nama_diskon && (
          <p className="text-xs text-destructive">
            {errors.nama_diskon.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-persentase">Persentase Diskon (%)</Label>
        <Input
          id="edit-persentase"
          type="number"
          min={1}
          max={100}
          {...register("persentase_diskon", { valueAsNumber: true })}
        />
        {errors.persentase_diskon && (
          <p className="text-xs text-destructive">
            {errors.persentase_diskon.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-tanggal_awal">Tanggal Awal</Label>
          <Input
            id="edit-tanggal_awal"
            type="date"
            {...register("tanggal_awal")}
          />
          {errors.tanggal_awal && (
            <p className="text-xs text-destructive">
              {errors.tanggal_awal.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-tanggal_akhir">Tanggal Akhir</Label>
          <Input
            id="edit-tanggal_akhir"
            type="date"
            {...register("tanggal_akhir")}
          />
          {errors.tanggal_akhir && (
            <p className="text-xs text-destructive">
              {errors.tanggal_akhir.message}
            </p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={updateDiskon.isPending}>
          {updateDiskon.isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────

function DeleteDiskonDialog({
  diskon,
  onClose,
}: {
  diskon: Diskon;
  onClose: () => void;
}) {
  const deleteDiskon = useDeleteDiskon();
  const [open, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
    onClose();
  };

  const handleDelete = async () => {
    try {
      await deleteDiskon.mutateAsync(diskon.id);
      toast.success("Diskon berhasil dihapus");
      close();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus diskon",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hapus Diskon</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus diskon{" "}
            <span className="font-medium text-foreground">
              {diskon.nama_diskon}
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteDiskon.isPending}
          >
            {deleteDiskon.isPending ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Diskon page ──────────────────────────────────────────────────────────

export default function AdminDiskonPage() {
  const { data: diskonList = [], isLoading, isError, refetch } = useAdminDiskon();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return diskonList as Diskon[];
    return (diskonList as Diskon[]).filter(
      (d) =>
        d.nama_diskon.toLowerCase().includes(q) ||
        String(d.persentase_diskon).includes(q),
    );
  }, [diskonList, search]);

  const columns: Column<Diskon>[] = [
    {
      key: "nama_diskon",
      header: "Nama Diskon",
      render: (d) => <span className="font-medium">{d.nama_diskon}</span>,
    },
    {
      key: "persentase_diskon",
      header: "Persentase",
      render: (d) => <span className="tabular-nums">{d.persentase_diskon}%</span>,
    },
    {
      key: "tanggal_awal",
      header: "Tanggal Awal",
      render: (d) => <span className="text-sm">{formatDate(d.tanggal_awal)}</span>,
    },
    {
      key: "tanggal_akhir",
      header: "Tanggal Akhir",
      render: (d) => <span className="text-sm">{formatDate(d.tanggal_akhir)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (d) =>
        d.is_active ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Aktif
          </Badge>
        ) : (
          <Badge variant="secondary">Kadaluwarsa</Badge>
        ),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (d) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${d.nama_diskon}`}
            onClick={() => setModal({ kind: "edit", diskon: d })}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Hapus ${d.nama_diskon}`}
            className="text-destructive hover:text-destructive"
            onClick={() => setModal({ kind: "delete", diskon: d })}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold">Data Diskon</h2>
          <p className="text-sm text-muted-foreground">
            Kelola kode promo dan diskon untuk reservasi.
          </p>
        </div>
        <Button onClick={() => setModal({ kind: "create" })}>
          <Plus className="size-4" />
          Tambah Diskon
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama diskon..."
          className="pl-8"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={isError}
        onRetry={() => refetch()}
        emptyMessage="Belum ada diskon"
        rowKey={(d) => String(d.id)}
        onRowClick={(d) => setModal({ kind: "edit", diskon: d })}
      />

      {/* Create modal */}
      <Dialog
        open={modal.kind === "create"}
        onOpenChange={(o) => (o ? null : setModal({ kind: "none" }))}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="size-4" />
              Tambah Diskon
            </DialogTitle>
            <DialogDescription>
              Buat kode promo diskon baru untuk reservasi.
            </DialogDescription>
          </DialogHeader>
          <CreateDiskonForm onSuccess={() => setModal({ kind: "none" })} />
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog
        open={modal.kind === "edit"}
        onOpenChange={(o) => (o ? null : setModal({ kind: "none" }))}
      >
        {modal.kind === "edit" && (
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="size-4" />
                Edit Diskon
              </DialogTitle>
              <DialogDescription>
                Perbarui data diskon {modal.diskon.nama_diskon}.
              </DialogDescription>
            </DialogHeader>
            <EditDiskonForm
              diskon={modal.diskon}
              onSuccess={() => setModal({ kind: "none" })}
            />
          </DialogContent>
        )}
      </Dialog>

      {/* Delete modal */}
      {modal.kind === "delete" && (
        <DeleteDiskonDialog
          diskon={modal.diskon}
          onClose={() => setModal({ kind: "none" })}
        />
      )}
    </div>
  );
}
"use client";

import { useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  useAdminSpaces,
  useCreateSpace,
  useUpdateSpace,
  useDeleteSpace,
  useUploadSpaceFoto,
} from "@/hooks/useAdmin";
import { spaceSchema, type SpaceFormValues } from "@/schemas/admin.schema";
import { DataTable, type Column } from "@/components/features/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, Pencil, Trash2, DoorOpen } from "lucide-react";
import type { Space, SpaceType } from "@/types";
import { SPACE_TYPE_LABELS } from "@/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const TIPE_OPTIONS: { value: SpaceType; label: string }[] = [
  { value: "desk", label: SPACE_TYPE_LABELS.desk },
  { value: "meeting_room", label: SPACE_TYPE_LABELS.meeting_room },
  { value: "private_office", label: SPACE_TYPE_LABELS.private_office },
];

// ─── Modal states ──────────────────────────────────────────────────────────

type ModalState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; space: Space }
  | { kind: "delete"; space: Space };

// ─── Create form ──────────────────────────────────────────────────────────

function CreateSpaceForm({ onSuccess }: { onSuccess: () => void }) {
  const createSpace = useCreateSpace();
  const uploadFoto = useUploadSpaceFoto();
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      nama_space: "",
      tipe: "desk",
      harga_per_jam: undefined as unknown as number,
      kapasitas: undefined as unknown as number,
      deskripsi: "",
    },
  });

  const onSubmit = async (values: SpaceFormValues) => {
    try {
      let foto: string | undefined;
      if (fotoFile) {
        try {
          foto = await uploadFoto.mutateAsync(fotoFile);
        } catch {
          toast.warning("Gagal mengunggah foto, space dibuat tanpa foto");
        }
      }
      await createSpace.mutateAsync({ ...values, foto });
      toast.success("Space berhasil ditambahkan");
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah space");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nama_space">Nama Space</Label>
        <Input id="nama_space" {...register("nama_space")} />
        {errors.nama_space && (
          <p className="text-xs text-destructive">{errors.nama_space.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipe">Tipe</Label>
        <Controller
          name="tipe"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih tipe space" />
              </SelectTrigger>
              <SelectContent>
                {TIPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.tipe && (
          <p className="text-xs text-destructive">{errors.tipe.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="harga_per_jam">Harga per Jam (Rp)</Label>
          <Input
            id="harga_per_jam"
            type="number"
            min={1000}
            {...register("harga_per_jam", { valueAsNumber: true })}
          />
          {errors.harga_per_jam && (
            <p className="text-xs text-destructive">
              {errors.harga_per_jam.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="kapasitas">Kapasitas</Label>
          <Input
            id="kapasitas"
            type="number"
            min={1}
            max={100}
            {...register("kapasitas", { valueAsNumber: true })}
          />
          {errors.kapasitas && (
            <p className="text-xs text-destructive">{errors.kapasitas.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deskripsi">Deskripsi</Label>
        <Textarea id="deskripsi" rows={3} {...register("deskripsi")} />
        {errors.deskripsi && (
          <p className="text-xs text-destructive">{errors.deskripsi.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="foto">Foto Space (opsional)</Label>
        <Input
          id="foto"
          type="file"
          accept="image/*"
          ref={fileRef}
          onChange={(e) => setFotoFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">
          Upload foto setelah space dibuat.
        </p>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createSpace.isPending}>
          {createSpace.isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────

function EditSpaceForm({
  space,
  onSuccess,
}: {
  space: Space;
  onSuccess: () => void;
}) {
  const updateSpace = useUpdateSpace();
  const uploadFoto = useUploadSpaceFoto();
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      nama_space: space.nama_space,
      tipe: space.tipe,
      harga_per_jam: space.harga_per_jam,
      kapasitas: space.kapasitas,
      deskripsi: space.deskripsi,
    },
  });

  const onSubmit = async (values: SpaceFormValues) => {
    try {
      let foto: string | null | undefined;
      if (fotoFile) {
        const filename = await uploadFoto.mutateAsync(fotoFile);
        foto = filename;
      }
      await updateSpace.mutateAsync({ id: space.id, ...values, foto });
      toast.success("Space berhasil diperbarui");
      onSuccess();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui space",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-nama_space">Nama Space</Label>
        <Input id="edit-nama_space" {...register("nama_space")} />
        {errors.nama_space && (
          <p className="text-xs text-destructive">{errors.nama_space.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-tipe">Tipe</Label>
        <Controller
          name="tipe"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.tipe && (
          <p className="text-xs text-destructive">{errors.tipe.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-harga">Harga per Jam (Rp)</Label>
          <Input
            id="edit-harga"
            type="number"
            min={1000}
            {...register("harga_per_jam", { valueAsNumber: true })}
          />
          {errors.harga_per_jam && (
            <p className="text-xs text-destructive">
              {errors.harga_per_jam.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-kapasitas">Kapasitas</Label>
          <Input
            id="edit-kapasitas"
            type="number"
            min={1}
            max={100}
            {...register("kapasitas", { valueAsNumber: true })}
          />
          {errors.kapasitas && (
            <p className="text-xs text-destructive">{errors.kapasitas.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-deskripsi">Deskripsi</Label>
        <Textarea id="edit-deskripsi" rows={3} {...register("deskripsi")} />
        {errors.deskripsi && (
          <p className="text-xs text-destructive">{errors.deskripsi.message}</p>
        )}
      </div>

      {space.foto_url && (
        <div className="space-y-1">
          <Label>Foto Saat Ini</Label>
          <img
            src={space.foto_url}
            alt={space.nama_space}
            className="h-24 w-40 rounded-lg object-cover ring-1 ring-foreground/10"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="edit-foto">Ganti Foto (opsional)</Label>
        <Input
          id="edit-foto"
          type="file"
          accept="image/*"
          ref={fileRef}
          onChange={(e) => setFotoFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={updateSpace.isPending}>
          {updateSpace.isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────

function DeleteSpaceDialog({
  space,
  onClose,
}: {
  space: Space;
  onClose: () => void;
}) {
  const deleteSpace = useDeleteSpace();
  const [open, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
    onClose();
  };

  const handleDelete = async () => {
    try {
      await deleteSpace.mutateAsync(space.id);
      toast.success("Space berhasil dihapus");
      close();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus space");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hapus Space</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus{" "}
            <span className="font-medium text-foreground">
              {space.nama_space}
            </span>
            ? Space dengan reservasi aktif tidak dapat dihapus.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteSpace.isPending}
          >
            {deleteSpace.isPending ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Spaces page ──────────────────────────────────────────────────────────

export default function AdminSpacesPage() {
  const { data: spaces = [], isLoading, isError, refetch } = useAdminSpaces();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return spaces as Space[];
    return (spaces as Space[]).filter(
      (s) =>
        s.nama_space.toLowerCase().includes(q) ||
        SPACE_TYPE_LABELS[s.tipe]?.toLowerCase().includes(q),
    );
  }, [spaces, search]);

  const columns: Column<Space>[] = [
    {
      key: "nama_space",
      header: "Nama",
      render: (s) => (
        <span className="font-medium">{s.nama_space}</span>
      ),
    },
    {
      key: "tipe",
      header: "Tipe",
      render: (s) => {
        const label = SPACE_TYPE_LABELS[s.tipe] ?? s.tipe;
        return <Badge variant="secondary">{label}</Badge>;
      },
    },
    {
      key: "harga_per_jam",
      header: "Harga",
      render: (s) => <span className="tabular-nums">{formatRupiah(s.harga_per_jam)}</span>,
    },
    {
      key: "kapasitas",
      header: "Kapasitas",
      render: (s) => <span>{s.kapasitas} orang</span>,
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (s) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${s.nama_space}`}
            onClick={() => setModal({ kind: "edit", space: s })}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Hapus ${s.nama_space}`}
            className="text-destructive hover:text-destructive"
            onClick={() => setModal({ kind: "delete", space: s })}
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
          <h2 className="text-lg font-semibold">Data Space</h2>
          <p className="text-sm text-muted-foreground">
            Kelola seluruh data ruangan coworking space Anda.
          </p>
        </div>
        <Button onClick={() => setModal({ kind: "create" })}>
          <Plus className="size-4" />
          Tambah Space
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau tipe space..."
          className="pl-8"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={isError}
        onRetry={() => refetch()}
        emptyMessage="Belum ada space"
        rowKey={(s) => String(s.id)}
        onRowClick={(s) => setModal({ kind: "edit", space: s })}
      />

      {/* Create modal */}
      <Dialog
        open={modal.kind === "create"}
        onOpenChange={(o) => (o ? null : setModal({ kind: "none" }))}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorOpen className="size-4" />
              Tambah Space
            </DialogTitle>
            <DialogDescription>
              Tambah ruangan baru untuk coworking space Anda.
            </DialogDescription>
          </DialogHeader>
          <CreateSpaceForm onSuccess={() => setModal({ kind: "none" })} />
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
                Edit Space
              </DialogTitle>
              <DialogDescription>
                Perbarui data ruangan {modal.space.nama_space}.
              </DialogDescription>
            </DialogHeader>
            <EditSpaceForm
              space={modal.space}
              onSuccess={() => setModal({ kind: "none" })}
            />
          </DialogContent>
        )}
      </Dialog>

      {/* Delete modal */}
      {modal.kind === "delete" && (
        <DeleteSpaceDialog
          space={modal.space}
          onClose={() => setModal({ kind: "none" })}
        />
      )}
    </div>
  );
}
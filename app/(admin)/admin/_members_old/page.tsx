"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  useMembers,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
} from "@/hooks/useAdmin";
import type {
  CreateMemberPayload,
  UpdateMemberPayload,
} from "@/hooks/useAdmin";
import { DataTable, type Column } from "@/components/features/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Search, Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import type { Member } from "@/types";

// ─── Form schemas ──────────────────────────────────────────────────────────

const createSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  nama_member: z.string().min(1, "Nama member wajib diisi"),
  instansi: z.string().min(1, "Instansi wajib diisi"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  telp: z.string().min(1, "Nomor telepon wajib diisi"),
});

const editSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter").optional(),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .optional()
    .or(z.literal("")),
  nama_member: z.string().min(1, "Nama member wajib diisi"),
  instansi: z.string().min(1, "Instansi wajib diisi"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  telp: z.string().min(1, "Nomor telepon wajib diisi"),
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;

// ─── Modal states ──────────────────────────────────────────────────────────

type ModalState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; member: Member }
  | { kind: "delete"; member: Member };

// ─── Create form ──────────────────────────────────────────────────────────

function CreateMemberForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const createMember = useCreateMember();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
  });

  const onSubmit = async (values: CreateFormValues) => {
    try {
      const payload: CreateMemberPayload = { ...values, foto: null };
      await createMember.mutateAsync(payload);
      toast.success("Member berhasil ditambahkan");
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah member");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" {...register("username")} />
        {errors.username && (
          <p className="text-xs text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nama_member">Nama Member</Label>
        <Input id="nama_member" {...register("nama_member")} />
        {errors.nama_member && (
          <p className="text-xs text-destructive">
            {errors.nama_member.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="instansi">Instansi</Label>
        <Input id="instansi" {...register("instansi")} />
        {errors.instansi && (
          <p className="text-xs text-destructive">
            {errors.instansi.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="alamat">Alamat</Label>
        <Textarea id="alamat" rows={2} {...register("alamat")} />
        {errors.alamat && (
          <p className="text-xs text-destructive">{errors.alamat.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="telp">Nomor Telepon</Label>
        <Input id="telp" type="tel" {...register("telp")} />
        {errors.telp && (
          <p className="text-xs text-destructive">{errors.telp.message}</p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createMember.isPending}>
          {createMember.isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────

function EditMemberForm({
  member,
  onSuccess,
}: {
  member: Member;
  onSuccess: () => void;
}) {
  const updateMember = useUpdateMember();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      nama_member: member.nama_member,
      instansi: member.instansi,
      alamat: member.alamat,
      telp: member.telp,
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: EditFormValues) => {
    try {
      const payload: UpdateMemberPayload = {
        nama_member: values.nama_member,
        instansi: values.instansi,
        alamat: values.alamat,
        telp: values.telp,
      };
      if (values.username && values.username.trim()) {
        payload.username = values.username;
      }
      if (values.password && values.password.trim()) {
        payload.password = values.password;
      }
      await updateMember.mutateAsync({ id: member.id, ...payload });
      toast.success("Member berhasil diperbarui");
      onSuccess();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui member",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-username">Username</Label>
        <Input
          id="edit-username"
          placeholder="Kosongkan jika tidak diubah"
          {...register("username")}
        />
        {errors.username && (
          <p className="text-xs text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-password">Password</Label>
        <Input
          id="edit-password"
          type="password"
          placeholder="Kosongkan jika tidak diubah"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-nama">Nama Member</Label>
        <Input id="edit-nama" {...register("nama_member")} />
        {errors.nama_member && (
          <p className="text-xs text-destructive">
            {errors.nama_member.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-instansi">Instansi</Label>
        <Input id="edit-instansi" {...register("instansi")} />
        {errors.instansi && (
          <p className="text-xs text-destructive">
            {errors.instansi.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-alamat">Alamat</Label>
        <Textarea id="edit-alamat" rows={2} {...register("alamat")} />
        {errors.alamat && (
          <p className="text-xs text-destructive">{errors.alamat.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-telp">Nomor Telepon</Label>
        <Input id="edit-telp" type="tel" {...register("telp")} />
        {errors.telp && (
          <p className="text-xs text-destructive">{errors.telp.message}</p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={updateMember.isPending}>
          {updateMember.isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────

function DeleteMemberDialog({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const deleteMember = useDeleteMember();
  const [open, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
    onClose();
  };

  const handleDelete = async () => {
    try {
      await deleteMember.mutateAsync(member.id);
      toast.success("Member berhasil dihapus");
      close();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus member");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hapus Member</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus member{" "}
            <span className="font-medium text-foreground">
              {member.nama_member}
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
            disabled={deleteMember.isPending}
          >
            {deleteMember.isPending ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Members page ─────────────────────────────────────────────────────────

export default function AdminMembersPage() {
  const { data: members = [], isLoading, isError, refetch } = useMembers();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members as Member[];
    return (members as Member[]).filter((m) =>
      m.nama_member.toLowerCase().includes(q),
    );
  }, [members, search]);

  const columns: Column<Member>[] = [
    {
      key: "id",
      header: "ID",
      render: (m) => <span className="text-muted-foreground">{m.id}</span>,
    },
    {
      key: "nama_member",
      header: "Nama",
      render: (m) => (
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="size-7 justify-center rounded-full">
            {m.nama_member?.charAt(0)?.toUpperCase() ?? "M"}
          </Badge>
          <span className="font-medium">{m.nama_member}</span>
        </div>
      ),
    },
    { key: "instansi", header: "Instansi" },
    { key: "telp", header: "Telepon" },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (m) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${m.nama_member}`}
            onClick={() => setModal({ kind: "edit", member: m })}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Hapus ${m.nama_member}`}
            className="text-destructive hover:text-destructive"
            onClick={() => setModal({ kind: "delete", member: m })}
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
          <h2 className="text-lg font-semibold">Data Member</h2>
          <p className="text-sm text-muted-foreground">
            Kelola seluruh data member terdaftar.
          </p>
        </div>
        <Button onClick={() => setModal({ kind: "create" })}>
          <Plus className="size-4" />
          Tambah Member
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama member..."
          className="pl-8"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={isError}
        onRetry={() => refetch()}
        emptyMessage="Belum ada member terdaftar"
        rowKey={(m) => String(m.id)}
        onRowClick={(m) => setModal({ kind: "edit", member: m })}
      />

      {/* Create modal */}
      <Dialog
        open={modal.kind === "create"}
        onOpenChange={(o) => (o ? null : setModal({ kind: "none" }))}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-4" />
              Tambah Member
            </DialogTitle>
            <DialogDescription>
              Buat akun member baru untuk coworking space Anda.
            </DialogDescription>
          </DialogHeader>
          <CreateMemberForm onSuccess={() => setModal({ kind: "none" })} />
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
                Edit Member
              </DialogTitle>
              <DialogDescription>
                Perbarui data member {modal.member.nama_member}.
              </DialogDescription>
            </DialogHeader>
            <EditMemberForm
              member={modal.member}
              onSuccess={() => setModal({ kind: "none" })}
            />
          </DialogContent>
        )}
      </Dialog>

      {/* Delete modal */}
      {modal.kind === "delete" && (
        <DeleteMemberDialog
          member={modal.member}
          onClose={() => setModal({ kind: "none" })}
        />
      )}
    </div>
  );
}
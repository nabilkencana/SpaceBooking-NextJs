"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

// ─── Zod schema ─────────────────────────────────────────────────────────────

const memberSchema = z.object({
  username: z
    .string()
    .min(3, "Minimal 3 karakter")
    .max(50, "Maksimal 50 karakter"),
  password: z.string().min(6, "Minimal 6 karakter"),
  nama_member: z.string().min(1, "Wajib diisi"),
  instansi: z.string().min(1, "Wajib diisi"),
  alamat: z.string().min(1, "Wajib diisi"),
  telp: z
    .string()
    .regex(/^[0-9+\- ]{8,15}$/, "Nomor telepon tidak valid"),
});

type MemberValues = z.infer<typeof memberSchema>;

// ─── Page ───────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();

  const form = useForm<MemberValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      username: "",
      password: "",
      nama_member: "",
      instansi: "",
      alamat: "",
      telp: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: MemberValues) {
    try {
      await apiClient.post("/proxy-register", {
        type: "member",
        ...values,
      });
      toast.success("Registrasi berhasil!");
      router.replace("/reservasi");
    } catch (e) {
      if (e instanceof ApiRequestError) {
        toast.error(e.message || "Registrasi gagal");
      } else {
        toast.error("Registrasi gagal");
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-lg font-semibold">Daftar Member</h1>
        <p className="text-sm text-muted-foreground">
          Buat akun untuk mulai memesan space
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Masukkan username"
                    autoComplete="username"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Masukkan password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nama_member"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Lengkap</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan nama lengkap" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instansi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instansi</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan instansi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alamat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan alamat" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Telepon</FormLabel>
                <FormControl>
                  <Input
                    placeholder="08xxxxxxxxxx"
                    autoComplete="tel"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Memproses..." : "Daftar"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
}
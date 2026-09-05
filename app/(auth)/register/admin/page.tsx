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

const adminSchema = z.object({
  username: z.string().min(1, "Wajib diisi"),
  password: z.string().min(6, "Minimal 6 karakter"),
  nama_coworking: z.string().min(1, "Wajib diisi"),
  nama_pemilik: z.string().min(1, "Wajib diisi"),
  telp: z.string().min(1, "Wajib diisi"),
});

type AdminValues = z.infer<typeof adminSchema>;

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminRegisterPage() {
  const router = useRouter();

  const form = useForm<AdminValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      username: "",
      password: "",
      nama_coworking: "",
      nama_pemilik: "",
      telp: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: AdminValues) {
    try {
      await apiClient.post("/proxy-register", {
        type: "admin",
        ...values,
      });
      toast.success("Registrasi berhasil!");
      router.replace("/admin/dashboard");
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
        <h1 className="text-lg font-semibold">Daftar Admin Space</h1>
        <p className="text-sm text-muted-foreground">
          Daftarkan coworking space Anda
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
            name="nama_coworking"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Coworking Space</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Masukkan nama coworking space"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nama_pemilik"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Pemilik</FormLabel>
                <FormControl>
                  <Input placeholder="Masukkan nama pemilik" {...field} />
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
            {isSubmitting ? "Memproses..." : "Daftar Admin Space"}
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
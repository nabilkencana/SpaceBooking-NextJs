"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
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
import type { Role } from "@/types";

// ─── Zod schema ─────────────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1, "Wajib diisi"),
  password: z.string().min(1, "Wajib diisi"),
});

type LoginValues = z.infer<typeof loginSchema>;

// ─── Role toggle (purely display — login endpoint is the same) ────────────

const ROLE_OPTIONS: { label: string; value: Role }[] = [
  { label: "Member", value: "member" },
  { label: "Admin", value: "admin_space" },
];

// ─── Page ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [roleTab, setRoleTab] = useState<Role>("member");

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: LoginValues) {
    try {
      const user = await login(values.username, values.password);

      if (user.role === "admin_space") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/reservasi");
      }
    } catch (e) {
      if (e instanceof ApiRequestError) {
        toast.error(e.message);
      } else {
        toast.error("Terjadi kesalahan, silakan coba lagi");
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Role toggle */}
      <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
        {ROLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRoleTab(opt.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              roleTab === opt.value
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Form */}
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
                    autoComplete="current-password"
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
            {isSubmitting ? "Memproses..." : "Masuk"}
          </Button>
        </form>
      </Form>

      {/* Links */}
      <div className="space-y-2 text-center text-sm text-muted-foreground">
        <p>
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Daftar sebagai Member
          </Link>
        </p>
        <p>
          <Link
            href="/register/admin"
            className="font-medium text-primary hover:underline"
          >
            Daftar Admin Space
          </Link>
        </p>
      </div>
    </div>
  );
}
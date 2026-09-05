"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Phone, User, Users } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { unwrapApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SPACE_TYPE_LABELS, type SpaceDetail } from "@/types";

const formatRupiah = (n: number) =>
  "Rp " + new Intl.NumberFormat("id-ID").format(n);

export default function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = use(params);
  const id = Number(idParam);
  const router = useRouter();
  const { isAuthenticated, role } = useAuth();

  const spaceQuery = useQuery({
    queryKey: ["space", id] as const,
    queryFn: () =>
      apiClient.get(`/spaces/${id}`).then((r) =>
        unwrapApi<SpaceDetail>({ data: r.data }),
      ),
    enabled: !!id,
  });

  const handlePesan = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (role === "member") {
      router.push(`/booking/${id}`);
      return;
    }
    // admin_space / unknown — button is disabled with a hint below.
  };

  const isAdmin = isAuthenticated && role !== "member";

  // ─── Loading ────────────────────────────────────────────────────────────
  if (spaceQuery.isLoading || !id) {
    return (
      <>
        <MemberHeader />
        <main className="mx-auto max-w-4xl p-4 md:p-8">
          <Skeleton className="aspect-[16/9] w-full rounded-xl" />
          <Skeleton className="mt-6 h-8 w-1/2" />
          <Skeleton className="mt-3 h-4 w-1/3" />
        </main>
      </>
    );
  }

  // ─── Error / not found ─────────────────────────────────────────────────
  if (spaceQuery.isError || !spaceQuery.data) {
    return (
      <>
        <MemberHeader />
        <main className="mx-auto max-w-4xl p-4 md:p-8">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-sm text-destructive">
                {spaceQuery.isError
                  ? "Gagal memuat detail space."
                  : "Space tidak ditemukan"}
              </p>
              <div className="flex gap-3">
                {spaceQuery.isError && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => spaceQuery.refetch()}
                  >
                    Coba Lagi
                  </Button>
                )}
                <Link href="/spaces">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowLeft className="size-4" />
                    Kembali ke Spaces
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const space = spaceQuery.data;
  const owner = space.owner;

  return (
    <>
      <MemberHeader />
      <main className="mx-auto max-w-4xl p-4 md:p-8">
        <Link href="/spaces">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 gap-2 text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Spaces
          </Button>
        </Link>

        {/* Hero image */}
        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-indigo-100">
          {space.foto_url ? (
            <img
              src={space.foto_url}
              alt={space.nama_space}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-400 to-indigo-600">
              <span className="text-6xl font-bold text-white/70">
                {space.nama_space.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info + CTA */}
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{space.nama_space}</h1>
              <Badge variant="secondary" className="shrink-0">
                {SPACE_TYPE_LABELS[space.tipe]}
              </Badge>
            </div>

            <p className="mt-2 text-lg font-medium">
              {formatRupiah(space.harga_per_jam)}
              <span className="text-sm font-normal text-muted-foreground">
                /jam
              </span>
            </p>

            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-4" />
              Kapasitas {space.kapasitas} orang
            </p>

            {space.deskripsi && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {space.deskripsi}
              </p>
            )}
          </div>

          <div className="md:pt-4">
            <Button className="w-full gap-2 md:w-auto" onClick={handlePesan}>
              Pesan Sekarang
            </Button>
            {isAdmin && (
              <p className="mt-2 text-center text-xs text-muted-foreground md:text-left">
                Login sebagai member untuk memesan
              </p>
            )}
          </div>
        </div>

        {/* Owner card */}
        {owner && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>{owner.nama_coworking}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <User className="size-4" />
                {owner.nama_pemilik}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4" />
                {owner.telp}
              </p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 size-4" />
                {owner.alamat}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
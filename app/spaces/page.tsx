"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { unwrapApi } from "@/lib/api";
import { SpaceCard } from "@/components/features/SpaceCard";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPACE_TYPE_LABELS, type Space, type SpaceType } from "@/types";

type TipeFilter = "all" | SpaceType;

const TIPE_OPTIONS: TipeFilter[] = [
  "all",
  "desk",
  "meeting_room",
  "private_office",
];

export default function SpacesPage() {
  const [search, setSearch] = useState("");
  const [tipe, setTipe] = useState<TipeFilter>("all");

  const spacesQuery = useQuery({
    queryKey: ["spaces", { search, tipe }] as const,
    queryFn: async () => {
      const params: Record<string, string> = {};
      const trimmed = search.trim();
      if (trimmed) params.search = trimmed;
      if (tipe !== "all") params.tipe = tipe;
      const { data } = await apiClient.get("/spaces", { params });
      return unwrapApi<Space[]>({ data });
    },
  });

  const onCobaLagi = () => {
    spacesQuery.refetch();
  };

  const showError = spacesQuery.isError && !spacesQuery.isFetching;

  useEffect(() => {
    if (showError) {
      toast.error("Gagal memuat daftar space");
    }
  }, [showError]);

  return (
    <>
      <MemberHeader />
      <main className="mx-auto max-w-6xl p-4 md:p-8">
        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Katalog Space</h1>
          <p className="text-sm text-muted-foreground">
            Temukan dan pesan ruang kerja terbaik untuk kebutuhan Anda.
          </p>
        </div>

        {/* Search + filter */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama space / deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={tipe}
            onValueChange={(val) => setTipe(val as TipeFilter)}
          >
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Semua tipe" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">Semua tipe</SelectItem>
              {TIPE_OPTIONS.filter((t) => t !== "all").map((t) => (
                <SelectItem key={t} value={t}>
                  {SPACE_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading skeleton */}
        {spacesQuery.isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[16/9] w-full rounded-none" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Error */}
        {showError && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Gagal memuat daftar space.
            </p>
            <Button variant="outline" size="sm" onClick={onCobaLagi}>
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Empty */}
        {!spacesQuery.isLoading &&
          !spacesQuery.isError &&
          spacesQuery.data &&
          spacesQuery.data.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Belum ada space tersedia
            </p>
          )}

        {/* Grid */}
        {!spacesQuery.isLoading &&
          !spacesQuery.isError &&
          spacesQuery.data &&
          spacesQuery.data.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {spacesQuery.data.map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          )}
      </main>
      <GlobalFooter />
    </>
  );
}
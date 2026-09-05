"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SPACE_TYPE_LABELS, type Space } from "@/types";

const formatRupiah = (n: number) =>
  "Rp " + new Intl.NumberFormat("id-ID").format(n);

interface SpaceCardProps {
  space: Space;
}

export function SpaceCard({ space }: SpaceCardProps) {
  return (
    <Link href={`/spaces/${space.id}`} className="block">
      <Card className="group h-full cursor-pointer transition-shadow hover:shadow-md">
        {/* Image / placeholder */}
        <div className="aspect-[16/9] w-full overflow-hidden rounded-t-xl bg-indigo-100">
          {space.foto_url ? (
            <img
              src={space.foto_url}
              alt={space.nama_space}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-400 to-indigo-600">
              <span className="text-3xl font-bold text-white/70">
                {space.nama_space.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <CardContent className="flex flex-col gap-2 pt-3">
          {/* Type badge + name */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-snug">
              {space.nama_space}
            </h3>
            <Badge variant="secondary" className="shrink-0">
              {SPACE_TYPE_LABELS[space.tipe]}
            </Badge>
          </div>

          {/* Price */}
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {formatRupiah(space.harga_per_jam)}
            <span className="text-xs font-normal text-muted-foreground">
              /jam
            </span>
          </p>

          {/* Capacity */}
          <p className="text-xs text-muted-foreground">
            {space.kapasitas} orang
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
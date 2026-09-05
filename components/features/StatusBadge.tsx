"use client";

import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type ReservasiStatus } from "@/types";

const colors: Record<
  ReservasiStatus,
  { bg: string; fg: string }
> = {
  belum_dikonfirm: {
    bg: "var(--status-pending-bg)",
    fg: "var(--status-pending)",
  },
  disetujui: {
    bg: "var(--status-approved-bg)",
    fg: "var(--status-approved)",
  },
  aktif: {
    bg: "var(--status-active-bg)",
    fg: "var(--status-active)",
  },
  selesai: {
    bg: "var(--status-done-bg)",
    fg: "var(--status-done)",
  },
  dibatalkan: {
    bg: "var(--status-cancelled-bg)",
    fg: "var(--status-cancelled)",
  },
};

export function StatusBadge({ status }: { status: ReservasiStatus }) {
  const c = colors[status];
  return (
    <Badge
      style={{ backgroundColor: c.bg, color: c.fg }}
      className="rounded-4xl border-transparent"
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { apiServer } from "@/lib/api-server";
import type { SpaceDetail } from "@/types";
import WorkspaceDetailBooking from "./workspace-detail-booking";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // GET /spaces/{slug} accepts id-or-slug (backend contract, todo 5).
  const { ok, body } = await apiServer(`/spaces/${encodeURIComponent(slug)}`);

  if (!ok) notFound();

  const space = body.data as SpaceDetail;

  return (
    <Suspense fallback={null}>
      <WorkspaceDetailBooking space={space} />
    </Suspense>
  );
}

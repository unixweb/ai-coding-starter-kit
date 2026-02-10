"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import {
  usePortalDetail,
  type LinkInfo,
  type Submission,
  type OutgoingFile,
} from "@/hooks/use-portal-detail";
import { Badge } from "@/components/ui/badge";
import { PortalSettings } from "./portal-settings";
import { PortalFileList, type FlatFile } from "./portal-file-list";
import { PortalLinkCard } from "./portal-link-card";
import { PortalStatsCard } from "./portal-stats-card";
import { PortalOutgoingFiles } from "./portal-outgoing-files";

function getStatusBadge(link: LinkInfo) {
  if (link.is_locked) return <Badge variant="destructive">Gesperrt</Badge>;
  if (!link.is_active) return <Badge variant="secondary">Deaktiviert</Badge>;
  if (link.expires_at && new Date(link.expires_at) < new Date())
    return <Badge variant="outline">Abgelaufen</Badge>;
  return (
    <Badge className="bg-green-600 hover:bg-green-600 text-white">Aktiv</Badge>
  );
}

/** Flatten submissions into a flat file list, sorted by date (newest first) */
function flattenFiles(submissions: Submission[]): FlatFile[] {
  const files: FlatFile[] = [];
  for (const sub of submissions) {
    for (const file of sub.files) {
      files.push({
        submissionId: sub.id,
        submitterName: sub.name,
        filename: file.name,
        size: file.size,
        sizeFormatted: file.sizeFormatted,
        uploadedAt: sub.created_at,
        key: `${sub.id}/${file.name}`,
      });
    }
  }
  files.sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
  return files;
}

export default function PortalDetailPage() {
  const params = useParams();
  const linkId = params.linkId as string;
  const { isOwner } = useUserRole();

  const { link, submissions, outgoingFiles, isLoading, isError, refresh } =
    usePortalDetail(linkId);

  const flatFiles = flattenFiles(submissions);

  if (isLoading && !link) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !link) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard/portal"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurueck zur Uebersicht
        </Link>
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          Portal nicht gefunden
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/dashboard/portal"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurueck zur Uebersicht
      </Link>

      {/* Page title */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {link.label || "Portal"}
        </h1>
        {getStatusBadge(link)}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column (main area) */}
        <div className="lg:col-span-2 space-y-6">
          <PortalSettings
            linkId={link.id}
            label={link.label}
            description={link.description}
            isActive={link.is_active}
            hasPassword={link.has_password}
            clientEmail={link.client_email}
            isOwner={isOwner ?? false}
            onSaved={refresh}
          />

          <PortalOutgoingFiles
            files={outgoingFiles}
            linkId={link.id}
            onFilesChanged={refresh}
          />

          <PortalFileList
            files={flatFiles}
            linkId={link.id}
            onFilesChanged={refresh}
          />
        </div>

        {/* Right column (sidebar) */}
        <div className="space-y-6">
          <PortalLinkCard
            token={link.token}
            isActive={link.is_active}
            linkId={link.id}
            clientEmail={link.client_email}
            onFilesUploaded={refresh}
          />

          <PortalStatsCard
            isActive={link.is_active}
            isLocked={link.is_locked}
            totalFiles={flatFiles.length}
            createdAt={link.created_at}
          />
        </div>
      </div>
    </div>
  );
}

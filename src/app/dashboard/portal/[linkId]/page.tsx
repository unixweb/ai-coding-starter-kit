"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PortalSettings } from "./portal-settings";
import { PortalFileList, type FlatFile } from "./portal-file-list";
import { PortalLinkCard } from "./portal-link-card";
import { PortalStatsCard } from "./portal-stats-card";

interface SubmissionFile {
  name: string;
  size: number;
  type: string;
  sizeFormatted: string;
}

interface Submission {
  id: string;
  name: string;
  email: string;
  note: string;
  file_count: number;
  created_at: string;
  files: SubmissionFile[];
}

interface LinkInfo {
  id: string;
  token: string;
  label: string;
  description: string;
  is_active: boolean;
  is_locked: boolean;
  failed_attempts: number;
  has_password: boolean;
  expires_at: string | null;
  created_at: string;
}

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

  const [link, setLink] = useState<LinkInfo | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/portal/submissions?linkId=${encodeURIComponent(linkId)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setLink(data.link);
        setSubmissions(data.submissions);
        setError(null);
      } else {
        setError("Daten konnten nicht geladen werden");
      }
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setIsLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const flatFiles = flattenFiles(submissions);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !link) {
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
          {error || "Portal nicht gefunden"}
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
            onSaved={loadData}
          />

          <PortalFileList
            files={flatFiles}
            linkId={link.id}
            onFilesChanged={loadData}
          />
        </div>

        {/* Right column (sidebar) */}
        <div className="space-y-6">
          <PortalLinkCard
            token={link.token}
            isActive={link.is_active}
            linkId={link.id}
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

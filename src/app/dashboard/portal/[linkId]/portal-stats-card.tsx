"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MAX_FILE_SIZE, ALLOWED_EXTENSIONS } from "@/lib/files";

interface PortalStatsCardProps {
  isActive: boolean;
  isLocked: boolean;
  totalFiles: number;
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStatusBadge(isActive: boolean, isLocked: boolean) {
  if (isLocked) {
    return <Badge variant="destructive">Gesperrt</Badge>;
  }
  if (!isActive) {
    return <Badge variant="secondary">Deaktiviert</Badge>;
  }
  return <Badge className="bg-green-600 hover:bg-green-600 text-white">Aktiv</Badge>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function getAllowedTypesLabel(): string {
  return Array.from(ALLOWED_EXTENSIONS)
    .map((ext) => ext.replace(".", "").toUpperCase())
    .join(", ");
}

export function PortalStatsCard({
  isActive,
  isLocked,
  totalFiles,
  createdAt,
}: PortalStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Statistiken</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd>{getStatusBadge(isActive, isLocked)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Uploads</dt>
            <dd className="font-medium">{totalFiles}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Erstellt</dt>
            <dd className="font-medium">{formatDate(createdAt)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Max. Dateigroesse</dt>
            <dd className="font-medium">{formatFileSize(MAX_FILE_SIZE)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground shrink-0">Erlaubte Typen</dt>
            <dd className="font-medium text-right text-xs leading-5">
              {getAllowedTypesLabel()}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

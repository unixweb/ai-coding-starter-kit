"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Upload,
  FolderOpen,
  BarChart3,
  Clock,
  Zap,
  ArrowRight,
  FileText,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  userName: string;
  uploadsToday: number;
  uploadsThisWeek: number;
  activePortals: number;
  inactivePortals: number;
  totalUploads: number;
  totalSubmissions: number;
  lastActivity: string | null;
  recentFiles: { name: string; size: string; uploadedAt: string }[];
  activePortalLinks: {
    id: string;
    label: string;
    submission_count: number;
    is_active: boolean;
  }[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function formatDateLong(): string {
  return new Date().toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const userName = stats?.userName ?? "";
  const firstName = userName.split(" ")[0] || userName.split("@")[0] || "";

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <span className="text-2xl">&#128075;</span>
          Willkommen zurueck, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Ihre Uebersicht fuer den {formatDateLong()}
        </p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          Dashboard-Daten konnten nicht geladen werden. Bitte versuchen Sie es
          spaeter erneut.
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Uploads heute */}
            <Card className="border-l-4 border-l-blue-500 bg-blue-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      Uploads heute
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.uploadsToday}
                    </p>
                    <p className="text-xs text-blue-600/70 mt-1">
                      +{stats.uploadsThisWeek} diese Woche
                    </p>
                  </div>
                  <Upload className="h-8 w-8 text-blue-500 opacity-80" />
                </div>
              </CardContent>
            </Card>

            {/* Aktive Portale */}
            <Card className="border-l-4 border-l-green-500 bg-green-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Aktive Portale
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.activePortals}
                    </p>
                    <p className="text-xs text-green-600/70 mt-1">
                      {stats.inactivePortals} inaktiv
                    </p>
                  </div>
                  <FolderOpen className="h-8 w-8 text-green-500 opacity-80" />
                </div>
              </CardContent>
            </Card>

            {/* Uploads gesamt */}
            <Card className="border-l-4 border-l-purple-500 bg-purple-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      Uploads gesamt
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {stats.totalUploads}
                    </p>
                    <p className="text-xs text-purple-600/70 mt-1">
                      Dateien hochgeladen
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500 opacity-80" />
                </div>
              </CardContent>
            </Card>

            {/* Letzte Aktivitaet */}
            <Card className="border-l-4 border-l-orange-500 bg-orange-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">
                      Letzte Aktivitaet
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {stats.lastActivity
                        ? formatDate(stats.lastActivity)
                        : "—"}
                    </p>
                    <p className="text-xs text-orange-600/70 mt-1">
                      Letzter Upload
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Section: Schnellaktionen + Letzte Uploads */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Schnellaktionen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Schnellaktionen
                </CardTitle>
                <CardDescription>Haeufig verwendete Aktionen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <Link
                  href="/dashboard/portal"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-muted transition-colors"
                >
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  Portale verwalten
                </Link>
                <Link
                  href="/dashboard/files"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-muted transition-colors"
                >
                  <Upload className="h-4 w-4 text-purple-600" />
                  Alle Uploads anzeigen
                </Link>
              </CardContent>
            </Card>

            {/* Letzte Uploads */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Letzte Uploads</CardTitle>
                    <CardDescription>
                      Kuerzlich hochgeladene Dateien
                    </CardDescription>
                  </div>
                  <Link
                    href="/dashboard/files"
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    Alle <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {stats.recentFiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Noch keine Dateien hochgeladen
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentFiles.map((file) => (
                      <div key={file.name} className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {file.size} · {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ihre Portale */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FolderOpen className="h-5 w-5 text-green-600" />
                    Ihre Portale
                  </CardTitle>
                  <CardDescription>Aktive Upload-Portale</CardDescription>
                </div>
                <Link
                  href="/dashboard/portal"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  Alle <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {stats.activePortalLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Noch keine Portale erstellt
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {stats.activePortalLinks.map((portal) => (
                    <Link
                      key={portal.id}
                      href={`/dashboard/portal/${portal.id}`}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {portal.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {portal.submission_count} Upload
                            {portal.submission_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="default"
                        className="ml-2 flex-shrink-0 h-2 w-2 rounded-full p-0 bg-green-500"
                      />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

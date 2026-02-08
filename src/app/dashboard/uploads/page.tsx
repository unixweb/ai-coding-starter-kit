"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Download,
  Trash2,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Loader2,
  Search,
  Archive,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Types
type FileStatus = "new" | "in_progress" | "done" | "archived";

// API response type (matches backend naming)
interface ApiFile {
  id: string;
  filename: string;
  fileUrl: string;
  size: number;
  sizeFormatted: string;
  type: string;
  status: FileStatus;
  createdAt: string;
  updatedAt: string;
  portalId: string;
  portalLabel: string;
  submissionId: string;
  submitterName: string;
  submitterEmail: string;
}

// Internal UI type
interface UploadFile {
  id: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  linkId: string;
  linkLabel: string;
  submissionId: string;
  status: FileStatus;
  createdAt: string;
}

interface PortalLink {
  id: string;
  label: string;
}

// Helper functions
function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return <FileText className="h-4 w-4 text-red-500" />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    return <FileImage className="h-4 w-4 text-blue-500" />;
  if (["xls", "xlsx"].includes(ext))
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  if (["doc", "docx"].includes(ext))
    return <FileText className="h-4 w-4 text-blue-700" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Status configuration
const statusConfig: Record<
  FileStatus,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  new: {
    label: "Neu",
    bgClass: "bg-blue-500",
    textClass: "text-blue-600",
    borderClass: "border-blue-500",
  },
  in_progress: {
    label: "In Arbeit",
    bgClass: "bg-orange-500",
    textClass: "text-orange-600",
    borderClass: "border-orange-500",
  },
  done: {
    label: "Erledigt",
    bgClass: "bg-green-500",
    textClass: "text-green-600",
    borderClass: "border-green-500",
  },
  archived: {
    label: "Archiviert",
    bgClass: "bg-gray-500",
    textClass: "text-gray-600",
    borderClass: "border-gray-500",
  },
};

// Status Badge Component - zeigt nur aktuellen Status, Dropdown zum Ändern
function StatusBadges({
  currentStatus,
  onStatusChange,
  disabled,
}: {
  currentStatus: FileStatus;
  onStatusChange: (status: FileStatus) => void;
  disabled?: boolean;
}) {
  const statuses: FileStatus[] = ["new", "in_progress", "done", "archived"];
  const config = statusConfig[currentStatus];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${config.bgClass} text-white`}
        >
          {config.label}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {statuses.map((status) => {
          const statusConf = statusConfig[status];
          const isCurrentStatus = status === currentStatus;
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => onStatusChange(status)}
              className={`cursor-pointer ${isCurrentStatus ? "bg-muted" : ""}`}
            >
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mr-2 ${statusConf.bgClass} text-white`}
              >
                {statusConf.label}
              </span>
              {isCurrentStatus && <span className="text-muted-foreground text-xs">(aktuell)</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Time range options
const timeRangeOptions = [
  { value: "all", label: "Alle Zeitraeume" },
  { value: "today", label: "Heute" },
  { value: "7days", label: "Letzte 7 Tage" },
  { value: "30days", label: "Letzte 30 Tage" },
  { value: "year", label: "Dieses Jahr" },
];

export default function UploadsPage() {
  // State
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [portals, setPortals] = useState<PortalLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"current" | "archive">("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPortal, setSelectedPortal] = useState<string>("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("all");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);

  // Load uploads
  const loadUploads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        tab: activeTab,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedPortal !== "all" && { portalId: selectedPortal }),
        ...(selectedTimeRange !== "all" && { timeRange: selectedTimeRange }),
      });

      const res = await fetch(`/api/uploads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Map API response to internal type
        const mappedFiles: UploadFile[] = (data.files || []).map((f: ApiFile) => ({
          id: f.id,
          filename: f.filename,
          fileUrl: f.fileUrl,
          fileSize: f.size,
          linkId: f.portalId,
          linkLabel: f.portalLabel,
          submissionId: f.submissionId,
          status: f.status,
          createdAt: f.createdAt,
        }));
        setFiles(mappedFiles);
        if (data.portals) {
          setPortals(data.portals);
        }
      } else {
        toast.error("Fehler beim Laden der Uploads");
      }
    } catch {
      toast.error("Verbindungsfehler beim Laden der Uploads");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery, selectedPortal, selectedTimeRange]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  // Clear selection when tab changes
  useEffect(() => {
    setSelectedFiles(new Set());
  }, [activeTab]);

  // Filtered files based on current tab
  const filteredFiles = useMemo(() => {
    return files;
  }, [files]);

  // Handle status change
  const handleStatusChange = async (fileIds: string[], newStatus: FileStatus) => {
    // Optimistic update
    setFiles((prev) =>
      prev.map((f) =>
        fileIds.includes(f.id) ? { ...f, status: newStatus } : f
      )
    );

    try {
      const res = await fetch("/api/uploads/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds, status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Status update failed");
      }

      toast.success(
        `Status auf "${statusConfig[newStatus].label}" geaendert`
      );

      // If status changed to archived and we're on current tab, remove from list
      if (newStatus === "archived" && activeTab === "current") {
        setFiles((prev) => prev.filter((f) => !fileIds.includes(f.id)));
      }
      // If status changed from archived and we're on archive tab, remove from list
      if (newStatus !== "archived" && activeTab === "archive") {
        setFiles((prev) => prev.filter((f) => !fileIds.includes(f.id)));
      }

      setSelectedFiles(new Set());
    } catch {
      // Rollback on error
      loadUploads();
      toast.error("Fehler beim Aendern des Status");
    }
  };

  // Handle file download
  const handleDownload = async (file: UploadFile) => {
    try {
      const res = await fetch(
        `/api/portal/download?linkId=${file.linkId}&submissionId=${file.submissionId}&filename=${encodeURIComponent(file.filename)}`
      );
      if (!res.ok) {
        toast.error("Download fehlgeschlagen");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Fehler beim Download");
    }
  };

  // Handle delete
  const confirmDelete = (fileIds: string[]) => {
    setFilesToDelete(fileIds);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (filesToDelete.length === 0) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: filesToDelete }),
      });

      if (res.ok) {
        setFiles((prev) => prev.filter((f) => !filesToDelete.includes(f.id)));
        setSelectedFiles(new Set());
        toast.success(
          `${filesToDelete.length} Datei${filesToDelete.length > 1 ? "en" : ""} geloescht`
        );
      } else {
        toast.error("Fehler beim Loeschen");
      }
    } catch {
      toast.error("Verbindungsfehler beim Loeschen");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setFilesToDelete([]);
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const toggleSelect = (fileId: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const isAllSelected =
    filteredFiles.length > 0 && selectedFiles.size === filteredFiles.length;
  const hasSelection = selectedFiles.size > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Uploads</h1>
        <p className="mt-1 text-muted-foreground">Alle Dateien</p>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "current" | "archive")}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="current">Aktuelle Dateien</TabsTrigger>
          <TabsTrigger value="archive" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archiv
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-0" />
        <TabsContent value="archive" className="mt-0" />
      </Tabs>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Dateiname suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedPortal} onValueChange={setSelectedPortal}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Alle Portale" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Portale</SelectItem>
            {portals.map((portal) => (
              <SelectItem key={portal.id} value={portal.id}>
                {portal.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Alle Zeitraeume" />
          </SelectTrigger>
          <SelectContent>
            {timeRangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      {hasSelection && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedFiles.size} Datei{selectedFiles.size > 1 ? "en" : ""}{" "}
            ausgewaehlt
          </span>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Status aendern
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(["new", "in_progress", "done", "archived"] as FileStatus[]).map(
                  (status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() =>
                        handleStatusChange(Array.from(selectedFiles), status)
                      }
                    >
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mr-2 ${statusConfig[status].bgClass} text-white`}
                      >
                        {statusConfig[status].label}
                      </span>
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {activeTab === "current" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleStatusChange(Array.from(selectedFiles), "archived")
                }
              >
                <Archive className="h-4 w-4 mr-1" />
                Archivieren
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => confirmDelete(Array.from(selectedFiles))}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Loeschen
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Upload className="h-10 w-10 mb-3" />
            <p className="text-sm">
              {searchQuery || selectedPortal !== "all" || selectedTimeRange !== "all"
                ? "Keine Dateien gefunden"
                : activeTab === "archive"
                  ? "Keine archivierten Dateien"
                  : "Noch keine Mandanten-Uploads"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Alle auswaehlen"
                    />
                  </TableHead>
                  <TableHead>Datei</TableHead>
                  <TableHead className="w-36">Portal</TableHead>
                  <TableHead className="w-80">Status</TableHead>
                  <TableHead className="w-36">Datum</TableHead>
                  <TableHead className="w-24">Groesse</TableHead>
                  <TableHead className="w-24 text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFiles.has(file.id)}
                        onCheckedChange={() => toggleSelect(file.id)}
                        aria-label={`${file.filename} auswaehlen`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.filename)}
                        <span className="truncate max-w-xs">{file.filename}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/portal/${file.linkId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {file.linkLabel || "[Geloescht]"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadges
                        currentStatus={file.status}
                        onStatusChange={(status) =>
                          handleStatusChange([file.id], status)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(file.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatSize(file.fileSize)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(file)}
                          title="Herunterladen"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => confirmDelete([file.id])}
                          title="Loeschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {filesToDelete.length > 1 ? "Dateien loeschen" : "Datei loeschen"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Moechtest du {filesToDelete.length > 1 ? `diese ${filesToDelete.length} Dateien` : "diese Datei"}{" "}
              wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Loeschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import useSWR from "swr";

export type FileStatus = "new" | "in_progress" | "done" | "archived";

export interface UploadFile {
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

export interface PortalOption {
  id: string;
  label: string;
}

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

interface UploadsApiResponse {
  files: ApiFile[];
  portals: PortalOption[];
}

interface UseUploadsParams {
  tab: "current" | "archive";
  search?: string;
  portalId?: string;
  timeRange?: string;
}

function buildCacheKey(params: UseUploadsParams): string {
  const queryParams = new URLSearchParams({ tab: params.tab });
  if (params.search) queryParams.set("search", params.search);
  if (params.portalId && params.portalId !== "all")
    queryParams.set("portalId", params.portalId);
  if (params.timeRange && params.timeRange !== "all")
    queryParams.set("timeRange", params.timeRange);
  return `/api/uploads?${queryParams.toString()}`;
}

function mapApiFiles(apiFiles: ApiFile[]): UploadFile[] {
  return apiFiles.map((f) => ({
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
}

export function useUploads(params: UseUploadsParams) {
  const cacheKey = buildCacheKey(params);

  const { data, error, isLoading, mutate } = useSWR<UploadsApiResponse>(
    cacheKey
  );

  const files = data?.files ? mapApiFiles(data.files) : [];
  const portals = data?.portals ?? [];

  const updateFileStatus = async (
    fileIds: string[],
    newStatus: FileStatus
  ): Promise<boolean> => {
    // Optimistic update
    mutate(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          files: current.files.map((f) =>
            fileIds.includes(f.id) ? { ...f, status: newStatus } : f
          ),
        };
      },
      { revalidate: false }
    );

    try {
      const res = await fetch("/api/uploads/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds, status: newStatus }),
      });

      if (!res.ok) {
        mutate();
        return false;
      }

      // Remove files from list if they moved to different tab
      const shouldRemove =
        (newStatus === "archived" && params.tab === "current") ||
        (newStatus !== "archived" && params.tab === "archive");

      if (shouldRemove) {
        mutate(
          (current) => {
            if (!current) return current;
            return {
              ...current,
              files: current.files.filter((f) => !fileIds.includes(f.id)),
            };
          },
          { revalidate: false }
        );
      }

      return true;
    } catch {
      mutate();
      return false;
    }
  };

  const deleteFiles = async (fileIds: string[]): Promise<boolean> => {
    // Optimistic update
    mutate(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          files: current.files.filter((f) => !fileIds.includes(f.id)),
        };
      },
      { revalidate: false }
    );

    try {
      const res = await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds }),
      });

      if (!res.ok) {
        mutate();
        return false;
      }

      return true;
    } catch {
      mutate();
      return false;
    }
  };

  return {
    files,
    portals,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
    updateFileStatus,
    deleteFiles,
  };
}

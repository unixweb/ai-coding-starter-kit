import useSWR from "swr";

interface SubmissionFile {
  name: string;
  size: number;
  type: string;
  sizeFormatted: string;
}

export interface Submission {
  id: string;
  name: string;
  email: string;
  note: string;
  file_count: number;
  created_at: string;
  files: SubmissionFile[];
}

export interface LinkInfo {
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
  client_email: string | null;
}

export interface OutgoingFile {
  id: string;
  filename: string;
  file_size: number;
  note: string;
  expires_at: string | null;
  created_at: string;
  is_expired: boolean;
}

interface SubmissionsResponse {
  link: LinkInfo;
  submissions: Submission[];
}

interface OutgoingResponse {
  files: OutgoingFile[];
}

export function usePortalDetail(linkId: string) {
  // Parallel SWR hooks - both execute simultaneously
  const {
    data: submissionsData,
    error: submissionsError,
    isLoading: submissionsLoading,
    mutate: mutateSubmissions,
  } = useSWR<SubmissionsResponse>(
    linkId ? `/api/portal/submissions?linkId=${encodeURIComponent(linkId)}` : null
  );

  const {
    data: outgoingData,
    error: outgoingError,
    isLoading: outgoingLoading,
    mutate: mutateOutgoing,
  } = useSWR<OutgoingResponse>(
    linkId ? `/api/portal/outgoing?linkId=${encodeURIComponent(linkId)}` : null
  );

  const refresh = () => {
    mutateSubmissions();
    mutateOutgoing();
  };

  return {
    link: submissionsData?.link ?? null,
    submissions: submissionsData?.submissions ?? [],
    outgoingFiles: outgoingData?.files ?? [],
    isLoading: submissionsLoading || outgoingLoading,
    isError: !!submissionsError || !!outgoingError,
    error: submissionsError || outgoingError,
    refresh,
    mutateSubmissions,
    mutateOutgoing,
  };
}

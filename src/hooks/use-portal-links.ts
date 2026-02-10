import useSWR from "swr";

export interface PortalLink {
  id: string;
  token: string;
  label: string;
  is_active: boolean;
  is_locked: boolean;
  expires_at: string | null;
  created_at: string;
  submission_count: number;
}

interface PortalLinksResponse {
  links: PortalLink[];
}

export function usePortalLinks() {
  const { data, error, isLoading, mutate } = useSWR<PortalLinksResponse>(
    "/api/portal/links"
  );

  const toggleLink = async (link: PortalLink) => {
    // Optimistic update
    mutate(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          links: current.links.map((l) =>
            l.id === link.id ? { ...l, is_active: !l.is_active } : l
          ),
        };
      },
      { revalidate: false }
    );

    try {
      const res = await fetch("/api/portal/links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, is_active: !link.is_active }),
      });

      if (!res.ok) {
        // Rollback on error
        mutate();
        return false;
      }

      // Revalidate to confirm server state
      mutate();
      return true;
    } catch {
      // Rollback on error
      mutate();
      return false;
    }
  };

  return {
    links: data?.links ?? [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
    toggleLink,
  };
}

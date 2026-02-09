"use client";

import { useState, useEffect } from "react";

interface UserRole {
  isOwner: boolean | null;
  isLoading: boolean;
}

export function useUserRole(): UserRole {
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserRole() {
      try {
        const res = await fetch("/api/user/role");
        if (res.ok) {
          const data = await res.json();
          setIsOwner(data.isOwner);
        }
      } catch {
        // Silently fail - assume not owner if we can't determine role
        setIsOwner(false);
      } finally {
        setIsLoading(false);
      }
    }
    loadUserRole();
  }, []);

  return { isOwner, isLoading };
}

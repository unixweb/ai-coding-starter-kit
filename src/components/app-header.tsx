"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Loader2, FileText, Shield, LinkIcon } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AppHeaderProps {
  userName?: string | null;
}

export function AppHeader({ userName }: AppHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

  async function handleLogout() {
    setIsLoggingOut(true);
    const supabase = createClient();

    try {
      await supabase.auth.signOut();
    } catch {
      // Even on network error, clear local session
    }

    window.location.href = "/login";
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <Shield className="h-5 w-5 text-primary" />
            SafeDocs Portal
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                pathname === "/dashboard"
                  ? "bg-muted font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/files"
              className={`text-sm px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                pathname === "/dashboard/files"
                  ? "bg-muted font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Meine Dateien
            </Link>
            <Link
              href="/dashboard/portal"
              className={`text-sm px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                pathname?.startsWith("/dashboard/portal")
                  ? "bg-muted font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Mandanten-Portal
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {userName && (
            <>
              <span className="text-sm text-muted-foreground">{userName}</span>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Abmelden
          </Button>
        </div>
      </div>
    </header>
  );
}

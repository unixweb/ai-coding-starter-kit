"use client";

import { useState, useEffect } from "react";
import { Loader2, LogOut } from "lucide-react";
import { SWRConfig } from "swr";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase";
import { swrConfig } from "@/lib/swr-config";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userName, setUserName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !user.email_confirmed_at) {
        window.location.href = "/login";
        return;
      }
      setUserName(user.user_metadata?.name ?? user.email ?? null);
      setAuthChecked(true);
    }
    checkAuth();
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch {}
    window.location.href = "/login";
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
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
        </header>
        <main className="flex-1">
          <SWRConfig value={swrConfig}>{children}</SWRConfig>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

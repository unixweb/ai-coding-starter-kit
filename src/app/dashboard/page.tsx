import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { AppHeader } from '@/components/app-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userName = user.user_metadata?.name ?? user.email

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader userName={userName} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Willkommen zurück, {userName}
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Erste Schritte</CardTitle>
            <CardDescription>
              Dein Account ist eingerichtet. Hier werden zukünftige Features angezeigt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Diese Seite dient als Platzhalter für zukünftige Inhalte.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

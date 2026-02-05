'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordStrengthIndicator, validatePassword } from '@/components/password-strength-indicator'

const confirmSchema = z.object({
  password: z.string().refine(validatePassword, 'Passwort erfüllt nicht alle Anforderungen'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
})

type ConfirmFormData = z.infer<typeof confirmSchema>

export default function ResetPasswordConfirmPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ConfirmFormData>({
    resolver: zodResolver(confirmSchema),
  })

  const password = watch('password', '')

  async function onSubmit(data: ConfirmFormData) {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (updateError) {
      setError('Passwort konnte nicht aktualisiert werden. Der Link ist möglicherweise abgelaufen.')
      setIsLoading(false)
      return
    }

    // Sign out after password reset so user logs in with new password
    await supabase.auth.signOut()
    window.location.href = '/login?reset=success'
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Neues Passwort setzen</CardTitle>
          <CardDescription>Wähle ein neues Passwort für deinen Account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Neues Passwort</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
              />
              <PasswordStrengthIndicator password={password} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Passwort speichern
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

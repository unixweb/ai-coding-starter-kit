'use client'

import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordStrengthIndicatorProps {
  password: string
}

const rules = [
  { label: 'Mindestens 8 Zeichen', test: (pw: string) => pw.length >= 8 },
  { label: 'Groß- und Kleinbuchstaben', test: (pw: string) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { label: 'Mindestens eine Zahl', test: (pw: string) => /\d/.test(pw) },
]

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  return (
    <ul className="space-y-1 text-sm">
      {rules.map((rule) => {
        const passed = password.length > 0 && rule.test(password)
        return (
          <li key={rule.label} className={cn('flex items-center gap-2', passed ? 'text-green-600' : 'text-muted-foreground')}>
            {passed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}

export function validatePassword(password: string): boolean {
  return rules.every((rule) => rule.test(password))
}

import { useState } from 'react'
import { Button } from '@/components/base/Button'
import { useAuthStore } from '@/store/auth'

export const ResetPasswordPage = () => {
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset)
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await requestPasswordReset(email)
    setFeedback('Revisa tu bandeja para continuar con el restablecimiento.')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2 text-sm">
        <span className="text-vision-ink font-medium">Email corporativo</span>
        <input
          className="glass-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@empresa.com"
          required
          aria-label="Email corporativo"
        />
      </label>
      {feedback && <p className="text-xs text-soft-slate">{feedback}</p>}
      <Button type="submit" className="w-full">
        Enviar enlace
      </Button>
    </form>
  )
}

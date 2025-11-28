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
        <span>Email corporativo</span>
        <input
          className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-vision-ink outline-none focus:border-plasma-blue/40"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      {feedback && <p className="text-xs text-soft-slate">{feedback}</p>}
      <Button type="submit" className="w-full">
        Enviar enlace
      </Button>
    </form>
  )
}

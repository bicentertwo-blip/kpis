import { useEffect, useState } from 'react'
import { Button } from '@/components/base/Button'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'

export const SetPasswordPage = () => {
  const updatePassword = useAuthStore((state) => state.updatePassword)
  const [passwords, setPasswords] = useState({ password: '', confirm: '' })
  const [message, setMessage] = useState<string | null>(null)
  const [isSessionReady, setIsSessionReady] = useState(false)

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    const token_hash = params.get('token_hash')
    const email = params.get('email') ?? undefined
    const defaultType = window.location.pathname.includes('reset-password') ? 'recovery' : 'invite'
    const rawType = params.get('type') || undefined
    const typeParam = (rawType as 'signup' | 'magiclink' | 'invite' | 'recovery' | 'email_change' | undefined) ?? defaultType

    const bootstrap = async () => {
      try {
        if (token_hash && typeParam) {
          // For custom email templates using token_hash (recommended)
          await supabase.auth.verifyOtp({ type: typeParam, token_hash, email })
        } else if (access_token && refresh_token) {
          // For default confirmation URLs that include access/refresh tokens
          await supabase.auth.setSession({ access_token, refresh_token })
        } else {
          setMessage('El enlace no es válido o ya expiró. Solicita uno nuevo.')
        }
      } catch (error) {
        console.error(error)
        setMessage('No se pudo validar el enlace. Solicita uno nuevo.')
      } finally {
        setIsSessionReady(true)
      }
    }

    bootstrap()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (passwords.password !== passwords.confirm) {
      setMessage('Las contraseñas no coinciden.')
      return
    }
    try {
      await updatePassword(passwords.password)
      setMessage('Contraseña actualizada. Puedes cerrar esta ventana y regresar al panel.')
    } catch (error) {
      setMessage((error as Error).message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2 text-sm">
        <span>Nueva contraseña</span>
        <input
          type="password"
          className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-vision-ink outline-none focus:border-plasma-blue/40"
          value={passwords.password}
          onChange={(event) => setPasswords((prev) => ({ ...prev, password: event.target.value }))}
          disabled={!isSessionReady}
        />
      </label>
      <label className="block space-y-2 text-sm">
        <span>Confirmar contraseña</span>
        <input
          type="password"
          className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-vision-ink outline-none focus:border-plasma-blue/40"
          value={passwords.confirm}
          onChange={(event) => setPasswords((prev) => ({ ...prev, confirm: event.target.value }))}
          disabled={!isSessionReady}
        />
      </label>
      {message && <p className="text-xs text-soft-slate">{message}</p>}
      <Button type="submit" className="w-full" disabled={!isSessionReady}>
        Guardar contraseña
      </Button>
    </form>
  )
}

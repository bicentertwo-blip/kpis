import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/base/Button'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'

export const SetPasswordPage = () => {
  const session = useAuthStore((state) => state.session)
  const updatePassword = useAuthStore((state) => state.updatePassword)
  const location = useLocation()
  const navigate = useNavigate()
  const [passwords, setPasswords] = useState({ password: '', confirm: '' })
  const [message, setMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<'checking' | 'ready' | 'error'>('checking')

  useEffect(() => {
    if (session) {
      setStatus('ready')
      setMessage(null)
      return
    }

    const hashParams = new URLSearchParams(location.hash.replace('#', ''))
    const searchParams = new URLSearchParams(location.search)

    const access_token = hashParams.get('access_token')
    const refresh_token = hashParams.get('refresh_token')
    const token_hash =
      searchParams.get('token_hash') ??
      hashParams.get('token_hash') ??
      searchParams.get('token') ??
      hashParams.get('token') ??
      undefined
    const email = searchParams.get('email') ?? hashParams.get('email') ?? undefined
    const rawType = searchParams.get('type') ?? hashParams.get('type') ?? undefined
    const normalizedType = rawType === 'invite' ? 'signup' : rawType ?? 'recovery'

    if (!access_token && !token_hash) {
      setStatus('error')
      setMessage('El enlace no es válido o ya expiró. Solicita uno nuevo.')
      return
    }

    const bootstrap = async () => {
      try {
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token })
        } else if (token_hash && normalizedType) {
          await supabase.auth.verifyOtp({ type: normalizedType as any, token_hash, email })
        }
        setStatus('ready')
        setMessage(null)
      } catch (error) {
        console.error(error)
        setStatus('error')
        setMessage('No se pudo validar el enlace. Solicita uno nuevo.')
      }
    }

    void bootstrap()
  }, [location.hash, location.search, session])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (passwords.password !== passwords.confirm) {
      setMessage('Las contraseñas no coinciden.')
      return
    }
    try {
      await updatePassword(passwords.password)
      setMessage('Contraseña actualizada. Preparando tu cuenta...')
      // Re-initialize to ensure profile is created after password is set
      await useAuthStore.getState().initialize()
      setMessage('¡Listo! Redirigiendo...')
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 500)
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
          disabled={status !== 'ready'}
        />
      </label>
      <label className="block space-y-2 text-sm">
        <span>Confirmar contraseña</span>
        <input
          type="password"
          className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-vision-ink outline-none focus:border-plasma-blue/40"
          value={passwords.confirm}
          onChange={(event) => setPasswords((prev) => ({ ...prev, confirm: event.target.value }))}
          disabled={status !== 'ready'}
        />
      </label>
      {message && <p className="text-xs text-soft-slate">{message}</p>}
      <Button type="submit" className="w-full" disabled={status !== 'ready'}>
        Guardar contraseña
      </Button>
    </form>
  )
}

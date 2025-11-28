import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/base/Button'

const OTP_TYPES = ['signup', 'invite', 'magiclink', 'recovery', 'email_change'] as const

const isEmailOtpType = (value: string | null): value is (typeof OTP_TYPES)[number] =>
  !!value && OTP_TYPES.includes(value as (typeof OTP_TYPES)[number])

const sanitizeNextPath = (raw: string | null, fallback: string) =>
  raw && raw.startsWith('/') ? raw : fallback

export const AuthCallbackPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const hashParams = new URLSearchParams(location.hash.replace('#', ''))
    const getParam = (key: string) => searchParams.get(key) ?? hashParams.get(key)

    const code = getParam('code')
    const access_token = hashParams.get('access_token')
    const refresh_token = hashParams.get('refresh_token')
    const rawType = getParam('type')
    const email = getParam('email') ?? undefined
    const token_hash = getParam('token_hash') ?? getParam('token') ?? undefined

    const normalizedType = rawType === 'invite' ? 'signup' : rawType
    const forcePasswordScreen = ['recovery', 'invite', 'signup'].includes(rawType ?? '') || !!token_hash
    const requestedNext = sanitizeNextPath(searchParams.get('next'), '/dashboard')
    const nextPath = forcePasswordScreen ? '/set-password' : requestedNext

    const processCallback = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session && !forcePasswordScreen) {
          navigate(nextPath, { replace: true })
          return
        }

        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
        } else if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token })
        } else if (token_hash && isEmailOtpType(normalizedType ?? null)) {
          await supabase.auth.verifyOtp({
            token_hash,
            type: normalizedType as typeof OTP_TYPES[number],
            email,
          })
        } else {
          setError(
            'El enlace que abriste no trae credenciales de Supabase. Usa el botón del correo más reciente o solicita otra invitación.'
          )
          return
        }

        navigate(nextPath, { replace: true })
      } catch (err) {
        console.error(err)
        setError('No pudimos validar tu enlace. Solicita uno nuevo para continuar.')
      }
    }

    void processCallback()
  }, [location.hash, location.search, navigate])

  if (error) {
    return (
      <div className="space-y-4 text-center text-sm text-soft-slate">
        <p>{error}</p>
        <Button type="button" className="w-full" onClick={() => navigate('/login')}>
          Volver al inicio de sesión
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 text-center text-sm text-soft-slate">
      <p>Validando tu enlace seguro...</p>
      <p className="text-xs">No cierres esta ventana. Te redirigiremos en segundos.</p>
    </div>
  )
}

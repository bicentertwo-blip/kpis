import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/base/Button'
import { useAuthStore } from '@/store/auth'

export const ResetPasswordPage = () => {
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!email.trim()) {
      setStatus('error')
      setErrorMessage('Por favor ingresa tu correo electrónico.')
      return
    }

    setLoading(true)
    setStatus('idle')
    setErrorMessage('')
    
    try {
      await requestPasswordReset(email.trim().toLowerCase())
      setStatus('success')
    } catch (error: unknown) {
      setStatus('error')
      const err = error as { message?: string; status?: number }
      
      // Mensajes amigables según el tipo de error
      if (err.status === 429) {
        setErrorMessage('Demasiados intentos. Por favor espera unos minutos antes de intentar de nuevo.')
      } else if (err.status === 400) {
        setErrorMessage('No encontramos una cuenta con ese correo. Verifica que esté bien escrito.')
      } else {
        setErrorMessage('Ocurrió un error al enviar el correo. Intenta de nuevo más tarde.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Vista de éxito
  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center"
        >
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </motion.div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-vision-ink">
            ¡Correo enviado!
          </h3>
          <p className="text-sm text-soft-slate leading-relaxed">
            Enviamos un enlace de recuperación a:
          </p>
          <p className="text-sm font-medium text-vision-ink bg-white/50 rounded-lg px-3 py-2 inline-block">
            {email}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <p className="text-xs text-soft-slate">
            Revisa tu bandeja de entrada y sigue las instrucciones del correo.
            Si no lo ves, revisa la carpeta de spam.
          </p>
          
          <button
            type="button"
            onClick={() => {
              setStatus('idle')
              setEmail('')
            }}
            className="text-sm text-plasma-blue hover:text-plasma-blue/80 font-medium transition-colors"
          >
            ¿No recibiste el correo? Intentar con otro email
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="reset-email" className="block text-sm font-medium text-vision-ink">
          Email corporativo
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-soft-slate/60" />
          <input
            id="reset-email"
            className={`glass-input pl-11 transition-all ${
              status === 'error' 
                ? 'ring-2 ring-red-300 border-red-300 focus:ring-red-400' 
                : ''
            }`}
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (status === 'error') {
                setStatus('idle')
                setErrorMessage('')
              }
            }}
            placeholder="tu@empresa.com"
            required
            disabled={loading}
            autoComplete="email"
            autoFocus
          />
        </div>
      </div>

      {/* Mensaje de error */}
      <AnimatePresence>
        {status === 'error' && errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading || !email.trim()}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Enviando...
          </span>
        ) : (
          'Enviar enlace de recuperación'
        )}
      </Button>

      <p className="text-xs text-center text-soft-slate">
        Te enviaremos un enlace seguro para restablecer tu contraseña.
      </p>
    </form>
  )
}

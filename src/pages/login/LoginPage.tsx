import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/base/Button'
import { useAuthStore } from '@/store/auth'

export const LoginPage = () => {
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <div className="space-y-3 sm:space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-vision-ink flex items-center gap-2">
            <Mail className="size-4 text-soft-slate" />
            Email corporativo
          </span>
          <input
            className="glass-input"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="tu@empresa.com"
            required
          />
        </label>
        
        <label className="block space-y-2">
          <span className="text-sm font-medium text-vision-ink flex items-center gap-2">
            <Lock className="size-4 text-soft-slate" />
            Contraseña
          </span>
          <input
            className="glass-input"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="••••••••"
            required
          />
        </label>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-rose-50/80 border border-rose-200/60 px-4 py-3 text-sm text-rose-600"
        >
          {error}
        </motion.div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          fullWidth
          glow
          loading={loading}
          iconRight={!loading && <ArrowRight className="size-5" />}
        >
          {loading ? 'Accediendo...' : 'Iniciar sesión'}
        </Button>
      </div>

      <p className="text-center text-sm text-soft-slate pt-2">
        ¿Olvidaste tu contraseña?{' '}
        <Link
          to="/reset-password"
          className="text-plasma-blue hover:text-plasma-indigo font-medium transition-colors"
        >
          Recuperar acceso
        </Link>
      </p>
    </motion.form>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
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
    <motion.form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2 text-sm">
        <span>Email corporativo</span>
        <input
          className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-vision-ink outline-none focus:border-plasma-blue/40"
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />
      </label>
      <label className="block space-y-2 text-sm">
        <span>Contraseña</span>
        <input
          className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-vision-ink outline-none focus:border-plasma-blue/40"
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          required
        />
      </label>
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <Button type="submit" className="w-full" glow disabled={loading}>
        {loading ? 'Accediendo...' : 'Iniciar sesión'}
      </Button>
      <p className="text-center text-xs text-soft-slate">
        ¿Olvidaste tu contraseña?{' '}
        <Link to="/reset-password" className="text-plasma-blue">
          Recuperar acceso
        </Link>
      </p>
    </motion.form>
  )
}

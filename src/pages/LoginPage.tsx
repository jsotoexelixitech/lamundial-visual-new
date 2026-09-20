import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { login } from '@/lib/nexus-auth';

// ─── Partículas ───────────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: Math.random() * 6 + 2,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 8 + 6,
  delay: Math.random() * 5,
  color: i % 3 === 0 ? '#E84F51' : i % 3 === 1 ? '#ACACAC' : 'rgba(255,255,255,0.4)',
}));

// ─── Anillos decorativos ──────────────────────────────────────────────────
const DecorativeRings: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
    <div
      className="ring-spin absolute rounded-full border border-mundial-blue/10"
      style={{ width: 600, height: 600 }}
    />
    <div
      className="ring-spin-reverse absolute rounded-full border border-mundial-silver/8"
      style={{ width: 450, height: 450 }}
    />
    <div
      className="ring-spin absolute rounded-full border border-white/5"
      style={{ width: 300, height: 300, animationDuration: '15s' }}
    />
  </div>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);

  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const existing = btn.querySelector('.ripple-effect');
    if (existing) existing.remove();
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
      left: ${e.clientX - rect.left - 5}px;
      top: ${e.clientY - rect.top - 5}px;
    `;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login({ email: email.trim(), password });
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Credenciales incorrectas. Verifica tu email y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg min-h-screen flex items-center justify-center relative" id="login-page">
      {/* Partículas flotantes */}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.color,
            animation: `float-particle ${p.duration}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}

      <DecorativeRings />

      {/* Layout dos columnas */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex items-center gap-16">

        {/* Columna izquierda — Branding */}
        <div className="hidden lg:flex flex-col gap-8 flex-1 animate-slide-in-left">
          {/* Logo */}
          <div className="logo-shine w-24 h-24 rounded-3xl overflow-hidden shadow-2xl"
               style={{ boxShadow: '0 20px 60px rgba(15,26,90,0.4)' }}>
            <img src="/logo-mundial.png" alt="La Mundial" className="w-full h-full object-cover" />
          </div>

          <div>
            <p className="text-mundial-silver/80 text-sm font-semibold tracking-widest uppercase mb-3">
              Portal Corporativo
            </p>
            <h1 className="text-5xl font-display font-bold text-white leading-tight mb-4">
              La Mundial<br />
              <span style={{ color: '#E84F51' }}>de Seguros</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-sm">
              Plataforma centralizada de gestión de flujos de seguros: RCV, Patrimoniales y Funerario.
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-3">
            {[
              { icon: '🚗', label: 'Flujo RCV completo' },
              { icon: '🏛️', label: 'Patrimoniales con SSO' },
              { icon: '🌸', label: 'Seguro funerario' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-2xl">{f.icon}</span>
                <span className="text-white/70 font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha — Formulario */}
        <div className="glass-card rounded-3xl p-10 w-full max-w-md flex-shrink-0 animate-slide-up">
          {/* Logo mobile */}
          <div className="flex lg:hidden justify-center mb-6">
            <div className="logo-shine w-16 h-16 rounded-2xl overflow-hidden"
                 style={{ boxShadow: '0 10px 30px rgba(15,26,90,0.4)' }}>
              <img src="/logo-mundial.png" alt="La Mundial" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Header form */}
          <div className="mb-8 animate-slide-up-delay-1">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} style={{ color: '#E84F51' }} />
              <span className="text-mundial-silver/80 text-xs font-semibold tracking-widest uppercase">
                Acceso Seguro
              </span>
            </div>
            <h2 className="text-3xl font-display font-bold text-white">Iniciar sesión</h2>
            <p className="text-white/50 mt-1 text-sm">Ingresa con tus credenciales Nexus</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" id="login-form">
            {/* Email */}
            <div className="animate-slide-up-delay-2">
              <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="login-email">
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@lamundial.com.ve"
                className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="animate-slide-up-delay-3">
              <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="login-password">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-dark w-full px-4 py-3 pr-12 rounded-xl text-sm"
                  disabled={loading}
                />
                <button
                  type="button"
                  id="toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 animate-fade-in">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              ref={btnRef}
              type="submit"
              id="login-submit"
              className="btn-mundial w-full py-4 rounded-xl text-base font-semibold animate-slide-up-delay-4"
              disabled={loading}
              onClick={createRipple}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Verificando...
                </span>
              ) : (
                'Ingresar al portal'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center animate-slide-up-delay-4">
            <p className="text-white/30 text-xs">
              © {new Date().getFullYear()} La Mundial de Seguros · Exélixi Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { login } from '@/lib/nexus-auth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);

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
    <div className="min-h-screen flex" style={{ background: '#F7F7F7' }}>
      {/* Columna Izquierda - Branding Corporativo */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-16 overflow-hidden"
           style={{ background: '#0F1A5A' }}>
        
        {/* Gradiente sutil y formas limpias alineadas a la marca */}
        <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-[#162a7f] to-[#091133]"></div>
        <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -right-32 w-[400px] h-[400px] bg-[#E84F51]/15 rounded-full blur-3xl"></div>

        <div className="relative z-10 animate-fade-in">
          <img src="/logo-white.png" alt="La Mundial" className="h-20 object-contain" 
               onError={(e) => { e.currentTarget.src = '/logo-mundial.png' }} />
        </div>

        <div className="relative z-10 animate-slide-up-delay-1">
          <h1 className="text-6xl font-display font-bold text-white leading-tight mb-6 tracking-wide">
            52 años <br/> contigo
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-md font-light">
            Estar entre las primeras compañías de seguros más adaptadas al bolsillo del venezolano. 
            Plataforma centralizada de gestión.
          </p>
        </div>

        <div className="relative z-10 flex gap-4 animate-slide-up-delay-2">
          <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">Lealtad</span>
          <span className="text-white/30 text-xs font-semibold uppercase tracking-widest">•</span>
          <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">Verdad</span>
          <span className="text-white/30 text-xs font-semibold uppercase tracking-widest">•</span>
          <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">Seriedad</span>
        </div>
      </div>

      {/* Columna Derecha - Formulario Limpio (Blanco) */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-md animate-slide-up">
          {/* Logo visible solo en mobile */}
          <div className="lg:hidden flex justify-center mb-10">
            <img src="/logo-color.png" alt="La Mundial" className="h-16 object-contain" 
                 onError={(e) => { e.currentTarget.src = '/logo-mundial.png' }} />
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-display font-bold mb-2" style={{ color: '#0F1A5A' }}>Iniciar sesión</h2>
            <p className="text-gray-500 text-sm font-medium">Portal Corporativo Exélixi</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#0F1A5A' }}>
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@lamundial.com.ve"
                className="w-full px-5 py-4 rounded-xl text-sm border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-[#E84F51] focus:ring-4 focus:ring-[#E84F51]/10 outline-none transition-all text-gray-800 font-medium"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: '#0F1A5A' }}>
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
                  className="w-full px-5 py-4 pr-12 rounded-xl text-sm border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-[#E84F51] focus:ring-4 focus:ring-[#E84F51]/10 outline-none transition-all text-gray-800 font-medium"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0F1A5A] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-5 py-4 animate-fade-in">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              ref={btnRef}
              type="submit"
              className="w-full py-4 mt-2 rounded-xl text-white text-base font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex justify-center items-center gap-2"
              style={{ background: '#E84F51', boxShadow: '0 10px 25px rgba(232, 79, 81, 0.25)' }}
              disabled={loading}
            >
              {loading ? (
                <><span className="animate-pulse">Verificando...</span></>
              ) : (
                'Ingresar al portal'
              )}
            </button>
          </form>

          <div className="mt-12 text-center lg:text-left">
            <p className="text-gray-400 text-xs font-medium">
              © {new Date().getFullYear()} La Mundial de Seguros. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

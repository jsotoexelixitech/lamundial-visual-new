import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 sm:p-10 lg:p-16" 
         style={{ background: '#091133' }}>
      
      {/* ─── FONDOS ANIMADOS (AURORA EFFECT) ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] min-w-[500px] min-h-[500px] rounded-full blur-[100px] opacity-30 mix-blend-screen"
             style={{ background: '#E84F51', animation: 'float-slow 15s ease-in-out infinite' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] min-w-[600px] min-h-[600px] rounded-full blur-[120px] opacity-40 mix-blend-screen"
             style={{ background: '#0F1A5A', animation: 'float-slow 20s ease-in-out infinite reverse' }} />
        <div className="absolute top-[20%] left-[20%] w-[30vw] h-[30vw] min-w-[400px] min-h-[400px] rounded-full blur-[90px] opacity-20 mix-blend-screen"
             style={{ background: '#162a7f', animation: 'float-slow 12s ease-in-out infinite 2s' }} />
      </div>

      {/* ─── MARCA / WATERMARK ABSTRACTO ─── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0 overflow-hidden">
        <h1 className="text-[20vw] font-display font-bold text-white leading-none tracking-tighter whitespace-nowrap select-none">
          LA MUNDIAL
        </h1>
      </div>

      {/* ─── CONTENEDOR CENTRAL (RESPONSIVE GRID) ─── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20 xl:gap-32">
        
        {/* Columna Izquierda: Textos */}
        <div className="flex flex-col flex-1 text-center lg:text-left animate-slide-in-left order-2 lg:order-1 mt-8 lg:mt-0">
          <div className="max-w-xl mx-auto lg:mx-0">
            <div className="flex justify-center lg:justify-start mb-8">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold tracking-widest uppercase backdrop-blur-md shadow-lg">
                <ShieldCheck size={16} className="text-[#E84F51]" />
                Portal Corporativo
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-display font-bold text-white leading-tight mb-6">
              El respaldo <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                que mereces
              </span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed font-light mx-auto lg:mx-0 max-w-md">
              Plataforma centralizada y segura para la gestión de productos RCV, Patrimoniales y Funerarios de La Mundial de Seguros.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Formulario (Glass Card Ultra Premium) */}
        <div className="w-full max-w-md xl:max-w-lg flex-shrink-0 animate-slide-up order-1 lg:order-2">
          {/* Card Wrapper con borde glow animado */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/5 to-white/10 rounded-3xl blur-sm transform scale-[1.02]"></div>
          
          <div className="relative bg-white/95 backdrop-blur-3xl rounded-3xl p-8 sm:p-12 shadow-2xl border border-white/50 overflow-hidden">
            {/* Destello decorativo interior */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#E84F51]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            {/* Logo con mix-blend-multiply para quitar el fondo blanco del JPG/PNG */}
            <div className="flex justify-center mb-10 relative z-10">
              <img 
                src="/logo-mundial.png" 
                alt="La Mundial de Seguros" 
                className="h-20 sm:h-24 object-contain hover:scale-105 transition-transform duration-500 mix-blend-multiply" 
                style={{ filter: 'contrast(1.1)' }}
              />
            </div>

            <div className="text-center mb-8 relative z-10">
              <h2 className="text-3xl font-display font-bold mb-2" style={{ color: '#0F1A5A' }}>Iniciar sesión</h2>
              <p className="text-gray-500 text-sm">Ingresa con tus credenciales asignadas</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
              <div className="group">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500 group-focus-within:text-[#0F1A5A] transition-colors">
                  Correo electrónico
                </label>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ej. admin@exelixi.com"
                    className="w-full px-5 py-4 rounded-xl text-sm border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#0F1A5A] focus:ring-4 focus:ring-[#0F1A5A]/10 outline-none transition-all text-[#091133] font-medium placeholder:text-gray-400"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500 group-focus-within:text-[#0F1A5A] transition-colors">
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
                    className="w-full px-5 py-4 pr-12 rounded-xl text-sm border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#0F1A5A] focus:ring-4 focus:ring-[#0F1A5A]/10 outline-none transition-all text-[#091133] font-medium placeholder:text-gray-400"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0F1A5A] transition-colors p-2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 animate-fade-in mt-1">
                  <AlertCircle size={18} className="text-[#E84F51] flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                ref={btnRef}
                type="submit"
                className="w-full py-4 mt-2 rounded-xl text-white text-base font-bold transition-all relative overflow-hidden group shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #0F1A5A 0%, #162a7f 100%)' }}
                disabled={loading}
              >
                {/* Botón Hover Effect */}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                
                <span className="relative z-10 flex justify-center items-center gap-2">
                  {loading ? (
                    <span className="animate-pulse">Autenticando...</span>
                  ) : (
                    'Acceder al portal'
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none opacity-40 z-0">
        <p className="text-white text-xs tracking-widest uppercase">
          © {new Date().getFullYear()} La Mundial de Seguros. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

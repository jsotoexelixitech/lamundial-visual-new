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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-8" 
         style={{ background: '#091133' }}>
      
      {/* ─── FONDOS ANIMADOS (AURORA EFFECT) ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Orbe Rojo Imperial */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-40 mix-blend-screen"
             style={{ background: '#E84F51', animation: 'float-slow 15s ease-in-out infinite' }} />
        {/* Orbe Azul Pennsylvania */}
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[150px] opacity-50 mix-blend-screen"
             style={{ background: '#0F1A5A', animation: 'float-slow 20s ease-in-out infinite reverse' }} />
        {/* Orbe Claro central */}
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 mix-blend-screen"
             style={{ background: '#162a7f', animation: 'float-slow 12s ease-in-out infinite 2s' }} />
      </div>

      {/* ─── MARCA / WATERMARK ─── */}
      <div className="absolute top-12 left-12 hidden xl:block pointer-events-none opacity-20 animate-fade-in">
        <h1 className="text-[120px] font-display font-bold text-white leading-none tracking-tighter">
          52<br/>años
        </h1>
      </div>

      {/* ─── CONTENEDOR CENTRAL ─── */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        
        {/* Columna Textos */}
        <div className="hidden lg:flex flex-col flex-1 animate-slide-in-left">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold tracking-widest uppercase backdrop-blur-md mb-6">
              <ShieldCheck size={14} className="text-[#E84F51]" />
              Portal Corporativo
            </span>
            <h1 className="text-6xl font-display font-bold text-white leading-tight mb-6">
              El respaldo <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                que mereces
              </span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-md font-light">
              Plataforma centralizada y segura para la gestión de productos RCV, Patrimoniales y Funerarios de La Mundial de Seguros.
            </p>
          </div>
        </div>

        {/* Columna Formulario (Glass Card Ultra Premium) */}
        <div className="w-full max-w-md animate-slide-up relative">
          {/* Card Wrapper con borde glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-white/5 rounded-3xl blur-[1px]"></div>
          
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl border border-white/40 overflow-hidden">
            {/* Destello decorativo interior */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#E84F51]/10 to-transparent rounded-full blur-2xl"></div>

            {/* Logo */}
            <div className="flex justify-center mb-8 relative z-10">
              <img src="/logo-mundial.png" alt="La Mundial de Seguros" className="h-20 object-contain drop-shadow-md hover:scale-105 transition-transform duration-500" />
            </div>

            <div className="text-center mb-8 relative z-10">
              <h2 className="text-3xl font-display font-bold mb-2" style={{ color: '#0F1A5A' }}>Iniciar sesión</h2>
              <p className="text-gray-500 text-sm">Ingresa con tus credenciales asignadas</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
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
                    className="w-full px-5 py-3.5 rounded-xl text-sm border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#0F1A5A] focus:ring-4 focus:ring-[#0F1A5A]/10 outline-none transition-all text-gray-800 font-medium placeholder:text-gray-400"
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
                    className="w-full px-5 py-3.5 pr-12 rounded-xl text-sm border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#0F1A5A] focus:ring-4 focus:ring-[#0F1A5A]/10 outline-none transition-all text-gray-800 font-medium placeholder:text-gray-400"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0F1A5A] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 animate-fade-in mt-2">
                  <AlertCircle size={18} className="text-[#E84F51] flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                ref={btnRef}
                type="submit"
                className="w-full py-4 mt-4 rounded-xl text-white text-base font-bold transition-all relative overflow-hidden group"
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
      
      {/* Footer Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none opacity-40">
        <p className="text-white text-xs tracking-widest uppercase">
          © {new Date().getFullYear()} La Mundial de Seguros. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

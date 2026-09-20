import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-[#091133] font-sans">
      
      {/* ─── FONDOS INMERSIVOS (AURORA GLOW) ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-20 mix-blend-screen"
             style={{ background: '#E84F51', animation: 'float-slow 25s ease-in-out infinite' }} />
        <div className="absolute bottom-[0%] right-[10%] w-[60vw] h-[60vw] rounded-full blur-[150px] opacity-30 mix-blend-screen"
             style={{ background: '#162A7F', animation: 'float-slow 20s ease-in-out infinite reverse' }} />
        
        {/* Malla de puntos para darle textura premium */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      </div>

      {/* ─── CONTENIDO CENTRAL (GLASSMORPHISM) ─── */}
      <div className="relative z-10 w-full max-w-md px-6 sm:px-0 animate-slide-up">
        
        {/* LOGO FLOTANTE */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/5 p-4 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl">
            <img 
              src="/logo-mundial.png" 
              alt="La Mundial de Seguros" 
              className="h-14 sm:h-16 object-contain"
              style={{ filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.5)) brightness(1.2)' }}
            />
          </div>
        </div>

        {/* TARJETA DE LOGIN */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-[32px] p-8 sm:p-10 shadow-[0_32px_64px_rgba(0,0,0,0.4)] border border-white/20 relative overflow-hidden">
          {/* Brillo interno en la tarjeta */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mb-2">
              Acceso Exclusivo
            </h2>
            <p className="text-white/50 text-sm font-light">
              Portal Corporativo · La Mundial de Seguros
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="group">
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className="w-full px-5 py-4 rounded-2xl text-sm border border-white/10 bg-white/5 focus:bg-white/10 focus:border-white/30 focus:ring-4 focus:ring-white/5 outline-none transition-all text-white font-medium placeholder:text-white/40"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="group">
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full px-5 py-4 pr-12 rounded-2xl text-sm border border-white/10 bg-white/5 focus:bg-white/10 focus:border-white/30 focus:ring-4 focus:ring-white/5 outline-none transition-all text-white font-medium placeholder:text-white/40"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 animate-fade-in mt-1 backdrop-blur-md">
                <AlertCircle size={18} className="text-[#E84F51] flex-shrink-0 mt-0.5" />
                <p className="text-white/90 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              ref={btnRef}
              type="submit"
              className="w-full py-4 mt-4 rounded-2xl text-white text-base font-bold transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(232,79,81,0.3)] hover:shadow-[0_0_30px_rgba(232,79,81,0.5)] relative overflow-hidden group flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #E84F51 0%, #B23F44 100%)' }}
              disabled={loading}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10 flex justify-center items-center gap-2">
                {loading ? (
                  <span className="animate-pulse">Autenticando...</span>
                ) : (
                  <>
                    Ingresar
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* FOOTER INVISIBLE/SUTIL */}
      <div className="absolute bottom-6 w-full text-center pointer-events-none opacity-30">
        <p className="text-white text-xs tracking-widest uppercase font-semibold">
          © {new Date().getFullYear()} La Mundial de Seguros
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

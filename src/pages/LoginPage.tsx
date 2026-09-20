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
    <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
      
      {/* ─── MITAD IZQUIERDA: IMAGEN CORPORATIVA (Azul Pennsylvania) ─── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-between"
           style={{ background: 'linear-gradient(145deg, #091133 0%, #0F1A5A 100%)' }}>
        
        {/* Luces y brillos sutiles estilo aurora */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-20 mix-blend-screen"
               style={{ background: '#162A7F', animation: 'float-slow 20s ease-in-out infinite' }} />
          <div className="absolute top-[40%] right-[-20%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-10 mix-blend-screen"
               style={{ background: '#E84F51', animation: 'float-slow 15s ease-in-out infinite reverse' }} />
        </div>

        {/* Marca de agua tipográfica abstracta */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
          <h1 className="text-[15vw] font-display font-bold text-white leading-none tracking-tighter whitespace-nowrap select-none -rotate-12">
            MUNDIAL
          </h1>
        </div>

        {/* Contenido Izquierdo */}
        <div className="relative z-10 p-12 lg:p-16 flex flex-col h-full justify-center text-white">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold tracking-widest uppercase backdrop-blur-md shadow-lg">
              <ShieldCheck size={16} className="text-[#E84F51]" />
              Acceso Seguro
            </span>
          </div>
          <h1 className="text-5xl xl:text-6xl 2xl:text-7xl font-display font-bold leading-[1.1] mb-6">
            El respaldo <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #fff, #ACACAC)' }}>
              que mereces.
            </span>
          </h1>
          <p className="text-white/70 text-lg xl:text-xl font-light max-w-lg leading-relaxed">
            Plataforma centralizada para la gestión inteligente de productos RCV, Patrimoniales y Funerarios de La Mundial de Seguros.
          </p>

          <div className="mt-auto pt-16">
            <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">
              © {new Date().getFullYear()} La Mundial de Seguros
            </p>
          </div>
        </div>
      </div>

      {/* ─── MITAD DERECHA: FORMULARIO BLANCO ─── */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-16 relative bg-[#FAFAFA]">
        <div className="w-full max-w-[420px] animate-slide-up bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative">
          
          {/* Logo en la parte superior del formulario */}
          <div className="mb-10 flex justify-center lg:justify-start">
            <img 
              src="/logo-mundial.png" 
              alt="La Mundial de Seguros" 
              className="h-16 object-contain"
            />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#091133' }}>Bienvenido de nuevo</h2>
            <p className="text-gray-500 text-sm">Ingresa tus credenciales para acceder al portal corporativo.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500 transition-colors" style={{ color: '#ACACAC' }}>
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej. admin@lamundial.com"
                  className="w-full px-4 py-3.5 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#0F1A5A] focus:ring-4 focus:ring-[#0F1A5A]/10 outline-none transition-all text-[#091133] font-medium placeholder:text-gray-400"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500 transition-colors" style={{ color: '#ACACAC' }}>
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
                  className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#0F1A5A] focus:ring-4 focus:ring-[#0F1A5A]/10 outline-none transition-all text-[#091133] font-medium placeholder:text-gray-400"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0F1A5A] transition-colors p-2"
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
              className="w-full py-3.5 mt-4 rounded-xl text-white text-sm font-bold transition-all hover:-translate-y-0.5 shadow-md hover:shadow-xl relative overflow-hidden group"
              style={{ background: '#E84F51' }}
              disabled={loading}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10 flex justify-center items-center gap-2">
                {loading ? (
                  <span className="animate-pulse">Autenticando...</span>
                ) : (
                  'Ingresar al Portal'
                )}
              </span>
            </button>
          </form>
          
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

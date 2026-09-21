import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, Lock, Car, Heart, Building2 } from 'lucide-react';
import { login, getCurrentUser } from '@/lib/nexus-auth';
import { MundialBrand } from '@/components/brand/MundialBrand';
import { LoginBrandShowcase } from '@/components/login/LoginBrandShowcase';
import { LoginLoadingOverlay } from '@/components/login/LoginLoadingOverlay';

// ═══════════════════════════════════════════════════
// APPLE LIGHT THEME (La Mundial)
// "White room with a single blue (red) switch"
// Canvas: #f5f5f7 | Text: #1d1d1f | Action: #E84F51
// ═══════════════════════════════════════════════════

const MIN_LOADING_MS = 2200;

const FLOAT_ICONS = [
  { Icon: Car, className: 'apple-float-card apple-float-1', label: 'RCV' },
  { Icon: Heart, className: 'apple-float-card apple-float-2', label: 'Funerario' },
  { Icon: Building2, className: 'apple-float-card apple-float-3', label: 'Personas' },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function waitMin(totalMs: number, started: number) {
  const remain = totalMs - (Date.now() - started);
  if (remain > 0) await sleep(remain);
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginStep, setLoginStep] = useState(0);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    // Add a specific class for this theme if needed globally
    document.body.classList.add('portal-login-apple');
    document.body.classList.remove('portal-login-route', 'portal-login-organic', 'portal-login-ib', 'portal-login-auros');
    return () => document.body.classList.remove('portal-login-apple');
  }, []);

  useEffect(() => {
    if (getCurrentUser()) navigate('/dashboard', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Completa correo y contraseña.');
      return;
    }
    const started = Date.now();
    setLoading(true);
    setLoginStep(0);
    setError('');
    try {
      await sleep(400);
      await login({ email: email.trim(), password });
      setLoginStep(1);
      await sleep(500);
      setLoginStep(2);
      await waitMin(MIN_LOADING_MS, started);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Credenciales incorrectas.');
      setLoading(false);
      setLoginStep(0);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col font-sans"
      style={{ 
        backgroundColor: '#f5f5f7', // Frost
        color: '#1d1d1f',           // Carbon
        minHeight: '100dvh' 
      }}
    >
      <LoginLoadingOverlay active={loading} stepIndex={loginStep} />

      {/* FLOAT ICONS (Adaptados al tema claro) */}
      {FLOAT_ICONS.map(({ Icon, className, label }) => (
        <div key={label} className={`${className} hidden md:flex flex-col items-center justify-center absolute opacity-40`} aria-hidden>
          <Icon size={24} style={{ color: '#858585' }} /> {/* Mist */}
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] mt-2" style={{ color: '#707070' }}>
            {label}
          </span>
        </div>
      ))}

      {/* NAV GLOBAL TIPO APPLE (Minimalista) */}
      <nav className="w-full flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#d2d2d7', backgroundColor: 'rgba(245, 245, 247, 0.8)', backdropFilter: 'blur(20px)' }}>
        <MundialBrand variant="dark" isotipoClassName="h-8 w-8" subtitle="Portal corporativo" />
        <div className="flex items-center gap-4 text-xs font-medium" style={{ color: '#333333' }}>
          <span className="hidden sm:inline">Soporte técnico</span>
          <Lock size={14} />
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL (Hero centrado) */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto w-full text-center relative z-10">
        
        <header className="mb-8 flex flex-col items-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#707070' }}>
            Suscripción Digital
          </p>
          <h1 className="font-semibold leading-[1.07] mb-4" style={{ fontSize: '56px', letterSpacing: '-0.005em', color: '#1d1d1f' }}>
            Emisión de pólizas. <br />
            <span style={{ color: '#707070' }}>Al instante.</span>
          </h1>
          <p className="text-lg leading-relaxed max-w-xl mx-auto font-light" style={{ color: '#1d1d1f', letterSpacing: '-0.016em' }}>
            Accede para cotizar y emitir: RCV, planes de personas y seguros patrimoniales, con el canal comercial de La Mundial de Seguros.
          </p>
        </header>

        <main className="w-full max-w-[360px] mx-auto mt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* INPUTS ESTILO APPLE */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Correo corporativo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 text-[17px] font-normal transition-all outline-none"
                  style={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #d2d2d7', 
                    borderRadius: '8px',
                    color: '#1d1d1f'
                  }}
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 text-[17px] font-normal transition-all outline-none pr-12"
                  style={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #d2d2d7', 
                    borderRadius: '8px',
                    color: '#1d1d1f'
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 transition-colors"
                  style={{ color: '#707070' }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex gap-3 items-start rounded-[8px] border px-4 py-3 text-left mt-2" style={{ backgroundColor: '#fff0f0', borderColor: '#ffcaca' }}>
                <AlertCircle size={18} style={{ color: '#E84F51', marginTop: '2px', flexShrink: 0 }} />
                <p className="text-sm font-medium" style={{ color: '#1d1d1f' }}>{error}</p>
              </div>
            )}

            {/* ACTION BUTTON (The "Single Red Switch") */}
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  backgroundColor: '#E84F51', // Rojo Imperial
                  color: '#ffffff', // Ice text
                  fontSize: '17px',
                  fontWeight: 400,
                  padding: '12px 24px',
                  borderRadius: '980px', // Apple Pill
                  border: 'none',
                  boxShadow: 'none' // Strict No-Shadow policy
                }}
              >
                {loading ? (
                  <span className="animate-pulse">Conectando…</span>
                ) : (
                  <>
                    Entrar al portal
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
            
            <div className="pt-4 flex justify-center">
              <LoginBrandShowcase />
            </div>
            
          </form>
        </main>
      </div>
      
      {/* FOOTER */}
      <footer className="w-full py-6 text-center border-t mt-auto" style={{ borderColor: '#d2d2d7', backgroundColor: '#f5f5f7' }}>
        <p className="text-xs" style={{ color: '#707070' }}>
          Copyright © {new Date().getFullYear()} La Mundial de Seguros. Todos los derechos reservados.
        </p>
      </footer>
      
      {/* ANIMACIONES PARA LOS FLOTANTES (CSS Inyectado) */}
      <style>{`
        .apple-float-card {
          position: absolute;
          animation: float-apple 20s ease-in-out infinite alternate;
        }
        .apple-float-1 { top: 20%; left: 10%; animation-delay: 0s; }
        .apple-float-2 { top: 60%; right: 15%; animation-delay: -5s; }
        .apple-float-3 { bottom: 15%; left: 20%; animation-delay: -10s; }
        
        @keyframes float-apple {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
          100% { transform: translateY(10px) rotate(-2deg); }
        }
        
        /* Focus styles for inputs */
        input:focus {
          border-color: #E84F51 !important;
          box-shadow: 0 0 0 2px rgba(232, 79, 81, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;

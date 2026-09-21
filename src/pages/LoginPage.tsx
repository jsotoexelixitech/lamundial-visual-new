import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { login, getCurrentUser } from '@/lib/nexus-auth';
import { MundialBrand } from '@/components/brand/MundialBrand';
import { LoginBrandShowcase } from '@/components/login/LoginBrandShowcase';
import { LoginLoadingOverlay } from '@/components/login/LoginLoadingOverlay';
import { LoginOrganicAmbient } from '@/components/login/LoginOrganicAmbient';

const MIN_LOADING_MS = 2200;

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
    document.body.classList.add('portal-login-organic');
    document.body.classList.remove('portal-login-route');
    return () => document.body.classList.remove('portal-login-organic');
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
      className="login-organic-page login-organic-v2 min-h-screen relative overflow-hidden"
      data-login-theme="organic-v2"
      style={{ minHeight: '100dvh' }}
    >
      <LoginLoadingOverlay active={loading} stepIndex={loginStep} />

      <div className="login-organic-split min-h-screen lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <aside className="login-organic-panel-dark relative flex flex-col justify-center px-8 py-14 sm:px-12 lg:px-16 overflow-hidden">
          <LoginOrganicAmbient intense={loading} variant="hero-dark" />

          <div className="relative z-10 max-w-lg mx-auto lg:mx-0 w-full">
            <header className="login-organic-stagger login-organic-stagger-1 flex flex-wrap items-center gap-3 mb-10">
              <MundialBrand variant="light" isotipoClassName="h-11 w-11" subtitle="Portal corporativo" />
              <span className="login-organic-chip-dark inline-flex items-center gap-2 px-3 py-1.5">
                <ShieldCheck size={12} className="login-organic-icon-pulse" />
                Acceso seguro
              </span>
            </header>

            <p className="login-organic-stagger login-organic-stagger-2 login-organic-eyebrow-light mb-4">
              Suscripción digital
            </p>
            <h1 className="login-organic-stagger login-organic-stagger-3 login-organic-hero-title text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold leading-[1.05] mb-5 tracking-tight">
              Emisión de pólizas en minutos
            </h1>
            <p className="login-organic-stagger login-organic-stagger-4 text-bone-white/75 text-base sm:text-lg leading-relaxed">
              Un solo acceso para cotizar y emitir: RCV, planes de personas y seguros patrimoniales,
              con el canal comercial que La Mundial de Seguros asignó a tu equipo.
            </p>

            <div className="login-organic-stagger login-organic-stagger-5 mt-12 flex justify-center lg:justify-start">
              <LoginBrandShowcase variant="hero" theme="organic-dark" />
            </div>
          </div>
        </aside>

        <section className="login-organic-panel-light relative flex items-center justify-center px-6 py-12 sm:px-10">
          <LoginOrganicAmbient intense={loading} variant="page-light" />

          <main className="relative z-10 w-full max-w-md login-organic-card-enter">
            <div className="login-organic-card login-organic-card-float rounded-[20px] overflow-hidden">
              <div className="h-1.5 bg-tissue overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 w-1/3 login-organic-shimmer" />
              </div>
              <div className="px-8 pt-8 pb-2 sm:px-10 sm:pt-10">
                <h2 className="text-xl font-semibold text-abyssal-ink mb-1">Iniciar sesión</h2>
                <p className="text-sm text-graphite mb-7">Credenciales corporativas La Mundial</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="login-email" className="login-organic-label">
                      Correo corporativo
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="nombre@lamundialdeseguros.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="login-organic-input w-full"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="login-password" className="login-organic-label">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="login-organic-input w-full pr-12"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-graphite hover:text-abyssal-ink"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex gap-3 items-start rounded-lg border border-mundial-red/25 bg-[#fdecec] px-4 py-3">
                      <AlertCircle size={18} className="text-mundial-red shrink-0 mt-0.5" />
                      <p className="text-sm text-[#991B1B] font-medium">{error}</p>
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="login-organic-cta w-full">
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="login-btn-spinner login-btn-spinner-dark" />
                        Conectando…
                      </span>
                    ) : (
                      <>
                        Entrar al portal
                        <ArrowRight size={18} className="login-organic-cta-arrow" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="mt-6 border-t border-tissue px-8 sm:px-10 py-4 flex items-center gap-2 text-[11px] text-graphite">
                <Lock size={13} className="text-mundial-blue" />
                Conexión cifrada · acceso auditado
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-graphite">
              ¿Problemas de acceso? Contacta a Tecnología La Mundial.
            </p>
          </main>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;

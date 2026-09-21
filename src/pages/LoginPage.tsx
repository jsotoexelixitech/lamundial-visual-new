import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Lock, Car, Heart, Building2 } from 'lucide-react';
import { login, getCurrentUser } from '@/lib/nexus-auth';
import { MundialBrand } from '@/components/brand/MundialBrand';
import { LoginBrandShowcase } from '@/components/login/LoginBrandShowcase';
import { LoginLoadingOverlay } from '@/components/login/LoginLoadingOverlay';
import { LoginAmbientLayer } from '@/components/login/LoginAmbientLayer';

const MIN_LOADING_MS = 2200;

const FLOAT_ICONS = [
  { Icon: Car, className: 'login-float-card login-float-1', label: 'RCV' },
  { Icon: Heart, className: 'login-float-card login-float-2', label: 'Funerario' },
  { Icon: Building2, className: 'login-float-card login-float-3', label: 'Personas' },
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
    document.body.classList.add('portal-login-route');
    document.body.classList.remove(
      'portal-login-organic',
      'portal-login-ib',
      'portal-login-auros',
      'portal-login-apple-mundial',
    );
    return () => document.body.classList.remove('portal-login-route');
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
      className="login-authkit-page bg-midnight-canvas min-h-screen relative overflow-hidden text-frost-glow"
      data-login-theme="authkit-v1"
      style={{ backgroundColor: '#05060f', minHeight: '100dvh' }}
    >
      <LoginAmbientLayer intense={loading} />
      <LoginLoadingOverlay active={loading} stepIndex={loginStep} />

      {FLOAT_ICONS.map(({ Icon, className, label }) => (
        <div key={label} className={`${className} hidden md:flex`} aria-hidden>
          <Icon size={22} className="text-blueprint-blue" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-moon-mist mt-2">
            {label}
          </span>
        </div>
      ))}

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 px-6 py-12 max-w-6xl mx-auto">
        <section className="flex-1 max-w-xl text-center lg:text-left login-hero-enter">
          <header className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-10">
            <MundialBrand variant="light" isotipoClassName="h-11 w-11" subtitle="Portal corporativo" />
            <span className="login-glass-chip inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-moon-mist">
              <ShieldCheck size={12} className="login-icon-bounce" />
              Acceso seguro
            </span>
          </header>

          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-fog-veil mb-4">
            Suscripción digital
          </p>
          <h1 className="login-headline-gradient text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold leading-[1.08] mb-5">
            Emisión de pólizas en minutos
          </h1>
          <p className="text-fog-veil text-sm sm:text-base leading-relaxed max-w-md mx-auto lg:mx-0">
            Un solo acceso para cotizar y emitir: RCV, planes de personas y seguros patrimoniales,
            con el canal comercial que La Mundial de Seguros asignó a tu equipo.
          </p>

          <div className="mt-12 flex justify-center lg:justify-start">
            <LoginBrandShowcase variant="hero" theme="authkit" />
          </div>
        </section>

        <main className="w-full max-w-md login-form-enter">
          <div className="login-glass-modal rounded-2xl overflow-hidden">
            <div className="h-1 bg-white/5 overflow-hidden">
              <div className="h-full login-idle-shimmer" />
            </div>
            <div className="px-8 pt-8 pb-2 sm:px-10 sm:pt-10">
              <h2 className="text-xl font-semibold text-ice-highlight mb-1">Iniciar sesión</h2>
              <p className="text-sm text-fog-veil mb-7">Credenciales corporativas La Mundial</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="login-label">
                    Correo corporativo
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="nombre@lamundialdeseguros.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-glass-input w-full"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="login-label">
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
                      className="login-glass-input w-full pr-12"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-fog-veil hover:text-frost-glow"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex gap-3 items-start rounded-lg border border-mundial-red/30 bg-mundial-red/10 px-4 py-3">
                    <AlertCircle size={18} className="text-mundial-red shrink-0 mt-0.5" />
                    <p className="text-sm text-[#f0a9a9] font-medium">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading} className="login-cta-violet w-full">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="login-btn-spinner" />
                      Conectando…
                    </span>
                  ) : (
                    <>
                      Entrar al portal
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 border-t border-white/5 px-8 sm:px-10 py-4 flex items-center gap-2 text-[11px] text-fog-veil">
              <Lock size={13} className="text-blueprint-blue" />
              Conexión cifrada · acceso auditado
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-fog-veil">
            ¿Problemas de acceso? Contacta a Tecnología La Mundial.
          </p>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;

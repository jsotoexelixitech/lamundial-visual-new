import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Lock, Car, Heart, Building2 } from 'lucide-react';
import { login, getCurrentUser } from '@/lib/nexus-auth';
import { MundialBrand } from '@/components/brand/MundialBrand';
import { LoginBrandShowcase } from '@/components/login/LoginBrandShowcase';
import { LoginLoadingOverlay } from '@/components/login/LoginLoadingOverlay';
import { LoginAppleMundialAmbient } from '@/components/login/LoginAppleMundialAmbient';

const MIN_LOADING_MS = 2200;

const RAMOS = [
  { Icon: Car, label: 'RCV', tone: 'blue' as const },
  { Icon: Heart, label: 'Funerario', tone: 'red' as const },
  { Icon: Building2, label: 'Personas', tone: 'blue' as const },
];

const FLOAT = [
  { Icon: Car, className: 'login-apple-m-float login-apple-m-float-1', label: 'RCV' },
  { Icon: Heart, className: 'login-apple-m-float login-apple-m-float-2', label: 'Funerario' },
  { Icon: Building2, className: 'login-apple-m-float login-apple-m-float-3', label: 'Patrimonial' },
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
    document.body.classList.add('portal-login-apple-mundial');
    document.body.classList.remove('portal-login-route', 'portal-login-organic', 'portal-login-ib', 'portal-login-auros');
    return () => document.body.classList.remove('portal-login-apple-mundial');
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
    <div className="login-apple-m relative min-h-screen overflow-hidden" data-login-theme="apple-mundial-v1" style={{ minHeight: '100dvh' }}>
      <LoginAppleMundialAmbient intense={loading} />
      <LoginLoadingOverlay active={loading} stepIndex={loginStep} />

      {FLOAT.map(({ Icon, className, label }) => (
        <div key={label} className={`${className} hidden lg:flex`} aria-hidden>
          <Icon size={20} className="text-mundial-blue" />
          <span className="login-apple-m-caption mt-2">{label}</span>
        </div>
      ))}

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1100px] flex-col px-6 pb-12 pt-6 sm:px-10">
        <header className="login-apple-m-nav flex flex-wrap items-center justify-between gap-4 border-b border-[#dddddd] pb-4">
          <MundialBrand variant="dark" isotipoClassName="h-10 w-10" subtitle="Portal corporativo" />
          <p className="login-apple-m-caption hidden sm:block">Suscripción digital · La Mundial de Seguros</p>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-12 py-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16">
          <section className="w-full text-center lg:text-left login-hero-enter">
            <p className="login-apple-m-caption mb-4">Portal corporativo</p>
            <h1 className="login-apple-m-display mb-4">
              Emisión de pólizas
              <span className="text-mundial-red italic font-normal"> en minutos.</span>
            </h1>
            <p className="login-apple-m-lead mx-auto max-w-md lg:mx-0 mb-10">
              Un solo acceso para cotizar y emitir con el canal comercial que La Mundial asignó a tu equipo.
            </p>

            <div className="flex justify-center lg:justify-start mb-10">
              <LoginBrandShowcase variant="hero" theme="mundial-light" />
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0">
              {RAMOS.map(({ Icon, label, tone }) => (
                <div key={label} className="login-apple-m-service-tile">
                  <Icon size={18} className={tone === 'red' ? 'text-mundial-red' : 'text-mundial-blue'} />
                  <span className="login-apple-m-caption mt-2 block">{label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="w-full max-w-md login-form-enter lg:justify-self-end">
            <div className="login-apple-m-panel px-8 py-8 sm:px-10 sm:py-10">
              <h2 className="login-apple-m-subtitle text-xl font-semibold mb-1">Iniciar sesión</h2>
              <p className="login-apple-m-body mb-7">Credenciales corporativas La Mundial</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="login-apple-m-label">
                    Correo corporativo
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="nombre@lamundialdeseguros.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-apple-m-input w-full"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="login-apple-m-label">
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
                      className="login-apple-m-input w-full pr-12"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#707070] hover:text-mundial-blue"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex gap-3 items-start rounded-lg border border-mundial-red/35 bg-[#fdecec] px-4 py-3">
                    <AlertCircle size={18} className="text-mundial-red shrink-0 mt-0.5" />
                    <p className="text-sm text-[#b23f44] font-normal">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading} className="login-apple-m-btn-primary w-full">
                  {loading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="login-btn-spinner" />
                      Conectando…
                    </span>
                  ) : (
                    'Entrar al portal'
                  )}
                </button>
              </form>

              <div className="login-apple-m-hairline my-8" />
              <p className="login-apple-m-body flex items-center gap-2 text-xs">
                <Lock size={13} className="text-mundial-blue" />
                Conexión cifrada · acceso auditado
              </p>
            </div>

            <p className="login-apple-m-body mt-6 text-center text-xs">
              ¿Problemas de acceso? Contacta a Tecnología La Mundial.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;

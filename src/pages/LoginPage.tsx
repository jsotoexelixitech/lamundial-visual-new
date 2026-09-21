import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowUpRight, Lock } from 'lucide-react';
import { login, getCurrentUser } from '@/lib/nexus-auth';
import { MundialBrand } from '@/components/brand/MundialBrand';
import { LoginLoadingOverlay } from '@/components/login/LoginLoadingOverlay';
import { LoginParticleSphere } from '@/components/login/LoginParticleSphere';
import { LoginMoleculeDecor } from '@/components/login/LoginMoleculeDecor';

const MIN_LOADING_MS = 2400;

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
    document.body.classList.add('portal-login-auros');
    document.body.classList.remove('portal-login-route', 'portal-login-organic', 'portal-login-ib');
    return () => document.body.classList.remove('portal-login-auros');
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
    <div className="login-auros relative min-h-screen overflow-hidden" data-login-theme="auros-mundial-v1" style={{ minHeight: '100dvh' }}>
      <div className="login-auros-aurora-wash pointer-events-none absolute inset-0" aria-hidden />
      <LoginLoadingOverlay active={loading} stepIndex={loginStep} />

      <div className="login-auros-orb-stage pointer-events-none absolute inset-0 lg:left-[38%]" aria-hidden>
        <LoginParticleSphere className="login-auros-orb-canvas h-full w-full" particleCount={420} radius={165} />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1440px] flex-col px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <MundialBrand variant="light" isotipoClassName="h-10 w-10" subtitle="Portal corporativo" />
          <nav className="login-auros-nav hidden sm:flex items-center gap-6" aria-label="Secciones">
            <span className="login-auros-nav-link is-active">Acceso</span>
            <span className="login-auros-nav-link">Emisión</span>
            <span className="login-auros-nav-link">Canales</span>
          </nav>
        </header>

        <main className="flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center lg:gap-16 pt-10 lg:pt-6 pb-12">
          <section className="relative max-w-xl lg:max-w-2xl">
            <p className="login-auros-eyebrow mb-6">La Mundial · Suscripción digital</p>
            <h1 className="login-auros-hero mb-8">
              Terminal de emisión
              <span className="text-mundial-red">.</span>
            </h1>
            <p className="login-auros-lead mb-12 max-w-md">
              Cotiza y emite RCV, planes de personas y patrimoniales con el canal comercial que La Mundial
              asignó a tu equipo — un solo acceso, trazabilidad completa.
            </p>

            <div className="login-auros-metrics mb-10 grid grid-cols-3 gap-6 max-w-lg">
              <div>
                <p className="login-auros-stat">3</p>
                <p className="login-auros-metric-label">Ramos activos</p>
              </div>
              <div>
                <p className="login-auros-stat text-[clamp(2rem,4vw,3.5rem)]">24/7</p>
                <p className="login-auros-metric-label">Disponibilidad</p>
              </div>
              <div>
                <p className="login-auros-stat text-[clamp(2rem,4vw,3.5rem)]">1</p>
                <p className="login-auros-metric-label">Acceso único</p>
              </div>
            </div>

            <LoginMoleculeDecor className="hidden lg:block absolute -right-4 top-1/2 h-40 w-40 opacity-70 -translate-y-1/2 translate-x-full" />
          </section>

          <section className="login-auros-card w-full max-w-md lg:max-w-none lg:justify-self-end">
            <div className="flex items-start justify-between gap-4 mb-8">
              <div>
                <p className="login-auros-eyebrow mb-3 text-liquid-mist">Acceso seguro</p>
                <h2 className="login-auros-card-title">Iniciar sesión</h2>
                <p className="login-auros-body mt-2">Credenciales corporativas La Mundial</p>
              </div>
              <span className="login-auros-icon-btn shrink-0" aria-hidden>
                <ArrowUpRight size={16} strokeWidth={1.75} />
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="login-auros-label">
                  Correo corporativo
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@lamundialdeseguros.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-auros-input w-full"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="login-password" className="login-auros-label">
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
                    className="login-auros-input w-full pr-12"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-silver-mist hover:text-platinum"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex gap-3 items-start rounded-md border border-slate-deep/60 bg-liquid-deep px-4 py-3">
                  <AlertCircle size={18} className="text-mundial-red shrink-0 mt-0.5" />
                  <p className="text-sm text-liquid-mist font-normal">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="login-auros-cta w-full mt-2">
                {loading ? 'Conectando…' : 'Entrar al portal'}
              </button>
            </form>

            <div className="login-auros-hairline my-8" />
            <p className="login-auros-body flex items-center gap-2 text-xs">
              <Lock size={13} />
              Conexión cifrada · acceso auditado
            </p>
            <p className="login-auros-body mt-4 text-xs opacity-80">
              ¿Problemas de acceso? Contacta a Tecnología La Mundial.
            </p>
          </section>
        </main>

        <footer className="login-auros-footer mt-auto pt-10 text-center lg:text-left">
          <p className="login-auros-body text-[10px] uppercase tracking-[0.15em] text-slate-deep">
            © La Mundial de Seguros · Portal corporativo
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;

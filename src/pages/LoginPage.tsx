import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import { login, getCurrentUser } from '@/lib/nexus-auth';
import { MundialBrand } from '@/components/brand/MundialBrand';
import { LoginBrandShowcase } from '@/components/login/LoginBrandShowcase';
import { LoginLoadingOverlay } from '@/components/login/LoginLoadingOverlay';
import { LoginAppleMundialAmbient } from '@/components/login/LoginAppleMundialAmbient';

const MIN_LOADING_MS = 2200;

const PROMO = [
  { title: 'RCV', kicker: 'Vehículos', wash: 'login-apple-m-wash-blue' },
  { title: 'Personas', kicker: 'Salud y vida', wash: 'login-apple-m-wash-ice' },
  { title: 'Patrimonial', kicker: 'Bienes', wash: 'login-apple-m-wash-red' },
] as const;

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
    <div className="login-apple-m relative min-h-screen" data-login-theme="apple-mundial-v2" style={{ minHeight: '100dvh' }}>
      <LoginAppleMundialAmbient intense={loading} />
      <LoginLoadingOverlay active={loading} stepIndex={loginStep} />

      <header className="login-apple-m-global-nav relative z-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 py-3 sm:px-10">
          <MundialBrand variant="dark" isotipoClassName="h-9 w-9" subtitle="" showWordmark />
          <nav className="login-apple-m-ghost-nav hidden md:flex items-center gap-8" aria-label="Portal">
            <span className="is-active">Acceso</span>
            <span>Emisión</span>
            <span>Canales</span>
          </nav>
          <span className="login-apple-m-caption hidden lg:inline">Portal corporativo</span>
        </div>
      </header>

      {/* Hero tipográfico centrado (patrón Apple) */}
      <section className="relative z-10 mx-auto max-w-[680px] px-6 pt-12 pb-4 text-center sm:pt-16 login-hero-enter">
        <p className="login-apple-m-caption mb-5">La Mundial de Seguros</p>
        <h1 className="login-apple-m-display-lg mb-4">
          Emisión de pólizas.
        </h1>
        <p className="login-apple-m-tagline mx-auto max-w-[28rem]">
          Cotiza y emite RCV, personas y patrimoniales con un solo acceso corporativo.
        </p>
      </section>

      {/* Producto = isotipo + órbitas (momento visual, no columna lateral) */}
      <section className="relative z-10 flex justify-center py-6 sm:py-10">
        <LoginBrandShowcase variant="compact" theme="mundial-light" />
      </section>

      {/* Formulario en franja elevada full-bleed — sin card flotante tipo AuthKit */}
      <section className="login-apple-m-form-band relative z-10 w-full border-y border-[#d2d2d7] py-12 sm:py-14">
        <div className="mx-auto w-full max-w-[420px] px-6 login-form-enter">
          <h2 className="login-apple-m-subtitle text-center text-[21px] font-semibold mb-1">Iniciar sesión</h2>
          <p className="login-apple-m-body text-center mb-8">Credenciales corporativas</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="login-apple-m-label sr-only">
                Correo corporativo
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="Correo corporativo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-apple-m-input w-full"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <label htmlFor="login-password" className="login-apple-m-label sr-only">
                Contraseña
              </label>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Contraseña"
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

            {error && (
              <div className="flex gap-3 items-start rounded-lg border border-mundial-red/35 bg-[#fff5f5] px-4 py-3">
                <AlertCircle size={18} className="text-mundial-red shrink-0 mt-0.5" />
                <p className="text-sm text-[#b23f44]">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="submit" disabled={loading} className="login-apple-m-btn-primary flex-1">
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="login-apple-m-spinner" />
                    Conectando…
                  </span>
                ) : (
                  'Entrar al portal'
                )}
              </button>
              <a href="mailto:soporte@lamundialdeseguros.com" className="login-apple-m-btn-outline flex-1 text-center">
                Ayuda
              </a>
            </div>
          </form>

          <p className="login-apple-m-body mt-8 flex items-center justify-center gap-2 text-xs">
            <Lock size={13} className="text-mundial-blue" />
            Conexión cifrada · acceso auditado
          </p>
        </div>
      </section>

      {/* Fila promocional tipo Apple TV+ / servicios */}
      <section className="relative z-10 mx-auto max-w-[1440px] px-6 py-14 sm:px-10 sm:py-16">
        <p className="login-apple-m-caption mb-6 text-center">Explore</p>
        <div className="login-apple-m-promo-scroll flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {PROMO.map(({ title, kicker, wash }) => (
            <article key={title} className={`login-apple-m-promo-card snap-start ${wash}`}>
              <p className="login-apple-m-promo-kicker">{kicker}</p>
              <h3 className="login-apple-m-promo-title">{title}</h3>
              <span className="login-apple-m-promo-pill">Emitir ahora</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="login-apple-m-footer relative z-10 border-t border-[#d2d2d7] px-6 py-10 text-center sm:px-10">
        <p className="login-apple-m-footer-text">
          ¿Problemas de acceso? Contacta a Tecnología La Mundial.
        </p>
        <p className="login-apple-m-footer-text mt-3">© La Mundial de Seguros</p>
      </footer>
    </div>
  );
};

export default LoginPage;

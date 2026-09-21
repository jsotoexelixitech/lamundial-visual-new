import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { login, getCurrentUser } from '@/lib/nexus-auth';
import { MundialBrand, MUNDIAL_ISOTIPO } from '@/components/brand/MundialBrand';
import { publicAsset } from '@/lib/public-asset';
import { LoginLoadingOverlay } from '@/components/login/LoginLoadingOverlay';

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
    document.body.classList.add('portal-login-ib');
    document.body.classList.remove('portal-login-route', 'portal-login-organic');
    return () => document.body.classList.remove('portal-login-ib');
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
    <div className="login-ib min-h-screen" data-login-theme="ib-lab-v1" style={{ minHeight: '100dvh' }}>
      <LoginLoadingOverlay active={loading} stepIndex={loginStep} />

      <div className="login-ib-grid min-h-screen lg:grid lg:grid-cols-2">
        <section className="login-ib-dark relative flex flex-col justify-between px-8 py-10 sm:px-12 lg:px-16 lg:py-14">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <MundialBrand variant="light" isotipoClassName="h-10 w-10" subtitle="Portal corporativo" />
            <span className="login-ib-counter">01 / 02</span>
          </header>

          <div className="flex-1 flex flex-col justify-center py-12 lg:py-16 max-w-xl">
            <p className="login-ib-tag mb-8">
              <span className="login-ib-dot" aria-hidden />
              Suscripción digital
            </p>
            <h1 className="login-ib-hero mb-8">
              Emisión de
              <br />
              pólizas en minutos.
            </h1>
            <p className="login-ib-lead max-w-md">
              Un solo acceso para cotizar y emitir: RCV, planes de personas y seguros patrimoniales,
              con el canal comercial que La Mundial de Seguros asignó a tu equipo.
            </p>
          </div>

          <div className="flex items-end justify-between gap-6 pt-8 border-t border-[#4d5757]">
            <img
              src={publicAsset(MUNDIAL_ISOTIPO)}
              alt=""
              className="h-14 w-14 object-contain opacity-90"
              draggable={false}
            />
            <div className="login-ib-lime-band flex-1 max-w-xs h-2 rounded-full" aria-hidden />
          </div>
        </section>

        <section className="login-ib-light flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="login-ib-card w-full max-w-md">
            <p className="login-ib-tag login-ib-tag--dark mb-6">
              <span className="login-ib-dot" aria-hidden />
              Acceso corporativo
            </p>
            <h2 className="login-ib-card-title mb-2">Iniciar sesión</h2>
            <p className="login-ib-meta mb-10">Credenciales La Mundial de Seguros</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="login-email" className="login-ib-label">
                  Correo corporativo
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@lamundialdeseguros.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-ib-input w-full"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="login-password" className="login-ib-label">
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
                    className="login-ib-input w-full pr-12"
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
                <div className="flex gap-3 items-start rounded-lg border border-lichen bg-tissue px-4 py-3">
                  <AlertCircle size={18} className="text-mundial-red shrink-0 mt-0.5" />
                  <p className="text-sm text-abyssal-ink font-normal">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="login-ib-submit-combo w-full flex pt-2">
                <span className="login-ib-btn-primary flex-1">
                  {loading ? 'Conectando…' : 'Entrar al portal'}
                </span>
                <span className="login-ib-arrow shrink-0" aria-hidden>
                  <ArrowRight size={20} strokeWidth={1.75} />
                </span>
              </button>
            </form>

            <div className="login-ib-divider mt-10 mb-4" />
            <p className="login-ib-meta flex items-center gap-2">
              <Lock size={13} />
              Conexión cifrada · acceso auditado
            </p>
            <p className="login-ib-meta mt-6 text-center lg:text-left">
              ¿Problemas de acceso? Contacta a Tecnología La Mundial.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;

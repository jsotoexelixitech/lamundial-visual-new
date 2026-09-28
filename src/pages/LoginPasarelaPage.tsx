import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Lock, Building, KeyRound, UserCheck } from 'lucide-react';
import { login, getCurrentUser } from '@/lib/nexus-auth';
import { MundialBrand } from '@/components/brand/MundialBrand';
import { LoginBrandShowcase } from '@/components/login/LoginBrandShowcase';
import { LoginLoadingOverlay } from '@/components/login/LoginLoadingOverlay';
import { LoginAmbientLayer } from '@/components/login/LoginAmbientLayer';

const MIN_LOADING_MS = 2200;

const FLOAT_ICONS = [
  { Icon: Building, className: 'login-float-card login-float-1', label: 'Gestores' },
  { Icon: KeyRound, className: 'login-float-card login-float-2', label: 'Canal Alterno' },
  { Icon: UserCheck, className: 'login-float-card login-float-3', label: 'Sis2000' },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function waitMin(totalMs: number, started: number) {
  const remain = totalMs - (Date.now() - started);
  if (remain > 0) await sleep(remain);
}

export const LoginPasarelaPage: React.FC = () => {
  const navigate = useNavigate();
  const [gestorEmail, setGestorEmail] = useState('');
  const [canalCode, setCanalCode] = useState('');
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
    if (!gestorEmail.trim() || !password.trim()) {
      setError('Completa el correo del gestor y la contraseña.');
      return;
    }
    const started = Date.now();
    setLoading(true);
    setLoginStep(0);
    setError('');
    try {
      await sleep(400);
      // Autenticar gestor pasarela
      await login({ email: gestorEmail.trim(), password });
      setLoginStep(1);
      await sleep(500);
      setLoginStep(2);
      await waitMin(MIN_LOADING_MS, started);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Credenciales de pasarela incorrectas o gestor no activo.');
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
            <MundialBrand variant="light" isotipoClassName="h-11 w-11" subtitle="Pasarela de Gestores" />
            <span className="login-glass-chip inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400">
              <ShieldCheck size={12} className="login-icon-bounce" />
              Canal Pasarela
            </span>
          </header>

          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-fog-veil mb-4">
            Ingreso Gestores & Canales Alternos
          </p>
          <h1 className="login-headline-gradient text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold leading-[1.08] mb-5">
            Acceso Pasarela La Mundial
          </h1>
          <p className="text-fog-veil text-sm sm:text-base leading-relaxed max-w-md mx-auto lg:mx-0">
            Portal de acceso para gestores comerciales, intermediarios y canales alternos validados en Sys2000 (`magestor`).
          </p>

          <div className="mt-12 flex justify-center lg:justify-start">
            <LoginBrandShowcase variant="hero" theme="authkit" />
          </div>
        </section>

        <main className="w-full max-w-md login-form-enter">
          <div className="login-glass-modal rounded-2xl overflow-hidden">
            <div className="h-1 bg-amber-500/20 overflow-hidden">
              <div className="h-full login-idle-shimmer" />
            </div>
            <div className="px-8 pt-8 pb-2 sm:px-10 sm:pt-10">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-semibold text-ice-highlight">Ingreso Pasarela</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Gestor
                </span>
              </div>
              <p className="text-sm text-fog-veil mb-7">Credenciales de gestor registrado (`magestor` / Sys2000)</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="pasarela-email" className="login-label">
                    Correo del Gestor (`magestor.xcorreo`)
                  </label>
                  <input
                    id="pasarela-email"
                    type="email"
                    autoComplete="email"
                    placeholder="gestor@lamundialdeseguros.com"
                    value={gestorEmail}
                    onChange={(e) => setGestorEmail(e.target.value)}
                    className="login-glass-input w-full"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="pasarela-canal" className="login-label flex justify-between">
                    <span>Código de Canal Alterno / Gestor (Opcional)</span>
                    <span className="text-[10px] text-fog-veil font-normal">`ccanalalt`</span>
                  </label>
                  <input
                    id="pasarela-canal"
                    type="text"
                    placeholder="Ej: CANAL-01 o cgestor"
                    value={canalCode}
                    onChange={(e) => setCanalCode(e.target.value)}
                    className="login-glass-input w-full"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="pasarela-password" className="login-label">
                    Contraseña / PIN de Pasarela
                  </label>
                  <div className="relative">
                    <input
                      id="pasarela-password"
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

                <button type="submit" disabled={loading} className="login-cta-violet w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="login-btn-spinner" />
                      Validando en pasarela…
                    </span>
                  ) : (
                    <>
                      Entrar a Pasarela
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 border-t border-white/5 px-8 sm:px-10 py-4 flex items-center justify-between text-[11px] text-fog-veil">
              <span className="inline-flex items-center gap-2">
                <Lock size={13} className="text-amber-400" />
                Acceso gestores auditado
              </span>
              <Link to="/login" className="text-blueprint-blue hover:underline font-medium">
                Ir a Login Corporativo →
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-fog-veil">
            ¿Dudas sobre tu código de gestor? Consulta con Administración de Canales La Mundial.
          </p>
        </main>
      </div>
    </div>
  );
};

export default LoginPasarelaPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Lock, Building2 } from 'lucide-react';
import { login, getCurrentUser } from '@/lib/nexus-auth';
import { MundialBrand, MundialLockup, MUNDIAL_ISOTIPO } from '@/components/brand/MundialBrand';
import { publicAsset } from '@/lib/public-asset';

const VALUE_PROPS = [
  { icon: ShieldCheck, text: 'Acceso único (SSO) al ecosistema de suscripción' },
  { icon: Building2, text: 'Canal y productor Sis2000 configurados por flujo' },
  { icon: Lock, text: 'Sesión cifrada y trazabilidad de cada emisión' },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (getCurrentUser()) navigate('/dashboard', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Completa correo y contraseña.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login({ email: email.trim(), password });
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">
      {/* ── Panel institucional ─────────────────────────────── */}
      <aside
        className="relative lg:w-[46%] xl:w-[44%] flex flex-col justify-between px-8 py-10 sm:px-14 sm:py-14 text-white overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #091133 0%, #0F1A5A 52%, #162A7F 100%)' }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 55% 45% at 15% 20%, rgba(74,141,213,0.28), transparent 62%),
              radial-gradient(ellipse 50% 45% at 85% 78%, rgba(232,79,81,0.22), transparent 62%)
            `,
          }}
        />
        <img
          aria-hidden
          src={publicAsset(MUNDIAL_ISOTIPO)}
          alt=""
          className="absolute -right-24 -bottom-16 w-[28rem] max-w-none opacity-[0.07] select-none pointer-events-none"
          draggable={false}
        />

        <header className="relative z-10 flex items-center justify-between gap-4">
          <MundialBrand variant="light" isotipoClassName="h-12 w-12" subtitle="Portal corporativo" />
          <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
            <ShieldCheck size={13} />
            Nexus SSO
          </span>
        </header>

        <div className="relative z-10 my-12 lg:my-0 max-w-lg">
          <MundialLockup onDark className="w-52 sm:w-60 mb-10" />

          <p className="text-[#F0A9A9] text-[11px] font-black uppercase tracking-[0.3em] mb-4">
            Suscripción digital
          </p>
          <h1 className="font-display text-3xl sm:text-[2.6rem] font-bold leading-[1.15] mb-5">
            Emisión de pólizas
            <br />
            en minutos
          </h1>
          <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-9">
            Un solo acceso para los flujos RCV, Patrimoniales y Funerario, con el canal
            y las validaciones de La Mundial de Seguros.
          </p>

          <ul className="space-y-3.5">
            {VALUE_PROPS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-white/80">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 border border-white/15">
                  <Icon size={15} className="text-[#8FB8E8]" />
                </span>
                {text}
              </li>
            ))}
          </ul>

          <div
            className="mt-10 h-1 w-28 rounded-full"
            style={{ background: 'linear-gradient(90deg, #4A8DD5, #2E6DBF 45%, #E84F51)' }}
          />
        </div>

        <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 text-white/45 text-[11px]">
          <span>© {new Date().getFullYear()} La Mundial de Seguros · C.A.</span>
          <span className="flex items-center gap-2">
            Tecnología
            <img
              src={publicAsset('logo-white.png')}
              alt="Exélixi Technology"
              className="h-4 w-auto opacity-70"
              draggable={false}
            />
          </span>
        </footer>
      </aside>

      {/* ── Formulario ─────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10 bg-[#F7F7F7]">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden mb-8 flex justify-center">
            <MundialLockup className="w-40" />
          </div>

          <div className="bg-white rounded-2xl border border-[#e4e6ee] shadow-[0_18px_50px_rgba(9,17,51,0.10)] overflow-hidden">
            <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #0F1A5A, #2E6DBF 55%, #E84F51)' }} />

            <div className="p-8 sm:p-10">
              <h2 className="text-[1.6rem] font-display font-bold text-[#091133] mb-1.5">Iniciar sesión</h2>
              <p className="text-sm text-[#777777] mb-8">
                Ingresa con tu usuario corporativo de Nexus.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#0F1A5A] mb-2">
                    Correo corporativo
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="nombre@lamundialdeseguros.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-[#FAFBFD] text-[#091133] text-sm placeholder:text-[#B9BECD] outline-none focus:border-[#0F1A5A] focus:bg-white focus:ring-2 focus:ring-[#0F1A5A]/12 transition-all"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#0F1A5A] mb-2">
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
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-[#dddddd] bg-[#FAFBFD] text-[#091133] text-sm placeholder:text-[#B9BECD] outline-none focus:border-[#0F1A5A] focus:bg-white focus:ring-2 focus:ring-[#0F1A5A]/12 transition-all"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9AA1B4] hover:text-[#091133] transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex gap-3 items-start rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle size={18} className="text-[#E84F51] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#991B1B] font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_10px_24px_-10px_rgba(232,79,81,0.7)] transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #E84F51 0%, #B23F44 100%)' }}
                >
                  {loading ? 'Verificando…' : (
                    <>
                      Entrar al portal
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="border-t border-[#eceef4] bg-[#FAFBFD] px-8 sm:px-10 py-4 flex items-center gap-2 text-[11px] text-[#8A90A2]">
              <Lock size={13} className="text-[#0F1A5A]" />
              Conexión cifrada · acceso auditado en bitácora
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[#ACACAC]">
            ¿Problemas de acceso? Contacta a Tecnología La Mundial.
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

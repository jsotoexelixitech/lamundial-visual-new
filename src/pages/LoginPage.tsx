import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { login, getCurrentUser } from '@/lib/nexus-auth';
import { MundialBrand } from '@/components/brand/MundialBrand';

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
      {/* Panel marca — manual La Mundial */}
      <aside
        className="relative lg:w-[44%] xl:w-[42%] flex flex-col justify-between p-8 sm:p-12 text-white overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #091133 0%, #0F1A5A 48%, #162A7F 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(232,79,81,0.35), transparent 45%),
              radial-gradient(circle at 80% 70%, rgba(74,141,213,0.25), transparent 50%)
            `,
          }}
        />
        <div className="relative z-10">
          <MundialBrand variant="light" isotipoClassName="h-16 w-16" />
        </div>

        <div className="relative z-10 my-12 lg:my-0 max-w-md">
          <p className="text-[#E84F51] text-xs font-black uppercase tracking-[0.28em] mb-4">
            Suscripción digital
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-snug mb-4">
            Emisión de pólizas en minutos
          </h1>
          <p className="text-white/75 text-sm sm:text-base leading-relaxed">
            Accede a los flujos RCV, Patrimoniales y Funerario con la misma seguridad
            y canal configurado para La Mundial de Seguros.
          </p>
          <div
            className="mt-8 h-1 w-24 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #0F1A5A, #2E6DBF 55%, #E84F51)',
            }}
          />
        </div>

        <p className="relative z-10 text-white/40 text-xs">
          © {new Date().getFullYear()} La Mundial de Seguros
        </p>
      </aside>

      {/* Formulario */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[#F7F7F7]">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden mb-8 flex justify-center">
            <MundialBrand variant="dark" isotipoClassName="h-14 w-14" />
          </div>

          <div className="bg-white rounded-2xl border border-[#dddddd] shadow-[0_12px_40px_rgba(9,17,51,0.08)] p-8 sm:p-10">
            <h2 className="text-2xl font-bold text-[#091133] mb-1">Iniciar sesión</h2>
            <p className="text-sm text-[#777777] mb-8">
              Usa tu usuario de Nexus / operaciones La Mundial.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-[#0F1A5A] mb-2">
                  Correo
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#dddddd] bg-[#FAFAFA] text-[#091133] text-sm outline-none focus:border-[#0F1A5A] focus:ring-2 focus:ring-[#0F1A5A]/15 transition-all"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-[#0F1A5A] mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-[#dddddd] bg-[#FAFAFA] text-[#091133] text-sm outline-none focus:border-[#0F1A5A] focus:ring-2 focus:ring-[#0F1A5A]/15 transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#777777] hover:text-[#091133]"
                    tabIndex={-1}
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
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
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
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

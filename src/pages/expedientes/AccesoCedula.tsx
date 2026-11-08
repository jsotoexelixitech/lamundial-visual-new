import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  isExpedientesError,
  solicitarCodigoAcceso,
  TIPOS_DOCUMENTO_ACCESO,
  verificarCodigoAcceso,
  type TipoDocumentoAcceso,
} from '@/lib/expedientes-api';

type Paso =
  | { tipo: 'documento' }
  | { tipo: 'codigo'; mensaje: string; vigenciaMinutos: number; reenvioSegundos: number };

function mensajeDe(err: unknown): string {
  if (isExpedientesError(err)) {
    if (err.kind === 'red') return 'No hay conexión. Revise su conexión a internet e intente de nuevo.';
    if (err.kind === 'apagado') return 'Por ahora no podemos atenderle por aquí. Intente de nuevo más tarde.';
    if (err.kind === 'validacion' && err.message) return err.message;
  }
  return 'No pudimos completar la solicitud. Intente de nuevo en unos minutos.';
}

function mmss(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Ingreso del asegurado sin el enlace del correo: documento de identidad y luego un código de
 * 6 dígitos que llega al correo registrado en su póliza. La cédula sola no muestra nada: la
 * respuesta es la misma existan o no pólizas. Al validar, `onAcceso` recibe el token del
 * enlace temporal y la página muestra el expediente como con el enlace del correo.
 */
export function AccesoCedula({ onAcceso }: { onAcceso: (token: string) => void }) {
  const [paso, setPaso] = useState<Paso>({ tipo: 'documento' });
  const [tipoDoc, setTipoDoc] = useState<TipoDocumentoAcceso>('V');
  const [documento, setDocumento] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [espera, setEspera] = useState(0);
  const codigoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (espera <= 0) return;
    const id = window.setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [espera]);

  useEffect(() => {
    if (paso.tipo === 'codigo') codigoRef.current?.focus();
  }, [paso.tipo]);

  const docLimpio = documento.replace(/\D/g, '');
  const docValido = /^\d{5,12}$/.test(docLimpio);

  const pedirCodigo = async (reenvio = false) => {
    if (!docValido) {
      setError('Indique su número de documento, solo números (entre 5 y 12 dígitos).');
      return;
    }
    setEnviando(true);
    setError(null);
    setAviso(null);
    try {
      const r = await solicitarCodigoAcceso(tipoDoc, docLimpio);
      setPaso({ tipo: 'codigo', ...r });
      setEspera(r.reenvioSegundos);
      setCodigo('');
      if (reenvio) setAviso('Le enviamos un código nuevo. El anterior ya no sirve.');
    } catch (err) {
      setError(mensajeDe(err));
    } finally {
      setEnviando(false);
    }
  };

  const validar = async () => {
    if (!/^\d{6}$/.test(codigo)) {
      setError('El código tiene 6 dígitos.');
      return;
    }
    setEnviando(true);
    setError(null);
    setAviso(null);
    try {
      const r = await verificarCodigoAcceso(tipoDoc, docLimpio, codigo);
      onAcceso(r.token);
    } catch (err) {
      setError(mensajeDe(err));
      setCodigo('');
      codigoRef.current?.focus();
    } finally {
      setEnviando(false);
    }
  };

  if (paso.tipo === 'documento') {
    return (
      <form
        className="mxp-acceso mxp-entra"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void pedirCodigo();
        }}
      >
        <span className="mxp-error-icono" aria-hidden>
          <ShieldCheck size={30} />
        </span>
        <h1 className="mxp-error-titulo">Ingrese con su cédula</h1>
        <p className="mxp-error-texto">
          Por su seguridad, le enviaremos un código de verificación al correo registrado en su póliza.
        </p>

        <div className="mxp-acceso-campos">
          <label className="mx-field mxp-acceso-tipo">
            <span>Tipo</span>
            <select
              className="mx-input mxp-acceso-input"
              value={tipoDoc}
              onChange={(e) => setTipoDoc(e.target.value as TipoDocumentoAcceso)}
              aria-label="Tipo de documento"
            >
              {TIPOS_DOCUMENTO_ACCESO.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
          </label>
          <label className="mx-field mxp-acceso-num">
            <span>Número de documento</span>
            <input
              className="mx-input mxp-acceso-input"
              inputMode="numeric"
              autoComplete="off"
              maxLength={15}
              placeholder="Ej.: 12345678"
              value={documento}
              aria-invalid={!!error && !docValido}
              onChange={(e) => {
                setDocumento(e.target.value.replace(/[^\d.\s-]/g, ''));
                setError(null);
              }}
            />
          </label>
        </div>

        {error && (
          <p className="mxp-acceso-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="mx-btn mx-btn--primary mxp-btn-grande mxp-acceso-btn" disabled={enviando}>
          {enviando ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Mail size={16} aria-hidden />}
          Enviar código
        </button>
        <p className="mxp-acceso-nota">
          Si tiene el enlace que le enviamos por correo, también puede abrirlo directamente.
        </p>
      </form>
    );
  }

  return (
    <form
      className="mxp-acceso mxp-entra"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void validar();
      }}
    >
      <span className="mxp-error-icono" aria-hidden>
        <Mail size={30} />
      </span>
      <h1 className="mxp-error-titulo">Revise su correo</h1>
      <p className="mxp-error-texto">{paso.mensaje}</p>
      <p className="mxp-error-texto">
        El código vence en {paso.vigenciaMinutos} minutos. Si no lo ve, revise la carpeta de correo no deseado.
      </p>

      <label className="mx-field mxp-acceso-codigo">
        <span>Código de verificación</span>
        <input
          ref={codigoRef}
          className="mx-input mxp-acceso-input mxp-acceso-otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          value={codigo}
          aria-invalid={!!error}
          onChange={(e) => {
            setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6));
            setError(null);
          }}
        />
      </label>

      {error && (
        <p className="mxp-acceso-error" role="alert">
          {error}
        </p>
      )}
      {aviso && !error && (
        <p className="mxp-acceso-aviso" role="status">
          {aviso}
        </p>
      )}

      <button
        type="submit"
        className="mx-btn mx-btn--primary mxp-btn-grande mxp-acceso-btn"
        disabled={enviando || codigo.length !== 6}
      >
        {enviando ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <ShieldCheck size={16} aria-hidden />}
        Validar código
      </button>

      <div className="mxp-acceso-acciones">
        <button
          type="button"
          className="mx-btn mx-btn--ghost mxp-acceso-sec"
          disabled={enviando || espera > 0}
          onClick={() => void pedirCodigo(true)}
        >
          <RefreshCw size={15} aria-hidden />
          {espera > 0 ? `Reenviar código en ${mmss(espera)}` : 'Reenviar código'}
        </button>
        <button
          type="button"
          className="mx-btn mx-btn--ghost mxp-acceso-sec"
          disabled={enviando}
          onClick={() => {
            setPaso({ tipo: 'documento' });
            setCodigo('');
            setError(null);
            setAviso(null);
          }}
        >
          <ArrowLeft size={15} aria-hidden />
          Cambiar documento
        </button>
      </div>
    </form>
  );
}

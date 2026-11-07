import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileUp,
  Hourglass,
  Link2Off,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { MundialBrand } from '@/components/brand/MundialBrand';
import {
  ACCEPT_ARCHIVOS,
  MAX_ARCHIVO_MB,
  isExpedientesError,
  obtenerExpedientePublico,
  subirDocumentoPublico,
  validarArchivo,
  type ExpedientePublico,
  type ExpedientesErrorKind,
  type Requisito,
} from '@/lib/expedientes-api';
import { etiquetaRequisito } from './expedientes/expedientes-format';
import './expedientes/expedientes.css';

type EstadoPagina =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; data: ExpedientePublico }
  | { tipo: 'error'; kind: ExpedientesErrorKind };

/**
 * Página pública del asegurado: /expediente?t=<token>
 * Solo muestra documentos pendientes y recibidos de su póliza y permite subirlos.
 * No usa la sesión del portal ni muestra datos de terceros.
 */
export const ExpedientePublicoPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = (params.get('t') ?? '').trim();
  const [estado, setEstado] = useState<EstadoPagina>(() =>
    token ? { tipo: 'cargando' } : { tipo: 'error', kind: 'enlace_invalido' },
  );

  useEffect(() => {
    const anterior = document.title;
    document.title = 'Completa tu expediente | La Mundial de Seguros';
    return () => {
      document.title = anterior;
    };
  }, []);

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!token) {
        setEstado({ tipo: 'error', kind: 'enlace_invalido' });
        return;
      }
      if (!silencioso) setEstado({ tipo: 'cargando' });
      try {
        const data = await obtenerExpedientePublico(token);
        setEstado({ tipo: 'listo', data });
      } catch (err) {
        setEstado({ tipo: 'error', kind: isExpedientesError(err) ? err.kind : 'servidor' });
      }
    },
    [token],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <div className="mx-pub">
      <div className="max-w-[38rem] mx-auto">
        <MundialBrand subtitle="Tu póliza" isotipoClassName="h-10 w-10" />
      </div>

      <main className="mx-pub-card" aria-live="polite">
        {estado.tipo === 'cargando' && (
          <div className="mx-estado">
            <Loader2 size={28} className="animate-spin text-[#2E6DBF]" aria-hidden />
            <p>Estamos buscando tu expediente…</p>
          </div>
        )}
        {estado.tipo === 'error' && (
          <PantallaError kind={estado.kind} onReintentar={() => void cargar()} />
        )}
        {estado.tipo === 'listo' && (
          <Expediente
            token={token}
            data={estado.data}
            onSubido={() => cargar(true)}
            onEnlaceCaido={(kind) => setEstado({ tipo: 'error', kind })}
          />
        )}
      </main>

      <p className="max-w-[38rem] mx-auto mt-5 text-center text-xs text-[#5E6275]">
        ¿Tienes dudas? Comunícate con tu asesor de La Mundial de Seguros.
      </p>
    </div>
  );
};

function PantallaError({
  kind,
  onReintentar,
}: {
  kind: ExpedientesErrorKind;
  onReintentar: () => void;
}) {
  let titulo = 'No pudimos abrir tu expediente';
  let texto = 'Intenta de nuevo en unos minutos.';
  let Icon = AlertCircle;
  let reintentar = true;

  if (kind === 'enlace_vencido') {
    titulo = 'Este enlace ya venció';
    texto =
      'Por tu seguridad, los enlaces duran pocos días. Pide uno nuevo a tu asesor de La Mundial de Seguros.';
    Icon = Clock;
    reintentar = false;
  } else if (kind === 'enlace_invalido' || kind === 'no_encontrado' || kind === 'permiso' || kind === 'sesion') {
    titulo = 'Este enlace no es válido';
    texto =
      'Revisa que lo hayas abierto completo desde el correo que te enviamos. Si el problema sigue, pide uno nuevo a tu asesor.';
    Icon = Link2Off;
    reintentar = false;
  } else if (kind === 'apagado') {
    titulo = 'Por ahora no podemos recibir documentos por aquí';
    texto = 'Intenta de nuevo más tarde. Disculpa las molestias.';
  } else if (kind === 'red') {
    titulo = 'No hay conexión';
    texto = 'Revisa tu conexión a internet e intenta de nuevo.';
  }

  return (
    <div className="mx-estado" role="alert">
      <Icon size={32} className="text-[#0F1A5A]" aria-hidden />
      <p className="mx-estado-titulo text-base">{titulo}</p>
      <p className="max-w-[28rem]">{texto}</p>
      {reintentar && (
        <button type="button" className="mx-btn mx-btn--ghost mt-2" onClick={onReintentar}>
          <RefreshCw size={15} aria-hidden />
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

function Expediente({
  token,
  data,
  onSubido,
  onEnlaceCaido,
}: {
  token: string;
  data: ExpedientePublico;
  onSubido: () => Promise<void>;
  onEnlaceCaido: (kind: ExpedientesErrorKind) => void;
}) {
  const [aviso, setAviso] = useState('');
  const pendientes = data.requisitos.filter((r) => r.estado === 'faltante' || r.estado === 'observado');
  const recibidos = data.requisitos.filter((r) => r.estado === 'recibido' || r.estado === 'validado');
  const primerNombre = (data.nombre ?? '').trim().split(/\s+/)[0] ?? '';

  const trasSubir = async (nombreDoc: string) => {
    await onSubido();
    const doc =
      nombreDoc === nombreDoc.toUpperCase()
        ? nombreDoc
        : nombreDoc.charAt(0).toLowerCase() + nombreDoc.slice(1);
    setAviso(`Recibimos tu ${doc}. ¡Gracias!`);
  };

  return (
    <>
      <div className="mx-pub-head">
        <p className="mx-pub-hola">{primerNombre ? `Hola, ${primerNombre}` : 'Hola'}</p>
        {aviso && (
          <div className="mx-aviso mx-aviso--ok mt-3" role="status">
            <CheckCircle2 size={18} aria-hidden className="shrink-0 mt-0.5" />
            <p>{aviso}</p>
          </div>
        )}
        {pendientes.length > 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-[#3c4260]">
            Tu póliza{data.poliza ? ` ${data.poliza}` : ''} ya está emitida. Para completar tu
            expediente solo nos falta{pendientes.length === 1 ? ' este documento' : 'n estos documentos'}.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-[#3c4260]">
            Tu póliza{data.poliza ? ` ${data.poliza}` : ''} ya está emitida.
          </p>
        )}
      </div>

      {pendientes.length === 0 ? (
        <div className="mx-estado">
          <CheckCircle2 size={34} className="text-[#146C43]" aria-hidden />
          <p className="mx-estado-titulo text-base">¡Gracias! Ya tenemos tus documentos</p>
          <p className="max-w-[26rem]">
            No tienes nada pendiente. Si necesitamos algo más, te escribiremos.
          </p>
        </div>
      ) : (
        <>
          <p className="px-5 pt-4 text-xs text-[#5E6275] leading-relaxed">
            Toma una foto clara, con buena luz y sin reflejos, o sube un PDF. Formatos: JPG, PNG,
            HEIC o PDF, hasta {MAX_ARCHIVO_MB} MB.
          </p>
          <ul className="mt-2">
            {pendientes.map((r) => (
              <DocumentoPendiente
                key={r.tipo}
                token={token}
                req={r}
                onSubido={() => trasSubir(etiquetaRequisito(r.tipo))}
                onEnlaceCaido={onEnlaceCaido}
              />
            ))}
          </ul>
        </>
      )}

      {recibidos.length > 0 && (
        <div className="border-t border-[#eceef4]">
          <p className="px-5 pt-4 text-xs font-semibold text-[#5E6275]">Ya recibimos</p>
          <ul>
            {recibidos.map((r) => (
              <li key={r.tipo} className="mx-pub-doc">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{etiquetaRequisito(r.tipo)}</span>
                  <span className="mx-req mx-req--recibido">
                    <Hourglass size={12} aria-hidden />
                    Recibido
                  </span>
                </div>
                <p className="text-xs text-[#5E6275]">
                  Lo estamos revisando. No tienes que hacer nada más con este documento.
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function DocumentoPendiente({
  token,
  req,
  onSubido,
  onEnlaceCaido,
}: {
  token: string;
  req: Requisito;
  onSubido: () => Promise<void>;
  onEnlaceCaido: (kind: ExpedientesErrorKind) => void;
}) {
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const nombre = etiquetaRequisito(req.tipo);
  const subiendo = pct !== null;

  const subir = async (file: File | undefined) => {
    if (!file) return;
    const problema = validarArchivo(file);
    if (problema) {
      setError(problema);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setError('');
    setPct(0);
    try {
      await subirDocumentoPublico(token, req.tipo, file, setPct);
      void onSubido();
    } catch (err) {
      const kind = isExpedientesError(err) ? err.kind : 'servidor';
      if (kind === 'enlace_vencido' || kind === 'enlace_invalido') {
        onEnlaceCaido(kind);
        return;
      }
      setError(
        kind === 'archivo_grande'
          ? `El archivo pesa más de ${MAX_ARCHIVO_MB} MB. Intenta con una foto o un PDF más liviano.`
          : kind === 'validacion'
            ? 'No pudimos recibir este archivo. Revisa que sea JPG, PNG, HEIC o PDF y que se vea completo.'
            : kind === 'red'
              ? 'Se perdió la conexión. Intenta de nuevo.'
              : 'No pudimos recibir el archivo. Intenta de nuevo en unos minutos.',
      );
    } finally {
      setPct(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <li className="mx-pub-doc">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">{nombre}</span>
        {req.estado === 'observado' ? (
          <span className="mx-req mx-req--observado">
            <AlertCircle size={12} aria-hidden />
            Envíalo de nuevo
          </span>
        ) : (
          <span className="mx-req mx-req--faltante">Pendiente</span>
        )}
      </div>
      {req.estado === 'observado' && (
        <p className="text-xs text-[#5E6275]">
          No pudimos revisar bien el que nos enviaste. Por favor, envía una imagen nueva donde se lea
          todo el documento.
        </p>
      )}

      <label className="mx-pub-upload" aria-disabled={subiendo}>
        {subiendo ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <FileUp size={18} aria-hidden />}
        {subiendo ? `Enviando… ${pct} %` : 'Subir foto o PDF'}
        <input
          ref={inputRef}
          type="file"
          className="mx-file-input"
          accept={ACCEPT_ARCHIVOS}
          disabled={subiendo}
          aria-label={`Subir ${nombre}`}
          onChange={(e) => void subir(e.target.files?.[0])}
        />
      </label>

      {subiendo && (
        <div className="mx-progreso" aria-hidden>
          <div style={{ width: `${pct}%` }} />
        </div>
      )}
      {error && (
        <p className="text-xs text-[#8F2A2D]" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

export default ExpedientePublicoPage;

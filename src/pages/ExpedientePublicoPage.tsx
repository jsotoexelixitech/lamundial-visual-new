import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  Hourglass,
  Lightbulb,
  Link2Off,
  Loader2,
  RefreshCw,
  RotateCcw,
  WifiOff,
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
import {
  etiquetaRequisito,
  motivoParaAsegurado,
  polizaEnmascarada,
} from './expedientes/expedientes-format';
import './expedientes/expedientes.css';

/** Tras subir un archivo, la IA lo revisa: se vuelve a consultar en silencio para mostrar el resultado. */
const SONDEOS_MS = [6_000, 15_000, 30_000, 60_000];

/** Resultado de la IA que obliga a cargar el documento de nuevo. */
function hayQueRepetir(r: Requisito): boolean {
  const res = r.diagnostico?.resultado;
  return r.estado !== 'validado' && (res === 'no_coincide' || res === 'ilegible');
}

type EstadoPagina =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; data: ExpedientePublico }
  | { tipo: 'error'; kind: ExpedientesErrorKind };

/**
 * Página pública del asegurado: /expediente?t=<token>
 * Solo muestra documentos pendientes y recibidos de su póliza y permite subirlos.
 * No usa la sesión del portal ni muestra datos de terceros.
 * Pensada primero para el móvil: una tarjeta por documento con un botón grande para subirlo
 * (el teléfono ofrece cámara o archivo; no se fuerza la cámara).
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

  // Consulta silenciosa: si falla, se deja la pantalla como está.
  const sondeos = useRef<number[]>([]);
  const limpiarSondeos = () => {
    sondeos.current.forEach((t) => window.clearTimeout(t));
    sondeos.current = [];
  };
  useEffect(() => limpiarSondeos, []);
  const sondear = useCallback(() => {
    limpiarSondeos();
    sondeos.current = SONDEOS_MS.map((ms) =>
      window.setTimeout(() => {
        obtenerExpedientePublico(token)
          .then((data) => setEstado({ tipo: 'listo', data }))
          .catch(() => undefined);
      }, ms),
    );
  }, [token]);

  return (
    <div className="mx-pub">
      <div className="mx-pub-wrap">
        <MundialBrand subtitle="Tu póliza" isotipoClassName="h-10 w-10" />

        <main className="mx-pub-card" aria-live="polite">
          {estado.tipo === 'cargando' && <CargandoPublico />}
          {estado.tipo === 'error' && (
            <PantallaError kind={estado.kind} onReintentar={() => void cargar()} />
          )}
          {estado.tipo === 'listo' && (
            <Expediente
              token={token}
              data={estado.data}
              onSubido={async () => {
                await cargar(true);
                sondear();
              }}
              onEnlaceCaido={(kind) => setEstado({ tipo: 'error', kind })}
            />
          )}
        </main>

        <p className="mx-pub-pie">¿Tienes dudas? Comunícate con tu asesor de seguros.</p>
      </div>
    </div>
  );
};

function CargandoPublico() {
  return (
    <div role="status" aria-live="polite">
      <div className="mx-pub-head">
        <p className="flex items-center gap-2 text-sm text-[#5E6275]">
          <Loader2 size={18} className="animate-spin text-[#2E6DBF]" aria-hidden />
          Estamos buscando tu expediente…
        </p>
      </div>
      <div className="mx-pub-lista" aria-hidden>
        {[0, 1].map((i) => (
          <div key={i} className="mx-esqueleto-fila">
            <span className="mx-esqueleto-linea" style={{ width: '45%' }} />
            <span className="mx-esqueleto-linea" style={{ width: '80%' }} />
            <span className="mx-esqueleto-linea" style={{ height: '2.75rem', borderRadius: '0.9rem' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

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
      'Por tu seguridad, los enlaces duran pocos días. Pide uno nuevo a tu asesor de seguros.';
    Icon = Clock;
    reintentar = false;
  } else if (kind === 'enlace_invalido' || kind === 'no_encontrado' || kind === 'permiso' || kind === 'sesion') {
    titulo = 'Este enlace no es válido';
    texto =
      'Revisa que lo hayas abierto completo desde el correo que te enviamos. Si el problema sigue, pide uno nuevo a tu asesor de seguros.';
    Icon = Link2Off;
    reintentar = false;
  } else if (kind === 'apagado') {
    titulo = 'Por ahora no podemos recibir documentos por aquí';
    texto = 'Intenta de nuevo más tarde. Disculpa las molestias.';
  } else if (kind === 'red') {
    titulo = 'No hay conexión';
    texto = 'Revisa tu conexión a internet e intenta de nuevo.';
    Icon = WifiOff;
  }

  return (
    <div className="mx-estado" role="alert">
      <span className="mx-estado-icono" aria-hidden>
        <Icon size={28} />
      </span>
      <p className="mx-estado-titulo text-base">{titulo}</p>
      <p className="max-w-[28rem] text-sm leading-relaxed">{texto}</p>
      {reintentar && (
        <button type="button" className="mx-btn mx-btn--primary mt-2 min-h-[2.75rem]" onClick={onReintentar}>
          <RefreshCw size={16} aria-hidden />
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
  const avisoRef = useRef<HTMLDivElement>(null);
  const pendientes = data.requisitos.filter(
    (r) => r.estado === 'faltante' || r.estado === 'observado' || hayQueRepetir(r),
  );
  const recibidos = data.requisitos.filter(
    (r) => (r.estado === 'recibido' || r.estado === 'validado') && !hayQueRepetir(r),
  );
  const primerNombre = (data.nombre ?? '').trim().split(/\s+/)[0] ?? '';
  const poliza = polizaEnmascarada(data.poliza);

  // En el móvil la confirmación queda arriba: se lleva a la vista al aparecer.
  useEffect(() => {
    if (aviso) avisoRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [aviso]);

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
        {poliza && (
          <p className="mx-pub-poliza">
            <FileText size={13} aria-hidden />
            Póliza {poliza}
          </p>
        )}
        <p className="mx-pub-texto">
          {pendientes.length > 0
            ? `Tu póliza ya está emitida. Para completar tu expediente solo nos falta${
                pendientes.length === 1 ? ' este documento' : 'n estos documentos'
              }.`
            : 'Tu póliza ya está emitida.'}
        </p>
        {aviso && (
          <div ref={avisoRef} className="mx-aviso mx-aviso--ok mt-3" role="status">
            <CheckCircle2 size={18} aria-hidden className="shrink-0 mt-0.5" />
            <p className="font-semibold">{aviso}</p>
          </div>
        )}
      </div>

      {pendientes.length === 0 ? (
        <div className="mx-pub-gracias">
          <span className="mx-estado-icono" aria-hidden>
            <CheckCircle2 size={30} />
          </span>
          <p className="mx-estado-titulo text-base">¡Gracias! Ya tenemos tus documentos</p>
          <p className="max-w-[26rem] text-sm leading-relaxed">
            No tienes nada pendiente. Si necesitamos algo más, te escribiremos.
          </p>
        </div>
      ) : (
        <>
          <div className="mx-pub-tip">
            <Lightbulb size={18} aria-hidden className="shrink-0 mt-0.5" />
            <p>
              Toma una foto clara, con buena luz y sin reflejos, o sube un PDF. Formatos: JPG, PNG,
              HEIC o PDF, hasta {MAX_ARCHIVO_MB} MB.
            </p>
          </div>
          <h2 className="mx-pub-seccion">Pendientes ({pendientes.length})</h2>
          <ul className="mx-pub-lista">
            {pendientes.map((r) => (
              <DocumentoPendiente
                key={r.tipo}
                token={token}
                req={r}
                producto={r.producto ?? data.producto}
                onSubido={() => trasSubir(etiquetaRequisito(r.tipo, r.producto ?? data.producto))}
                onEnlaceCaido={onEnlaceCaido}
              />
            ))}
          </ul>
        </>
      )}

      {recibidos.length > 0 && (
        <div className="border-t border-[#eceef4]">
          <h2 className="mx-pub-seccion">Ya recibimos ({recibidos.length})</h2>
          <ul className="mx-pub-lista">
            {recibidos.map((r) => {
              const aprobado = r.estado === 'validado';
              return (
                <li key={r.tipo} className={`mx-pub-doc ${aprobado ? 'mx-tono--verde' : 'mx-tono--azul'}`}>
                  <div className="mx-pub-doc-head">
                    <span className="mx-pub-doc-nombre">
                      <span className="mx-pub-doc-icono" aria-hidden>
                        <FileText size={18} />
                      </span>
                      {etiquetaRequisito(r.tipo, r.producto ?? data.producto)}
                    </span>
                    {aprobado ? (
                      <span className="mx-req mx-req--validado">
                        <CheckCircle2 size={13} aria-hidden />
                        Aprobado
                      </span>
                    ) : (
                      <span className="mx-req mx-req--recibido">
                        <Hourglass size={13} aria-hidden />
                        Recibido
                      </span>
                    )}
                  </div>
                  <p className="mx-pub-nota">
                    {aprobado
                      ? 'Revisado. No tienes que hacer nada más con este documento.'
                      : 'Lo estamos revisando. No tienes que hacer nada más con este documento.'}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

function DocumentoPendiente({
  token,
  req,
  producto,
  onSubido,
  onEnlaceCaido,
}: {
  token: string;
  req: Requisito;
  producto: string | null;
  onSubido: () => Promise<void>;
  onEnlaceCaido: (kind: ExpedientesErrorKind) => void;
}) {
  const [pct, setPct] = useState<number | null>(null);
  const [archivo, setArchivo] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const nombre = etiquetaRequisito(req.tipo, producto);
  const subiendo = pct !== null;
  // v1.3: datos cambiados en el formulario = el documento está bien, se revisa la póliza.
  const enRevision = req.estado !== 'validado' && req.diagnostico?.resultado === 'datos_modificados';
  const repetir = !enRevision && (req.estado === 'observado' || hayQueRepetir(req));
  // Motivo simple, sin datos de la póliza: nunca el resumen de la IA ni el motivo interno.
  const motivoSimple = motivoParaAsegurado(req.tipo, producto, req.diagnostico?.resultado);
  const tono = enRevision ? 'ambar' : repetir ? 'rojo' : 'gris';

  const subir = async (file: File | undefined) => {
    if (!file) return;
    const problema = validarArchivo(file);
    if (problema) {
      setError(problema);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setError('');
    setArchivo(file.name);
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
    <li className={`mx-pub-doc mx-tono--${tono}`}>
      <div className="mx-pub-doc-head">
        <span className="mx-pub-doc-nombre">
          <span className="mx-pub-doc-icono" aria-hidden>
            <FileText size={18} />
          </span>
          {nombre}
        </span>
        {enRevision ? (
          <span className="mx-req mx-req--revisar">
            <Hourglass size={13} aria-hidden />
            En revisión
          </span>
        ) : repetir ? (
          <span className="mx-req mx-req--errado">
            <AlertCircle size={13} aria-hidden />
            Envíalo de nuevo
          </span>
        ) : (
          <span className="mx-req mx-req--faltante">Pendiente</span>
        )}
      </div>
      {enRevision && motivoSimple && <p className="mx-pub-nota">{motivoSimple}</p>}
      {repetir && (
        <p className={`mx-pub-nota ${motivoSimple ? 'mx-pub-nota--alerta' : ''}`}>
          {motivoSimple ??
            'No pudimos revisar bien el que nos enviaste. Por favor, envía una imagen nueva donde se lea todo el documento.'}
        </p>
      )}

      {/* Sin `capture`: el teléfono deja elegir entre la cámara y un archivo. */}
      <label className="mx-pub-upload" aria-disabled={subiendo}>
        {subiendo ? (
          <Loader2 size={20} className="animate-spin" aria-hidden />
        ) : repetir ? (
          <RotateCcw size={20} aria-hidden />
        ) : (
          <Camera size={20} aria-hidden />
        )}
        {subiendo ? `Enviando… ${pct} %` : repetir ? 'Subir de nuevo' : 'Subir foto o PDF'}
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
      {!subiendo && <p className="mx-pub-ayuda">Puedes tomar la foto en este momento o elegir un archivo.</p>}

      {subiendo && (
        <div className="mx-pub-progreso">
          <div
            className="mx-progreso"
            role="progressbar"
            aria-valuenow={pct ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Enviando ${nombre}`}
          >
            <div style={{ width: `${pct}%` }} />
          </div>
          {archivo && <span className="truncate">{archivo}</span>}
        </div>
      )}
      {error && (
        <p className="mx-aviso mx-aviso--error" role="alert">
          <AlertCircle size={16} aria-hidden className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}
    </li>
  );
}

export default ExpedientePublicoPage;

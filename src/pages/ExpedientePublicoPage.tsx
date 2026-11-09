import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Hourglass,
  KeyRound,
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
import { AccesoCedula } from './expedientes/AccesoCedula';
import './expedientes/expedientes.css';
import './expedientes/expediente-publico.css';

/** Tras subir un archivo, la IA lo revisa: se vuelve a consultar en silencio para mostrar el resultado. */
const SONDEOS_MS = [6_000, 15_000, 30_000, 60_000];
/** Cuánto dura resaltada la tarjeta del documento recién recibido. */
const RESALTE_MS = 6_000;

/** Resultado de la IA que obliga a cargar el documento de nuevo. */
function hayQueRepetir(r: Requisito): boolean {
  const res = r.diagnostico?.resultado;
  return r.estado !== 'validado' && (res === 'no_coincide' || res === 'ilegible');
}

/** «JOSE» o «jose» → «Jose». No agrega ni quita tildes: respeta lo que llega. */
function nombrePropio(nombre: string): string {
  return nombre
    .toLocaleLowerCase('es')
    .replace(/(^|[\s'-])(\p{L})/gu, (_, sep: string, letra: string) => sep + letra.toLocaleUpperCase('es'));
}

/** Los mensajes de validación del archivo, en trato de usted. */
function problemaDeArchivo(file: File): string | null {
  const problema = validarArchivo(file);
  if (!problema) return null;
  if (file.size === 0) return 'El archivo está vacío. Intente con otro.';
  if (/formato/i.test(problema)) return 'Formato no admitido. Use una foto JPG, PNG o HEIC, o un PDF.';
  if (/pesa más/i.test(problema)) {
    return `El archivo pesa más de ${MAX_ARCHIVO_MB} MB. Intente con una foto o un PDF más liviano.`;
  }
  return 'No pudimos usar este archivo. Intente con otro.';
}

type EstadoPagina =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; data: ExpedientePublico }
  | { tipo: 'error'; kind: ExpedientesErrorKind };

/**
 * Página pública del asegurado: /expediente?t=<token>
 * Solo muestra documentos pendientes y recibidos de su póliza y permite subirlos.
 * No usa la sesión del portal ni muestra datos de terceros. Trato de usted, como el correo
 * oficial de La Mundial. Pensada primero para el móvil; en escritorio, banda de marca y
 * tarjeta más ancha. Animaciones solo en CSS y apagadas con `prefers-reduced-motion`.
 */
export const ExpedientePublicoPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const token = (params.get('t') ?? '').trim();
  const [estado, setEstado] = useState<EstadoPagina>(() =>
    token ? { tipo: 'cargando' } : { tipo: 'error', kind: 'enlace_invalido' },
  );

  useEffect(() => {
    const anterior = document.title;
    document.title = 'Complete su expediente | La Mundial de Seguros';
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
    <div className="mx-pub mxp">
      <header className="mxp-banda">
        <div className="mxp-banda-in">
          <MundialBrand variant="light" subtitle="Su póliza" isotipoClassName="h-10 w-10" />
          <p className="mxp-banda-texto">Complete su expediente</p>
        </div>
      </header>

      <div className="mxp-wrap">
        <main className="mx-pub-card mxp-card" aria-live="polite">
          {/* Sin enlace: ingreso por cédula + código al correo registrado. */}
          {!token && (
            <AccesoCedula
              onAcceso={(t) => {
                setEstado({ tipo: 'cargando' });
                setParams({ t }, { replace: true });
              }}
            />
          )}
          {token && estado.tipo === 'cargando' && <CargandoPublico />}
          {token && estado.tipo === 'error' && (
            <PantallaError
              kind={estado.kind}
              onReintentar={() => void cargar()}
              onIngresarConCedula={() => setParams({}, { replace: true })}
            />
          )}
          {token && estado.tipo === 'listo' && (
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

        <p className="mx-pub-pie">¿Tiene dudas? Comuníquese con su asesor de seguros.</p>
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
          Estamos buscando su expediente…
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
  onIngresarConCedula,
}: {
  kind: ExpedientesErrorKind;
  onReintentar: () => void;
  onIngresarConCedula?: () => void;
}) {
  let titulo = 'No pudimos abrir su expediente';
  let texto = 'Intente de nuevo en unos minutos.';
  let Icon = AlertCircle;
  let tono = 'azul';
  let reintentar = true;
  let cedula = false;

  if (kind === 'enlace_vencido') {
    titulo = 'Este enlace ya venció';
    texto =
      'Por su seguridad, los enlaces duran pocos días. Pida uno nuevo a su asesor de seguros.';
    Icon = Clock;
    tono = 'ambar';
    reintentar = false;
    cedula = true;
  } else if (kind === 'enlace_invalido' || kind === 'no_encontrado' || kind === 'permiso' || kind === 'sesion') {
    titulo = 'Este enlace no es válido';
    texto =
      'Revise que lo haya abierto completo desde el correo que le enviamos. Si el problema sigue, pida uno nuevo a su asesor de seguros.';
    Icon = Link2Off;
    tono = 'ambar';
    reintentar = false;
    cedula = true;
  } else if (kind === 'apagado') {
    titulo = 'Por ahora no podemos recibir documentos por aquí';
    texto = 'Intente de nuevo más tarde. Disculpe las molestias.';
  } else if (kind === 'red') {
    titulo = 'No hay conexión';
    texto = 'Revise su conexión a internet e intente de nuevo.';
    Icon = WifiOff;
  }

  return (
    <div className="mxp-error mxp-entra" role="alert">
      <span className={`mxp-error-icono is-${tono}`} aria-hidden>
        <Icon size={30} />
      </span>
      <p className="mxp-error-titulo">{titulo}</p>
      <p className="mxp-error-texto">{texto}</p>
      {reintentar && (
        <button type="button" className="mx-btn mx-btn--primary mxp-btn-grande" onClick={onReintentar}>
          <RefreshCw size={16} aria-hidden />
          Intentar de nuevo
        </button>
      )}
      {cedula && onIngresarConCedula && (
        <button
          type="button"
          className="mx-btn mx-btn--ghost mxp-ir-cedula"
          onClick={onIngresarConCedula}
        >
          <KeyRound size={16} aria-hidden />
          ¿No tiene el enlace? Ingrese con su cédula
        </button>
      )}
    </div>
  );
}

/**
 * Avance arriba: «1 de 3 documentos aprobados» con un anillo que se llena al cargar.
 * Solo cuenta los documentos ya aprobados (validados): nunca aparenta más avance del real.
 */
function Avance({ aprobados, total }: { aprobados: number; total: number }) {
  const [lleno, setLleno] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setLleno(true));
    return () => window.cancelAnimationFrame(id);
  }, []);
  const R = 26;
  const C = 2 * Math.PI * R;
  const fraccion = total > 0 ? aprobados / total : 0;
  return (
    <div className="mxp-avance">
      <svg
        className="mxp-anillo"
        viewBox="0 0 64 64"
        role="img"
        aria-label={`${aprobados} de ${total} documentos aprobados`}
      >
        <circle className="mxp-anillo-pista" cx="32" cy="32" r={R} />
        <circle
          className="mxp-anillo-relleno"
          cx="32"
          cy="32"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={lleno ? C * (1 - fraccion) : C}
        />
        <text x="32" y="36" textAnchor="middle" className="mxp-anillo-num">
          {aprobados}/{total}
        </text>
      </svg>
      <div className="min-w-0 flex-1">
        <p className="mxp-avance-titulo">
          {aprobados} de {total} documentos aprobados
        </p>
        <div className="mxp-barra" aria-hidden>
          <span style={{ width: lleno ? `${fraccion * 100}%` : '0%' }} />
        </div>
      </div>
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
  const [recien, setRecien] = useState<string | null>(null);
  const avisoRef = useRef<HTMLDivElement>(null);
  const pendientes = data.requisitos.filter(
    (r) => r.estado === 'faltante' || r.estado === 'observado' || hayQueRepetir(r),
  );
  const recibidos = data.requisitos.filter(
    (r) => (r.estado === 'recibido' || r.estado === 'validado') && !hayQueRepetir(r),
  );
  const aprobados = data.requisitos.filter((r) => r.estado === 'validado').length;
  const primerNombre = nombrePropio((data.nombre ?? '').trim().split(/\s+/)[0] ?? '');
  const poliza = polizaEnmascarada(data.poliza);
  // Lo que hay que volver a enviar va primero; luego lo que falta; al final lo que está en revisión.
  const ordenPendiente = (r: Requisito) =>
    r.diagnostico?.resultado === 'datos_modificados' && r.estado !== 'validado'
      ? 2
      : r.estado === 'observado' || hayQueRepetir(r)
        ? 0
        : 1;
  const pendientesOrdenados = pendientes
    .map((r, i) => ({ r, i }))
    .sort((a, b) => ordenPendiente(a.r) - ordenPendiente(b.r) || a.i - b.i)
    .map((x) => x.r);

  // En el móvil la confirmación queda arriba: se lleva a la vista al aparecer.
  useEffect(() => {
    if (aviso) avisoRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [aviso]);

  useEffect(() => {
    if (!recien) return;
    const t = window.setTimeout(() => setRecien(null), RESALTE_MS);
    return () => window.clearTimeout(t);
  }, [recien]);

  const trasSubir = async (tipo: string, nombreDoc: string) => {
    await onSubido();
    const doc =
      nombreDoc === nombreDoc.toUpperCase()
        ? nombreDoc
        : nombreDoc.charAt(0).toLowerCase() + nombreDoc.slice(1);
    setRecien(tipo);
    setAviso(`Recibimos su ${doc}. ¡Gracias!`);
  };

  return (
    <>
      <div className="mx-pub-head mxp-head">
        <p className="mx-pub-hola">
          {primerNombre ? `Estimado(a) ${primerNombre}` : 'Estimado(a) asegurado(a)'}
        </p>
        {poliza && (
          <p className="mx-pub-poliza">
            <FileText size={13} aria-hidden />
            Póliza N.º {poliza}
          </p>
        )}
        <p className="mx-pub-texto">
          {pendientes.length > 0
            ? `Su póliza ya está emitida. Para completar su expediente solo nos falta${
                pendientes.length === 1 ? ' este documento' : 'n estos documentos'
              }.`
            : 'Su póliza ya está emitida.'}
        </p>
        {data.requisitos.length > 0 && <Avance aprobados={aprobados} total={data.requisitos.length} />}
        {aviso && (
          <div ref={avisoRef} className="mx-aviso mx-aviso--ok mt-3 mxp-entra" role="status">
            <CheckCircle2 size={18} aria-hidden className="shrink-0 mt-0.5" />
            <p className="font-semibold">{aviso}</p>
          </div>
        )}
      </div>

      {pendientes.length === 0 ? (
        <div className="mx-pub-gracias mxp-entra">
          <CheckAnimado grande />
          <p className="mx-estado-titulo text-base">¡Gracias! Ya tenemos sus documentos</p>
          <p className="max-w-[26rem] text-sm leading-relaxed">
            No tiene nada pendiente. Si necesitamos algo más, le escribiremos.
          </p>
        </div>
      ) : (
        <>
          <h2 className="mx-pub-seccion">Pendientes ({pendientes.length})</h2>
          <details className="mxp-consejos">
            <summary>
              <Lightbulb size={16} aria-hidden />
              Consejos para una buena foto
              <ChevronDown size={16} className="mxp-chev" aria-hidden />
            </summary>
            <ul>
              <li>Use buena luz y evite reflejos o sombras.</li>
              <li>Que se vea el documento completo, sin dedos encima.</li>
              <li>Formatos: JPG, PNG, HEIC o PDF, hasta {MAX_ARCHIVO_MB} MB.</li>
            </ul>
          </details>
          <ul className="mx-pub-lista">
            {pendientesOrdenados.map((r, i) => (
              <DocumentoPendiente
                key={r.tipo}
                indice={i}
                token={token}
                req={r}
                producto={r.producto ?? data.producto}
                onSubido={() =>
                  trasSubir(r.tipo, etiquetaRequisito(r.tipo, r.producto ?? data.producto))
                }
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
            {recibidos.map((r, i) => {
              const aprobado = r.estado === 'validado';
              const nuevo = recien === r.tipo;
              return (
                <li
                  key={r.tipo}
                  className={`mx-pub-doc mxp-entra ${aprobado ? 'mx-tono--verde' : 'mx-tono--azul'} ${
                    nuevo ? 'mxp-nuevo' : ''
                  }`}
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <div className="mx-pub-doc-head">
                    <span className="mx-pub-doc-nombre">
                      <span className="mx-pub-doc-icono" aria-hidden>
                        {nuevo ? <CheckAnimado /> : <FileText size={18} />}
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
                      ? 'Revisado. No tiene que hacer nada más con este documento.'
                      : 'Lo estamos revisando. No tiene que hacer nada más con este documento.'}
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

/** Check que se dibuja (círculo y palomita). Sin animación si el usuario la desactivó. */
function CheckAnimado({ grande = false }: { grande?: boolean }) {
  return (
    <svg
      className={`mxp-check ${grande ? 'mxp-check--grande' : ''}`}
      viewBox="0 0 52 52"
      aria-hidden
    >
      <circle className="mxp-check-circulo" cx="26" cy="26" r="23" />
      <path className="mxp-check-trazo" d="M15 27 l7 7 l15 -16" />
    </svg>
  );
}

function DocumentoPendiente({
  indice,
  token,
  req,
  producto,
  onSubido,
  onEnlaceCaido,
}: {
  indice: number;
  token: string;
  req: Requisito;
  producto: string | null;
  onSubido: () => Promise<void>;
  onEnlaceCaido: (kind: ExpedientesErrorKind) => void;
}) {
  const [pct, setPct] = useState<number | null>(null);
  const [listo, setListo] = useState(false);
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
  const tono = listo ? 'azul' : enRevision ? 'ambar' : repetir ? 'rojo' : 'gris';

  // Si tras recargar el documento sigue pendiente, el botón vuelve a aparecer.
  useEffect(() => {
    if (!listo) return;
    const t = window.setTimeout(() => setListo(false), RESALTE_MS);
    return () => window.clearTimeout(t);
  }, [listo]);

  const subir = async (file: File | undefined) => {
    if (!file) return;
    const problema = problemaDeArchivo(file);
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
      // Check animado mientras la página trae el nuevo estado; luego la tarjeta pasa a «Ya recibimos».
      setListo(true);
      setPct(null);
      void onSubido();
    } catch (err) {
      setPct(null);
      const kind = isExpedientesError(err) ? err.kind : 'servidor';
      if (kind === 'enlace_vencido' || kind === 'enlace_invalido') {
        onEnlaceCaido(kind);
        return;
      }
      setError(
        kind === 'archivo_grande'
          ? `El archivo pesa más de ${MAX_ARCHIVO_MB} MB. Intente con una foto o un PDF más liviano.`
          : kind === 'validacion'
            ? 'No pudimos recibir este archivo. Revise que sea JPG, PNG, HEIC o PDF y que se vea completo.'
            : kind === 'red'
              ? 'Se perdió la conexión. Intente de nuevo.'
              : 'No pudimos recibir el archivo. Intente de nuevo en unos minutos.',
      );
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <li
      className={`mx-pub-doc mxp-doc mxp-entra mx-tono--${tono}`}
      style={{ '--i': indice } as React.CSSProperties}
    >
      <div className="mx-pub-doc-head">
        <span className="mx-pub-doc-nombre">
          <span className={`mx-pub-doc-icono mxp-icono--${tono}`} aria-hidden>
            {listo ? <CheckAnimado /> : <FileText size={18} />}
          </span>
          {nombre}
        </span>
        {listo ? (
          <span className="mx-req mx-req--recibido">
            <CheckCircle2 size={13} aria-hidden />
            Recibido
          </span>
        ) : enRevision ? (
          <span className="mx-req mx-req--revisar">
            <Hourglass size={13} aria-hidden />
            En revisión
          </span>
        ) : repetir ? (
          <span className="mx-req mx-req--errado">
            <AlertCircle size={13} aria-hidden />
            Envíelo de nuevo
          </span>
        ) : (
          <span className="mx-req mx-req--faltante">Pendiente</span>
        )}
      </div>

      {!listo && enRevision && motivoSimple && <p className="mx-pub-nota">{motivoSimple}</p>}
      {!listo && repetir && (
        <p className="mxp-motivo">
          <AlertCircle size={16} aria-hidden className="shrink-0 mt-0.5" />
          <span>
            {motivoSimple ??
              'No pudimos revisar bien el que nos envió. Por favor, envíe una imagen nueva donde se lea todo el documento.'}
          </span>
        </p>
      )}

      {listo ? (
        <p className="mxp-listo" role="status">
          ¡Listo! Recibimos su archivo. Lo estamos revisando.
        </p>
      ) : (
        <>
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
          {!subiendo && (
            <p className="mx-pub-ayuda">Puede tomar la foto en este momento o elegir un archivo.</p>
          )}
        </>
      )}

      {subiendo && (
        <div className="mx-pub-progreso">
          <div
            className="mx-progreso mxp-progreso"
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

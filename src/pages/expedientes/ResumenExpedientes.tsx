import { useEffect, useId, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { obtenerIndicadores, type FiltrosIndicadores, type Indicadores } from '@/lib/expedientes-api';
import { numero } from './expedientes-format';

type TonoResumen = 'rojo' | 'ambar' | 'violeta';
type CifraClave = {
  [K in keyof Indicadores]-?: Indicadores[K] extends number ? K : never;
}[keyof Indicadores];
/** manual / automatica: solo en ese modo de validación (sin modo conocido se muestran como antes). */
type Modo = 'manual' | 'automatica';

/**
 * Primero lo que pide atención (qué falta y qué está mal); luego el resto.
 * El tono solo se pinta si la cifra es mayor que cero. Cada cifra lleva su descripción visible.
 * En el móvil se ven las cuatro primeras y «Ver todo el resumen» abre las demás.
 */
const CIFRAS: {
  key: CifraClave;
  label: string;
  desc: string;
  tono?: TonoResumen;
  modo?: Modo;
  /** Nuevo en Nexus: si la versión instalada no conoce el modo, no se muestra. */
  requiereModo?: boolean;
}[] = [
  {
    key: 'incompletos',
    label: 'Incompletos',
    desc: 'Les falta al menos un documento por recibir, validar o corregir.',
    tono: 'ambar',
  },
  {
    key: 'conErrores',
    label: 'Con errores',
    desc: 'Algún documento no coincide con la póliza, es ilegible o necesita revisión.',
    tono: 'rojo',
  },
  {
    key: 'datosModificados',
    label: 'Datos cambiados',
    desc: 'Los datos de la póliza cambiaron después de leer el documento.',
    tono: 'violeta',
  },
  {
    key: 'porValidar',
    label: 'Por validar',
    desc: 'Pólizas con documentos que esperan revisión de un analista.',
    tono: 'ambar',
    modo: 'manual',
  },
  {
    key: 'analizando',
    label: 'Analizando',
    desc: 'Pólizas con documentos que la IA está revisando.',
    modo: 'automatica',
  },
  {
    key: 'noLeidos',
    label: 'No se pudo leer',
    desc: 'El sistema no pudo leer un archivo; se reintenta solo.',
    modo: 'automatica',
    requiereModo: true,
  },
  { key: 'pendientesPago', label: 'Pendientes de pago', desc: 'Emitidas como pendientes de cobro.' },
  { key: 'completos', label: 'Completos', desc: 'Todos los documentos requeridos están validados.' },
  {
    key: 'validadosIa',
    label: 'Validados por IA',
    desc: 'Completos validados por la IA, sin intervención manual.',
  },
  {
    key: 'total',
    label: 'Total',
    desc: 'Pólizas emitidas por el Marketplace que pasaron por el OCR.',
  },
];
const VISIBLES_MOVIL = 4;

/** Cifras del modo de validación vigente («Por validar» solo en manual). */
const cifrasDe = (validacion?: Modo) =>
  CIFRAS.filter((c) => (validacion ? !c.modo || c.modo === validacion : !c.requiereModo));

/** Hacia abajo: nunca 100 % si falta alguna póliza. */
const pctCompletos = (d: Indicadores) =>
  d.total > 0 ? Math.floor((d.completos / d.total) * 100) : 0;

const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

/**
 * Cuadre con Nexus: cuántas de las emisiones registradas están en el monitor y por qué falta
 * el resto. Sin el dato de Nexus (versión anterior) no se muestra.
 */
function textoCuadre(d: Indicadores): string | null {
  if (d.emisionesNexus == null) return null;
  const descartadas = d.descartadas ?? 0;
  const partes = [
    `${numero(d.total)} en el monitor de ${numero(d.emisionesNexus)} ${plural(
      d.emisionesNexus,
      'póliza registrada',
      'pólizas registradas',
    )} en Nexus.`,
  ];
  if (descartadas > 0) {
    partes.push(
      `${numero(descartadas)} ${plural(
        descartadas,
        'no se controla porque no pasó',
        'no se controlan porque no pasaron',
      )} por el OCR.`,
    );
  }
  const resto = d.emisionesNexus - d.total - descartadas;
  if (resto > 0) {
    partes.push(
      `${numero(resto)} ${plural(resto, 'queda', 'quedan')} fuera por el alcance configurado o por conciliar.`,
    );
  }
  return partes.join(' ');
}

/**
 * Resumen compacto del encabezado, visible en todas las pestañas.
 * Respeta los filtros globales (fecha y área) si la página los pasa; sin filtros es el acumulado
 * de las áreas en alcance. Si Nexus no responde, no se muestra (cada pestaña informa el error).
 */
export function ResumenExpedientes({
  recargaKey,
  filtros = {},
}: {
  recargaKey: number;
  filtros?: FiltrosIndicadores;
}) {
  const [datos, setDatos] = useState<Indicadores | null>(null);
  const [fallo, setFallo] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const gridId = useId();
  const { area, desde, hasta } = filtros;
  // Cargando = la última respuesta no corresponde a los filtros/recarga actuales.
  const clave = `${area ?? ''}|${desde ?? ''}|${hasta ?? ''}|${recargaKey}`;
  const [listo, setListo] = useState<string | null>(null);
  const cargando = listo !== clave;

  useEffect(() => {
    let vigente = true;
    obtenerIndicadores({ area, desde, hasta })
      .then((d) => {
        if (!vigente) return;
        setDatos(d);
        setFallo(false);
      })
      .catch(() => {
        if (vigente) setFallo(true);
      })
      .finally(() => {
        if (vigente) setListo(clave);
      });
    return () => {
      vigente = false;
    };
  }, [area, desde, hasta, clave]);

  if (fallo && !datos) return null;

  const filtrado = !!(area || desde || hasta);
  const cifras = cifrasDe(datos?.validacion);
  // Las emisiones de Nexus no tienen área: el cuadre solo se muestra sin filtro de área.
  const cuadre = datos && !area ? textoCuadre(datos) : null;
  return (
    <section
      className={`mx-resumen ${abierto ? 'is-abierto' : ''}`}
      aria-label="Resumen de expedientes"
      aria-busy={cargando}
    >
      {datos && (
        <div className={`mx-resumen-avance ${cargando ? 'opacity-70' : ''}`}>
          <div className="mx-resumen-avance-fila">
            <span>
              Expedientes completos:{' '}
              <strong className="mx-num">
                {numero(datos.completos)} de {numero(datos.total)}
              </strong>
            </span>
            <span className="mx-num">{pctCompletos(datos)} %</span>
          </div>
          <div
            className="mx-bar"
            role="progressbar"
            aria-valuenow={pctCompletos(datos)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Porcentaje de pólizas con expediente completo"
          >
            <div style={{ width: `${pctCompletos(datos)}%` }} />
          </div>
        </div>
      )}
      <dl id={gridId} className={`mx-resumen-grid ${cargando && datos ? 'opacity-70' : ''}`}>
        {cifras.map(({ key, label, desc, tono }, i) => {
          const valor = datos ? datos[key] : null;
          const clases = [
            'mx-resumen-item',
            i >= VISIBLES_MOVIL ? 'mx-resumen-item--extra' : '',
            tono && valor ? `is-${tono}` : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div key={key} className={clases}>
              <dt>{label}</dt>
              <dd className="mx-num">{valor === null ? '…' : numero(valor)}</dd>
              <dd className="mx-resumen-desc">{desc}</dd>
            </div>
          );
        })}
      </dl>
      <div className="mx-resumen-pie">
        <p className={cuadre ? 'mx-resumen-cuadre' : 'mx-resumen-nota'}>
          {cuadre
            ? `${filtrado ? 'En las fechas elegidas: ' : ''}${cuadre}`
            : filtrado
              ? 'Según los filtros de fecha y área.'
              : 'Acumulado de las pólizas en el monitor.'}
        </p>
        <button
          type="button"
          className="mx-resumen-mas"
          aria-expanded={abierto}
          aria-controls={gridId}
          onClick={() => setAbierto((a) => !a)}
        >
          {abierto ? 'Ver menos' : `Ver todo el resumen (${cifras.length})`}
          {abierto ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
        </button>
      </div>
    </section>
  );
}

import { useEffect, useId, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { obtenerIndicadores, type FiltrosIndicadores, type Indicadores } from '@/lib/expedientes-api';
import { numero } from './expedientes-format';

type TonoResumen = 'rojo' | 'ambar' | 'violeta';

/**
 * Primero lo que pide atención (qué falta y qué está mal); luego el resto.
 * El tono solo se pinta si la cifra es mayor que cero.
 * En el móvil se ven las cuatro primeras y «Ver todo el resumen» abre las demás.
 */
const CIFRAS: { key: keyof Indicadores; label: string; tono?: TonoResumen }[] = [
  { key: 'incompletos', label: 'Incompletos', tono: 'ambar' },
  { key: 'conErrores', label: 'Con errores', tono: 'rojo' },
  { key: 'datosModificados', label: 'Datos cambiados', tono: 'violeta' },
  { key: 'porValidar', label: 'Por validar', tono: 'ambar' },
  { key: 'analizando', label: 'Analizando' },
  { key: 'pendientesPago', label: 'Pendientes de pago' },
  { key: 'completos', label: 'Completos' },
  { key: 'validadosIa', label: 'Validados por IA' },
  { key: 'sinInformacion', label: 'Sin información' },
  { key: 'total', label: 'Total' },
];
const VISIBLES_MOVIL = 4;

/** Hacia abajo: nunca 100 % si falta alguna póliza. */
const pctCompletos = (d: Indicadores) =>
  d.total > 0 ? Math.floor((d.completos / d.total) * 100) : 0;

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
        {CIFRAS.map(({ key, label, tono }, i) => {
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
            </div>
          );
        })}
      </dl>
      <div className="mx-resumen-pie">
        <p className="mx-resumen-nota">
          {filtrado ? 'Según los filtros de fecha y área.' : 'Acumulado de las pólizas en el monitor.'}
        </p>
        <button
          type="button"
          className="mx-resumen-mas"
          aria-expanded={abierto}
          aria-controls={gridId}
          onClick={() => setAbierto((a) => !a)}
        >
          {abierto ? 'Ver menos' : `Ver todo el resumen (${CIFRAS.length})`}
          {abierto ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
        </button>
      </div>
    </section>
  );
}
